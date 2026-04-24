const PermissionService = require('../services/permissionService');

/**
 * Dynamic Permission Middleware
 * Enhanced permission checking that supports both static role-based and dynamic assigned permissions
 */
class DynamicPermissionMiddleware {
  /**
   * Check if user has specific permission (supports both role-based and dynamic permissions)
   * @param {String} permissionName - Permission name to check
   * @param {Object} options - Additional options
   */
  static requirePermission(permissionName, options = {}) {
    return async (req, res, next) => {
      try {
        // Check if user is authenticated
        if (!req.user) {
          return res.status(401).json({
            success: false,
            error: 'Authentication required'
          });
        }

        const userId = req.user.userId;
        const { resource } = options;

        // First check dynamic permissions
        const hasDynamicPermission = await PermissionService.checkUserPermission(userId, permissionName, resource);
        
        // If no dynamic permission, fall back to role-based permissions
        let hasPermission = hasDynamicPermission;
        
        if (!hasDynamicPermission) {
          hasPermission = DynamicPermissionMiddleware._checkRolePermission(req.user, permissionName, resource);
        }

        if (hasPermission) {
          // Update permission usage
          if (hasDynamicPermission) {
            // Dynamic permissions are tracked in the service
          } else {
            // Role-based permissions
            console.log(`🔐 Role-based permission check: ${permissionName} for ${req.user.role}`);
          }
          
          return next();
        } else {
          return res.status(403).json({
            success: false,
            error: `Access denied. Missing permission: ${permissionName}`,
            requiredPermission: permissionName,
            userRole: req.user.role,
            userId: req.user.userId
          });
        }
      } catch (error) {
        console.error('❌ Permission middleware error:', error);
        return res.status(500).json({
          success: false,
          error: 'Permission check failed'
        });
      }
    };
  }

  /**
   * Check multiple permissions (all must be present)
   */
  static requireAllPermissions(permissionNames, options = {}) {
    return async (req, res, next) => {
      try {
        if (!req.user) {
          return res.status(401).json({
            success: false,
            error: 'Authentication required'
          });
        }

        const userId = req.user.userId;
        const permissionChecks = [];

        // Check each permission
        for (const permissionName of permissionNames) {
          const hasPermission = await PermissionService.checkUserPermission(userId, permissionName, options.resource);
          
          if (!hasPermission) {
            // Check role-based fallback
            const hasRolePermission = DynamicPermissionMiddleware._checkRolePermission(req.user, permissionName, options.resource);
            permissionChecks.push({
              permission: permissionName,
              hasPermission: hasRolePermission
            });
          } else {
            permissionChecks.push({
              permission: permissionName,
              hasPermission: true
            });
          }
        }

        const allGranted = permissionChecks.every(check => check.hasPermission);
        
        if (allGranted) {
          return next();
        } else {
          const missingPermissions = permissionChecks
            .filter(check => !check.hasPermission)
            .map(check => check.permission);

          return res.status(403).json({
            success: false,
            error: `Access denied. Missing permissions: ${missingPermissions.join(', ')}`,
            requiredPermissions: permissionNames,
            missingPermissions,
            userRole: req.user.role,
            userId: req.user.userId
          });
        }
      } catch (error) {
        console.error('❌ Multiple permission middleware error:', error);
        return res.status(500).json({
          success: false,
          error: 'Permission check failed'
        });
      }
    };
  }

  /**
   * Check if user has any of the specified permissions
   */
  static requireAnyPermission(permissionNames, options = {}) {
    return async (req, res, next) => {
      try {
        if (!req.user) {
          return res.status(401).json({
            success: false,
            error: 'Authentication required'
          });
        }

        const userId = req.user.userId;
        let hasPermission = false;
        let grantedPermission = null;

        // Check each permission until one is found
        for (const permissionName of permissionNames) {
          const hasDynamicPermission = await PermissionService.checkUserPermission(userId, permissionName, options.resource);
          
          if (hasDynamicPermission) {
            hasPermission = true;
            grantedPermission = permissionName;
            break;
          } else {
            // Check role-based fallback
            const hasRolePermission = DynamicPermissionMiddleware._checkRolePermission(req.user, permissionName, options.resource);
            if (hasRolePermission) {
              hasPermission = true;
              grantedPermission = permissionName;
              break;
            }
          }
        }

        if (hasPermission) {
          return next();
        } else {
          return res.status(403).json({
            success: false,
            error: `Access denied. Missing any of permissions: ${permissionNames.join(', ')}`,
            requiredPermissions: permissionNames,
            userRole: req.user.role,
            userId: req.user.userId
          });
        }
      } catch (error) {
        console.error('❌ Any permission middleware error:', error);
        return res.status(500).json({
          success: false,
          error: 'Permission check failed'
        });
      }
    };
  }

  /**
   * Check resource access permission
   */
  static requireResourceAccess(resource, action = 'READ') {
    return async (req, res, next) => {
      try {
        if (!req.user) {
          return res.status(401).json({
            success: false,
            error: 'Authentication required'
          });
        }

        const userId = req.user.userId;
        const hasAccess = await PermissionService.canAccessResource(userId, resource, action);

        if (hasAccess) {
          return next();
        } else {
          return res.status(403).json({
            success: false,
            error: `Access denied. Cannot ${action} resource: ${resource}`,
            requiredResource: resource,
            requiredAction: action,
            userRole: req.user.role,
            userId: req.user.userId
          });
        }
      } catch (error) {
        console.error('❌ Resource access middleware error:', error);
        return res.status(500).json({
          success: false,
          error: 'Resource access check failed'
        });
      }
    };
  }

  /**
   * Check if user is admin or has admin-level permissions
   */
  static requireAdminOrPermission(permissionName, options = {}) {
    return async (req, res, next) => {
      try {
        if (!req.user) {
          return res.status(401).json({
            success: false,
            error: 'Authentication required'
          });
        }

        // Admins always have access
        if (req.user.role === 'admin') {
          return next();
        }

        // For non-admins, check the specific permission
        return DynamicPermissionMiddleware.requirePermission(permissionName, options)(req, res, next);
      } catch (error) {
        console.error('❌ Admin or permission middleware error:', error);
        return res.status(500).json({
          success: false,
          error: 'Permission check failed'
        });
      }
    };
  }

  /**
   * Fallback to role-based permission checking
   */
  static _checkRolePermission(user, permissionName, resource = null) {
    const rolePermissions = PermissionService.getRolePermissions(user.role);
    return rolePermissions.includes(permissionName);
  }

  /**
   * Middleware to check if user can manage permissions
   */
  static requirePermissionManagement() {
    return async (req, res, next) => {
      try {
        if (!req.user) {
          return res.status(401).json({
            success: false,
            error: 'Authentication required'
          });
        }

        // Only admins can manage permissions
        if (req.user.role === 'admin') {
          return next();
        }

        // Check if user has permission management permission
        const hasPermission = await PermissionService.checkUserPermission(req.user.userId, 'manage_permissions');

        if (hasPermission) {
          return next();
        } else {
          return res.status(403).json({
            success: false,
            error: 'Access denied. Permission management requires admin privileges',
            userRole: req.user.role,
            userId: req.user.userId
          });
        }
      } catch (error) {
        console.error('❌ Permission management middleware error:', error);
        return res.status(500).json({
          success: false,
          error: 'Permission check failed'
        });
      }
    };
  }

  /**
   * Get user's effective permissions for middleware use
   */
  static async getUserEffectivePermissions(userId) {
    try {
      return await PermissionService.getEffectivePermissions(userId);
    } catch (error) {
      console.error('❌ Error getting effective permissions:', error);
      return [];
    }
  }
}

module.exports = DynamicPermissionMiddleware;
