const express = require('express');
const router = express.Router();
const doctorController = require('../controllers/doctorController');
const { authenticate } = require('../middlewares/auth');
const { requirePermission } = require('../middlewares/permissionMiddleware');
const { body, param, query } = require('express-validator');

// Apply authentication middleware to all routes
router.use(authenticate);

/**
 * Get all doctors with filters and search
 * GET /api/doctors
 * Query params: page, limit, status, specialization, search
 */
router.get('/',
  requirePermission('manage_doctors'),
  [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
    query('status')
      .optional()
      .isIn(['approved', 'pending', 'rejected', 'blocked', 'deleted'])
      .withMessage('Status must be one of: approved, pending, rejected, blocked, deleted'),
    query('specialization')
      .optional()
      .trim()
      .isLength({ max: 50 })
      .withMessage('Specialization cannot exceed 50 characters'),
    query('search')
      .optional()
      .trim()
      .isLength({ max: 100 })
      .withMessage('Search term cannot exceed 100 characters')
  ],
  doctorController.getDoctors
);

/**
 * Get doctor by ID
 * GET /api/doctors/:doctorId
 */
router.get('/:doctorId',
  requirePermission('manage_doctors'),
  [
    param('doctorId')
      .isMongoId()
      .withMessage('Invalid doctor ID')
  ],
  doctorController.getDoctorById
);

/**
 * Get doctors by specialization
 * GET /api/doctors/specialization/:specialization
 */
router.get('/specialization/:specialization',
  requirePermission('manage_doctors'),
  [
    param('specialization')
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('Specialization must be between 2 and 50 characters'),
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100')
  ],
  doctorController.getDoctorsBySpecialization
);

/**
 * Approve doctor
 * PATCH /api/doctors/:doctorId/approve
 */
router.patch('/:doctorId/approve',
  requirePermission('manage_doctors'),
  [
    param('doctorId')
      .isMongoId()
      .withMessage('Invalid doctor ID'),
    body('reason')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Approval reason cannot exceed 500 characters')
  ],
  doctorController.approveDoctor
);

/**
 * Reject doctor
 * PATCH /api/doctors/:doctorId/reject
 */
router.patch('/:doctorId/reject',
  requirePermission('manage_doctors'),
  [
    param('doctorId')
      .isMongoId()
      .withMessage('Invalid doctor ID'),
    body('reason')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Rejection reason cannot exceed 500 characters')
  ],
  doctorController.rejectDoctor
);

/**
 * Restore doctor (after soft delete)
 * PATCH /api/doctors/:doctorId/restore
 */
router.patch('/:doctorId/restore',
  requirePermission('manage_doctors'),
  [
    param('doctorId')
      .isMongoId()
      .withMessage('Invalid doctor ID')
  ],
  doctorController.restoreDoctor
);

/**
 * Get doctor statistics
 * GET /api/doctors/stats
 */
router.get('/stats',
  requirePermission('manage_doctors'),
  doctorController.getDoctorStats
);

module.exports = router;
