const ChatAccessService = require('../services/chatAccessService');
const { body, query, validationResult } = require('express-validator');

/**
 * Chat Access Controller
 * Exposes API endpoints for testing and managing chat access control
 */
class ChatAccessController {
  /**
   * Check if user can access chat
   * POST /api/chat-access/check-access
   */
  static async checkChatAccess(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const { userId, chatContext } = req.body;
      const result = await ChatAccessService.canAccessChat(userId, chatContext);

      res.status(200).json({
        success: true,
        data: result
      });

    } catch (error) {
      console.error('Error checking chat access:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Check if user can send message
   * POST /api/chat-access/check-send
   */
  static async checkSendMessage(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const { userId, chatContext } = req.body;
      const result = await ChatAccessService.canSendMessage(userId, chatContext);

      res.status(200).json({
        success: true,
        data: result
      });

    } catch (error) {
      console.error('Error checking send message permission:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Record a message (for testing)
   * POST /api/chat-access/record-message
   */
  static async recordMessage(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const { userId, messageContext } = req.body;
      const result = await ChatAccessService.recordMessage(userId, messageContext);

      res.status(200).json({
        success: true,
        data: result
      });

    } catch (error) {
      console.error('Error recording message:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Get user access summary
   * GET /api/chat-access/user-summary/:userId
   */
  static async getUserAccessSummary(req, res) {
    try {
      const { userId } = req.params;
      const result = await ChatAccessService.getUserAccessSummary(userId);

      res.status(200).json({
        success: true,
        data: result
      });

    } catch (error) {
      console.error('Error getting user access summary:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Test access with current authenticated user
   * POST /api/chat-access/test-access
   */
  static async testAccess(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const userId = req.user.userId;
      const { chatContext } = req.body;

      // Check both access and send permissions
      const [accessResult, sendResult, summary] = await Promise.all([
        ChatAccessService.canAccessChat(userId, chatContext),
        ChatAccessService.canSendMessage(userId, chatContext),
        ChatAccessService.getUserAccessSummary(userId)
      ]);

      res.status(200).json({
        success: true,
        data: {
          userId,
          accessResult,
          sendResult,
          summary
        }
      });

    } catch (error) {
      console.error('Error testing access:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
}

module.exports = ChatAccessController;
