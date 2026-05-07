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
const validateBundleCreation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Bundle name is required')
    .isLength({ max: 100 })
    .withMessage('Bundle name cannot exceed 100 characters'),
  body('doctors')
    .isArray({ min: 2, max: 3 })
    .withMessage('Bundle must contain between 2 and 3 doctors'),
  body('doctors.*')
    .isMongoId()
    .withMessage('Invalid doctor ID format'),
  body('pricing.oneMonth')
    .isFloat({ gt: 0 })
    .withMessage('One month price must be greater than 0'),
  body('pricing.threeMonths')
    .isFloat({ gt: 0 })
    .withMessage('Three months price must be greater than 0'),
  body('pricing.sixMonths')
    .isFloat({ gt: 0 })
    .withMessage('Six months price must be greater than 0')
];

router.post('/',
  requirePermission('MANAGE_BUNDLES'),
  validateBundleCreation,
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
      .isArray({ min: 2, max: 3 })
      .withMessage('Bundle must contain between 2 and 3 doctors'),
    body('doctors.*')
      .optional()
      .isMongoId()
      .withMessage('Invalid doctor ID format'),
    body('pricing.oneMonth')
      .optional()
      .isFloat({ gt: 0 })
      .withMessage('One month price must be greater than 0'),
    body('pricing.threeMonths')
      .optional()
      .isFloat({ gt: 0 })
      .withMessage('Three months price must be greater than 0'),
    body('pricing.sixMonths')
      .optional()
      .isFloat({ gt: 0 })
      .withMessage('Six months price must be greater than 0')
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
