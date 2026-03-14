const express = require('express');
const router = express.Router();
const auditController = require('../controllers/auditController');
const { authenticate } = require('../middlewares/auth');
const { requirePermission } = require('../middlewares/permissionMiddleware');
const rateLimit = require('express-rate-limit');

// Apply authentication to all audit routes
router.use(authenticate);

// Rate limiting for audit endpoints
const auditLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many audit requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiting to all audit routes
router.use(auditLimiter);

// Get audit logs with filtering and pagination
router.get('/logs', 
  requirePermission('read_audit_logs'), 
  auditController.getAuditLogs
);

// Get audit statistics and analytics
router.get('/statistics', 
  requirePermission('read_audit_logs'), 
  auditController.getAuditStatistics
);

// Get detailed audit log by ID
router.get('/logs/:logId', 
  requirePermission('read_audit_logs'), 
  auditController.getAuditLogById
);

// Export audit logs (CSV format)
router.get('/export', 
  requirePermission('export_audit_logs'), 
  auditController.exportAuditLogs
);

// Get available action types for filtering
router.get('/action-types', 
  requirePermission('read_audit_logs'), 
  auditController.getActionTypes
);

// Get available target types for filtering
router.get('/target-types', 
  requirePermission('read_audit_logs'), 
  auditController.getTargetTypes
);

// Get admin activity summary
router.get('/activity-summary', 
  requirePermission('read_audit_logs'), 
  auditController.getAdminActivitySummary
);

module.exports = router;
