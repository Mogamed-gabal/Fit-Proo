const UserMessageUsage = require('../models/UserMessageUsage');
const Subscription = require('../models/Subscription');
const User = require('../models/User');
const config = require('../config/chatAccessConfig');

/**
 * Chat Access Control Engine
 * Centralized business logic for determining chat access permissions
 */
class ChatAccessService {
  /**
   * Check if user can access a specific chat
   * @param {String} userId - User ID
   * @param {Object} chatContext - Chat context information
   * @returns {Promise<Object>} Access decision with detailed information
   */
  static async canAccessChat(userId, chatContext) {
    try {
      // Validate input
      if (!userId || !chatContext) {
        return this._createAccessResponse(false, config.ACCESS_REASONS.INVALID_CHAT, {
          error: 'Invalid input parameters'
        });
      }

      // Get user information
      const user = await User.findById(userId).lean();
      if (!user) {
        return this._createAccessResponse(false, config.ACCESS_REASONS.NO_ACCESS, {
          error: 'User not found'
        });
      }

      // Check if user is participant in chat
      const isParticipant = await this._isChatParticipant(userId, chatContext);
      if (!isParticipant) {
        return this._createAccessResponse(false, config.ACCESS_REASONS.NOT_PARTICIPANT, {
          chatId: chatContext.chatId
        });
      }

      // Check free message access first
      const freeAccessResult = await this._checkFreeMessageAccess(userId);
      if (freeAccessResult.allowed) {
        return this._createAccessResponse(true, config.ACCESS_REASONS.FREE_USAGE, {
          isUsingFreeMessage: true,
          remainingFreeMessages: freeAccessResult.remaining,
          subscriptionStatus: 'FREE_USAGE'
        });
      }

      // Check subscription access
      const subscriptionResult = await this._checkSubscriptionAccess(userId, chatContext);
      if (subscriptionResult.allowed) {
        return this._createAccessResponse(true, subscriptionResult.reason, {
          isUsingFreeMessage: false,
          isInGracePeriod: subscriptionResult.isInGracePeriod,
          remainingFreeMessages: freeAccessResult.remaining,
          subscriptionStatus: subscriptionResult.status,
          subscriptionType: subscriptionResult.type,
          expiresAt: subscriptionResult.expiresAt
        });
      }

      // No access available
      return this._createAccessResponse(false, config.ACCESS_REASONS.NO_ACCESS, {
        isUsingFreeMessage: false,
        remainingFreeMessages: freeAccessResult.remaining,
        subscriptionStatus: 'NO_SUBSCRIPTION',
        reason: subscriptionResult.reason
      });

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
   * @param {Object} chatContext - Chat context information
   * @returns {Promise<Object>} Send permission with detailed information
   */
  static async canSendMessage(userId, chatContext) {
    try {
      // First check if user can access the chat
      const accessResult = await this.canAccessChat(userId, chatContext);
      
      if (!accessResult.allowed) {
        return accessResult;
      }

      // Additional checks for sending messages
      const sendChecks = await this._performSendMessageChecks(userId, chatContext);
      
      if (!sendChecks.allowed) {
        return this._createAccessResponse(false, sendChecks.reason, {
          ...accessResult,
          sendError: sendChecks.error
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
   * Record a message sent by user
   * @param {String} userId - User ID
   * @param {Object} messageContext - Message context
   * @returns {Promise<Object>} Updated usage information
   */
  static async recordMessage(userId, messageContext) {
    try {
      const accessResult = await this.canSendMessage(userId, messageContext.chatContext);
      
      if (!accessResult.allowed) {
        throw new Error(`User ${userId} does not have permission to send message: ${accessResult.reason}`);
      }

      // Increment usage counters
      const usage = await UserMessageUsage.incrementUsage(userId, accessResult.isUsingFreeMessage);
      
      return {
        success: true,
        usage: usage.getUsageStats(),
        accessResult: accessResult
      };

    } catch (error) {
      console.error('Error recording message:', error);
      throw error;
    }
  }

  /**
   * Get user's chat access summary
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

      // Get active subscriptions
      const subscriptions = await Subscription.find({
        userId,
        status: 'ACTIVE',
        endDate: { $gte: new Date() }
      }).lean();

      // Check for grace period subscriptions
      const gracePeriodSubscriptions = await Subscription.find({
        userId,
        status: 'EXPIRED',
        endDate: {
          $gte: new Date(Date.now() - (config.GRACE_PERIOD.DURATION_DAYS * 24 * 60 * 60 * 1000))
        }
      }).lean();

      return {
        userId,
        userName: user.name,
        userEmail: user.email,
        userRole: user.role,
        messageUsage: usageStats,
        activeSubscriptions: subscriptions.map(sub => ({
          id: sub._id,
          planType: sub.planType,
          status: sub.status,
          endDate: sub.endDate,
          features: sub.features
        })),
        gracePeriodSubscriptions: gracePeriodSubscriptions.map(sub => ({
          id: sub._id,
          planType: sub.planType,
          status: 'GRACE_PERIOD',
          endDate: sub.endDate,
          gracePeriodEnds: new Date(sub.endDate.getTime() + (config.GRACE_PERIOD.DURATION_DAYS * 24 * 60 * 60 * 1000))
        })),
        hasFreeMessages: usageStats.remainingFreeMessages > 0,
        hasActiveSubscription: subscriptions.length > 0,
        isInGracePeriod: gracePeriodSubscriptions.length > 0
      };

    } catch (error) {
      console.error('Error getting user access summary:', error);
      throw error;
    }
  }

  /**
   * Check free message access for user
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
   * Check subscription access for user in specific chat context
   * @private
   */
  static async _checkSubscriptionAccess(userId, chatContext) {
    try {
      const now = new Date();
      const gracePeriodStart = new Date(now.getTime() - (config.GRACE_PERIOD.DURATION_DAYS * 24 * 60 * 60 * 1000));

      // Get active subscriptions
      const activeSubscriptions = await Subscription.find({
        userId,
        status: 'ACTIVE',
        endDate: { $gte: now }
      }).lean();

      // Check active subscriptions first
      for (const subscription of activeSubscriptions) {
        const accessCheck = await this._validateSubscriptionAccess(subscription, chatContext);
        if (accessCheck.allowed) {
          return {
            allowed: true,
            reason: config.ACCESS_REASONS.SUBSCRIPTION_ACTIVE,
            type: subscription.planType,
            status: 'ACTIVE',
            expiresAt: subscription.endDate,
            isInGracePeriod: false
          };
        }
      }

      // Check grace period subscriptions
      const gracePeriodSubscriptions = await Subscription.find({
        userId,
        status: 'EXPIRED',
        endDate: { $gte: gracePeriodStart }
      }).lean();

      for (const subscription of gracePeriodSubscriptions) {
        const accessCheck = await this._validateSubscriptionAccess(subscription, chatContext);
        if (accessCheck.allowed) {
          return {
            allowed: true,
            reason: config.ACCESS_REASONS.GRACE_PERIOD,
            type: subscription.planType,
            status: 'GRACE_PERIOD',
            expiresAt: subscription.endDate,
            isInGracePeriod: true
          };
        }
      }

      return {
        allowed: false,
        reason: 'NO_VALID_SUBSCRIPTION'
      };

    } catch (error) {
      console.error('Error checking subscription access:', error);
      return { allowed: false, reason: 'SUBSCRIPTION_CHECK_ERROR' };
    }
  }

  /**
   * Validate if subscription grants access to specific chat
   * @private
   */
  static async _validateSubscriptionAccess(subscription, chatContext) {
    try {
      // Check if subscription has chat access feature
      if (!subscription.features || !subscription.features.get('chat_access')) {
        return { allowed: false, reason: 'CHAT_NOT_INCLUDED_IN_SUBSCRIPTION' };
      }

      // Doctor-based subscription
      if (subscription.planType === 'DOCTOR_BASED' || subscription.planType === 'COUPON') {
        if (chatContext.doctorId && subscription.features.get('doctor_id') === chatContext.doctorId.toString()) {
          return { allowed: true };
        }
        return { allowed: false, reason: config.ACCESS_REASONS.WRONG_DOCTOR };
      }

      // Bundle subscription
      if (subscription.planType === 'BUNDLE') {
        if (chatContext.bundleId && subscription.features.get('bundle_id') === chatContext.bundleId.toString()) {
          return { allowed: true };
        }
        return { allowed: false, reason: config.ACCESS_REASONS.NOT_IN_BUNDLE };
      }

      // General subscription with chat access
      if (subscription.features.get('unlimited_chat')) {
        return { allowed: true };
      }

      return { allowed: false, reason: 'SUBSCRIPTION_DOES_NOT_GRANT_CHAT_ACCESS' };

    } catch (error) {
      console.error('Error validating subscription access:', error);
      return { allowed: false, reason: 'VALIDATION_ERROR' };
    }
  }

  /**
   * Check if user is participant in chat
   * @private
   */
  static async _isChatParticipant(userId, chatContext) {
    try {
      // For one-to-one chats, check if user is one of the participants
      if (chatContext.chatType === config.CHAT_TYPES.ONE_TO_ONE) {
        return chatContext.participants && 
               chatContext.participants.some(p => p.toString() === userId.toString());
      }

      // For group chats, check if user is in participants list
      if (chatContext.chatType === config.CHAT_TYPES.GROUP) {
        return chatContext.participants && 
               chatContext.participants.some(p => p.toString() === userId.toString());
      }

      return false;

    } catch (error) {
      console.error('Error checking chat participation:', error);
      return false;
    }
  }

  /**
   * Additional checks for sending messages
   * @private
   */
  static async _performSendMessageChecks(userId, chatContext) {
    try {
      // Check if user is blocked (if applicable)
      // Check rate limiting (if applicable)
      // Check chat status (if chat is active, etc.)
      
      return { allowed: true };

    } catch (error) {
      console.error('Error performing send message checks:', error);
      return { allowed: false, reason: 'SEND_CHECK_ERROR', error: error.message };
    }
  }

  /**
   * Create standardized access response
   * @private
   */
  static _createAccessResponse(allowed, reason, additionalData = {}) {
    return {
      allowed,
      reason,
      isUsingFreeMessage: additionalData.isUsingFreeMessage || false,
      isInGracePeriod: additionalData.isInGracePeriod || false,
      remainingFreeMessages: additionalData.remainingFreeMessages || 0,
      timestamp: new Date(),
      ...additionalData
    };
  }
}

module.exports = ChatAccessService;
