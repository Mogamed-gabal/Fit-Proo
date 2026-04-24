const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/auth');
const { requirePermission } = require('../middlewares/permissionMiddleware');
const { body, query, validationResult } = require('express-validator');
const SupervisorAuditController = require('../controllers/supervisorAuditController');
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
 * Supervisor Audit Routes
 * All routes require admin authentication and permissions
 */

// Get all supervisor audit logs with filtering
router.get('/logs',
  authenticate,
  requirePermission('read_supervisor_audit'),
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('supervisorId').optional().isMongoId().withMessage('Invalid supervisor ID'),
    query('action').optional().isAlpha().withMessage('Action must contain only letters'),
    query('module').optional().isAlpha().withMessage('Module must contain only letters'),
    query('status').optional().isIn(['SUCCESS', 'FAILURE', 'PARTIAL', 'PENDING']).withMessage('Invalid status'),
    query('dateFrom').optional().isISO8601().withMessage('Invalid date format'),
    query('dateTo').optional().isISO8601().withMessage('Invalid date format')
  ],
  handleValidationErrors,
  asyncErrorHandler(SupervisorAuditController.getSupervisorAuditLogs)
);

// Get supervisor activity statistics
router.get('/activity',
  authenticate,
  requirePermission('read_supervisor_audit'),
  [
    query('supervisorId').optional().isMongoId().withMessage('Invalid supervisor ID'),
    query('dateFrom').optional().isISO8601().withMessage('Invalid date format'),
    query('dateTo').optional().isISO8601().withMessage('Invalid date format'),
    query('days').optional().isInt({ min: 1, max: 365 }).withMessage('Days must be between 1 and 365')
  ],
  handleValidationErrors,
  asyncErrorHandler(SupervisorAuditController.getSupervisorActivity)
);

// Get audit summary for dashboard
router.get('/summary',
  authenticate,
  requirePermission('read_supervisor_audit'),
  [
    query('supervisorId').optional().isMongoId().withMessage('Invalid supervisor ID'),
    query('days').optional().isInt({ min: 1, max: 365 }).withMessage('Days must be between 1 and 365')
  ],
  handleValidationErrors,
  asyncErrorHandler(SupervisorAuditController.getAuditSummary)
);

// Get logs for specific supervisor
router.get('/supervisor/:supervisorId',
  authenticate,
  requirePermission('read_supervisor_audit'),
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('action').optional().isAlpha().withMessage('Action must contain only letters'),
    query('module').optional().isAlpha().withMessage('Module must contain only letters'),
    query('status').optional().isIn(['SUCCESS', 'FAILURE', 'PARTIAL', 'PENDING']).withMessage('Invalid status'),
    query('dateFrom').optional().isISO8601().withMessage('Invalid date format'),
    query('dateTo').optional().isISO8601().withMessage('Invalid date format')
  ],
  handleValidationErrors,
  asyncErrorHandler(SupervisorAuditController.getSupervisorSpecificLogs)
);

// Export supervisor audit logs
router.get('/export',
  authenticate,
  requirePermission('export_supervisor_audit'),
  [
    query('format').optional().isIn(['json', 'csv']).withMessage('Format must be json or csv'),
    query('supervisorId').optional().isMongoId().withMessage('Invalid supervisor ID'),
    query('action').optional().isAlpha().withMessage('Action must contain only letters'),
    query('module').optional().isAlpha().withMessage('Module must contain only letters'),
    query('dateFrom').optional().isISO8601().withMessage('Invalid date format'),
    query('dateTo').optional().isISO8601().withMessage('Invalid date format')
  ],
  handleValidationErrors,
  asyncErrorHandler(SupervisorAuditController.exportSupervisorAuditLogs)
);

// Archive old supervisor audit logs
router.post('/archive',
  authenticate,
  requirePermission('manage_supervisor_audit'),
  [
    body('days').optional().isInt({ min: 30, max: 365 }).withMessage('Days must be between 30 and 365')
  ],
  handleValidationErrors,
  asyncErrorHandler(SupervisorAuditController.archiveOldLogs)
);

// Get archived supervisor audit logs
router.get('/archived',
  authenticate,
  requirePermission('read_supervisor_audit'),
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('supervisorId').optional().isMongoId().withMessage('Invalid supervisor ID'),
    query('dateFrom').optional().isISO8601().withMessage('Invalid date format'),
    query('dateTo').optional().isISO8601().withMessage('Invalid date format')
  ],
  handleValidationErrors,
  asyncErrorHandler(SupervisorAuditController.getArchivedLogs)
);

module.exports = router;
