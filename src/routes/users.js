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
  requirePermission('read_users'),
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
  requirePermission('read_users'),
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
 * Get all soft-deleted users (any role)
 * GET /api/users/soft-deleted
 * Query params: page, limit, role, sortBy, sortOrder, search
 * Returns: All users with isDeleted=true regardless of role
 */
router.get('/soft-deleted',
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
    query('role')
      .optional()
      .isIn(['client', 'doctor', 'supervisor', 'admin', 'all'])
      .withMessage('Role must be one of: client, doctor, supervisor, admin, or all'),
    query('sortBy')
      .optional()
      .isIn(['deletedAt', 'name', 'email', 'createdAt', 'role'])
      .withMessage('Sort field must be one of: deletedAt, name, email, createdAt, role'),
    query('sortOrder')
      .optional()
      .isIn(['asc', 'desc'])
      .withMessage('Sort order must be asc or desc'),
    query('search')
      .optional()
      .trim()
      .isLength({ max: 100 })
      .withMessage('Search term cannot exceed 100 characters')
  ],
  userController.getSoftDeletedUsers
);

/**
 * Get user by ID
 * GET /api/users/:id
 */
router.get('/:id',
  requirePermission('read_user_details'),
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
  requirePermission('manage_users_limited'),
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
  requirePermission('manage_users_limited'),
  [
    param('id')
      .isMongoId()
      .withMessage('Invalid user ID')
  ],
  userController.deleteUser
);


/**
 * Restore any deleted user (regardless of role)
 * PATCH /api/users/:userId/restore
 * Works for: client, doctor, supervisor, admin - any role
 */
router.patch('/:userId/restore',
  requirePermission('view_deleted_users'),
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

/**
 * Debug endpoint to compare query methods
 * GET /debug/user/:id
 */
router.get('/debug/user/:id', userController.debugUserQuery);

/**
 * Permanently delete any user (regardless of role)
 * DELETE /api/users/:userId/permanent
 * Works for: client, doctor, supervisor, admin - ANY role
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

module.exports = router;
