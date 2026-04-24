const SupervisorAuditService = require('../services/supervisorAuditService');

/**
 * Global Supervisor Audit Middleware
 * Automatically logs ALL supervisor actions across the entire application
 * This middleware should be applied globally to capture all supervisor activity
 */
class GlobalSupervisorAudit {
  /**
   * Global middleware for automatic supervisor action logging
   * This middleware intercepts all requests from supervisors
   */
  static globalAuditMiddleware() {
    return (req, res, next) => {
      // Only process if user is supervisor
      if (!req.user || req.user.role !== 'supervisor') {
        return next();
      }

      const startTime = Date.now();
      const originalEnd = res.end;
      const originalJson = res.json;
      
      let responseData = null;
      let statusCode = 200;
      let logged = false;

      // Override response methods to capture final state
      res.json = function(data) {
        responseData = data;
        statusCode = res.statusCode;
        return originalJson.call(this, data);
      };

      res.end = function(chunk, encoding) {
        // Ensure logging happens only once
        if (!logged) {
          logged = true;
          setImmediate(() => {
            GlobalSupervisorAudit._logRequestAction(req, res, startTime, responseData, statusCode);
          });
        }
        return originalEnd.call(this, chunk, encoding);
      };

      // Handle response finish event for additional safety
      res.on('finish', () => {
        if (!logged) {
          logged = true;
          setImmediate(() => {
            GlobalSupervisorAudit._logRequestAction(req, res, startTime, responseData, statusCode);
          });
        }
      });

      next();
    };
  }

  /**
   * Internal method to determine and log action based on request
   */
  static async _logRequestAction(req, res, startTime, responseData, statusCode) {
    try {
      const duration = Date.now() - startTime;
      const isSuccess = statusCode >= 200 && statusCode < 300;
      
      // Determine action and module based on request
      const { action, module } = GlobalSupervisorAudit._parseRequestDetails(req);
      
      if (!action) {
        return; // Skip if action cannot be determined
      }

      // Prepare audit data
      const auditData = {
        actorId: req.user.userId,
        actorName: req.user.name,
        actorEmail: req.user.email,
        action,
        module,
        description: `${action} in ${module}`,
        status: isSuccess ? 'SUCCESS' : 'FAILURE',
        message: isSuccess ? 'Action completed successfully' : 'Action failed',
        duration,
        metadata: {
          statusCode,
          endpoint: req.originalUrl,
          method: req.method,
          params: req.params,
          query: req.query,
          body: GlobalSupervisorAudit._shouldIncludeBody(req) ? req.body : undefined,
          responseData: responseData
        }
      };

      // Add target entity if identifiable
      const target = GlobalSupervisorAudit._extractTargetEntity(req);
      if (target) {
        auditData.target = target;
      }

      await SupervisorAuditService.logAction(auditData, req);
      
    } catch (error) {
      console.error('❌ Global supervisor audit error:', error);
      // Don't throw error to avoid breaking main flow
    }
  }

  /**
   * Parse request to determine action and module
   */
  static _parseRequestDetails(req) {
    const { method, originalUrl, params } = req;
    const path = originalUrl.split('?')[0]; // Remove query params
    
    // Define action mappings
    const actionMappings = {
      // User management
      'POST:/api/users/:userId/block': { action: 'BLOCK_CLIENT', module: 'USER_MANAGEMENT' },
      'POST:/api/users/:userId/unblock': { action: 'UNBLOCK_CLIENT', module: 'USER_MANAGEMENT' },
      'PUT:/api/users/:userId': { action: 'MODIFY_CLIENT_DATA', module: 'USER_MANAGEMENT' },
      'GET:/api/users/:userId': { action: 'VIEW_CLIENT_DATA', module: 'USER_MANAGEMENT' },
      
      // Doctor management
      'PATCH:/api/doctors/:doctorId/approve': { action: 'APPROVE_DOCTOR', module: 'DOCTORS' },
      'PATCH:/api/doctors/:doctorId/reject': { action: 'REJECT_DOCTOR', module: 'DOCTORS' },
      'PATCH:/api/doctors/:doctorId/restore': { action: 'RESTORE_DOCTOR', module: 'DOCTORS' },
      'GET:/api/doctors/:doctorId': { action: 'VIEW_DOCTOR_PROFILE', module: 'DOCTORS' },
      
      // Diet plan management
      'POST:/api/diet-plans': { action: 'CREATE_DIET_PLAN', module: 'DIET_PLANS' },
      'PUT:/api/diet-plans/:id': { action: 'UPDATE_DIET_PLAN', module: 'DIET_PLANS' },
      'DELETE:/api/diet-plans/:id': { action: 'DELETE_DIET_PLAN', module: 'DIET_PLANS' },
      'GET:/api/diet-plans/:id': { action: 'VIEW_DIET_PLAN', module: 'DIET_PLANS' },
      
      // Progress tracking
      'GET:/api/progress/client/:clientId': { action: 'VIEW_CLIENT_PROGRESS', module: 'DIET_PROGRESS' },
      'POST:/api/progress/food': { action: 'UPDATE_CLIENT_PROGRESS', module: 'DIET_PROGRESS' },
      'GET:/api/progress/:dietPlanId/nutrition': { action: 'EXPORT_PROGRESS_REPORT', module: 'DIET_PROGRESS' },
      
      // System access
      'GET:/api/admin/dashboard': { action: 'LOGIN_SUPERVISOR_PANEL', module: 'SYSTEM_ACCESS' },
      'GET:/api/admin/users': { action: 'VIEW_SENSITIVE_DATA', module: 'DATA_EXPORT' },
      'GET:/api/admin/supervisors': { action: 'VIEW_SYSTEM_REPORTS', module: 'REPORTS' },
      
      // Data export
      'GET:/api/admin/blocked-users': { action: 'EXPORT_USER_DATA', module: 'DATA_EXPORT' },
      'GET:/api/admin/*': { action: 'ACCESS_ADMIN_FEATURES', module: 'SYSTEM_ACCESS' }
    };

    // Try to find exact match first
    const exactKey = `${method}:${path}`;
    if (actionMappings[exactKey]) {
      return actionMappings[exactKey];
    }

    // Try pattern matching
    for (const [pattern, mapping] of Object.entries(actionMappings)) {
      const [patternMethod, patternPath] = pattern.split(':');
      if (patternMethod === method && GlobalSupervisorAudit._pathMatches(patternPath, path, params)) {
        return mapping;
      }
    }

    // Default fallback based on HTTP method and path pattern
    return GlobalSupervisorAudit._getDefaultAction(method, path);
  }

  /**
   * Check if path pattern matches
   */
  static _pathMatches(patternPath, actualPath, params) {
    if (!patternPath.includes(':')) {
      return patternPath === actualPath;
    }

    const patternParts = patternPath.split('/');
    const actualParts = actualPath.split('/');

    if (patternParts.length !== actualParts.length) {
      return false;
    }

    return patternParts.every((part, index) => {
      if (part.startsWith(':')) {
        return true; // Parameter matches anything
      }
      return part === actualParts[index];
    });
  }

  /**
   * Get default action based on HTTP method and path
   */
  static _getDefaultAction(method, path) {
    const pathSegments = path.split('/').filter(Boolean);
    
    if (pathSegments.includes('users')) {
      return { action: 'VIEW_CLIENT_DATA', module: 'USER_MANAGEMENT' };
    }
    if (pathSegments.includes('doctors')) {
      return { action: 'VIEW_DOCTOR_PROFILE', module: 'DOCTORS' };
    }
    if (pathSegments.includes('diet-plans')) {
      return { action: 'VIEW_DIET_PLAN', module: 'DIET_PLANS' };
    }
    if (pathSegments.includes('progress')) {
      return { action: 'VIEW_CLIENT_PROGRESS', module: 'DIET_PROGRESS' };
    }
    if (pathSegments.includes('admin')) {
      return { action: 'ACCESS_ADMIN_FEATURES', module: 'SYSTEM_ACCESS' };
    }

    // Fallback
    return { action: 'SYSTEM_ACCESS', module: 'SYSTEM_ACCESS' };
  }

  /**
   * Extract target entity from request
   */
  static _extractTargetEntity(req) {
    const { params, originalUrl } = req;
    const path = originalUrl.split('?')[0];
    
    // Try to extract entity ID and type from URL
    if (params.userId) {
      return {
        entityType: 'USER',
        entityId: params.userId,
        entityName: `User ${params.userId}`
      };
    }
    
    if (params.doctorId) {
      return {
        entityType: 'DOCTOR',
        entityId: params.doctorId,
        entityName: `Doctor ${params.doctorId}`
      };
    }
    
    if (params.id && path.includes('diet-plans')) {
      return {
        entityType: 'DIET_PLAN',
        entityId: params.id,
        entityName: `Diet Plan ${params.id}`
      };
    }
    
    if (params.clientId) {
      return {
        entityType: 'CLIENT',
        entityId: params.clientId,
        entityName: `Client ${params.clientId}`
      };
    }

    return null;
  }

  /**
   * Determine if request body should be included in logs
   */
  static _shouldIncludeBody(req) {
    const { method, originalUrl } = req;
    const path = originalUrl.split('?')[0];
    
    // Only include body for non-sensitive operations
    const sensitivePaths = [
      '/login',
      '/register',
      '/change-password',
      '/forgot-password'
    ];
    
    const isSensitive = sensitivePaths.some(sensitivePath => 
      path.includes(sensitivePath)
    );
    
    return !isSensitive && ['POST', 'PUT', 'PATCH'].includes(method);
  }

  /**
   * Enhanced middleware with more intelligent action detection
   */
  static enhancedAuditMiddleware(options = {}) {
    return (req, res, next) => {
      // Only process if user is supervisor
      if (!req.user || req.user.role !== 'supervisor') {
        return next();
      }

      // Store original methods
      const originalEnd = res.end;
      const originalJson = res.json;
      
      let responseData = null;
      let statusCode = 200;
      
      // Enhanced response capture
      res.json = function(data) {
        responseData = data;
        statusCode = res.statusCode;
        
        // Try to extract more context from response
        if (options.extractResponseData && data) {
          req.auditContext = req.auditContext || {};
          req.auditContext.responseData = data;
        }
        
        return originalJson.call(this, data);
      };

      res.end = function(chunk, encoding) {
        // Enhanced logging with more context
        setImmediate(() => {
          GlobalSupervisorAudit._logEnhancedAction(req, res, responseData, statusCode, options);
        });
      };
      
      next();
    };
  }

  /**
   * Enhanced logging with better context extraction
   */
  static async _logEnhancedAction(req, res, responseData, statusCode, options) {
    try {
      const { action, module } = GlobalSupervisorAudit._parseRequestDetails(req);
      const target = GlobalSupervisorAudit._extractTargetEntity(req);
      
      // Extract state changes if available
      const stateChanges = GlobalSupervisorAudit._extractStateChanges(req, responseData);
      
      const auditData = {
        actorId: req.user.userId,
        actorName: req.user.name,
        actorEmail: req.user.email,
        action,
        module,
        description: `${action} in ${module}`,
        reason: req.body?.reason || null,
        status: statusCode >= 200 && statusCode < 300 ? 'SUCCESS' : 'FAILURE',
        message: GlobalSupervisorAudit._extractMessage(responseData, statusCode),
        metadata: {
          statusCode,
          endpoint: req.originalUrl,
          method: req.method,
          params: req.params,
          query: req.query,
          userAgent: req.get('User-Agent'),
          ...stateChanges
        }
      };

      if (target) {
        auditData.target = target;
      }

      await SupervisorAuditService.logAction(auditData, req);
      
    } catch (error) {
      console.error('❌ Enhanced supervisor audit error:', error);
    }
  }

  /**
   * Extract state changes from request/response
   */
  static _extractStateChanges(req, responseData) {
    const changes = {};
    
    // Extract changes from PATCH/PUT requests
    if (['PUT', 'PATCH'].includes(req.method) && req.body) {
      changes.requestBody = req.body;
    }
    
    // Extract changes from response
    if (responseData && responseData.data) {
      changes.responseData = responseData.data;
    }
    
    return changes;
  }

  /**
   * Extract meaningful message from response
   */
  static _extractMessage(responseData, statusCode) {
    if (responseData && responseData.message) {
      return responseData.message;
    }
    
    if (responseData && responseData.error) {
      return responseData.error;
    }
    
    if (statusCode >= 400) {
      return `Request failed with status ${statusCode}`;
    }
    
    return 'Action completed';
  }
}

module.exports = GlobalSupervisorAudit;
