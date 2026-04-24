const SupervisorAuditService = require('../services/supervisorAuditService');

/**
 * Supervisor Audit Controller
 * Handles supervisor audit log retrieval and management for administrators
 * Completely separate from admin audit system
 */
class SupervisorAuditController {
  /**
   * Get all supervisor audit logs with filtering
   * GET /api/admin/supervisor-audit/logs
   */
  static async getSupervisorAuditLogs(req, res) {
    try {
      const {
        page = 1,
        limit = 50,
        supervisorId,
        action,
        module,
        status,
        dateFrom,
        dateTo
      } = req.query;

      // Parse pagination
      const pageNum = parseInt(page);
      const limitNum = parseInt(limit);
      const skip = (pageNum - 1) * limitNum;

      // Build query options
      const options = {
        skip,
        limit: limitNum
      };

      // Add filters
      if (action) options.action = action;
      if (module) options.module = module;
      if (status) options.status = status;
      if (dateFrom) options.dateFrom = new Date(dateFrom);
      if (dateTo) options.dateTo = new Date(dateTo);

      // Get logs
      let logs;
      if (supervisorId) {
        logs = await SupervisorAuditService.getSupervisorLogs(supervisorId, options);
      } else {
        logs = await SupervisorAuditService.getLogsByAction(null, options);
      }

      // Get total count
      const SupervisorAuditLog = require('../models/SupervisorAuditLog');
      const totalQuery = { isArchived: false };
      
      if (supervisorId) totalQuery['actor.userId'] = supervisorId;
      if (action) totalQuery.action = action;
      if (module) totalQuery.module = module;
      if (status) totalQuery['outcome.status'] = status;
      if (dateFrom) totalQuery.timestamp = { $gte: new Date(dateFrom) };
      if (dateTo) totalQuery.timestamp = { $lte: new Date(dateTo) };

      const total = await SupervisorAuditLog.countDocuments(totalQuery);

      res.status(200).json({
        success: true,
        data: {
          logs,
          pagination: {
            currentPage: pageNum,
            totalPages: Math.ceil(total / limitNum),
            totalLogs: total,
            hasNext: pageNum * limitNum < total,
            hasPrev: pageNum > 1
          },
          filters: {
            supervisorId,
            action,
            module,
            status,
            dateFrom,
            dateTo
          }
        }
      });
    } catch (error) {
      console.error('❌ Get supervisor audit logs error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve supervisor audit logs'
      });
    }
  }

  /**
   * Get supervisor activity statistics
   * GET /api/admin/supervisor-audit/activity
   */
  static async getSupervisorActivity(req, res) {
    try {
      const {
        supervisorId,
        dateFrom,
        dateTo,
        days = 30
      } = req.query;

      // Build options
      const options = {};
      if (supervisorId) options.supervisorId = supervisorId;
      if (dateFrom) options.dateFrom = new Date(dateFrom);
      if (dateTo) options.dateTo = new Date(dateTo);

      // Get activity statistics
      const activity = await SupervisorAuditService.getSupervisorActivity(options);

      res.status(200).json({
        success: true,
        data: {
          activity,
          filters: {
            supervisorId,
            dateFrom,
            dateTo,
            days
          }
        }
      });
    } catch (error) {
      console.error('❌ Get supervisor activity error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve supervisor activity statistics'
      });
    }
  }

  /**
   * Get audit summary for dashboard
   * GET /api/admin/supervisor-audit/summary
   */
  static async getAuditSummary(req, res) {
    try {
      const {
        supervisorId,
        days = 30
      } = req.query;

      const summary = await SupervisorAuditService.getAuditSummary(
        supervisorId || null,
        parseInt(days)
      );

      res.status(200).json({
        success: true,
        data: summary
      });
    } catch (error) {
      console.error('❌ Get audit summary error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve audit summary'
      });
    }
  }

  /**
   * Get logs for specific supervisor
   * GET /api/admin/supervisor-audit/supervisor/:supervisorId
   */
  static async getSupervisorSpecificLogs(req, res) {
    try {
      const { supervisorId } = req.params;
      const {
        page = 1,
        limit = 50,
        action,
        module,
        status,
        dateFrom,
        dateTo
      } = req.query;

      // Parse pagination
      const pageNum = parseInt(page);
      const limitNum = parseInt(limit);
      const skip = (pageNum - 1) * limitNum;

      // Build query options
      const options = {
        skip,
        limit: limitNum
      };

      // Add filters
      if (action) options.action = action;
      if (module) options.module = module;
      if (status) options.status = status;
      if (dateFrom) options.dateFrom = new Date(dateFrom);
      if (dateTo) options.dateTo = new Date(dateTo);

      const logs = await SupervisorAuditService.getSupervisorLogs(supervisorId, options);

      // Get total count
      const SupervisorAuditLog = require('../models/SupervisorAuditLog');
      const total = await SupervisorAuditLog.countDocuments({
        'actor.userId': supervisorId,
        isArchived: false,
        ...(action && { action }),
        ...(module && { module }),
        ...(status && { 'outcome.status': status }),
        ...(dateFrom && { timestamp: { $gte: new Date(dateFrom) } }),
        ...(dateTo && { timestamp: { $lte: new Date(dateTo) } })
      });

      res.status(200).json({
        success: true,
        data: {
          supervisorId,
          logs,
          pagination: {
            currentPage: pageNum,
            totalPages: Math.ceil(total / limitNum),
            totalLogs: total,
            hasNext: pageNum * limitNum < total,
            hasPrev: pageNum > 1
          },
          filters: {
            action,
            module,
            status,
            dateFrom,
            dateTo
          }
        }
      });
    } catch (error) {
      console.error('❌ Get supervisor specific logs error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve supervisor logs'
      });
    }
  }

  /**
   * Export supervisor audit logs
   * GET /api/admin/supervisor-audit/export
   */
  static async exportSupervisorAuditLogs(req, res) {
    try {
      const {
        format = 'json',
        supervisorId,
        action,
        module,
        dateFrom,
        dateTo
      } = req.query;

      // Build query options
      const options = {
        limit: 10000 // Large limit for export
      };

      if (supervisorId) options.supervisorId = supervisorId;
      if (action) options.action = action;
      if (module) options.module = module;
      if (dateFrom) options.dateFrom = new Date(dateFrom);
      if (dateTo) options.dateTo = new Date(dateTo);

      const logs = await SupervisorAuditService.getLogsByAction(null, options);

      // Format based on requested format
      if (format === 'csv') {
        const csv = SupervisorAuditController.convertToCSV(logs);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=supervisor_audit_logs_${new Date().toISOString().split('T')[0]}.csv`);
        res.send(csv);
      } else {
        // Default to JSON
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename=supervisor_audit_logs_${new Date().toISOString().split('T')[0]}.json`);
        res.json({
          success: true,
          data: logs,
          exportedAt: new Date().toISOString(),
          totalRecords: logs.length,
          filters: { supervisorId, action, module, dateFrom, dateTo }
        });
      }
    } catch (error) {
      console.error('❌ Export supervisor audit logs error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to export supervisor audit logs'
      });
    }
  }

  /**
   * Archive old supervisor audit logs
   * POST /api/admin/supervisor-audit/archive
   */
  static async archiveOldLogs(req, res) {
    try {
      const { days = 90 } = req.body;
      const daysOld = parseInt(days);

      if (daysOld < 30) {
        return res.status(400).json({
          success: false,
          error: 'Cannot archive logs less than 30 days old'
        });
      }

      const result = await SupervisorAuditService.archiveOldLogs(daysOld);

      res.status(200).json({
        success: true,
        message: `Successfully archived ${result.modifiedCount} supervisor audit logs older than ${daysOld} days`,
        data: {
          archivedCount: result.modifiedCount,
          cutoffDate: new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000)
        }
      });
    } catch (error) {
      console.error('❌ Archive supervisor audit logs error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to archive supervisor audit logs'
      });
    }
  }

  /**
   * Get archived supervisor audit logs
   * GET /api/admin/supervisor-audit/archived
   */
  static async getArchivedLogs(req, res) {
    try {
      const {
        page = 1,
        limit = 50,
        supervisorId,
        dateFrom,
        dateTo
      } = req.query;

      // Parse pagination
      const pageNum = parseInt(page);
      const limitNum = parseInt(limit);
      const skip = (pageNum - 1) * limitNum;

      // Build query options
      const options = {
        skip,
        limit: limitNum
      };

      if (supervisorId) options.supervisorId = supervisorId;
      if (dateFrom) options.dateFrom = new Date(dateFrom);
      if (dateTo) options.dateTo = new Date(dateTo);

      const logs = await SupervisorAuditService.getArchivedLogs(options);

      // Get total count
      const SupervisorAuditLog = require('../models/SupervisorAuditLog');
      const total = await SupervisorAuditLog.countDocuments({
        isArchived: true,
        ...(supervisorId && { 'actor.userId': supervisorId }),
        ...(dateFrom && { timestamp: { $gte: new Date(dateFrom) } }),
        ...(dateTo && { timestamp: { $lte: new Date(dateTo) } })
      });

      res.status(200).json({
        success: true,
        data: {
          logs,
          pagination: {
            currentPage: pageNum,
            totalPages: Math.ceil(total / limitNum),
            totalLogs: total,
            hasNext: pageNum * limitNum < total,
            hasPrev: pageNum > 1
          },
          filters: {
            supervisorId,
            dateFrom,
            dateTo
          }
        }
      });
    } catch (error) {
      console.error('❌ Get archived logs error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve archived supervisor audit logs'
      });
    }
  }

  /**
   * Convert supervisor audit logs to CSV format
   */
  static convertToCSV(logs) {
    const headers = [
      'Timestamp',
      'Supervisor Name',
      'Supervisor Email',
      'Action',
      'Module',
      'Target Entity',
      'Description',
      'Status',
      'IP Address',
      'Duration (ms)',
      'User Agent'
    ];

    const csvRows = logs.map(log => [
      `"${log.timestamp}"`,
      `"${log.actor.name}"`,
      `"${log.actor.email}"`,
      `"${log.action}"`,
      `"${log.module}"`,
      `"${log.target?.entityName || 'N/A'}"`,
      `"${log.context.description}"`,
      `"${log.outcome.status}"`,
      `"${log.technical.ipAddress}"`,
      `"${log.technical.duration}"`,
      `"${log.technical.userAgent}"`
    ].join(','));

    return [headers.join(','), ...csvRows].join('\n');
  }
}

module.exports = SupervisorAuditController;
