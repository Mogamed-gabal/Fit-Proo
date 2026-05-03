const ChatService = require('../services/chatService');
const { body, query, validationResult } = require('express-validator');

/**
 * Chat Controller
 * HTTP API endpoints for chat operations
 */
class ChatController {
  /**
   * Create a new chat
   * POST /api/chat/create
   */
  static async createChat(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const { chatData, subscriptionId } = req.body;
      const creatorId = req.user.userId;

      const result = await ChatService.createChat(creatorId, chatData, subscriptionId);

      res.status(201).json({
        success: true,
        data: result
      });

    } catch (error) {
      console.error('Error creating chat:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Send a message
   * POST /api/chat/send-message
   */
  static async sendMessage(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const { chatId, content, type = 'TEXT', attachment } = req.body;
      const senderId = req.user.userId;

      const result = await ChatService.sendMessage(senderId, chatId, {
        content,
        type,
        attachment
      });

      res.status(200).json({
        success: true,
        data: result
      });

    } catch (error) {
      console.error('Error sending message:', error);
      
      // Handle specific error types
      if (error.message.includes('Rate limit exceeded')) {
        return res.status(429).json({
          success: false,
          error: 'Rate limit exceeded',
          reason: 'RATE_LIMIT_EXCEEDED'
        });
      }
      
      if (error.message.includes('Access denied')) {
        return res.status(403).json({
          success: false,
          error: error.message,
          reason: 'ACCESS_DENIED'
        });
      }

      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Get chat messages
   * GET /api/chat/:chatId/messages
   */
  static async getChatMessages(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const { chatId } = req.params;
      const { page = 1, limit = 50, before, after, markAsRead } = req.query;
      const userId = req.user.userId;

      const result = await ChatService.getChatMessages(userId, chatId, {
        page: parseInt(page),
        limit: parseInt(limit),
        before,
        after,
        markAsRead: markAsRead !== 'false'
      });

      res.status(200).json({
        success: true,
        data: result
      });

    } catch (error) {
      console.error('Error getting chat messages:', error);
      
      if (error.message.includes('Access denied')) {
        return res.status(403).json({
          success: false,
          error: error.message,
          reason: 'ACCESS_DENIED'
        });
      }

      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Get user's chats
   * GET /api/chat/my-chats
   */
  static async getUserChats(req, res) {
    try {
      const { page = 1, limit = 20, type } = req.query;
      const userId = req.user.userId;

      const result = await ChatService.getUserChats(userId, {
        page: parseInt(page),
        limit: parseInt(limit),
        type
      });

      res.status(200).json({
        success: true,
        data: result
      });

    } catch (error) {
      console.error('Error getting user chats:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Join chat (for HTTP API, socket.io uses different method)
   * POST /api/chat/join
   */
  static async joinChat(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const { chatId } = req.body;
      const userId = req.user.userId;

      const result = await ChatService.joinChat(userId, chatId);

      res.status(200).json({
        success: true,
        data: result
      });

    } catch (error) {
      console.error('Error joining chat:', error);
      
      if (error.message.includes('Access denied')) {
        return res.status(403).json({
          success: false,
          error: error.message,
          reason: 'ACCESS_DENIED'
        });
      }

      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Mark message as read
   * POST /api/chat/mark-read
   */
  static async markMessageAsRead(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const { messageId } = req.body;
      const userId = req.user.userId;

      const result = await ChatService.markMessageAsRead(userId, messageId);

      res.status(200).json({
        success: true,
        data: result
      });

    } catch (error) {
      console.error('Error marking message as read:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Delete a message
   * DELETE /api/chat/message/:messageId
   */
  static async deleteMessage(req, res) {
    try {
      const { messageId } = req.params;
      const userId = req.user.userId;

      const result = await ChatService.deleteMessage(userId, messageId);

      res.status(200).json({
        success: true,
        data: result
      });

    } catch (error) {
      console.error('Error deleting message:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Edit a message
   * PUT /api/chat/message/:messageId
   */
  static async editMessage(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const { messageId } = req.params;
      const { content } = req.body;
      const userId = req.user.userId;

      const result = await ChatService.editMessage(userId, messageId, content);

      res.status(200).json({
        success: true,
        data: result
      });

    } catch (error) {
      console.error('Error editing message:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Add reaction to message
   * POST /api/chat/message/:messageId/reaction
   */
  static async addReaction(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const { messageId } = req.params;
      const { reactionType } = req.body;
      const userId = req.user.userId;

      const result = await ChatService.addReaction(userId, messageId, reactionType);

      res.status(200).json({
        success: true,
        data: result
      });

    } catch (error) {
      console.error('Error adding reaction:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Remove reaction from message
   * DELETE /api/chat/message/:messageId/reaction
   */
  static async removeReaction(req, res) {
    try {
      const { messageId } = req.params;
      const userId = req.user.userId;

      const result = await ChatService.removeReaction(userId, messageId);

      res.status(200).json({
        success: true,
        data: result
      });

    } catch (error) {
      console.error('Error removing reaction:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Get chat statistics
   * GET /api/chat/:chatId/statistics
   */
  static async getChatStatistics(req, res) {
    try {
      const { chatId } = req.params;
      const userId = req.user.userId;

      // First check if user has access to chat
      const accessResult = await ChatService.joinChat(userId, chatId);
      if (!accessResult.success) {
        return res.status(403).json({
          success: false,
          error: 'Access denied',
          reason: 'ACCESS_DENIED'
        });
      }

      const result = await ChatService.getChatStatistics(chatId);

      res.status(200).json({
        success: true,
        data: result
      });

    } catch (error) {
      console.error('Error getting chat statistics:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Get user chat statistics
   * GET /api/chat/my-statistics
   */
  static async getUserChatStatistics(req, res) {
    try {
      const userId = req.user.userId;

      const result = await ChatService.getUserChatStatistics(userId);

      res.status(200).json({
        success: true,
        data: result
      });

    } catch (error) {
      console.error('Error getting user chat statistics:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Upload file and send message with attachment
   * POST /api/chat/upload-file
   */
  static async uploadFile(req, res) {
    try {
      const { chatId, messageType = 'FILE' } = req.body;
      const senderId = req.user.userId;
      
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: 'No file uploaded'
        });
      }

      // Use ChatService to handle file upload and message sending
      const result = await ChatService.sendFileWithAttachment(senderId, chatId, req.file, messageType);

      res.status(200).json({
        success: true,
        data: result
      });

    } catch (error) {
      console.error('Error uploading file:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Upload image and send message with image attachment
   * POST /api/chat/upload-image
   */
  static async uploadImage(req, res) {
    try {
      const { chatId } = req.body;
      const senderId = req.user.userId;
      
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: 'No image uploaded'
        });
      }

      // Validate that it's an image
      if (!req.file.mimetype.startsWith('image/')) {
        return res.status(400).json({
          success: false,
          error: 'File must be an image'
        });
      }

      // Use ChatService to handle image upload and message sending
      const result = await ChatService.sendImageWithAttachment(senderId, chatId, req.file);

      res.status(200).json({
        success: true,
        data: result
      });

    } catch (error) {
      console.error('Error uploading image:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Admin: Get all chats in the system
   * GET /api/chat/admin/all-chats
   */
  static async getAllChats(req, res) {
    try {
      const { 
        page = 1, 
        limit = 20, 
        status, 
        search, 
        participantRole, 
        specialization, 
        chatType 
      } = req.query;
      
      // Use ChatService to get all chats with search and filters
      const result = await ChatService.getAllChats({
        page: parseInt(page),
        limit: parseInt(limit),
        status,
        search: search ? search.trim() : undefined,
        participantRole,
        specialization: specialization ? specialization.trim() : undefined,
        chatType
      });

      res.status(200).json({
        success: true,
        data: result
      });

    } catch (error) {
      console.error('Error getting all chats:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Admin: Get chat messages for any chat
   * GET /api/chat/admin/:chatId/messages
   */
  static async getAdminChatMessages(req, res) {
    try {
      const { chatId } = req.params;
      const { page = 1, limit = 50, before, after } = req.query;
      
      // Use ChatService to get chat messages (admin view)
      const result = await ChatService.getAdminChatMessages(chatId, {
        page: parseInt(page),
        limit: parseInt(limit),
        before,
        after
      });

      res.status(200).json({
        success: true,
        data: result
      });

    } catch (error) {
      console.error('Error getting chat messages (admin):', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Admin: Get chat statistics for any chat
   * GET /api/chat/admin/:chatId/statistics
   */
  static async getAdminChatStatistics(req, res) {
    try {
      const { chatId } = req.params;
      
      // Use ChatService to get chat statistics
      const result = await ChatService.getChatStatistics(chatId);

      res.status(200).json({
        success: true,
        data: result
      });

    } catch (error) {
      console.error('Error getting chat statistics (admin):', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
}

module.exports = ChatController;
