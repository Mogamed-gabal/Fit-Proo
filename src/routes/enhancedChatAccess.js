const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/auth');
const EnhancedChatAccessController = require('../controllers/enhancedChatAccessController');
const { body, query } = require('express-validator');
const { asyncErrorHandler } = require('../middlewares/userErrorMiddleware');

/**
 * Enhanced Chat Access Control Routes
 * Secure API endpoints for testing and managing chat access control
 */

// Validation middleware
const validateUserId = [
  body('userId').isMongoId().withMessage('Invalid user ID')
];

const validateChatId = [
  body('chatId').isString().notEmpty().withMessage('Chat ID is required')
];

const validateChatCreation = [
  body('userId').isMongoId().withMessage('Invalid user ID'),
  body('subscriptionId').isMongoId().withMessage('Invalid subscription ID'),
  body('chatData.chatId').isString().notEmpty().withMessage('Chat ID is required'),
  body('chatData.type').isIn(['ONE_TO_ONE', 'GROUP']).withMessage('Invalid chat type'),
  body('chatData.participants').isArray().withMessage('Participants must be an array'),
  body('chatData.participants.*.userId').isMongoId().withMessage('Invalid participant ID')
];

const validateMessageContext = [
  ...validateUserId,
  ...validateChatId,
  body('messageContext.messageType').optional().isString().withMessage('Message type must be string')
];

const validateConcurrencyTest = [
  ...validateUserId,
  ...validateChatId,
  body('messageCount').optional().isInt({ min: 1, max: 50 }).withMessage('Message count must be between 1 and 50')
];

// Check chat access (enhanced with database validation)
router.post('/enhanced/check-access',
  authenticate,
  validateUserId,
  validateChatId,
  asyncErrorHandler(EnhancedChatAccessController.checkChatAccess)
);

// Check send message permission (enhanced)
router.post('/enhanced/check-send',
  authenticate,
  validateUserId,
  validateChatId,
  asyncErrorHandler(EnhancedChatAccessController.checkSendMessage)
);

// Record message (atomic operation)
router.post('/enhanced/record-message',
  authenticate,
  validateMessageContext,
  asyncErrorHandler(EnhancedChatAccessController.recordMessage)
);

// Get user access summary (enhanced)
router.get('/enhanced/user-summary/:userId',
  authenticate,
  asyncErrorHandler(EnhancedChatAccessController.getUserAccessSummary)
);

// Create bound chat with subscription validation
router.post('/enhanced/create-chat',
  authenticate,
  validateChatCreation,
  asyncErrorHandler(EnhancedChatAccessController.createBoundChat)
);

// Test access with current user (enhanced)
router.post('/enhanced/test-access',
  authenticate,
  validateChatId,
  asyncErrorHandler(EnhancedChatAccessController.testAccess)
);

// Detailed access analysis (for debugging)
router.post('/enhanced/analyze-access',
  authenticate,
  validateUserId,
  validateChatId,
  asyncErrorHandler(EnhancedChatAccessController.analyzeAccess)
);

// Concurrency testing (for load testing)
router.post('/enhanced/concurrency-test',
  authenticate,
  validateConcurrencyTest,
  asyncErrorHandler(EnhancedChatAccessController.concurrencyTest)
);

// System health metrics
router.get('/enhanced/health',
  authenticate,
  asyncErrorHandler(EnhancedChatAccessController.getSystemHealth)
);

module.exports = router;
