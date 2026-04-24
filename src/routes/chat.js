const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/auth');
const DynamicPermissionMiddleware = require('../middleware/dynamicPermissionMiddleware');
const ChatController = require('../controllers/chatController');
const { body, query } = require('express-validator');
const { asyncErrorHandler } = require('../middlewares/userErrorMiddleware');

/**
 * Chat Routes
 * HTTP API endpoints for chat operations
 */

// Validation middleware
const validateChatCreation = [
  body('chatData.chatId').isString().notEmpty().withMessage('Chat ID is required'),
  body('chatData.type').isIn(['ONE_TO_ONE', 'GROUP']).withMessage('Invalid chat type'),
  body('chatData.participants').isArray().withMessage('Participants must be an array'),
  body('chatData.participants.*.userId').isMongoId().withMessage('Invalid participant ID'),
  body('subscriptionId').isMongoId().withMessage('Subscription ID is required')
];

const validateSendMessage = [
  body('chatId').isString().notEmpty().withMessage('Chat ID is required'),
  body('content').isString().notEmpty().withMessage('Message content is required'),
  body('content').isLength({ min: 1, max: 4000 }).withMessage('Message content must be 1-4000 characters'),
  body('type').optional().isIn(['TEXT', 'IMAGE', 'FILE']).withMessage('Invalid message type'),
  body('attachment').optional().isObject().withMessage('Attachment must be an object')
];

const validateJoinChat = [
  body('chatId').isString().notEmpty().withMessage('Chat ID is required')
];

const validateMarkRead = [
  body('messageId').isString().notEmpty().withMessage('Message ID is required')
];

const validateEditMessage = [
  body('content').isString().notEmpty().withMessage('Message content is required'),
  body('content').isLength({ min: 1, max: 4000 }).withMessage('Message content must be 1-4000 characters')
];

const validateReaction = [
  body('reactionType').isIn(['LIKE', 'LOVE', 'LAUGH', 'ANGRY', 'SAD']).withMessage('Invalid reaction type')
];

// Create a new chat
router.post('/create',
  authenticate,
  validateChatCreation,
  asyncErrorHandler(ChatController.createChat)
);

// Send a message
router.post('/send-message',
  authenticate,
  validateSendMessage,
  asyncErrorHandler(ChatController.sendMessage)
);

// Get chat messages
router.get('/:chatId/messages',
  authenticate,
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('before').optional().isISO8601().withMessage('Invalid date format'),
    query('after').optional().isISO8601().withMessage('Invalid date format'),
    query('markAsRead').optional().isBoolean().withMessage('markAsRead must be boolean')
  ],
  asyncErrorHandler(ChatController.getChatMessages)
);

// Get user's chats
router.get('/my-chats',
  authenticate,
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('type').optional().isIn(['ONE_TO_ONE', 'GROUP']).withMessage('Invalid chat type')
  ],
  asyncErrorHandler(ChatController.getUserChats)
);

// Join chat (HTTP API)
router.post('/join',
  authenticate,
  validateJoinChat,
  asyncErrorHandler(ChatController.joinChat)
);

// Mark message as read
router.post('/mark-read',
  authenticate,
  validateMarkRead,
  asyncErrorHandler(ChatController.markMessageAsRead)
);

// Delete a message
router.delete('/message/:messageId',
  authenticate,
  asyncErrorHandler(ChatController.deleteMessage)
);

// Edit a message
router.put('/message/:messageId',
  authenticate,
  validateEditMessage,
  asyncErrorHandler(ChatController.editMessage)
);

// Add reaction to message
router.post('/message/:messageId/reaction',
  authenticate,
  validateReaction,
  asyncErrorHandler(ChatController.addReaction)
);

// Remove reaction from message
router.delete('/message/:messageId/reaction',
  authenticate,
  asyncErrorHandler(ChatController.removeReaction)
);

// Get chat statistics
router.get('/:chatId/statistics',
  authenticate,
  asyncErrorHandler(ChatController.getChatStatistics)
);

// Get user chat statistics
router.get('/my-statistics',
  authenticate,
  asyncErrorHandler(ChatController.getUserChatStatistics)
);

// Admin routes - require admin permissions
router.get('/admin/all-chats',
  authenticate,
  DynamicPermissionMiddleware.requireAdminOrPermission('VIEW_ALL_CHATS'),
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('status').optional().isIn(['ACTIVE', 'SUSPENDED', 'CLOSED']).withMessage('Invalid status')
  ],
  asyncErrorHandler(async (req, res) => {
    try {
      // Admin can view all chats
      const Chat = require('../models/Chat');
      const { page = 1, limit = 20, status } = req.query;
      
      const query = status ? { status, isDeleted: false } : { isDeleted: false };
      
      const chats = await Chat.find(query)
        .populate('participants.userId', 'name email role')
        .populate('subscriptionBinding.subscriptionId')
        .sort({ updatedAt: -1 })
        .limit(parseInt(limit))
        .skip((parseInt(page) - 1) * parseInt(limit));
      
      const total = await Chat.countDocuments(query);
      
      res.status(200).json({
        success: true,
        data: {
          chats: chats.map(chat => chat.getChatInfo()),
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / parseInt(limit))
          }
        }
      });
    } catch (error) {
      console.error('Error getting all chats:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  })
);

// Admin view chat messages
router.get('/admin/:chatId/messages',
  authenticate,
  DynamicPermissionMiddleware.requireAdminOrPermission('VIEW_ALL_CHATS'),
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('before').optional().isISO8601().withMessage('Invalid date format'),
    query('after').optional().isISO8601().withMessage('Invalid date format')
  ],
  asyncErrorHandler(async (req, res) => {
    try {
      const { chatId } = req.params;
      const { page = 1, limit = 50, before, after } = req.query;
      
      // Admin can view any chat messages
      const ChatMessage = require('../models/ChatMessage');
      const messages = await ChatMessage.getChatMessages(chatId, {
        page: parseInt(page),
        limit: parseInt(limit),
        before,
        after,
        markAsRead: false // Admin doesn't affect read status
      });
      
      res.status(200).json({
        success: true,
        data: {
          messages,
          page: parseInt(page),
          limit: parseInt(limit)
        }
      });
    } catch (error) {
      console.error('Error getting chat messages (admin):', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  })
);

// Admin get chat statistics
router.get('/admin/:chatId/statistics',
  authenticate,
  DynamicPermissionMiddleware.requireAdminOrPermission('VIEW_ALL_CHATS'),
  asyncErrorHandler(async (req, res) => {
    try {
      const { chatId } = req.params;
      
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
  })
);

module.exports = router;
