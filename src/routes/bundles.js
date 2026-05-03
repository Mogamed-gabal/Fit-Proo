const express = require('express');
const router = express.Router();
const bundleController = require('../controllers/bundleController');
const { authenticate } = require('../middlewares/auth');
const { requirePermission } = require('../middlewares/permissionMiddleware');
const { body, param } = require('express-validator');

// Apply authentication to all routes
router.use(authenticate);

/**
 * Create a new bundle
 * POST /api/bundles
 */
router.post('/',
  requirePermission('MANAGE_BUNDLES'),
  [
    body('name')
      .trim()
      .notEmpty()
      .withMessage('Bundle name is required')
      .isLength({ max: 100 })
      .withMessage('Bundle name cannot exceed 100 characters'),
    body('doctors')
      .isArray({ min: 2, max: 2 })
      .withMessage('Bundle must contain exactly 2 doctors'),
    body('doctors.*')
      .isMongoId()
      .withMessage('Invalid doctor ID format'),
    body('price')
      .isFloat({ gt: 0 })
      .withMessage('Price must be greater than 0')
  ],
  bundleController.createBundle
);

/**
 * Get all bundles
 * GET /api/bundles
 */
router.get('/',
  bundleController.getAllBundles
);

/**
 * Update a bundle
 * PUT /api/bundles/:id
 */
router.put('/:id',
  requirePermission('MANAGE_BUNDLES'),
  [
    param('id')
      .isMongoId()
      .withMessage('Invalid bundle ID'),
    body('name')
      .optional()
      .trim()
      .notEmpty()
      .withMessage('Bundle name cannot be empty')
      .isLength({ max: 100 })
      .withMessage('Bundle name cannot exceed 100 characters'),
    body('doctors')
      .optional()
      .isArray({ min: 2, max: 2 })
      .withMessage('Bundle must contain exactly 2 doctors'),
    body('doctors.*')
      .optional()
      .isMongoId()
      .withMessage('Invalid doctor ID format'),
    body('price')
      .optional()
      .isFloat({ gt: 0 })
      .withMessage('Price must be greater than 0')
  ],
  bundleController.updateBundle
);

/**
 * Deactivate a bundle
 * PATCH /api/bundles/:id/deactivate
 */
router.patch('/:id/deactivate',
  requirePermission('MANAGE_BUNDLES'),
  [
    param('id')
      .isMongoId()
      .withMessage('Invalid bundle ID')
  ],
  bundleController.deactivateBundle
);

module.exports = router;
