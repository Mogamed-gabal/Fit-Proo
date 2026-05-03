const Chat = require('../models/Chat');
const ChatMessage = require('../models/ChatMessage');
const EnhancedChatAccessService = require('./enhancedChatAccessService');
const UserRateLimit = require('../models/UserRateLimit');
const User = require('../models/User');
const Subscription = require('../models/Subscription');

/**
 * Chat Service
 * Business logic for chat operations with access control integration
 */
class ChatService {
  /**
   * Create a new chat with subscription binding
   * @param {String} creatorId - User creating the chat
   * @param {Object} chatData - Chat configuration
   * @param {String} subscriptionId - Subscription for binding
   * @returns {Promise<Object>} Created chat information
   */
  static async createChat(creatorId, chatData, subscriptionId) {
    try {
      // Validate creator exists
      const creator = await User.findById(creatorId);
      if (!creator) {
        throw new Error('Creator not found');
      }

      // Validate subscription and create bound chat
      const result = await EnhancedChatAccessService.createBoundChat(creatorId, chatData, subscriptionId);
      
      return result;

    } catch (error) {
      console.error('Error creating chat:', error);
      throw error;
    }
  }

  /**
   * Update chat status based on subscription lifecycle
   * @param {String} subscriptionId - Subscription ID
   * @returns {Promise<Object>} Update result
   */
  static async updateChatStatusBySubscription(subscriptionId) {
    try {
      const subscription = await Subscription.findById(subscriptionId);
      if (!subscription) {
        throw new Error('Subscription not found');
      }

      const now = new Date();
      const gracePeriodEnd = new Date(subscription.endDate.getTime() + (24 * 60 * 60 * 1000));
      let chatStatus = 'ACTIVE';

      // Determine chat status based on subscription state
      if (subscription.status !== 'ACTIVE') {
        chatStatus = 'SUSPENDED';
      } else if (now > gracePeriodEnd) {
        chatStatus = 'LOCKED';
      }

      // Update all chats bound to this subscription
      const result = await Chat.updateMany(
        { 'subscriptionBinding.subscriptionId': subscriptionId },
        { 
          $set: { 
            status: chatStatus,
            updatedAt: now
          }
        }
      );

      console.log(`Updated ${result.modifiedCount} chats to status ${chatStatus} for subscription ${subscriptionId}`);
      
      return {
        success: true,
        chatStatus,
        updatedChats: result.modifiedCount,
        gracePeriodEnd,
        subscriptionEndsAt: subscription.endDate
      };

    } catch (error) {
      console.error('Error updating chat status by subscription:', error);
      throw error;
    }
  }

  /**
   * Auto-lock chats after grace period
   * @returns {Promise<Object>} Lock result
   */
  static async lockExpiredChats() {
    try {
      const now = new Date();
      
      // Find chats where grace period has ended
      const expiredChats = await Chat.find({
        status: 'ACTIVE',
        'subscriptionBinding.subscriptionId': { $exists: true }
      }).populate('subscriptionBinding.subscriptionId');

      let lockedCount = 0;

      for (const chat of expiredChats) {
        const subscription = chat.subscriptionBinding.subscriptionId;
        const gracePeriodEnd = new Date(subscription.endDate.getTime() + (24 * 60 * 60 * 1000));
        
        if (now > gracePeriodEnd) {
          await Chat.updateOne(
            { _id: chat._id },
            { $set: { status: 'LOCKED', updatedAt: now } }
          );
          lockedCount++;
        }
      }

      console.log(`Locked ${lockedCount} chats after grace period`);
      
      return {
        success: true,
        lockedChats: lockedCount,
        timestamp: now
      };

    } catch (error) {
      console.error('Error locking expired chats:', error);
      throw error;
    }
  }

  /**
   * Record a message with full access control validation
   * @param {String} senderId - User sending the message
   * @param {String} chatId - Chat ID
   * @param {Object} messageData - Message content and metadata
   * @returns {Promise<Object>} Sent message information
   */
  static async sendMessage(senderId, chatId, messageData) {
    try {
      // Step 1: Check chat status (LOCKED chats cannot send messages)
      const chat = await Chat.findOne({ chatId, isDeleted: false });
      if (!chat) {
        throw new Error('Chat not found');
      }

      if (chat.status === 'LOCKED') {
        throw new Error('Chat is locked - subscription expired');
      }

      if (chat.status === 'SUSPENDED') {
        throw new Error('Chat is suspended');
      }

      // Step 2: Check if user is active participant
      const participant = chat.participants.find(p => 
        p.userId.toString() === senderId.toString() && p.isActive
      );
      
      if (!participant) {
        throw new Error('User is not an active participant in this chat');
      }

      // Step 3: Check send permission (includes subscription validation with strict priority)
      const sendPermission = await EnhancedChatAccessService.canSendMessage(senderId, chatId);
      if (!sendPermission.allowed) {
        throw new Error(`Access denied: ${sendPermission.reason}`);
      }

      // Step 4: Validate message data
      const { content, type = 'TEXT', attachment = null } = messageData;
      
      if (!content || content.trim().length === 0) {
        throw new Error('Message content cannot be empty');
      }

      if (content.length > 4000) {
        throw new Error('Message content too long');
      }

      // CRITICAL: Only server is allowed to create SYSTEM messages
      if (type === 'SYSTEM') {
        throw new Error('System messages can only be created by the server');
      }

      // Basic input sanitization for message content
      const sanitizedContent = content.trim()
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
        .replace(/javascript:/gi, '') // Remove javascript: protocol
        .replace(/on\w+\s*=/gi, ''); // Remove event handlers

      // CRITICAL: Final chat status validation before saving message
      // This prevents race conditions with cron jobs
      const finalChatCheck = await Chat.findOne({ 
        chatId, 
        isDeleted: false 
      });
      
      if (!finalChatCheck || finalChatCheck.status === 'LOCKED') {
        throw new Error('Chat status changed to locked - message aborted');
      }

      // Step 5: Create message
      const message = await ChatMessage.createMessage({
        chatId,
        senderId,
        content: sanitizedContent,
        type,
        attachment
      });

      // Step 6: Record message usage (atomic) - Only for non-system messages
      let usageResult = null;
      if (type !== 'SYSTEM') {
        usageResult = await EnhancedChatAccessService.recordMessage(senderId, chatId, {
          messageType: type,
          messageId: message.messageId
        });
      }

      // Step 7: Update chat rate limiting
      await Chat.updateRateLimit(chatId);

      return {
        success: true,
        message: message.toSafeObject(),
        usage: usageResult ? usageResult.usage : null,
        accessResult: sendPermission
      };

    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  /**
   * Update participant activity status for bundle chats
   * @param {String} chatId - Chat ID
   * @param {String} userId - User ID
   * @param {Boolean} isActive - Active status
   * @returns {Promise<Object>} Update result
   */
  static async updateParticipantActivity(chatId, userId, isActive) {
    try {
      const chat = await Chat.findOne({ chatId, isDeleted: false });
      if (!chat) {
        throw new Error('Chat not found');
      }

      // Update participant activity
      const result = await Chat.updateOne(
        { 
          chatId, 
          'participants.userId': userId 
        },
        { 
          $set: { 
            'participants.$.isActive': isActive,
            updatedAt: new Date()
          }
        }
      );

      if (result.modifiedCount === 0) {
        throw new Error('Participant not found in chat');
      }

      console.log(`Updated participant ${userId} activity to ${isActive} in chat ${chatId}`);
      
      return {
        success: true,
        isActive,
        chatId,
        userId
      };

    } catch (error) {
      console.error('Error updating participant activity:', error);
      throw error;
    }
  }

  /**
   * Log chat view audit (admin/supervisor)
   * @param {String} viewerId - Viewer ID
   * @param {String} role - Viewer role (ADMIN|SUPERVISOR)
   * @param {String} chatId - Chat ID
   * @returns {Promise<Object>} Audit result
   */
  static async logChatViewAudit(viewerId, role, chatId) {
    try {
      // Create audit message in chat
      const auditMessage = await ChatMessage.createMessage({
        chatId,
        senderId: viewerId,
        content: `[${role} VIEW] Chat viewed by ${role}`,
        type: 'SYSTEM',
        systemData: {
          action: 'CHAT_VIEWED',
          targetUserId: viewerId,
          targetUserRole: role,
          details: {
            viewedAt: new Date(),
            viewerType: role.toLowerCase()
          }
        }
      });

      console.log(`Logged ${role} view audit for chat ${chatId} by user ${viewerId}`);
      
      return {
        success: true,
        auditMessage: auditMessage.toSafeObject(),
        viewerId,
        role,
        chatId,
        viewedAt: new Date()
      };

    } catch (error) {
      console.error('Error logging chat view audit:', error);
      throw error;
    }
  }

  /**
   * Get optimized unread messages using participant lastReadAt
   * @param {String} chatId - Chat ID
   * @param {String} userId - User ID
   * @returns {Promise<Object>} Unread count and messages
   */
  static async getOptimizedUnreadMessages(chatId, userId) {
    try {
      // Get chat with participants
      const chat = await Chat.findOne({ chatId, isDeleted: false });
      if (!chat) {
        throw new Error('Chat not found');
      }

      // Find participant with lastReadAt
      const participant = chat.participants.find(p => 
        p.userId.toString() === userId.toString()
      );

      if (!participant) {
        throw new Error('User not found in chat');
      }

      const lastReadAt = participant.lastReadAt || participant.joinedAt;

      // Count unread messages using lastReadAt
      const unreadCount = await ChatMessage.countDocuments({
        chatId,
        senderId: { $ne: userId },
        createdAt: { $gt: lastReadAt },
        isDeleted: false
      });

      // Get recent unread messages
      const unreadMessages = await ChatMessage.find({
        chatId,
        senderId: { $ne: userId },
        createdAt: { $gt: lastReadAt },
        isDeleted: false
      })
      .populate('senderId', 'name email role avatar')
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

      return {
        success: true,
        unreadCount,
        unreadMessages: unreadMessages.reverse(),
        lastReadAt
      };

    } catch (error) {
      console.error('Error getting optimized unread messages:', error);
      throw error;
    }
  }

  /**
   * Update participant lastReadAt
   * @param {String} chatId - Chat ID
   * @param {String} userId - User ID
   * @returns {Promise<Object>} Update result
   */
  static async updateParticipantLastRead(chatId, userId) {
    try {
      const now = new Date();
      
      const result = await Chat.updateOne(
        { 
          chatId, 
          'participants.userId': userId 
        },
        { 
          $set: { 
            'participants.$.lastReadAt': now,
            updatedAt: now
          }
        }
      );

      if (result.modifiedCount === 0) {
        throw new Error('Participant not found in chat');
      }

      console.log(`Updated lastReadAt for participant ${userId} in chat ${chatId}`);
      
      return {
        success: true,
        lastReadAt: now,
        chatId,
        userId
      };

    } catch (error) {
      console.error('Error updating participant lastReadAt:', error);
      throw error;
    }
  }

  /**
   * Get chat messages for a user
   * @param {String} userId - User requesting messages
   * @param {String} chatId - Chat ID
   * @param {Object} options - Pagination and filtering options
   * @returns {Promise<Object>} Messages and metadata
   */
  static async getChatMessages(userId, chatId, options = {}) {
    try {
      // Step 1: Check access permission
      const accessResult = await EnhancedChatAccessService.canAccessChat(userId, chatId);
      if (!accessResult.allowed) {
        throw new Error(`Access denied: ${accessResult.reason}`);
      }

      // Step 2: Get messages
      const messages = await ChatMessage.getChatMessages(chatId, options);

      // Step 3: Get unread count
      const unreadCount = await ChatMessage.getUnreadCount(chatId, userId);

      // Step 4: Mark messages as read (optional, based on options)
      if (options.markAsRead !== false) {
        await ChatMessage.markChatAsRead(chatId, userId);
      }

      return {
        success: true,
        messages,
        unreadCount,
        accessResult
      };

    } catch (error) {
      console.error('Error getting chat messages:', error);
      throw error;
    }
  }

  /**
   * Get user's chats with access validation
   * @param {String} userId - User ID
   * @param {Object} options - Filtering options
   * @returns {Promise<Object>} User's chats
   */
  static async getUserChats(userId, options = {}) {
    try {
      const { page = 1, limit = 20, type = null } = options;

      // Get user's chats from database
      const userChats = await Chat.find({
        'participants.userId': userId,
        'participants.isActive': true,
        status: 'ACTIVE',
        isDeleted: false,
        ...(type && { type })
      })
      .populate('subscriptionBinding.subscriptionId')
      .populate('participants.userId', 'name email role avatar')
      .sort({ updatedAt: -1 })
      .limit(limit)
      .skip((page - 1) * limit)
      .lean();

      // Get unread counts for each chat
      const chatsWithUnread = await Promise.all(
        userChats.map(async (chat) => {
          const unreadCount = await ChatMessage.getUnreadCount(chat.chatId, userId);
          return {
            ...chat,
            unreadCount
          };
        })
      );

      return {
        success: true,
        chats: chatsWithUnread,
        page,
        limit
      };

    } catch (error) {
      console.error('Error getting user chats:', error);
      throw error;
    }
  }

  /**
   * Join a chat room (socket.io integration)
   * @param {String} userId - User joining
   * @param {String} chatId - Chat ID
   * @returns {Promise<Object>} Join result
   */
  static async joinChat(userId, chatId) {
    try {
      // Check access permission
      const accessResult = await EnhancedChatAccessService.canAccessChat(userId, chatId);
      if (!accessResult.allowed) {
        throw new Error(`Access denied: ${accessResult.reason}`);
      }

      // Get chat details
      const chat = await Chat.findOne({ chatId, status: 'ACTIVE', isDeleted: false })
        .populate('participants.userId', 'name email role avatar')
        .populate('subscriptionBinding.subscriptionId');

      if (!chat) {
        throw new Error('Chat not found or inactive');
      }

      // Get unread count
      const unreadCount = await ChatMessage.getUnreadCount(chatId, userId);

      return {
        success: true,
        chat: chat.getChatInfo(),
        unreadCount,
        accessResult
      };

    } catch (error) {
      console.error('Error joining chat:', error);
      throw error;
    }
  }

  /**
   * Mark message as read
   * @param {String} userId - User marking as read
   * @param {String} messageId - Message ID
   * @returns {Promise<Object>} Result
   */
  static async markMessageAsRead(userId, messageId) {
    try {
      const message = await ChatMessage.markAsRead(messageId, userId);
      
      if (!message) {
        throw new Error('Message not found or already read');
      }

      return {
        success: true,
        message: message.toSafeObject()
      };

    } catch (error) {
      console.error('Error marking message as read:', error);
      throw error;
    }
  }

  /**
   * Delete a message
   * @param {String} userId - User deleting message
   * @param {String} messageId - Message ID
   * @returns {Promise<Object>} Result
   */
  static async deleteMessage(userId, messageId) {
    try {
      const message = await ChatMessage.deleteMessage(messageId, userId);
      
      if (!message) {
        throw new Error('Message not found or cannot be deleted');
      }

      return {
        success: true,
        message: message.toSafeObject()
      };

    } catch (error) {
      console.error('Error deleting message:', error);
      throw error;
    }
  }

  /**
   * Edit a message
   * @param {String} userId - User editing message
   * @param {String} messageId - Message ID
   * @param {String} newContent - New message content
   * @returns {Promise<Object>} Result
   */
  static async editMessage(userId, messageId, newContent) {
    try {
      if (!newContent || newContent.trim().length === 0) {
        throw new Error('Message content cannot be empty');
      }

      if (newContent.length > 4000) {
        throw new Error('Message content too long');
      }

      const message = await ChatMessage.editMessage(messageId, newContent.trim(), userId);
      
      if (!message) {
        throw new Error('Message not found or cannot be edited');
      }

      return {
        success: true,
        message: message.toSafeObject()
      };

    } catch (error) {
      console.error('Error editing message:', error);
      throw error;
    }
  }

  /**
   * Add reaction to message
   * @param {String} userId - User adding reaction
   * @param {String} messageId - Message ID
   * @param {String} reactionType - Reaction type
   * @returns {Promise<Object>} Result
   */
  static async addReaction(userId, messageId, reactionType) {
    try {
      const message = await ChatMessage.addReaction(messageId, userId, reactionType);
      
      if (!message) {
        throw new Error('Message not found or reaction already exists');
      }

      return {
        success: true,
        message: message.toSafeObject()
      };

    } catch (error) {
      console.error('Error adding reaction:', error);
      throw error;
    }
  }

  /**
   * Remove reaction from message
   * @param {String} userId - User removing reaction
   * @param {String} messageId - Message ID
   * @returns {Promise<Object>} Result
   */
  static async removeReaction(userId, messageId) {
    try {
      const message = await ChatMessage.removeReaction(messageId, userId);
      
      if (!message) {
        throw new Error('Message not found or no reaction to remove');
      }

      return {
        success: true,
        message: message.toSafeObject()
      };

    } catch (error) {
      console.error('Error removing reaction:', error);
      throw error;
    }
  }

  /**
   * Get chat statistics
   * @param {String} chatId - Chat ID
   * @returns {Promise<Object>} Chat statistics
   */
  static async getChatStatistics(chatId) {
    try {
      const [
        totalMessages,
        unreadCounts,
        activeParticipants,
        lastMessage
      ] = await Promise.all([
        ChatMessage.countDocuments({ chatId, isDeleted: false }),
        this._getUnreadCountsByUser(chatId),
        ChatMessage.distinct('senderId', { chatId, isDeleted: false }),
        ChatMessage.findOne({ chatId, isDeleted: false }).sort({ createdAt: -1 })
      ]);

      return {
        success: true,
        statistics: {
          totalMessages,
          unreadCounts,
          activeParticipants: activeParticipants.length,
          lastMessage: lastMessage ? lastMessage.toSafeObject() : null
        }
      };

    } catch (error) {
      console.error('Error getting chat statistics:', error);
      throw error;
    }
  }

  /**
   * Get user's chat statistics
   * @param {String} userId - User ID
   * @returns {Promise<Object>} User statistics
   */
  static async getUserChatStatistics(userId) {
    try {
      const [
        totalChats,
        totalMessages,
        unreadMessages,
        rateLimitStatus
      ] = await Promise.all([
        Chat.countDocuments({
          'participants.userId': userId,
          'participants.isActive': true,
          status: 'ACTIVE',
          isDeleted: false
        }),
        ChatMessage.countDocuments({ senderId: userId, isDeleted: false }),
        this._getTotalUnreadCount(userId),
        UserRateLimit.getUserRateLimitStatus(userId)
      ]);

      return {
        success: true,
        statistics: {
          totalChats,
          totalMessages,
          unreadMessages,
          rateLimitStatus
        }
      };

    } catch (error) {
      console.error('Error getting user chat statistics:', error);
      throw error;
    }
  }

  /**
   * Get unread counts by user for a chat
   * @private
   */
  static async _getUnreadCountsByUser(chatId) {
    try {
      const chat = await Chat.findOne({ chatId, status: 'ACTIVE', isDeleted: false });
      
      if (!chat) {
        return {};
      }

      const unreadCounts = {};
      
      for (const participant of chat.participants) {
        if (participant.isActive) {
          const count = await ChatMessage.getUnreadCount(chatId, participant.userId);
          unreadCounts[participant.userId.toString()] = count;
        }
      }

      return unreadCounts;

    } catch (error) {
      console.error('Error getting unread counts by user:', error);
      return {};
    }
  }

  /**
   * Get total unread count for a user
   * @private
   */
  static async _getTotalUnreadCount(userId) {
    try {
      const userChats = await Chat.find({
        'participants.userId': userId,
        'participants.isActive': true,
        status: 'ACTIVE',
        isDeleted: false
      });

      let totalUnread = 0;
      
      for (const chat of userChats) {
        const count = await ChatMessage.getUnreadCount(chat.chatId, userId);
        totalUnread += count;
      }

      return totalUnread;

    } catch (error) {
      console.error('Error getting total unread count:', error);
      return 0;
    }
  }

  /**
   * Send file with attachment
   * @param {String} senderId - Sender user ID
   * @param {String} chatId - Chat ID
   * @param {Object} file - File object from multer
   * @param {String} messageType - Message type (FILE or IMAGE)
   * @returns {Promise<Object>} Result with message and upload info
   */
  static async sendFileWithAttachment(senderId, chatId, file, messageType = 'FILE') {
    try {
      // Import cloudinary service
      const { uploadImage } = require('./cloudinaryService');

      // Determine message type based on file mimetype
      let finalMessageType = messageType;
      if (file.mimetype.startsWith('image/')) {
        finalMessageType = 'IMAGE';
      } else {
        finalMessageType = 'FILE';
      }

      // Upload file to Cloudinary
      const uploadResult = await uploadImage(file.buffer, {
        folder: 'chat-attachments',
        resource_type: finalMessageType === 'IMAGE' ? 'image' : 'auto',
        public_id: `chat_${chatId}_${Date.now()}`
      });

      // Create message content
      const messageContent = `Shared ${finalMessageType === 'IMAGE' ? 'image' : 'file'}: ${file.originalname}`;
      
      // Create attachment object
      const attachment = {
        url: uploadResult.secure_url,
        filename: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        publicId: uploadResult.public_id
      };

      // Send message with attachment
      const messageResult = await this.sendMessage(senderId, chatId, {
        content: messageContent,
        type: finalMessageType,
        attachment
      });

      // Return result with upload info
      return {
        ...messageResult,
        uploadInfo: {
          originalName: file.originalname,
          mimeType: file.mimetype,
          size: file.size,
          url: uploadResult.secure_url
        }
      };

    } catch (error) {
      console.error('Error sending file with attachment:', error);
      throw error;
    }
  }

  /**
   * Send image with attachment (optimized for images)
   * @param {String} senderId - Sender user ID
   * @param {String} chatId - Chat ID
   * @param {Object} imageFile - Image file object from multer
   * @returns {Promise<Object>} Result with message and upload info
   */
  static async sendImageWithAttachment(senderId, chatId, imageFile) {
    try {
      // Import cloudinary service
      const { uploadImage } = require('./cloudinaryService');

      // Upload image to Cloudinary with image-specific options
      const uploadResult = await uploadImage(imageFile.buffer, {
        folder: 'chat-images',
        resource_type: 'image',
        public_id: `chat_${chatId}_img_${Date.now()}`,
        quality: 'auto',
        fetch_format: 'auto'
      });

      // Create message content
      const messageContent = `Shared image: ${imageFile.originalname}`;
      
      // Create attachment object with image-specific info
      const attachment = {
        url: uploadResult.secure_url,
        filename: imageFile.originalname,
        mimeType: imageFile.mimetype,
        size: imageFile.size,
        publicId: uploadResult.public_id,
        thumbnailUrl: uploadResult.secure_url // Cloudinary auto-generates thumbnails
      };

      // Send message with image attachment
      const messageResult = await this.sendMessage(senderId, chatId, {
        content: messageContent,
        type: 'IMAGE',
        attachment
      });

      // Return result with image info
      return {
        ...messageResult,
        uploadInfo: {
          originalName: imageFile.originalname,
          mimeType: imageFile.mimetype,
          size: imageFile.size,
          url: uploadResult.secure_url,
          thumbnailUrl: uploadResult.secure_url
        }
      };

    } catch (error) {
      console.error('Error sending image with attachment:', error);
      throw error;
    }
  }

  /**
   * Admin: Get all chats in the system with advanced search and filtering
   * @param {Object} options - Query options
   * @returns {Promise<Object>} All chats with pagination
   */
  static async getAllChats(options = {}) {
    try {
      const { 
        page = 1, 
        limit = 20, 
        status, 
        search, 
        participantRole, 
        specialization, 
        chatType 
      } = options;
      
      const Chat = require('../models/Chat');
      const User = require('../models/User');
      
      // Build base query
      let query = { isDeleted: false };
      
      // Add status filter
      if (status) {
        query.status = status;
      }
      
      // Add chat type filter
      if (chatType) {
        query.type = chatType;
      }
      
      // Build aggregation pipeline for advanced search
      let pipeline = [
        // Match base criteria
        { $match: query },
        
        // Lookup participants to get user details
        {
          $lookup: {
            from: 'users',
            localField: 'participants.userId',
            foreignField: '_id',
            as: 'participantDetails'
          }
        },
        
        // Lookup subscription details
        {
          $lookup: {
            from: 'subscriptions',
            localField: 'subscriptionBinding.subscriptionId',
            foreignField: '_id',
            as: 'subscriptionDetails'
          }
        }
      ];
      
      // Add search filter (by participant name or email)
      if (search) {
        const searchRegex = new RegExp(search, 'i'); // Case-insensitive search
        pipeline.push({
          $match: {
            'participantDetails': {
              $elemMatch: {
                $or: [
                  { name: searchRegex },
                  { email: searchRegex }
                ]
              }
            }
          }
        });
      }
      
      // Add participant role filter
      if (participantRole) {
        pipeline.push({
          $match: {
            'participantDetails': {
              $elemMatch: {
                role: participantRole
              }
            }
          }
        });
      }
      
      // Add specialization filter (for doctors/nutritionists)
      if (specialization) {
        const specializationRegex = new RegExp(specialization, 'i');
        pipeline.push({
          $match: {
            'participantDetails': {
              $elemMatch: {
                $or: [
                  { specialization: specializationRegex },
                  { 'packages.specialization': specializationRegex }
                ]
              }
            }
          }
        });
      }
      
      // Add sorting
      pipeline.push({ $sort: { updatedAt: -1 } });
      
      // Add pagination
      const skip = (parseInt(page) - 1) * parseInt(limit);
      pipeline.push(
        { $skip: skip },
        { $limit: parseInt(limit) }
      );
      
      // Execute aggregation
      const chats = await Chat.aggregate(pipeline);
      
      // Get total count for pagination
      const countPipeline = pipeline.slice(0, -2); // Remove skip and limit
      const countResult = await Chat.aggregate([
        ...countPipeline,
        { $count: 'total' }
      ]);
      const total = countResult[0]?.total || 0;
      
      // Process and format results
      const formattedChats = chats.map(chat => {
        // Merge participant details back into participants array
        const participants = chat.participants.map(participant => {
          const participantDetail = chat.participantDetails.find(
            detail => detail._id.toString() === participant.userId.toString()
          );
          
          return {
            ...participant,
            user: participantDetail || null
          };
        });
        
        return {
          chatId: chat.chatId,
          type: chat.type,
          status: chat.status,
          participants: participants,
          subscriptionBinding: chat.subscriptionBinding,
          createdAt: chat.createdAt,
          updatedAt: chat.updatedAt,
          lastMessage: chat.lastMessage,
          // Add computed fields for easier filtering
          participantNames: participants
            .map(p => p.user?.name || 'Unknown')
            .filter(name => name !== 'Unknown'),
          participantRoles: participants
            .map(p => p.user?.role)
            .filter(role => role),
          hasDoctor: participants.some(p => p.user?.role === 'doctor'),
          hasClient: participants.some(p => p.user?.role === 'client')
        };
      });
      
      return {
        chats: formattedChats,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit)),
          hasNext: page * limit < total,
          hasPrev: page > 1
        },
        filters: {
          applied: {
            status: status || null,
            search: search || null,
            participantRole: participantRole || null,
            specialization: specialization || null,
            chatType: chatType || null
          },
          available: {
            statuses: ['ACTIVE', 'SUSPENDED', 'CLOSED'],
            participantRoles: ['client', 'doctor', 'nutritionist', 'therapist', 'coach'],
            chatTypes: ['ONE_TO_ONE', 'GROUP']
          }
        }
      };

    } catch (error) {
      console.error('Error getting all chats:', error);
      throw error;
    }
  }

  /**
   * Admin: Get chat messages for any chat (bypasses access control)
   * @param {String} chatId - Chat ID
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Messages with pagination
   */
  static async getAdminChatMessages(chatId, options = {}) {
    try {
      const { page = 1, limit = 50, before, after } = options;
      const ChatMessage = require('../models/ChatMessage');
      
      // Get messages without access control (admin view)
      const messages = await ChatMessage.getChatMessages(chatId, {
        page: parseInt(page),
        limit: parseInt(limit),
        before,
        after,
        markAsRead: false // Admin doesn't affect read status
      });
      
      return {
        messages,
        page: parseInt(page),
        limit: parseInt(limit)
      };

    } catch (error) {
      console.error('Error getting admin chat messages:', error);
      throw error;
    }
  }

  /**
   * Admin: Get chat statistics for any chat
   * @param {String} chatId - Chat ID
   * @returns {Promise<Object>} Chat statistics
   */
  static async getAdminChatStatistics(chatId) {
    try {
      // Use existing getChatStatistics method (admin has full access)
      return await this.getChatStatistics(chatId);

    } catch (error) {
      console.error('Error getting admin chat statistics:', error);
      throw error;
    }
  }
}

module.exports = ChatService;
