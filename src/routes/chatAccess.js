const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/auth');
const ChatAccessController = require('../controllers/chatAccessController');
const { body, query } = require('express-validator');
const { asyncErrorHandler } = require('../middlewares/userErrorMiddleware');

/**
 * Chat Access Control Routes
 * API endpoints for testing and managing chat access control
 */

// Validation middleware
const validateChatContext = [
  body('chatContext.chatId').isMongoId().withMessage('Invalid chat ID'),
  body('chatContext.chatType').isIn(['ONE_TO_ONE', 'GROUP']).withMessage('Invalid chat type'),
  body('chatContext.participants').isArray().withMessage('Participants must be an array'),
  body('chatContext.participants.*').isMongoId().withMessage('Invalid participant ID'),
  body('chatContext.doctorId').optional().isMongoId().withMessage('Invalid doctor ID'),
  body('chatContext.bundleId').optional().isMongoId().withMessage('Invalid bundle ID')
];

const validateUserId = [
  body('userId').isMongoId().withMessage('Invalid user ID')
];

const validateMessageContext = [
  ...validateUserId,
  body('messageContext.chatContext').notEmpty().withMessage('Chat context is required'),
  body('messageContext.messageType').optional().isString().withMessage('Message type must be string')
];

// Check chat access (for testing)
router.post('/check-access',
  authenticate,
  validateUserId,
  validateChatContext,
  asyncErrorHandler(ChatAccessController.checkChatAccess)
);

// Check send message permission (for testing)
router.post('/check-send',
  authenticate,
  validateUserId,
  validateChatContext,
  asyncErrorHandler(ChatAccessController.checkSendMessage)
);

// Record message (for testing)
router.post('/record-message',
  authenticate,
  validateMessageContext,
  asyncErrorHandler(ChatAccessController.recordMessage)
);

// Get user access summary
router.get('/user-summary/:userId',
  authenticate,
  asyncErrorHandler(ChatAccessController.getUserAccessSummary)
);

// Test access with current user
router.post('/test-access',
  authenticate,
  validateChatContext,
  asyncErrorHandler(ChatAccessController.testAccess)
);

module.exports = router;
