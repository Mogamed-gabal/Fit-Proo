const EnhancedChatAccessService = require('../services/enhancedChatAccessService');
const { body, query, validationResult } = require('express-validator');

/**
 * Enhanced Chat Access Controller
 * Secure API endpoints for testing and managing chat access control
 */
class EnhancedChatAccessController {
  /**
   * Check if user can access chat (using chatId from database)
   * POST /api/chat-access/enhanced/check-access
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

      const { userId, chatId } = req.body;
      const result = await EnhancedChatAccessService.canAccessChat(userId, chatId);

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
   * POST /api/chat-access/enhanced/check-send
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

      const { userId, chatId } = req.body;
      const result = await EnhancedChatAccessService.canSendMessage(userId, chatId);

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
   * Record a message (atomic operation)
   * POST /api/chat-access/enhanced/record-message
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

      const { userId, chatId, messageContext } = req.body;
      const result = await EnhancedChatAccessService.recordMessage(userId, chatId, messageContext);

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
   * GET /api/chat-access/enhanced/user-summary/:userId
   */
  static async getUserAccessSummary(req, res) {
    try {
      const { userId } = req.params;
      const result = await EnhancedChatAccessService.getUserAccessSummary(userId);

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
   * Create a new chat with subscription binding
   * POST /api/chat-access/enhanced/create-chat
   */
  static async createBoundChat(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const { userId, chatData, subscriptionId } = req.body;
      const result = await EnhancedChatAccessService.createBoundChat(userId, chatData, subscriptionId);

      res.status(201).json({
        success: true,
        data: result
      });

    } catch (error) {
      console.error('Error creating bound chat:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Test access with current authenticated user
   * POST /api/chat-access/enhanced/test-access
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
      const { chatId } = req.body;

      // Check both access and send permissions
      const [accessResult, sendResult, summary] = await Promise.all([
        EnhancedChatAccessService.canAccessChat(userId, chatId),
        EnhancedChatAccessService.canSendMessage(userId, chatId),
        EnhancedChatAccessService.getUserAccessSummary(userId)
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

  /**
   * Get detailed access analysis for debugging
   * POST /api/chat-access/enhanced/analyze-access
   */
  static async analyzeAccess(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const { userId, chatId } = req.body;

      // Get comprehensive analysis
      const summary = await EnhancedChatAccessService.getUserAccessSummary(userId);
      const accessResult = await EnhancedChatAccessService.canAccessChat(userId, chatId);
      const sendResult = await EnhancedChatAccessService.canSendMessage(userId, chatId);

      // Add analysis metadata
      const analysis = {
        timestamp: new Date(),
        userId,
        chatId,
        userStatus: {
          hasFreeMessages: summary.hasFreeMessages,
          hasActiveSubscription: summary.hasActiveSubscription,
          isInGracePeriod: summary.isInGracePeriod,
          isRateLimited: summary.isRateLimited
        },
        accessDecision: {
          canAccess: accessResult.allowed,
          canSend: sendResult.allowed,
          accessReason: accessResult.reason,
          accessMode: accessResult.mode,
          willExpireSoon: accessResult.willExpireSoon
        },
        usageMetrics: {
          freeMessagesUsed: summary.messageUsage.freeMessagesUsed,
          freeMessagesRemaining: summary.messageUsage.remainingFreeMessages,
          totalMessagesSent: summary.messageUsage.totalMessagesSent
        },
        rateLimitStatus: summary.rateLimitStatus,
        subscriptions: summary.subscriptions,
        userChats: summary.userChats.length
      };

      res.status(200).json({
        success: true,
        data: analysis
      });

    } catch (error) {
      console.error('Error analyzing access:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Simulate concurrent access testing
   * POST /api/chat-access/enhanced/concurrency-test
   */
  static async concurrencyTest(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const { userId, chatId, messageCount = 10 } = req.body;
      const results = [];

      // Simulate concurrent message sending
      const promises = Array.from({ length: messageCount }, async (_, index) => {
        try {
          const startTime = Date.now();
          const result = await EnhancedChatAccessService.recordMessage(userId, chatId, {
            messageType: 'TEST',
            testIndex: index
          });
          const endTime = Date.now();

          return {
            index,
            success: true,
            duration: endTime - startTime,
            result
          };
        } catch (error) {
          return {
            index,
            success: false,
            error: error.message
          };
        }
      });

      const concurrentResults = await Promise.all(promises);

      // Analyze results
      const successful = concurrentResults.filter(r => r.success);
      const failed = concurrentResults.filter(r => !r.success);
      const avgDuration = successful.length > 0 
        ? successful.reduce((sum, r) => sum + r.duration, 0) / successful.length 
        : 0;

      const analysis = {
        totalRequests: messageCount,
        successful: successful.length,
        failed: failed.length,
        successRate: (successful.length / messageCount) * 100,
        averageDuration: Math.round(avgDuration),
        results: concurrentResults,
        timestamp: new Date()
      };

      res.status(200).json({
        success: true,
        data: analysis
      });

    } catch (error) {
      console.error('Error in concurrency test:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Get system health metrics
   * GET /api/chat-access/enhanced/health
   */
  static async getSystemHealth(req, res) {
    try {
      const UserMessageUsage = require('../models/UserMessageUsage');
      const UserRateLimit = require('../models/UserRateLimit');
      const Chat = require('../models/Chat');

      // Get system metrics
      const [
        totalUsers,
        activeChats,
        totalMessages,
        blockedUsers,
        avgFreeMessagesRemaining
      ] = await Promise.all([
        User.countDocuments({}),
        Chat.countDocuments({ status: 'ACTIVE', isDeleted: false }),
        UserMessageUsage.aggregate([
          { $group: { _id: null, total: { $sum: '$totalMessagesSent' } } }
        ]).then(result => result[0]?.total || 0),
        UserRateLimit.countDocuments({ 'violations.currentBlockUntil': { $gt: new Date() } }),
        UserMessageUsage.aggregate([
          { $group: { _id: null, avg: { $avg: '$freeMessagesUsed' } } }
        ]).then(result => result[0]?.avg || 0)
      ]);

      const health = {
        timestamp: new Date(),
        status: 'HEALTHY',
        metrics: {
          totalUsers,
          activeChats,
          totalMessages,
          blockedUsers,
          avgFreeMessagesUsed: Math.round(avgFreeMessagesRemaining),
          avgFreeMessagesRemaining: Math.max(0, 15 - avgFreeMessagesRemaining)
        },
        services: {
          chatAccessService: 'HEALTHY',
          userMessageUsage: 'HEALTHY',
          userRateLimit: 'HEALTHY',
          chatModel: 'HEALTHY'
        }
      };

      res.status(200).json({
        success: true,
        data: health
      });

    } catch (error) {
      console.error('Error getting system health:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
}

module.exports = EnhancedChatAccessController;
