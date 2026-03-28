const { body, param, query } = require('express-validator');
const { handleValidationErrors } = require('./authValidator');

/**
 * Notification validation chains
 */

// Get notifications validation
const getNotifications = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50'),
  handleValidationErrors
];

// Mark notifications as read validation
const markAsRead = [
  body('notificationIds')
    .isArray({ min: 1 })
    .withMessage('Notification IDs must be an array with at least one element'),
  body('notificationIds.*')
    .isMongoId()
    .withMessage('Each notification ID must be a valid MongoDB ID'),
  handleValidationErrors
];

// Mark single notification as read validation
const markSingleAsRead = [
  param('notificationId')
    .isMongoId()
    .withMessage('Notification ID must be a valid MongoDB ID'),
  handleValidationErrors
];

// Delete notification validation
const deleteNotification = [
  param('notificationId')
    .isMongoId()
    .withMessage('Notification ID must be a valid MongoDB ID'),
  handleValidationErrors
];

module.exports = {
  getNotifications,
  markAsRead,
  markSingleAsRead,
  deleteNotification
};
