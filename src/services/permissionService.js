const User = require('../models/User');
const Permission = require('../models/Permission');
const mongoose = require('mongoose');
const {
  getAllPermissionDefinitions,
  getPermissionsByCategory,
  getRolePermissions: getRolePermissionsFromConfig,
  getAllCategories,
  getPermissionsByLevel,
  permissionExists,
  getPermissionDefinition,
  getAssignablePermissions
} = require('../config/permissionDefinitions');

/**
 * Permission Service
 * Dynamic permission management system for role-based access control
 */
class PermissionService {
  /**
   * Initialize default permissions in the system
   */
  static async initializePermissions() {
    try {
      const existingCount = await Permission.countDocuments();
      
      if (existingCount === 0) {
        await Permission.createDefaultPermissions();
        console.log('🔐 Permission system initialized with default permissions');
      } else {
        console.log(`🔐 Permission system already has ${existingCount} permissions`);
      }
    } catch (error) {
      console.error('❌ Error initializing permissions:', error);
      throw error;
    }
  }

  /**
   * Grant permission to a user
   */
  static async grantPermission(userId, permissionName, assignedBy, expiresAt = null, reason = null) {
    try {
      // Validate permission exists in configuration
      if (!permissionExists(permissionName)) {
        throw new Error(`Permission '${permissionName}' not found`);
      }

      // Check if permission is assignable
      const permissionInfo = getPermissionDefinition(permissionName);
      if (!permissionInfo.isAssignable) {
        throw new Error(`Permission '${permissionName}' cannot be assigned to users`);
      }

      // Check if user already has this permission
      const existingPermission = await Permission.findOne({
        assignedTo: userId,
        name: permissionName,
        isActive: true,
        isDeleted: false,
        $or: [
          { expiresAt: null },
          { expiresAt: { $gt: new Date() } }
        ]
      });

      if (existingPermission) {
        throw new Error(`User already has permission '${permissionName}'`);
      }

      // Get user info
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Get assigned by user info
      const assignedByUser = await User.findById(assignedBy);
      if (!assignedByUser) {
        throw new Error('Assigned by user not found');
      }

      // Create permission assignment
      const assignment = new Permission({
        name: permissionName,
        description: permissionInfo.description,
        category: permissionInfo.category,
        action: this.getActionFromName(permissionName),
        resource: this.getResourceFromName(permissionName),
        level: permissionInfo.level,
        assignedTo: userId,
        assignedBy: assignedBy,
        assignedAt: new Date(),
        expiresAt: expiresAt,
        isActive: true,
        isDeleted: false,
        metadata: {
          reason: reason || 'Permission granted via admin panel'
        }
      });

      await assignment.save();
      
      // Log the assignment
      console.log(`🔐 Granted permission '${permissionName}' to user ${userId} by ${assignedBy}`);
      
      return {
        success: true,
        data: {
          permission: assignment,
          user: {
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role
          },
          grantedBy: {
            _id: assignedByUser._id,
            name: assignedByUser.name,
            email: assignedByUser.email
          }
        }
      };
    } catch (error) {
      console.error('❌ Error granting permission:', error);
      throw error;
    }
  }

  /**
   * Revoke permission from a user
   */
  static async revokePermission(userId, permissionName, revokedBy, reason = null) {
    try {
      // Validate permission exists in configuration
      if (!permissionExists(permissionName)) {
        throw new Error(`Permission '${permissionName}' not found`);
      }

      // Find the active permission
      const permission = await Permission.findOne({
        assignedTo: userId,
        name: permissionName,
        isActive: true,
        isDeleted: false,
        $or: [
          { expiresAt: null },
          { expiresAt: { $gt: new Date() } }
        ]
      });

      if (!permission) {
        throw new Error(`User does not have active permission '${permissionName}'`);
      }

      // Soft delete the permission
      permission.isActive = false;
      permission.isDeleted = true;
      permission.deletedAt = new Date();
      permission.deletedBy = revokedBy;
      permission.metadata = {
        ...permission.metadata,
        revokeReason: reason || 'Permission revoked via admin panel'
      };

      await permission.save();
      
      console.log(`🔐 Revoked permission '${permissionName}' from user ${userId} by ${revokedBy}`);
      
      return {
        success: true,
        data: {
          message: `Permission '${permissionName}' revoked from user`,
          revokedAt: permission.deletedAt,
          revokedBy: await User.findById(revokedBy, 'name email')
        }
      };
    } catch (error) {
      console.error('❌ Error revoking permission:', error);
      throw error;
    }
  }

  /**
   * Get all permissions for a user
   */
  static async getUserPermissions(userId, includeInactive = false) {
    try {
      const permissions = await Permission.getUserPermissions(userId, includeInactive);
      
      console.log(`🔐 Retrieved ${permissions.length} permissions for user ${userId}`);
      
      return permissions;
    } catch (error) {
      console.error('❌ Error fetching user permissions:', error);
      throw error;
    }
  }

  /**
   * Check if user has specific permission
   */
  static async checkUserPermission(userId, permissionName, resource = null) {
    try {
      const hasPermission = await Permission.checkPermission(userId, permissionName, resource);
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`🔐 Permission check: ${permissionName} for user ${userId} = ${hasPermission}`);
      }
      
      return hasPermission;
    } catch (error) {
      console.error('❌ Error checking permission:', error);
      return false;
    }
  }

  /**
   * Grant multiple permissions to a user
   */
  static async grantMultiplePermissions(userId, permissionNames, assignedBy, expiresAt = null, reason = null) {
    try {
      const results = [];
      
      for (const permissionName of permissionNames) {
        try {
          // Check if permission exists and is assignable
          if (!permissionExists(permissionName)) {
            results.push({
              success: false,
              permission: permissionName,
              error: `Permission '${permissionName}' not found`,
              skipped: true
            });
            continue;
          }

          const permissionInfo = getPermissionDefinition(permissionName);
          if (!permissionInfo.isAssignable) {
            results.push({
              success: false,
              permission: permissionName,
              error: `Permission '${permissionName}' cannot be assigned to users`,
              skipped: true
            });
            continue;
          }

          // Check if user already has this permission
          const existingPermission = await Permission.findOne({
            assignedTo: userId,
            name: permissionName,
            isActive: true,
            isDeleted: false,
            $or: [
              { expiresAt: null },
              { expiresAt: { $gt: new Date() } }
            ]
          });

          if (existingPermission) {
            results.push({
              success: true,
              permission: permissionName,
              message: `User already has permission '${permissionName}'`,
              skipped: true,
              existing: true
            });
            continue;
          }

          // Grant the permission
          const result = await PermissionService.grantPermission(userId, permissionName, assignedBy, expiresAt, reason);
          results.push({
            success: true,
            permission: permissionName,
            data: result.data,
            granted: true
          });
          
        } catch (error) {
          results.push({
            success: false,
            permission: permissionName,
            error: error.message,
            failed: true
          });
        }
      }
      
      const successCount = results.filter(r => r.success).length;
      const grantedCount = results.filter(r => r.granted).length;
      const skippedCount = results.filter(r => r.skipped).length;
      const failureCount = results.filter(r => r.failed).length;
      
      console.log(`🔐 Batch permission grant: ${grantedCount} granted, ${skippedCount} skipped, ${failureCount} failed`);
      
      return {
        success: failureCount === 0,
        results,
        summary: {
          total: results.length,
          successful: successCount,
          granted: grantedCount,
          skipped: skippedCount,
          failed: failureCount
        }
      };
    } catch (error) {
      console.error('❌ Error granting multiple permissions:', error);
      throw error;
    }
  }

  /**
   * Revoke multiple permissions from a user
   */
  static async revokeMultiplePermissions(userId, permissionNames, revokedBy) {
    try {
      const results = [];
      
      for (const permissionName of permissionNames) {
        try {
          const result = await PermissionService.revokePermission(userId, permissionName, revokedBy);
          results.push(result);
        } catch (error) {
          results.push({
            success: false,
            permission: permissionName,
            error: error.message
          });
        }
      }
      
      const successCount = results.filter(r => r.success).length;
      const failureCount = results.length - successCount;
      
      console.log(`🔐 Batch permission revocation: ${successCount} success, ${failureCount} failures`);
      
      return {
        success: failureCount === 0,
        results,
        summary: {
          total: results.length,
          successful: successCount,
          failed: failureCount
        }
      };
    } catch (error) {
      console.error('❌ Error revoking multiple permissions:', error);
      throw error;
    }
  }

  /**
   * Get all available permissions in the system
   */
  static async getAllPermissions(category = null, includeInactive = false) {
    try {
      // Get all available permissions from the configuration
      let allPermissions;
      
      if (category) {
        allPermissions = getPermissionsByCategory(category);
      } else {
        allPermissions = getAssignablePermissions();
      }

      // Format permissions for response
      const formattedPermissions = allPermissions.map(permission => ({
        name: permission.name,
        description: permission.description,
        category: permission.category,
        action: this.getActionFromName(permission.name),
        resource: this.getResourceFromName(permission.name),
        level: permission.level,
        isActive: includeInactive ? true : true, // All config permissions are active
        isAssignable: permission.isAssignable
      }));

      return formattedPermissions;
    } catch (error) {
      console.error('❌ Error fetching all permissions:', error);
      throw error;
    }
  }

  /**
   * Derive action from permission name
   */
  static getActionFromName(permissionName) {
    const actionMap = {
      'manage_': 'MANAGE',
      'read_': 'READ',
      'view_': 'VIEW',
      'access_': 'ACCESS',
      'export_': 'EXPORT',
      'block_': 'BLOCK',
      'unblock_': 'UNBLOCK',
      'update_': 'UPDATE'
    };

    for (const [prefix, action] of Object.entries(actionMap)) {
      if (permissionName.startsWith(prefix)) {
        return action;
      }
    }

    return 'MANAGE'; // Default action
  }

  /**
   * Derive resource from permission name
   */
  static getResourceFromName(permissionName) {
    const resourceMap = {
      'manage_users': 'USERS',
      'manage_doctors': 'DOCTORS',
      'access_admin_panel': 'ADMIN_PANEL',
      'view_sensitive_data': 'SENSITIVE_DATA',
      'export_user_data': 'USER_DATA',
      'view_system_reports': 'SYSTEM_REPORTS',
      'MANAGE_BUNDLES': 'BUNDLES',
      'manage_diet_plans': 'DIET_PLANS',
      'manage_client_workout_plans': 'CLIENT_WORKOUT_PLANS',
      'view_client_workout_plans': 'CLIENT_WORKOUT_PLANS',
      'view_client_progress': 'CLIENT_PROGRESS',
      'manage_workout_templates': 'WORKOUT_TEMPLATES',
      'read_users': 'USERS',
      'read_dashboard': 'DASHBOARD',
      'read_subscriptions': 'SUBSCRIPTIONS',
      'block_client': 'CLIENTS',
      'unblock_client': 'CLIENTS',
      'read_user_details': 'USER_DETAILS',
      'manage_users_limited': 'USERS',
      'manage_supervisors': 'SUPERVISORS',
      'read_audit_logs': 'AUDIT_LOGS',
      'read_supervisor_audit': 'SUPERVISOR_AUDIT',
      'export_supervisor_audit': 'SUPERVISOR_AUDIT',
      'manage_supervisor_audit': 'SUPERVISOR_AUDIT',
      'read_permissions': 'PERMISSIONS',
      'manage_permissions': 'PERMISSIONS',
      'read_own_profile': 'OWN_PROFILE',
      'manage_own_subscriptions': 'OWN_SUBSCRIPTIONS',
      'read_own_subscriptions': 'OWN_SUBSCRIPTIONS',
      'manage_own_certificates': 'OWN_CERTIFICATES',
      'manage_own_packages': 'OWN_PACKAGES',
      'manage_own_bio': 'OWN_BIO',
      'update_own_profile': 'OWN_PROFILE',
      'manage_own_profile_picture': 'OWN_PROFILE_PICTURE',
      'read_own_weight': 'OWN_WEIGHT',
      'manage_own_weight': 'OWN_WEIGHT',
      'manage_own_progress': 'OWN_PROGRESS',
      'view_own_progress': 'OWN_PROGRESS'
    };

    return resourceMap[permissionName] || 'SYSTEM';
  }

  /**
   * Get permissions by category
   */
  static async getPermissionsByCategory(category, includeInactive = false) {
    try {
      return await PermissionService.getAllPermissions(category, includeInactive);
    } catch (error) {
      console.error('❌ Error fetching permissions by category:', error);
      throw error;
    }
  }

  /**
   * Update permission (for system management)
   */
  static async updatePermission(permissionId, updates, updatedBy) {
    try {
      const permission = await Permission.findByIdAndUpdate(
        permissionId,
        {
          ...updates,
          updatedBy,
          updatedAt: new Date()
        },
        { new: true }
      );

      if (!permission) {
        throw new Error(`Permission with ID ${permissionId} not found`);
      }

      console.log(`🔐 Updated permission ${permissionId}`);
      
      return permission;
    } catch (error) {
      console.error('❌ Error updating permission:', error);
      throw error;
    }
  }

  /**
   * Get permission statistics
   */
  static async getPermissionStats() {
    try {
      const stats = await Permission.getPermissionStats();
      
      console.log(`🔐 Retrieved permission statistics: ${stats.length} categories`);
      
      return stats;
    } catch (error) {
      console.error('❌ Error fetching permission stats:', error);
      throw error;
    }
  }

  /**
   * Check if user can access specific resource
   */
  static async canAccessResource(userId, resource, action = 'READ') {
    try {
      // Get user's permissions
      const permissions = await PermissionService.getUserPermissions(userId);
      
      // Check for direct resource permission
      const resourcePermission = permissions.find(perm => 
        perm.resource === resource && 
        perm.action === action && 
        perm.isActive
      );

      if (resourcePermission) {
        return true;
      }

      // Check for system-wide permissions
      const systemPermission = permissions.find(perm => 
        perm.resource === 'SYSTEM' && 
        perm.action === 'MANAGE' && 
        perm.isActive
      );

      return !!systemPermission;
    } catch (error) {
      console.error('❌ Error checking resource access:', error);
      return false;
    }
  }

  /**
   * Get user's effective permissions (including role-based)
   */
  static async getEffectivePermissions(userId) {
    try {
      // Get user details
      const user = await User.findById(userId).lean();
      
      if (!user) {
        return [];
      }

      // Get assigned permissions
      const assignedPermissions = await PermissionService.getUserPermissions(userId);
      
      // Get role-based permissions
      const rolePermissions = PermissionService.getRolePermissions(user.role);
      
      // Combine and deduplicate
      const allPermissions = [
        ...rolePermissions,
        ...assignedPermissions.map(p => p.name)
      ];

      // Remove duplicates
      const uniquePermissions = [...new Set(allPermissions)];
      
      return uniquePermissions;
    } catch (error) {
      console.error('❌ Error getting effective permissions:', error);
      throw error;
    }
  }

  /**
   * Get role-based permissions from configuration
   */
  static getRolePermissions(role) {
    return getRolePermissionsFromConfig(role);
  }

  /**
   * Get all permission categories
   */
  static getAllPermissionCategories() {
    return getAllCategories();
  }

  /**
   * Get permissions by level
   */
  static getPermissionsByLevel(level) {
    return getPermissionsByLevel(level);
  }

  /**
   * Check if permission exists
   */
  static isValidPermission(permissionName) {
    return permissionExists(permissionName);
  }

  /**
   * Get permission definition
   */
  static getPermissionInfo(permissionName) {
    return getPermissionDefinition(permissionName);
  }

  /**
   * Get assignable permissions only
   */
  static getAssignablePermissionsList() {
    return getAssignablePermissions();
  }

  /**
   * Cleanup expired permissions
   */
  static async cleanupExpiredPermissions() {
    try {
      const result = await Permission.updateMany(
        {
          expiresAt: { $lt: new Date() },
          isActive: true
        },
        {
          isActive: false,
          updatedAt: new Date()
        }
      );

      console.log(`🔐 Deactivated ${result.modifiedCount} expired permissions`);
      
      return result;
    } catch (error) {
      console.error('❌ Error cleaning up expired permissions:', error);
      throw error;
    }
  }
}

module.exports = PermissionService;
