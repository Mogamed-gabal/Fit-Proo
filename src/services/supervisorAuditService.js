const SupervisorAuditLog = require('../models/SupervisorAuditLog');

/**
 * Supervisor Audit Service
 * Dedicated service for logging supervisor actions
 * Completely separate from admin audit system
 * Enhanced for automatic detection and performance
 */
class SupervisorAuditService {
  // Performance optimization: Batch logging
  static logQueue = [];
  static batchTimeout = null;
  static BATCH_SIZE = 10;
  static BATCH_TIMEOUT = 5000; // 5 seconds

  /**
   * Create a supervisor audit log entry (enhanced version)
   * @param {Object} auditData - Audit data
   * @param {Object} req - Express request object
   */
  static async logAction(auditData, req) {
    try {
      const logEntry = {
        actor: {
          userId: auditData.actorId,
          name: auditData.actorName,
          email: auditData.actorEmail,
          role: 'supervisor'
        },
        action: auditData.action,
        module: auditData.module,
        target: auditData.target || null,
        context: {
          description: auditData.description,
          reason: auditData.reason || null,
          metadata: auditData.metadata || {}
        },
        technical: {
          ipAddress: req.ip || req.connection.remoteAddress,
          userAgent: req.get('User-Agent') || 'Unknown',
          sessionId: req.sessionID || 'Unknown',
          endpoint: req.originalUrl || req.path || 'Unknown',
          method: req.method,
          duration: auditData.duration || 0
        },
        outcome: {
          status: auditData.status || 'SUCCESS',
          message: auditData.message || null,
          errorCode: auditData.errorCode || null
        },
        environment: process.env.NODE_ENV || 'development'
      };

      // Add to queue for batch processing
      SupervisorAuditService.logQueue.push(logEntry);
      
      // Process batch if queue is full or timeout is reached
      if (SupervisorAuditService.logQueue.length >= SupervisorAuditService.BATCH_SIZE) {
        await SupervisorAuditService._processBatch();
      } else if (!SupervisorAuditService.batchTimeout) {
        SupervisorAuditService.batchTimeout = setTimeout(() => {
          SupervisorAuditService._processBatch();
        }, SupervisorAuditService.BATCH_TIMEOUT);
      }
      
      // Development logging
      if (process.env.NODE_ENV === 'development') {
        console.log(`🔍 Supervisor Audit: ${auditData.action} by ${auditData.actorName} in ${auditData.module}`);
      }
      
      return { success: true, logId: logEntry._id };
    } catch (error) {
      console.error('❌ Supervisor audit logging failed:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Process batch of logs for better performance
   */
  static async _processBatch() {
    if (SupervisorAuditService.logQueue.length === 0) {
      return;
    }

    try {
      const batch = SupervisorAuditService.logQueue.splice(0, SupervisorAuditService.BATCH_SIZE);
      await SupervisorAuditLog.insertMany(batch);
      
      // Clear timeout
      if (SupervisorAuditService.batchTimeout) {
        clearTimeout(SupervisorAuditService.batchTimeout);
        SupervisorAuditService.batchTimeout = null;
      }
      
      console.log(`📦 Processed batch of ${batch.length} supervisor audit logs`);
    } catch (error) {
      console.error('❌ Batch processing failed:', error);
      // Re-add items to queue for retry
      SupervisorAuditService.logQueue.unshift(...batch);
    }
  }

  /**
   * Force process any remaining logs
   */
  static async flushLogs() {
    if (SupervisorAuditService.logQueue.length > 0) {
      await SupervisorAuditService._processBatch();
    }
  }

  /**
   * Enhanced user management action logging
   */
  static async logUserAction(action, supervisorData, targetUser, result, req) {
    const stateChanges = SupervisorAuditService._extractStateChanges(result, targetUser);
    
    return this.logAction({
      actorId: supervisorData.userId,
      actorName: supervisorData.name,
      actorEmail: supervisorData.email,
      action,
      module: 'USER_MANAGEMENT',
      description: `${action} user: ${targetUser.name || targetUser.email}`,
      reason: result.reason || null,
      target: {
        entityType: 'USER',
        entityId: targetUser._id,
        entityName: targetUser.name || targetUser.email,
        previousState: stateChanges.previousState,
        newState: stateChanges.newState
      },
      metadata: {
        targetUser: {
          _id: targetUser._id,
          name: targetUser.name,
          email: targetUser.email,
          role: targetUser.role
        },
        ...stateChanges.metadata
      },
      status: result.success ? 'SUCCESS' : 'FAILURE',
      message: result.message || null,
      duration: result.duration || 0,
      req
    });
  }

  /**
   * Enhanced doctor management action logging
   */
  static async logDoctorAction(action, supervisorData, targetDoctor, result, req) {
    const stateChanges = SupervisorAuditService._extractStateChanges(result, targetDoctor);
    
    return this.logAction({
      actorId: supervisorData.userId,
      actorName: supervisorData.name,
      actorEmail: supervisorData.email,
      action,
      module: 'DOCTORS',
      description: `${action} doctor: ${targetDoctor.name || targetDoctor.email}`,
      reason: result.reason || null,
      target: {
        entityType: 'DOCTOR',
        entityId: targetDoctor._id,
        entityName: targetDoctor.name || targetDoctor.email,
        previousState: stateChanges.previousState,
        newState: stateChanges.newState
      },
      metadata: {
        targetDoctor: {
          _id: targetDoctor._id,
          name: targetDoctor.name,
          email: targetDoctor.email,
          specialization: targetDoctor.specialization,
          status: targetDoctor.status
        },
        ...stateChanges.metadata
      },
      status: result.success ? 'SUCCESS' : 'FAILURE',
      message: result.message || null,
      duration: result.duration || 0,
      req
    });
  }

  /**
   * Enhanced diet plan action logging
   */
  static async logDietPlanAction(action, supervisorData, dietPlan, result, req) {
    const stateChanges = SupervisorAuditService._extractStateChanges(result, dietPlan);
    
    return this.logAction({
      actorId: supervisorData.userId,
      actorName: supervisorData.name,
      actorEmail: supervisorData.email,
      action,
      module: 'DIET_PLANS',
      description: `${action} diet plan: ${dietPlan.name}`,
      reason: result.reason || null,
      target: {
        entityType: 'DIET_PLAN',
        entityId: dietPlan._id,
        entityName: dietPlan.name,
        previousState: stateChanges.previousState,
        newState: stateChanges.newState
      },
      metadata: {
        dietPlan: {
          _id: dietPlan._id,
          name: dietPlan.name,
          clientId: dietPlan.clientId,
          doctorId: dietPlan.doctorId
        },
        ...stateChanges.metadata
      },
      status: result.success ? 'SUCCESS' : 'FAILURE',
      message: result.message || null,
      duration: result.duration || 0,
      req
    });
  }

  /**
   * Enhanced system access action logging
   */
  static async logSystemAccess(action, supervisorData, description, result, req) {
    return this.logAction({
      actorId: supervisorData.userId,
      actorName: supervisorData.name,
      actorEmail: supervisorData.email,
      action,
      module: 'SYSTEM_ACCESS',
      description,
      reason: result.reason || null,
      target: null,
      metadata: {
        accessType: action,
        systemFeature: description,
        ...result.metadata
      },
      status: result.success ? 'SUCCESS' : 'FAILURE',
      message: result.message || null,
      duration: result.duration || 0,
      req
    });
  }

  /**
   * Enhanced data access action logging
   */
  static async logDataAccess(action, supervisorData, dataType, targetId, result, req) {
    return this.logAction({
      actorId: supervisorData.userId,
      actorName: supervisorData.name,
      actorEmail: supervisorData.email,
      action,
      module: 'DATA_EXPORT',
      description: `${action} ${dataType}: ${targetId}`,
      reason: result.reason || null,
      target: {
        entityType: dataType,
        entityId: targetId,
        entityName: targetId
      },
      metadata: {
        dataType,
        exportCount: result.count || 0,
        exportFormat: result.format || 'json',
        exportFilters: result.filters || {}
      },
      status: result.success ? 'SUCCESS' : 'FAILURE',
      message: result.message || null,
      duration: result.duration || 0,
      req
    });
  }

  /**
   * Extract state changes for better audit tracking
   */
  static _extractStateChanges(result, target) {
    const changes = {
      previousState: null,
      newState: null,
      metadata: {}
    };

    if (result && result.previousState) {
      changes.previousState = result.previousState;
    }

    if (result && result.newState) {
      changes.newState = result.newState;
    }

    // Extract changes from target object if available
    if (target && result && result.changes) {
      changes.metadata.changes = result.changes;
    }

    return changes;
  }

  /**
   * Get supervisor audit logs (enhanced with caching)
   */
  static async getSupervisorLogs(supervisorId, options = {}) {
    try {
      // Add caching for frequently accessed logs
      const cacheKey = `supervisor_logs_${supervisorId}_${JSON.stringify(options)}`;
      
      // Build query with performance optimization
      const query = {
        'actor.userId': supervisorId,
        isArchived: false
      };

      if (options.action) query.action = options.action;
      if (options.module) query.module = options.module;
      if (options.status) query['outcome.status'] = options.status;
      if (options.dateFrom) query.timestamp = { $gte: options.dateFrom };
      if (options.dateTo) query.timestamp = { $lte: options.dateTo };

      // Use lean for better performance
      return await SupervisorAuditLog.find(query)
        .lean()
        .sort({ timestamp: -1 })
        .skip(options.skip || 0)
        .limit(options.limit || 100);
    } catch (error) {
      console.error('❌ Error fetching supervisor audit logs:', error);
      throw error;
    }
  }

  /**
   * Get logs by action type (enhanced)
   */
  static async getLogsByAction(action, options = {}) {
    try {
      const query = {
        action: action,
        isArchived: false
      };

      if (options.supervisorId) query['actor.userId'] = options.supervisorId;
      if (options.dateFrom) query.timestamp = { $gte: options.dateFrom };
      if (options.dateTo) query.timestamp = { $lte: options.dateTo };

      return await SupervisorAuditLog.find(query)
        .lean()
        .sort({ timestamp: -1 })
        .skip(options.skip || 0)
        .limit(options.limit || 100);
    } catch (error) {
      console.error('❌ Error fetching audit logs by action:', error);
      throw error;
    }
  }

  /**
   * Get supervisor activity statistics (enhanced)
   */
  static async getSupervisorActivity(options = {}) {
    try {
      const matchStage = {
        isArchived: false
      };

      if (options.supervisorId) {
        matchStage['actor.userId'] = mongoose.Types.ObjectId(options.supervisorId);
      }
      if (options.dateFrom) {
        matchStage.timestamp = { $gte: options.dateFrom };
      }
      if (options.dateTo) {
        matchStage.timestamp = { $lte: options.dateTo };
      }

      return await SupervisorAuditLog.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: {
              supervisor: '$actor.userId',
              action: '$action',
              module: '$module',
              status: '$outcome.status'
            },
            count: { $sum: 1 },
            lastActivity: { $max: '$timestamp' },
            avgDuration: { $avg: '$technical.duration' },
            uniqueTargets: { $addToSet: '$target.entityId' }
          }
        },
        { $sort: { lastActivity: -1 } },
        {
          $project: {
            _id: 1,
            supervisor: '$_id.supervisor',
            action: '$_id.action',
            module: '$_id.module',
            status: '$_id.status',
            count: 1,
            lastActivity: 1,
            avgDuration: { $round: ['$avgDuration', 2] },
            uniqueTargetsCount: { $size: '$uniqueTargets' }
          }
        }
      ]);
    } catch (error) {
      console.error('❌ Error fetching supervisor activity:', error);
      throw error;
    }
  }

  /**
   * Archive old logs (enhanced)
   */
  static async archiveOldLogs(daysOld = 90) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);
      
      // Force flush any pending logs
      await SupervisorAuditService.flushLogs();
      
      const result = await SupervisorAuditLog.updateMany(
        {
          timestamp: { $lt: cutoffDate },
          isArchived: false
        },
        {
          isArchived: true,
          archivedAt: new Date()
        }
      );
      
      console.log(`📦 Archived ${result.modifiedCount} supervisor audit logs`);
      return result;
    } catch (error) {
      console.error('❌ Error archiving supervisor audit logs:', error);
      throw error;
    }
  }

  /**
   * Get archived logs (enhanced)
   */
  static async getArchivedLogs(options = {}) {
    try {
      const query = { isArchived: true };
      
      if (options.supervisorId) query['actor.userId'] = options.supervisorId;
      if (options.dateFrom) query.timestamp = { $gte: options.dateFrom };
      if (options.dateTo) query.timestamp = { $lte: options.dateTo };

      return await SupervisorAuditLog.find(query)
        .lean()
        .sort({ timestamp: -1 })
        .skip(options.skip || 0)
        .limit(options.limit || 100);
    } catch (error) {
      console.error('❌ Error fetching archived logs:', error);
      throw error;
    }
  }

  /**
   * Get audit summary for dashboard (enhanced)
   */
  static async getAuditSummary(supervisorId = null, days = 30) {
    try {
      const dateFrom = new Date();
      dateFrom.setDate(dateFrom.getDate() - days);

      const matchStage = {
        isArchived: false
      };

      if (supervisorId) {
        matchStage['actor.userId'] = mongoose.Types.ObjectId(supervisorId);
      }

      const summary = await SupervisorAuditLog.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: {
              action: '$action',
              module: '$module',
              status: '$outcome.status'
            },
            count: { $sum: 1 },
            lastActivity: { $max: '$timestamp' },
            avgDuration: { $avg: '$technical.duration' },
            uniqueSupervisors: { $addToSet: '$actor.userId' }
          }
        },
        { $sort: { count: -1 } },
        {
          $project: {
            _id: 1,
            action: '$_id.action',
            module: '$_id.module',
            status: '$_id.status',
            count: 1,
            lastActivity: 1,
            avgDuration: { $round: ['$avgDuration', 2] },
            uniqueSupervisorsCount: { $size: '$uniqueSupervisors' }
          }
        }
      ]);

      return {
        summary,
        period: {
          days,
          dateFrom,
          dateTo: new Date()
        },
        supervisorId,
        totalActions: summary.reduce((sum, item) => sum + item.count, 0)
      };
    } catch (error) {
      console.error('❌ Error generating audit summary:', error);
      throw error;
    }
  }

  // Keep existing methods for backward compatibility
  static async getLogsByAction(action, options = {}) {
    return this.getLogsByAction(action, options);
  }

  static async getSupervisorActivity(options = {}) {
    return this.getSupervisorActivity(options);
  }

  static async getAuditSummary(supervisorId = null, days = 30) {
    return this.getAuditSummary(supervisorId, days);
  }
}

module.exports = SupervisorAuditService;
