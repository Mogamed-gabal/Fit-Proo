const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/auth');
const DynamicPermissionMiddleware = require('../middleware/dynamicPermissionMiddleware');
const { body, query, validationResult } = require('express-validator');
const PermissionController = require('../controllers/permissionController');
const { asyncErrorHandler } = require('../middlewares/userErrorMiddleware');

// Validation middleware
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array()
    });
  }
  next();
};

/**
 * Permission Management Routes
 * Dynamic permission system for role-based access control
 */

// Grant permission to user
router.post('/grant',
  authenticate,
  DynamicPermissionMiddleware.requirePermissionManagement(),
  [
    body('userId').isMongoId().withMessage('Invalid user ID'),
    body('permissionName').notEmpty().withMessage('Permission name is required'),
    body('expiresAt').optional().isISO8601().withMessage('Invalid expiration date'),
    body('reason').optional().isString().withMessage('Reason must be a string')
  ],
  handleValidationErrors,
  asyncErrorHandler(PermissionController.grantPermission)
);

// Revoke permission from user
router.post('/revoke',
  authenticate,
  DynamicPermissionMiddleware.requirePermissionManagement(),
  [
    body('userId').isMongoId().withMessage('Invalid user ID'),
    body('permissionName').notEmpty().withMessage('Permission name is required'),
    body('reason').optional().isString().withMessage('Reason must be a string')
  ],
  handleValidationErrors,
  asyncErrorHandler(PermissionController.revokePermission)
);

// Get user permissions
router.get('/user/:userId',
  authenticate,
  DynamicPermissionMiddleware.requirePermission('read_permissions'),
  [
    query('includeInactive').optional().isBoolean().withMessage('Include inactive must be boolean')
  ],
  handleValidationErrors,
  asyncErrorHandler(PermissionController.getUserPermissions)
);

// Get current user permissions
router.get('/my',
  authenticate,
  [
    query('includeInactive').optional().isBoolean().withMessage('Include inactive must be boolean')
  ],
  handleValidationErrors,
  asyncErrorHandler(PermissionController.getMyPermissions)
);

// Get all available permissions
router.get('/all',
  authenticate,
  DynamicPermissionMiddleware.requirePermission('read_permissions'),
  [
    query('category').optional().isAlpha().withMessage('Category must contain only letters'),
    query('includeInactive').optional().isBoolean().withMessage('Include inactive must be boolean')
  ],
  handleValidationErrors,
  asyncErrorHandler(PermissionController.getAllPermissions)
);

// Get permissions by category
router.get('/category/:category',
  authenticate,
  DynamicPermissionMiddleware.requirePermission('read_permissions'),
  [
    query('includeInactive').optional().isBoolean().withMessage('Include inactive must be boolean')
  ],
  handleValidationErrors,
  asyncErrorHandler(PermissionController.getPermissionsByCategory)
);

// Grant multiple permissions
router.post('/grant-multiple',
  authenticate,
  DynamicPermissionMiddleware.requirePermissionManagement(),
  [
    body('userId').isMongoId().withMessage('Invalid user ID'),
    body('permissionNames').isArray({ min: 1 }).withMessage('Permission names must be an array with at least 1 item'),
    body('permissionNames.*').notEmpty().withMessage('Permission name cannot be empty'),
    body('expiresAt').optional().isISO8601().withMessage('Invalid expiration date'),
    body('reason').optional().isString().withMessage('Reason must be a string')
  ],
  handleValidationErrors,
  asyncErrorHandler(PermissionController.grantMultiplePermissions)
);

// Revoke multiple permissions
router.post('/revoke-multiple',
  authenticate,
  DynamicPermissionMiddleware.requirePermissionManagement(),
  [
    body('userId').isMongoId().withMessage('Invalid user ID'),
    body('permissionNames').isArray({ min: 1 }).withMessage('Permission names must be an array with at least 1 item'),
    body('permissionNames.*').notEmpty().withMessage('Permission name cannot be empty'),
    body('reason').optional().isString().withMessage('Reason must be a string')
  ],
  handleValidationErrors,
  asyncErrorHandler(PermissionController.revokeMultiplePermissions)
);

// Check user permission
router.get('/check/:userId/:permissionName',
  authenticate,
  DynamicPermissionMiddleware.requirePermission('read_permissions'),
  [
    query('resource').optional().isString().withMessage('Resource must be a string')
  ],
  handleValidationErrors,
  asyncErrorHandler(PermissionController.checkPermission)
);

// Get permission statistics
router.get('/stats',
  authenticate,
  DynamicPermissionMiddleware.requirePermission('read_permissions'),
  handleValidationErrors,
  asyncErrorHandler(PermissionController.getPermissionStats)
);

// Initialize permission system
router.post('/initialize',
  authenticate,
  DynamicPermissionMiddleware.requirePermissionManagement(),
  handleValidationErrors,
  asyncErrorHandler(PermissionController.initializePermissions)
);

// Cleanup expired permissions
router.post('/cleanup',
  authenticate,
  DynamicPermissionMiddleware.requirePermissionManagement(),
  handleValidationErrors,
  asyncErrorHandler(PermissionController.cleanupExpiredPermissions)
);

// Get effective permissions for user
router.get('/effective/:userId',
  authenticate,
  DynamicPermissionMiddleware.requirePermission('read_permissions'),
  handleValidationErrors,
  asyncErrorHandler(PermissionController.getEffectivePermissions)
);

module.exports = router;
