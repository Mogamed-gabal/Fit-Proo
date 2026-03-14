const AuditLog = require('../models/AuditLog');
const { requirePermission } = require('../middlewares/permissionMiddleware');

/**
 * Audit Controller
 * Handles audit log viewing and management for administrators
 */

/**
 * Get audit logs with filtering and pagination
 */
const getAuditLogs = async (req, res) => {
  try {
    const {
      adminId,
      actionType,
      targetType,
      targetId,
      result,
      dateFrom,
      dateTo,
      search,
      page = 1,
      limit = 50
    } = req.query;

    // Validate limit
    const parsedLimit = parseInt(limit);
    if (isNaN(parsedLimit) || parsedLimit < 1 || parsedLimit > 100) {
      return res.status(400).json({
        success: false,
        error: 'Limit must be between 1 and 100'
      });
    }

    // Validate page
    const parsedPage = parseInt(page);
    if (isNaN(parsedPage) || parsedPage < 1) {
      return res.status(400).json({
        success: false,
        error: 'Page must be a positive integer'
      });
    }

    // Validate date format
    const filters = {
      adminId,
      actionType,
      targetType,
      targetId,
      result,
      dateFrom,
      dateTo,
      search,
      page: parsedPage,
      limit: parsedLimit
    };

    // Validate date formats
    if (dateFrom && isNaN(Date.parse(dateFrom))) {
      return res.status(400).json({
        success: false,
        error: 'Invalid dateFrom format'
      });
    }

    if (dateTo && isNaN(Date.parse(dateTo))) {
      return res.status(400).json({
        success: false,
        error: 'Invalid dateTo format'
      });
    }

    // Query audit logs
    const logsResult = await AuditLog.queryLogs(filters);

    res.status(200).json({
      success: true,
      data: logsResult
    });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch audit logs'
    });
  }
};

/**
 * Get audit statistics and analytics
 */
const getAuditStatistics = async (req, res) => {
  try {
    const { adminId, dateFrom, dateTo } = req.query;

    const filters = { adminId, dateFrom, dateTo };

    // Validate date formats
    if (dateFrom && isNaN(Date.parse(dateFrom))) {
      return res.status(400).json({
        success: false,
        error: 'Invalid dateFrom format'
      });
    }

    if (dateTo && isNaN(Date.parse(dateTo))) {
      return res.status(400).json({
        success: false,
        error: 'Invalid dateTo format'
      });
    }

    const auditStatistics = await AuditLog.getStatistics(filters);

    res.status(200).json({
      success: true,
      data: auditStatistics
    });
  } catch (error) {
    console.error('Error fetching audit statistics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch audit statistics'
    });
  }
};

/**
 * Get detailed audit log by ID
 */
const getAuditLogById = async (req, res) => {
  try {
    const { logId } = req.params;

    if (!logId) {
      return res.status(400).json({
        success: false,
        error: 'Log ID is required'
      });
    }

    const log = await AuditLog.findById(logId)
      .populate('adminId', 'name email role')
      .lean();

    if (!log) {
      return res.status(404).json({
        success: false,
        error: 'Audit log not found'
      });
    }

    // Format the log for display
    const formattedLog = new AuditLog(log).toFormattedJSON();

    res.status(200).json({
      success: true,
      data: {
        log: formattedLog
      }
    });
  } catch (error) {
    console.error('Error fetching audit log:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch audit log'
    });
  }
};

/**
 * Export audit logs (CSV format)
 */
const exportAuditLogs = async (req, res) => {
  try {
    const {
      adminId,
      actionType,
      targetType,
      targetId,
      result,
      dateFrom,
      dateTo,
      search
    } = req.query;

    // Set a higher limit for exports
    const filters = {
      adminId,
      actionType,
      targetType,
      targetId,
      result,
      dateFrom,
      dateTo,
      search,
      page: 1,
      limit: 10000 // Large limit for exports
    };

    // Validate date formats
    if (dateFrom && isNaN(Date.parse(dateFrom))) {
      return res.status(400).json({
        success: false,
        error: 'Invalid dateFrom format'
      });
    }

    if (dateTo && isNaN(Date.parse(dateTo))) {
      return res.status(400).json({
        success: false,
        error: 'Invalid dateTo format'
      });
    }

    const exportResult = await AuditLog.queryLogs(filters);

    // Convert to CSV
    const csvHeaders = [
      'Timestamp',
      'Admin Name',
      'Admin Email',
      'Action Type',
      'Target Type',
      'Target ID',
      'Result',
      'Reason',
      'IP Address',
      'User Agent',
      'Endpoint'
    ];

    const csvRows = exportResult.logs.map(log => [
      log.timestamp,
      log.adminId?.name || 'N/A',
      log.adminId?.email || 'N/A',
      log.actionType,
      log.targetType,
      log.targetId,
      log.result,
      log.details?.reason || '',
      log.details?.requestInfo?.ipAddress || '',
      log.details?.requestInfo?.userAgent || '',
      log.details?.requestInfo?.endpoint || ''
    ]);

    // Build CSV
    const csvContent = [
      csvHeaders.join(','),
      ...csvRows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    // Set headers for CSV download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="audit-logs-${new Date().toISOString().split('T')[0]}.csv"`);

    res.status(200).send(csvContent);
  } catch (error) {
    console.error('Error exporting audit logs:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to export audit logs'
    });
  }
};

/**
 * Get available action types for filtering
 */
const getActionTypes = async (req, res) => {
  try {
    const actionTypes = await AuditLog.distinct('actionType');
    
    res.status(200).json({
      success: true,
      data: {
        actionTypes: actionTypes.sort()
      }
    });
  } catch (error) {
    console.error('Error fetching action types:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch action types'
    });
  }
};

/**
 * Get available target types for filtering
 */
const getTargetTypes = async (req, res) => {
  try {
    const targetTypes = await AuditLog.distinct('targetType');
    
    res.status(200).json({
      success: true,
      data: {
        targetTypes: targetTypes.sort()
      }
    });
  } catch (error) {
    console.error('Error fetching target types:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch target types'
    });
  }
};

/**
 * Get admin activity summary
 */
const getAdminActivitySummary = async (req, res) => {
  try {
    const { adminId, days = 30 } = req.query;

    // Validate days parameter
    const parsedDays = parseInt(days);
    if (isNaN(parsedDays) || parsedDays < 1 || parsedDays > 365) {
      return res.status(400).json({
        success: false,
        error: 'Days must be between 1 and 365'
      });
    }

    const dateFrom = new Date();
    dateFrom.setDate(dateFrom.getDate() - parsedDays);

    const filters = { adminId, dateFrom: dateFrom.toISOString() };

    const activityStatistics = await AuditLog.getStatistics(filters);

    // Get daily activity for the period
    const dailyActivity = await AuditLog.aggregate([
      {
        $match: {
          timestamp: { $gte: dateFrom },
          ...(adminId && { adminId: require('mongoose').Types.ObjectId(adminId) })
        }
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$timestamp'
            }
          },
          count: { $sum: 1 },
          success: {
            $sum: { $cond: [{ $eq: ['$result', 'success'] }, 1, 0] }
          },
          failure: {
            $sum: { $cond: [{ $eq: ['$result', 'failure'] }, 1, 0] }
          }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.status(200).json({
      success: true,
      data: {
        summary: activityStatistics,
        dailyActivity,
        period: {
          days: parsedDays,
          dateFrom: dateFrom.toISOString(),
          dateTo: new Date().toISOString()
        }
      }
    });
  } catch (error) {
    console.error('Error fetching admin activity summary:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch admin activity summary'
    });
  }
};

module.exports = {
  getAuditLogs,
  getAuditStatistics,
  getAuditLogById,
  exportAuditLogs,
  getActionTypes,
  getTargetTypes,
  getAdminActivitySummary
};
