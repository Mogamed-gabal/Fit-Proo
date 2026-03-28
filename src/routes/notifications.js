const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { authenticate } = require('../middlewares/auth');
const notificationValidator = require('../middlewares/validators/notificationValidator');

// All notification routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/notifications
 * @desc    Get user notifications with pagination
 * @access  Private
 */
router.get('/', 
  notificationValidator.getNotifications,
  notificationController.getNotifications
);

/**
 * @route   GET /api/notifications/unread-count
 * @desc    Get unread notifications count
 * @access  Private
 */
router.get('/unread-count', 
  notificationController.getUnreadCount
);

/**
 * @route   PUT /api/notifications/mark-read
 * @desc    Mark notifications as read
 * @access  Private
 */
router.put('/mark-read', 
  notificationValidator.markAsRead,
  notificationController.markAsRead
);

/**
 * @route   PUT /api/notifications/:notificationId/mark-read
 * @desc    Mark single notification as read
 * @access  Private
 */
router.put('/:notificationId/mark-read', 
  notificationValidator.markSingleAsRead,
  notificationController.markSingleAsRead
);

/**
 * @route   DELETE /api/notifications/:notificationId
 * @desc    Delete notification
 * @access  Private
 */
router.delete('/:notificationId', 
  notificationValidator.deleteNotification,
  notificationController.deleteNotification
);

/**
 * @route   DELETE /api/notifications/clear-read
 * @desc    Clear all read notifications
 * @access  Private
 */
router.delete('/clear-read', 
  notificationController.clearReadNotifications
);

module.exports = router;
