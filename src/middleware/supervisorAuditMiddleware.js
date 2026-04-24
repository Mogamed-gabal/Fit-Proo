const SupervisorAuditService = require('../services/supervisorAuditService');

/**
 * Supervisor Audit Middleware
 * Automatically logs supervisor actions across the application
 * This middleware detects supervisor role and logs actions
 */
class SupervisorAuditMiddleware {
  /**
   * Middleware to log supervisor actions
   * @param {String} action - Action type
   * @param {String} module - Module affected
   * @param {Object} options - Additional options
   */
  static logSupervisorAction(action, module, options = {}) {
    return async (req, res, next) => {
      // Check if user is supervisor
      if (req.user && req.user.role === 'supervisor') {
        const startTime = Date.now();
        
        // Store original end method
        const originalEnd = res.end;
        const originalJson = res.json;
        
        let responseData = null;
        let statusCode = 200;
        
        // Override json method to capture response
        res.json = function(data) {
          responseData = data;
          statusCode = res.statusCode;
          return originalJson.call(this, data);
        };
        
        // Override end method to capture response
        res.end = function(chunk, encoding) {
          // Log the action after response is sent
          setImmediate(() => {
            SupervisorAuditMiddleware._logAction(req, res, action, module, {
              startTime,
              responseData,
              statusCode,
              options
            });
          });
          
          return originalEnd.call(this, chunk, encoding);
        };
      }
      
      next();
    };
  }

  /**
   * Internal method to perform the actual logging
   */
  static async _logAction(req, res, action, module, context) {
    try {
      const { startTime, responseData, statusCode, options } = context;
      const duration = Date.now() - startTime;
      
      // Determine success/failure
      const isSuccess = statusCode >= 200 && statusCode < 300;
      const status = isSuccess ? 'SUCCESS' : 'FAILURE';
      
      // Prepare audit data
      const auditData = {
        actorId: req.user.userId,
        actorName: req.user.name,
        actorEmail: req.user.email,
        action,
        module,
        description: options.description || `${action} in ${module}`,
        reason: options.reason || null,
        status,
        message: options.message || (isSuccess ? 'Action completed successfully' : 'Action failed'),
        duration,
        metadata: {
          statusCode,
          endpoint: req.originalUrl,
          method: req.method,
          params: req.params,
          query: req.query,
          body: options.includeBody ? req.body : undefined,
          responseData: options.includeResponse ? responseData : undefined,
          ...options.metadata
        }
      };

      // Add target entity if provided
      if (options.target) {
        auditData.target = options.target;
      }

      // Log the action
      await SupervisorAuditService.logAction(auditData, req);
      
    } catch (error) {
      console.error('❌ Supervisor audit middleware error:', error);
      // Don't throw error to avoid breaking the main flow
    }
  }

  /**
   * Middleware for user management actions
   */
  static logUserManagement(action, options = {}) {
    return SupervisorAuditMiddleware.logSupervisorAction(action, 'USER_MANAGEMENT', options);
  }

  /**
   * Middleware for doctor management actions
   */
  static logDoctorManagement(action, options = {}) {
    return SupervisorAuditMiddleware.logSupervisorAction(action, 'DOCTORS', options);
  }

  /**
   * Middleware for diet plan actions
   */
  static logDietPlanAction(action, options = {}) {
    return SupervisorAuditMiddleware.logSupervisorAction(action, 'DIET_PLANS', options);
  }

  /**
   * Middleware for system access actions
   */
  static logSystemAccess(action, options = {}) {
    return SupervisorAuditMiddleware.logSupervisorAction(action, 'SYSTEM_ACCESS', options);
  }

  /**
   * Middleware for data export actions
   */
  static logDataExport(action, options = {}) {
    return SupervisorAuditMiddleware.logSupervisorAction(action, 'DATA_EXPORT', options);
  }

  /**
   * Helper function to log manual actions from controllers
   */
  static async logManualAction(req, action, module, auditData) {
    try {
      const fullAuditData = {
        actorId: req.user.userId,
        actorName: req.user.name,
        actorEmail: req.user.email,
        action,
        module,
        description: auditData.description || `${action} in ${module}`,
        reason: auditData.reason || null,
        status: auditData.status || 'SUCCESS',
        message: auditData.message || null,
        duration: auditData.duration || 0,
        metadata: auditData.metadata || {}
      };

      if (auditData.target) {
        fullAuditData.target = auditData.target;
      }

      await SupervisorAuditService.logAction(fullAuditData, req);
    } catch (error) {
      console.error('❌ Manual supervisor audit logging error:', error);
    }
  }
}

module.exports = SupervisorAuditMiddleware;
