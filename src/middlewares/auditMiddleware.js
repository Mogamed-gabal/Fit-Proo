const AuditLog = require('../models/AuditLog');

/**
 * Audit Middleware
 * Automatically logs admin actions for security and compliance
 */

/**
 * Middleware to log admin actions
 * @param {string} actionType - Type of action being performed
 * @param {string} targetType - Type of target entity
 * @param {Object} options - Additional options
 */
const auditAction = (actionType, targetType, options = {}) => {
  return async (req, res, next) => {
    // Store original res.json to intercept response
    const originalJson = res.json;
    let responseData = null;
    let isSuccess = true;
    let errorInfo = null;

    // Intercept response
    res.json = function(data) {
      responseData = data;
      
      // Determine if action was successful
      if (data && data.success === false) {
        isSuccess = false;
        errorInfo = {
          message: data.error || data.message || 'Unknown error',
          code: data.code || 'UNKNOWN_ERROR'
        };
      }
      
      return originalJson.call(this, data);
    };

    // Continue with the request
    res.on('finish', async () => {
      try {
        // Only log if user is authenticated and is admin/supervisor
        if (!req.user || !['admin', 'supervisor'].includes(req.user.role)) {
          return;
        }

        // Get target ID from request parameters or body
        const targetId = req.params.userId || req.params.id || req.body.userId || req.body.id;
        
        if (!targetId && !options.allowNoTarget) {
          return; // Skip logging if no target ID found (unless explicitly allowed)
        }

        // Prepare log data
        const logData = {
          adminId: req.user.userId,
          actionType,
          targetId: targetId || null,
          targetType,
          result: isSuccess ? 'success' : 'failure',
          sessionId: req.sessionID || null,
          details: {
            requestInfo: {
              endpoint: req.originalUrl,
              method: req.method,
              userAgent: req.get('User-Agent'),
              ipAddress: req.ip || req.connection.remoteAddress
            },
            metadata: {
              query: req.query,
              params: req.params,
              // Only include non-sensitive body data
              body: sanitizeRequestBody(req.body)
            }
          }
        };

        // Add error information if action failed
        if (!isSuccess && errorInfo) {
          logData.error = errorInfo;
        }

        // Add reason if provided in request body
        if (req.body.reason) {
          logData.details.reason = req.body.reason;
        }

        // Add custom options
        if (options.includeChanges) {
          logData.details.changes = await captureChanges(req, targetType, targetId);
        }

        if (options.customMetadata) {
          logData.details.metadata = {
            ...logData.details.metadata,
            ...options.customMetadata(req)
          };
        }

        // Create audit log
        await AuditLog.createLog(logData);

      } catch (error) {
        console.error('Audit middleware error:', error);
        // Don't break the request flow due to audit logging errors
      }
    });

    next();
  };
};

/**
 * Middleware to log system actions (not tied to specific entities)
 * @param {string} actionType - Type of system action
 * @param {Object} options - Additional options
 */
const auditSystemAction = (actionType, options = {}) => {
  return auditAction(actionType, 'System', { ...options, allowNoTarget: true });
};

/**
 * Helper function to capture entity changes
 * @param {Object} req - Express request object
 * @param {string} targetType - Type of target entity
 * @param {string} targetId - ID of target entity
 */
const captureChanges = async (req, targetType, targetId) => {
  try {
    // This would typically involve fetching the current state
    // and comparing with the new state from the request
    
    // For now, return the changes from request body
    const changes = {
      oldValues: null, // Would be populated by fetching current state
      newValues: sanitizeRequestBody(req.body)
    };

    // For specific actions, we can add more detailed change tracking
    switch (req.method) {
      case 'PATCH':
      case 'PUT':
        // Only include fields that are actually being changed
        if (changes.newValues) {
          const changedFields = {};
          for (const [key, value] of Object.entries(changes.newValues)) {
            if (value !== undefined && value !== null) {
              changedFields[key] = value;
            }
          }
          changes.newValues = changedFields;
        }
        break;
    }

    return changes;
  } catch (error) {
    console.error('Error capturing changes:', error);
    return null;
  }
};

/**
 * Helper function to sanitize request body for logging
 * @param {Object} body - Request body
 * @returns {Object} - Sanitized body
 */
const sanitizeRequestBody = (body) => {
  if (!body || typeof body !== 'object') {
    return {};
  }

  const sensitiveFields = [
    'password',
    'currentPassword',
    'newPassword',
    'token',
    'accessToken',
    'refreshToken',
    'secret',
    'key',
    'authorization'
  ];

  const sanitized = {};
  
  for (const [key, value] of Object.entries(body)) {
    const lowerKey = key.toLowerCase();
    
    if (sensitiveFields.some(field => lowerKey.includes(field.toLowerCase()))) {
      sanitized[key] = '[MASKED]';
    } else if (Array.isArray(value)) {
      // Handle arrays (like file uploads)
      sanitized[key] = value.map(item => {
        if (item && typeof item === 'object' && item.buffer) {
          return {
            filename: item.filename || item.originalName,
            mimetype: item.mimetype,
            size: item.size,
            buffer: '[BINARY_DATA]'
          };
        }
        return item;
      });
    } else if (value && typeof value === 'object' && value.constructor === Object) {
      // Handle nested objects
      sanitized[key] = sanitizeRequestBody(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
};

/**
 * Manual audit logging function for custom scenarios
 * @param {Object} logData - Log data
 */
const logAction = async (logData) => {
  try {
    await AuditLog.createLog(logData);
  } catch (error) {
    console.error('Manual audit logging error:', error);
  }
};

/**
 * Pre-defined audit middleware for common admin actions
 */
const auditApproveUser = auditAction('approve_user', 'User', { includeChanges: true });
const auditRejectUser = auditAction('reject_user', 'User', { includeChanges: true });
const auditBlockUser = auditAction('block_user', 'User', { includeChanges: true });
const auditUnblockUser = auditAction('unblock_user', 'User', { includeChanges: true });
const auditSoftDeleteUser = auditAction('soft_delete_user', 'User', { includeChanges: true });
const auditCreateSupervisor = auditAction('create_supervisor', 'User', { includeChanges: true });
const auditDeleteSupervisor = auditAction('delete_supervisor', 'User', { includeChanges: true });

module.exports = {
  auditAction,
  auditSystemAction,
  logAction,
  auditApproveUser,
  auditRejectUser,
  auditBlockUser,
  auditUnblockUser,
  auditSoftDeleteUser,
  auditCreateSupervisor,
  auditDeleteSupervisor,
  captureChanges,
  sanitizeRequestBody
};
