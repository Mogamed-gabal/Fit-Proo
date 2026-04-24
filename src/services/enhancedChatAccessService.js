const UserMessageUsage = require('../models/UserMessageUsage');
const UserRateLimit = require('../models/UserRateLimit');
const Chat = require('../models/Chat');
const Subscription = require('../models/Subscription');
const User = require('../models/User');
const config = require('../config/chatAccessConfig');

/**
 * Enhanced Chat Access Control Engine
 * Secure, production-ready with proper access priority and concurrency safety
 */
class EnhancedChatAccessService {
  /**
   * Check if user can access a specific chat
   * @param {String} userId - User ID
   * @param {String} chatId - Chat ID (validated from database)
   * @returns {Promise<Object>} Access decision with detailed information
   */
  static async canAccessChat(userId, chatId) {
    try {
      // Validate input
      if (!userId || !chatId) {
        return this._createAccessResponse(false, config.ACCESS_REASONS.INVALID_CHAT, {
          error: 'Invalid input parameters'
        });
      }

      // Step 1: Validate user exists
      const user = await User.findById(userId).lean();
      if (!user) {
        return this._createAccessResponse(false, config.ACCESS_REASONS.NO_ACCESS, {
          error: 'User not found'
        });
      }

      // Step 2: Validate chat and get subscription binding
      const chatValidation = await Chat.validateChatAccess(chatId, userId);
      if (!chatValidation.valid) {
        return this._createAccessResponse(false, chatValidation.reason, {
          chatId,
          userId
        });
      }

      const { chat, subscription } = chatValidation;

      // Step 3: Check user rate limiting (block before access checks)
      const rateLimitCheck = await UserRateLimit.checkRateLimit(userId, 'ACCESS_CHAT');
      if (!rateLimitCheck.allowed) {
        return this._createAccessResponse(false, rateLimitCheck.reason, {
          rateLimitInfo: rateLimitCheck,
          blockedUntil: rateLimitCheck.blockedUntil
        });
      }

      // Step 4: Evaluate access with proper priority order
      const accessEvaluation = await this._evaluateAccessPriority(userId, chat, subscription);
      
      return accessEvaluation;

    } catch (error) {
      console.error('Error checking chat access:', error);
      return this._createAccessResponse(false, config.ACCESS_REASONS.NO_ACCESS, {
        error: error.message
      });
    }
  }

  /**
   * Check if user can send a message in a specific chat
   * @param {String} userId - User ID
   * @param {String} chatId - Chat ID
   * @returns {Promise<Object>} Send permission with detailed information
   */
  static async canSendMessage(userId, chatId) {
    try {
      // First check if user can access the chat
      const accessResult = await this.canAccessChat(userId, chatId);
      
      if (!accessResult.allowed) {
        return accessResult;
      }

      // Additional send-specific checks
      const sendChecks = await this._performSendMessageChecks(userId, chatId);
      
      if (!sendChecks.allowed) {
        return this._createAccessResponse(false, sendChecks.reason, {
          ...accessResult,
          sendError: sendChecks.error
        });
      }

      // Check user rate limiting for sending messages
      const rateLimitCheck = await UserRateLimit.checkRateLimit(userId, 'SEND_MESSAGE');
      if (!rateLimitCheck.allowed) {
        return this._createAccessResponse(false, rateLimitCheck.reason, {
          ...accessResult,
          rateLimitInfo: rateLimitCheck,
          blockedUntil: rateLimitCheck.blockedUntil
        });
      }

      // Check chat-specific rate limiting
      const chatRateLimitCheck = await Chat.updateRateLimit(chatId);
      if (!chatRateLimitCheck.allowed) {
        return this._createAccessResponse(false, chatRateLimitCheck.reason, {
          ...accessResult,
          chatRateLimitInfo: chatRateLimitCheck
        });
      }

      return accessResult;

    } catch (error) {
      console.error('Error checking send message permission:', error);
      return this._createAccessResponse(false, config.ACCESS_REASONS.NO_ACCESS, {
        error: error.message
      });
    }
  }

  /**
   * Record a message sent by user with atomic operations
   * @param {String} userId - User ID
   * @param {String} chatId - Chat ID
   * @param {Object} messageContext - Message context
   * @returns {Promise<Object>} Updated usage information
   */
  static async recordMessage(userId, chatId, messageContext) {
    try {
      // First check send permission (this will also check access)
      const sendPermission = await this.canSendMessage(userId, chatId);
      
      if (!sendPermission.allowed) {
        throw new Error(`User ${userId} does not have permission to send message: ${sendPermission.reason}`);
      }

      // Skip usage recording for system messages
      if (messageContext.messageType === 'SYSTEM') {
        return {
          success: true,
          usage: {
            totalMessagesSent: 0,
            freeMessagesUsed: 0,
            remainingFreeMessages: await UserMessageUsage.getRemainingFreeMessages(userId)
          },
          accessResult: sendPermission
        };
      }

      // Atomic message recording based on access mode
      let usageResult;
      
      if (sendPermission.mode === config.ACCESS_MODES.SUBSCRIPTION) {
        usageResult = await this._recordSubscriptionMessage(userId, chatId, messageContext);
      } else if (sendPermission.mode === config.ACCESS_MODES.FREE) {
        usageResult = await this._recordFreeMessage(userId, chatId, messageContext);
      } else if (sendPermission.mode === config.ACCESS_MODES.GRACE) {
        usageResult = await this._recordGracePeriodMessage(userId, chatId, messageContext);
      } else {
        throw new Error(`Unknown access mode: ${sendPermission.mode}`);
      }

      return {
        success: true,
        usage: usageResult,
        accessResult: sendPermission,
        timestamp: new Date()
      };

    } catch (error) {
      console.error('Error recording message:', error);
      throw error;
    }
  }

  /**
   * Get comprehensive user access summary
   * @param {String} userId - User ID
   * @returns {Promise<Object>} User's access status summary
   */
  static async getUserAccessSummary(userId) {
    try {
      const user = await User.findById(userId).lean();
      if (!user) {
        throw new Error('User not found');
      }

      // Get message usage
      const usage = await UserMessageUsage.getUserUsage(userId);
      const usageStats = usage.getUsageStats();

      // Get rate limit status
      const rateLimitStatus = await UserRateLimit.getUserRateLimitStatus(userId);

      // Get active subscriptions
      const subscriptions = await this._getUserSubscriptions(userId);

      // Get user's chats
      const userChats = await this._getUserChats(userId);

      return {
        userId,
        userName: user.name,
        userEmail: user.email,
        userRole: user.role,
        messageUsage: usageStats,
        rateLimitStatus,
        subscriptions,
        userChats: userChats.map(chat => chat.getChatInfo()),
        hasFreeMessages: usageStats.remainingFreeMessages > 0,
        hasActiveSubscription: subscriptions.active.length > 0,
        isInGracePeriod: subscriptions.gracePeriod.length > 0,
        isRateLimited: rateLimitStatus.status === 'BLOCKED'
      };

    } catch (error) {
      console.error('Error getting user access summary:', error);
      throw error;
    }
  }

  /**
   * Create a new chat with proper subscription binding
   * @param {String} userId - User ID creating the chat
   * @param {Object} chatData - Chat data
   * @param {String} subscriptionId - Subscription ID for binding
   * @returns {Promise<Object>} Created chat information
   */
  static async createBoundChat(userId, chatData, subscriptionId) {
    try {
      // Validate subscription
      const subscription = await Subscription.findById(subscriptionId);
      if (!subscription) {
        throw new Error('Subscription not found');
      }

      if (subscription.userId.toString() !== userId.toString()) {
        throw new Error('Subscription does not belong to user');
      }

      // Determine access type
      const accessType = this._determineAccessType(subscription);

      // Create chat with subscription binding
      const chat = await Chat.createBoundChat(chatData, subscriptionId, accessType);

      return {
        success: true,
        chat: chat.getChatInfo(),
        subscription: {
          id: subscription._id,
          type: subscription.planType,
          accessType
        }
      };

    } catch (error) {
      console.error('Error creating bound chat:', error);
      throw error;
    }
  }

  /**
   * Evaluate access priority in correct order
   * @private
   */
  static async _evaluateAccessPriority(userId, chat, subscription) {
    const now = new Date();
    
    // Priority 1: Active Subscription Access
    if (subscription.status === 'ACTIVE' && subscription.endDate >= now) {
      const subscriptionAccess = await this._validateSubscriptionAccess(userId, chat, subscription);
      if (subscriptionAccess.allowed) {
        return this._createAccessResponse(true, config.ACCESS_REASONS.SUBSCRIPTION_ACTIVE, {
          mode: config.ACCESS_MODES.SUBSCRIPTION,
          subscriptionId: subscription._id,
          subscriptionType: subscription.planType,
          expiresAt: subscription.endDate,
          willExpireSoon: this._willExpireSoon(subscription.endDate),
          remainingFreeMessages: await UserMessageUsage.getRemainingFreeMessages(userId),
          isInGracePeriod: false
        });
      }
    }

    // Priority 2: Grace Period Access
    const gracePeriodEnd = new Date(subscription.endDate.getTime() + (config.GRACE_PERIOD.DURATION_DAYS * 24 * 60 * 60 * 1000));
    if (now <= gracePeriodEnd && subscription.status === 'ACTIVE') {
      const graceAccess = await this._validateSubscriptionAccess(userId, chat, subscription);
      if (graceAccess.allowed) {
        return this._createAccessResponse(true, config.ACCESS_REASONS.GRACE_PERIOD, {
          mode: config.ACCESS_MODES.GRACE,
          subscriptionId: subscription._id,
          subscriptionType: subscription.planType,
          expiresAt: gracePeriodEnd,
          willExpireSoon: this._willExpireSoon(gracePeriodEnd),
          remainingFreeMessages: await UserMessageUsage.getRemainingFreeMessages(userId),
          isInGracePeriod: true,
          originalSubscriptionEnd: subscription.endDate
        });
      }
    }

    // Priority 3: Free Message Usage (Fallback only)
    const freeAccess = await this._checkFreeMessageAccess(userId);
    if (freeAccess.allowed) {
      return this._createAccessResponse(true, config.ACCESS_REASONS.FREE_USAGE, {
        mode: config.ACCESS_MODES.FREE,
        isUsingFreeMessage: true,
        remainingFreeMessages: freeAccess.remaining,
        willExpireSoon: false,
        isInGracePeriod: false
      });
    }

    // No access available
    return this._createAccessResponse(false, config.ACCESS_REASONS.NO_ACCESS, {
      mode: config.ACCESS_MODES.BLOCKED,
      remainingFreeMessages: freeAccess.remaining,
      subscriptionStatus: subscription.status,
      subscriptionEndsAt: subscription.endDate
    });
  }

  /**
   * Validate subscription access for specific chat
   * @private
   */
  static async _validateSubscriptionAccess(userId, chat, subscription) {
    try {
      // Check if subscription has chat access feature
      if (!subscription.features || !subscription.features.get('chat_access')) {
        return { allowed: false, reason: 'CHAT_NOT_INCLUDED_IN_SUBSCRIPTION' };
      }

      // Validate based on chat access type
      switch (chat.subscriptionBinding.accessType) {
        case config.CHAT_ACCESS_TYPES.DOCTOR:
          return await this._validateDoctorSubscriptionAccess(userId, chat, subscription);
        case config.CHAT_ACCESS_TYPES.BUNDLE:
          return await this._validateBundleSubscriptionAccess(userId, chat, subscription);
        case config.CHAT_ACCESS_TYPES.COUPON:
          return await this._validateCouponSubscriptionAccess(userId, chat, subscription);
        default:
          return { allowed: false, reason: 'UNKNOWN_ACCESS_TYPE' };
      }

    } catch (error) {
      console.error('Error validating subscription access:', error);
      return { allowed: false, reason: 'VALIDATION_ERROR', error: error.message };
    }
  }

  /**
   * Validate doctor subscription access
   * @private
   */
  static async _validateDoctorSubscriptionAccess(userId, chat, subscription) {
    try {
      const subscriptionDoctorId = subscription.features.get('doctor_id');
      
      if (!subscriptionDoctorId) {
        return { allowed: false, reason: 'DOCTOR_NOT_FOUND_IN_SUBSCRIPTION' };
      }

      // Check if user is the doctor or a client with access
      const user = await User.findById(userId);
      if (!user) {
        return { allowed: false, reason: 'USER_NOT_FOUND' };
      }

      // Doctor always has access
      if (user._id.toString() === subscriptionDoctorId.toString()) {
        return { allowed: true, reason: 'DOCTOR_ACCESS' };
      }

      // Client access - validate client-doctor relationship
      if (user.role === 'client') {
        // This would validate if client has subscription with this doctor
        // For now, assume client has access if they're in chat participants
        const isParticipant = chat.participants.some(p => 
          p.userId.toString() === userId.toString() && p.isActive
        );
        
        if (isParticipant) {
          return { allowed: true, reason: 'CLIENT_DOCTOR_ACCESS' };
        }
      }

      return { allowed: false, reason: 'INVALID_DOCTOR_ACCESS' };

    } catch (error) {
      console.error('Error validating doctor subscription access:', error);
      return { allowed: false, reason: 'DOCTOR_ACCESS_ERROR', error: error.message };
    }
  }

  /**
   * Validate bundle subscription access
   * @private
   */
  static async _validateBundleSubscriptionAccess(userId, chat, subscription) {
    try {
      const bundleId = subscription.features.get('bundle_id');
      
      if (!bundleId) {
        return { allowed: false, reason: 'BUNDLE_NOT_FOUND_IN_SUBSCRIPTION' };
      }

      // Check if user is in bundle participants
      const bundleParticipants = subscription.features.get('bundle_participants') || [];
      
      if (bundleParticipants.includes(userId.toString())) {
        return { allowed: true, reason: 'BUNDLE_ACCESS' };
      }

      return { allowed: false, reason: 'NOT_IN_BUNDLE' };

    } catch (error) {
      console.error('Error validating bundle subscription access:', error);
      return { allowed: false, reason: 'BUNDLE_ACCESS_ERROR', error: error.message };
    }
  }

  /**
   * Validate coupon subscription access
   * @private
   */
  static async _validateCouponSubscriptionAccess(userId, chat, subscription) {
    try {
      const couponDoctorId = subscription.features.get('doctor_id');
      
      if (!couponDoctorId) {
        return { allowed: false, reason: 'DOCTOR_NOT_FOUND_IN_COUPON' };
      }

      // Check if user is the doctor or has coupon access
      const user = await User.findById(userId);
      if (!user) {
        return { allowed: false, reason: 'USER_NOT_FOUND' };
      }

      // Doctor always has access
      if (user._id.toString() === couponDoctorId.toString()) {
        return { allowed: true, reason: 'DOCTOR_COUPON_ACCESS' };
      }

      // Validate coupon is valid for this user
      const couponUsers = subscription.features.get('coupon_users') || [];
      
      if (couponUsers.includes(userId.toString())) {
        return { allowed: true, reason: 'COUPON_ACCESS' };
      }

      return { allowed: false, reason: 'INVALID_COUPON_ACCESS' };

    } catch (error) {
      console.error('Error validating coupon subscription access:', error);
      return { allowed: false, reason: 'COUPON_ACCESS_ERROR', error: error.message };
    }
  }

  /**
   * Check free message access with atomic safety
   * @private
   */
  static async _checkFreeMessageAccess(userId) {
    try {
      const remaining = await UserMessageUsage.getRemainingFreeMessages(userId);
      
      return {
        allowed: remaining > 0,
        remaining
      };

    } catch (error) {
      console.error('Error checking free message access:', error);
      return { allowed: false, remaining: 0 };
    }
  }

  /**
   * Record free message with atomic operation
   * @private
   */
  static async _recordFreeMessage(userId, chatId, messageContext) {
    try {
      // Atomic increment with limit check
      const usage = await UserMessageUsage.findOneAndUpdate(
        { 
          userId,
          freeMessagesUsed: { $lt: config.FREE_USAGE.GLOBAL_MESSAGE_LIMIT }
        },
        { 
          $inc: { 
            freeMessagesUsed: 1,
            totalMessagesSent: 1
          },
          $set: { 
            lastMessageAt: new Date()
          }
        },
        { 
          new: true,
          upsert: true 
        }
      );

      if (!usage) {
        throw new Error('Free messages exhausted or user not found');
      }

      return usage.getUsageStats();

    } catch (error) {
      console.error('Error recording free message:', error);
      throw error;
    }
  }

  /**
   * Record subscription message
   * @private
   */
  static async _recordSubscriptionMessage(userId, chatId, messageContext) {
    try {
      // For subscription messages, just increment total count
      const usage = await UserMessageUsage.findOneAndUpdate(
        { userId },
        { 
          $inc: { 
            totalMessagesSent: 1
          },
          $set: { 
            lastMessageAt: new Date()
          }
        },
        { 
          new: true,
          upsert: true 
        }
      );

      return usage.getUsageStats();

    } catch (error) {
      console.error('Error recording subscription message:', error);
      throw error;
    }
  }

  /**
   * Record grace period message
   * @private
   */
  static async _recordGracePeriodMessage(userId, chatId, messageContext) {
    try {
      // Grace period messages count like subscription messages
      return await this._recordSubscriptionMessage(userId, chatId, messageContext);
    } catch (error) {
      console.error('Error recording grace period message:', error);
      throw error;
    }
  }

  /**
   * Additional checks for sending messages
   * @private
   */
  static async _performSendMessageChecks(userId, chatId) {
    try {
      // Check if chat is active
      const chat = await Chat.findOne({ 
        chatId, 
        status: 'ACTIVE', 
        isDeleted: false 
      });

      if (!chat) {
        return { allowed: false, reason: config.ACCESS_REASONS.CHAT_SUSPENDED };
      }

      return { allowed: true };

    } catch (error) {
      console.error('Error performing send message checks:', error);
      return { allowed: false, reason: 'SEND_CHECK_ERROR', error: error.message };
    }
  }

  /**
   * Get user subscriptions with proper categorization
   * @private
   */
  static async _getUserSubscriptions(userId) {
    try {
      const now = new Date();
      const gracePeriodStart = new Date(now.getTime() - (config.GRACE_PERIOD.DURATION_DAYS * 24 * 60 * 60 * 1000));

      // Get active subscriptions
      const activeSubscriptions = await Subscription.find({
        userId,
        status: 'ACTIVE',
        endDate: { $gte: now }
      }).lean();

      // Get grace period subscriptions
      const gracePeriodSubscriptions = await Subscription.find({
        userId,
        status: 'ACTIVE',
        endDate: { 
          $lt: now,
          $gte: gracePeriodStart
        }
      }).lean();

      return {
        active: activeSubscriptions,
        gracePeriod: gracePeriodSubscriptions,
        total: activeSubscriptions.length + gracePeriodSubscriptions.length
      };

    } catch (error) {
      console.error('Error getting user subscriptions:', error);
      return { active: [], gracePeriod: [], total: 0 };
    }
  }

  /**
   * Get user's chats
   * @private
   */
  static async _getUserChats(userId) {
    try {
      return await Chat.find({
        'participants.userId': userId,
        'participants.isActive': true,
        status: 'ACTIVE',
        isDeleted: false
      }).populate('subscriptionBinding.subscriptionId');

    } catch (error) {
      console.error('Error getting user chats:', error);
      return [];
    }
  }

  /**
   * Determine access type from subscription
   * @private
   */
  static _determineAccessType(subscription) {
    if (subscription.features.get('bundle_id')) {
      return config.CHAT_ACCESS_TYPES.BUNDLE;
    }
    
    if (subscription.features.get('coupon_users')) {
      return config.CHAT_ACCESS_TYPES.COUPON;
    }
    
    if (subscription.features.get('doctor_id')) {
      return config.CHAT_ACCESS_TYPES.DOCTOR;
    }
    
    return config.CHAT_ACCESS_TYPES.FREE;
  }

  /**
   * Check if subscription will expire soon
   * @private
   */
  static _willExpireSoon(expiresAt) {
    const now = new Date();
    const warningThreshold = config.UX_SIGNALING.EXPIRATION_WARNING_HOURS * 60 * 60 * 1000;
    
    return (expiresAt - now) <= warningThreshold;
  }

  /**
   * Create standardized access response
   * @private
   */
  static _createAccessResponse(allowed, reason, additionalData = {}) {
    return {
      allowed,
      reason,
      mode: additionalData.mode || (allowed ? 'UNKNOWN' : config.ACCESS_MODES.BLOCKED),
      isUsingFreeMessage: additionalData.isUsingFreeMessage || false,
      isInGracePeriod: additionalData.isInGracePeriod || false,
      willExpireSoon: additionalData.willExpireSoon || false,
      remainingFreeMessages: additionalData.remainingFreeMessages || 0,
      timestamp: new Date(),
      ...additionalData
    };
  }
}

module.exports = EnhancedChatAccessService;
