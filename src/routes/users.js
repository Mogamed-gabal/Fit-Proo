const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticate } = require('../middlewares/auth');
const { requirePermission } = require('../middlewares/permissionMiddleware');
const { body, param, query } = require('express-validator');

// Apply authentication middleware to all routes
router.use(authenticate);

/**
 * Get all users with role = 'client'
 * GET /api/users
 * Query params: page, limit, search
 */
router.get('/',
  requirePermission('view_client_workout_plans'),
  [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
    query('search')
      .optional()
      .trim()
      .isLength({ max: 100 })
      .withMessage('Search term cannot exceed 100 characters')
  ],
  userController.getUsers
);

/**
 * Get user statistics
 * GET /api/users/stats
 */
router.get('/stats',
  requirePermission('view_client_workout_plans'),
  userController.getUserStats
);

/**
 * Get all blocked users AND deleted supervisors (admin/supervisor with permissions)
 * GET /api/users/deleted
 * Query params: page, limit, search, role, blockedFrom, blockedTo
 * Returns: Users with isBlocked=true + supervisors with isDeleted=true
 */
router.get('/deleted',
  requirePermission('view_deleted_users'),
  [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
    query('search')
      .optional()
      .trim()
      .isLength({ max: 100 })
      .withMessage('Search term cannot exceed 100 characters'),
    query('role')
      .optional()
      .isIn(['client', 'doctor', 'supervisor', 'admin'])
      .withMessage('Role must be one of: client, doctor, supervisor, admin'),
    query('blockedFrom')
      .optional()
      .isISO8601()
      .withMessage('Blocked from must be a valid date'),
    query('blockedTo')
      .optional()
      .isISO8601()
      .withMessage('Blocked to must be a valid date')
  ],
  userController.getDeletedUsers
);

/**
 * Get user by ID
 * GET /api/users/:id
 */
router.get('/:id',
  requirePermission('view_client_workout_plans'),
  [
    param('id')
      .isMongoId()
      .withMessage('Invalid user ID')
  ],
  userController.getUserById
);

/**
 * Update user status (activate/deactivate)
 * PATCH /api/users/:id/status
 */
router.patch('/:id/status',
  requirePermission('manage_client_workout_plans'),
  [
    param('id')
      .isMongoId()
      .withMessage('Invalid user ID'),
    body('isActive')
      .isBoolean()
      .withMessage('isActive must be a boolean')
  ],
  userController.updateUserStatus
);

/**
 * Delete user
 * DELETE /api/users/:id
 */
router.delete('/:id',
  requirePermission('manage_client_workout_plans'),
  [
    param('id')
      .isMongoId()
      .withMessage('Invalid user ID')
  ],
  userController.deleteUser
);

/**
 * Permanently delete a user (admin/supervisor with permissions)
 * DELETE /api/users/:userId/permanent
 */
router.delete('/:userId/permanent',
  requirePermission('permanent_delete_users'),
  [
    param('userId')
      .isMongoId()
      .withMessage('Invalid user ID'),
    body('reason')
      .optional()
      .trim()
      .isLength({ min: 3, max: 500 })
      .withMessage('Reason must be between 3 and 500 characters')
  ],
  userController.permanentDeleteUser
);

/**
 * Restore deleted user
 * POST /api/users/:userId/restore
 */
router.post('/:userId/restore',
  requirePermission('restore_deleted_users'),
  [
    param('userId')
      .isMongoId()
      .withMessage('Invalid user ID'),
    body('reason')
      .optional()
      .trim()
      .isLength({ min: 3, max: 500 })
      .withMessage('Reason must be between 3 and 500 characters')
  ],
  userController.restoreUser
);

module.exports = router;
