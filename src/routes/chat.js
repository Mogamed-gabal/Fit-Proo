const express = require('express');
const router = express.Router();
const multer = require('multer');
const { authenticate } = require('../middlewares/auth');
const DynamicPermissionMiddleware = require('../middleware/dynamicPermissionMiddleware');
const ChatController = require('../controllers/chatController');
const { body, query } = require('express-validator');
const { asyncErrorHandler } = require('../middlewares/userErrorMiddleware');
const { uploadImage } = require('../services/cloudinaryService');

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
  body('subscriptionId').optional().isMongoId().withMessage('Invalid subscription ID format')
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

// Multer configuration for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 25 * 1024 * 1024, // 25MB limit
    files: 1
  },
  fileFilter: (req, file, cb) => {
    // Allowed file types
    const allowedMimes = [
      // Images
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'image/gif',
      'image/webp',
      // Documents
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      // Audio
      'audio/mpeg',
      'audio/wav',
      'audio/mp3',
      'audio/m4a',
      // Video
      'video/mp4',
      'video/quicktime',
      'video/x-msvideo'
    ];
    
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images, PDFs, documents, audio, and video files are allowed.'), false);
    }
  }
});

// Validation for file upload
const validateFileUpload = [
  body('chatId').isString().notEmpty().withMessage('Chat ID is required'),
  body('messageType').optional().isIn(['IMAGE', 'FILE']).withMessage('Invalid message type')
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

// Upload file and send message with attachment
router.post('/upload-file',
  authenticate,
  upload.single('file'),
  validateFileUpload,
  asyncErrorHandler(ChatController.uploadFile)
);

// Upload image specifically (for better image handling)
router.post('/upload-image',
  authenticate,
  upload.single('image'),
  validateFileUpload,
  asyncErrorHandler(ChatController.uploadImage)
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
    query('status').optional().isIn(['ACTIVE', 'SUSPENDED', 'CLOSED']).withMessage('Invalid status'),
    query('search').optional().isString().trim().isLength({ min: 1, max: 100 }).withMessage('Search term must be between 1 and 100 characters'),
    query('participantRole').optional().isIn(['client', 'doctor', 'nutritionist', 'therapist', 'coach']).withMessage('Invalid participant role'),
    query('specialization').optional().isString().trim().isLength({ min: 1, max: 50 }).withMessage('Specialization must be between 1 and 50 characters'),
    query('chatType').optional().isIn(['ONE_TO_ONE', 'GROUP']).withMessage('Invalid chat type')
  ],
  asyncErrorHandler(ChatController.getAllChats)
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
  asyncErrorHandler(ChatController.getAdminChatMessages)
);

// Admin get chat statistics
router.get('/admin/:chatId/statistics',
  authenticate,
  DynamicPermissionMiddleware.requireAdminOrPermission('VIEW_ALL_CHATS'),
  asyncErrorHandler(ChatController.getAdminChatStatistics)
);

module.exports = router;
