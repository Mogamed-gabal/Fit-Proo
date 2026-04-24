const Permission = require('../models/Permission');
const User = require('../models/User');

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
      // Find the permission
      const permission = await Permission.findOne({ 
        name: permissionName, 
        isDeleted: false 
      });

      if (!permission) {
        throw new Error(`Permission '${permissionName}' not found`);
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

      // Assign permission
      const assignment = await Permission.assignPermission(permission._id, userId, assignedBy, expiresAt);
      
      // Log the assignment
      console.log(`🔐 Granted permission '${permissionName}' to user ${userId} by ${assignedBy}`);
      
      return {
        success: true,
        assignment,
        message: `Permission '${permissionName}' granted successfully`
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

      // Revoke permission
      const revocation = await Permission.revokePermission(permission._id, revokedBy);
      
      console.log(`🔐 Revoked permission '${permissionName}' from user ${userId} by ${revokedBy}`);
      
      return {
        success: true,
        revocation,
        message: `Permission '${permissionName}' revoked successfully`
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
  static async grantMultiplePermissions(userId, permissionNames, assignedBy, expiresAt = null) {
    try {
      const results = [];
      
      for (const permissionName of permissionNames) {
        try {
          const result = await PermissionService.grantPermission(userId, permissionName, assignedBy, expiresAt);
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
      
      console.log(`🔐 Batch permission grant: ${successCount} success, ${failureCount} failures`);
      
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
      const query = { isDeleted: false };
      
      if (!includeInactive) {
        query.isActive = true;
      }
      
      if (category) {
        query.category = category;
      }

      const permissions = await Permission.find(query)
        .populate('assignedBy', 'name email')
        .populate('assignedTo', 'name email')
        .sort({ category: 1, level: 1, name: 1 });

      return permissions;
    } catch (error) {
      console.error('❌ Error fetching all permissions:', error);
      throw error;
    }
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
   * Get role-based permissions (fallback to existing system)
   */
  static getRolePermissions(role) {
    const rolePermissions = {
      admin: [
        'manage_users',
        'manage_doctors',
        'manage_diet_plans',
        'access_admin_panel',
        'view_sensitive_data',
        'export_user_data',
        'view_system_reports',
        'read_supervisor_audit',
        'export_supervisor_audit',
        'manage_supervisor_audit'
      ],
      supervisor: [
        // These will be replaced by dynamic permissions
        'read_users',
        'read_dashboard',
        'read_subscriptions',
        'block_client',
        'unblock_client',
        'read_user_details',
        'manage_users_limited',
        'manage_supervisors',
        'read_audit_logs'
      ],
      doctor: [
        'read_own_profile',
        'manage_own_subscriptions',
        'read_own_subscriptions',
        'manage_own_certificates',
        'manage_own_packages',
        'manage_own_bio',
        'update_own_profile',
        'manage_own_profile_picture',
        'read_own_weight',
        'manage_client_workout_plans',
        'view_client_workout_plans',
        'view_client_progress',
        'manage_workout_templates'
      ],
      client: [
        'read_own_profile',
        'manage_own_subscriptions',
        'read_own_subscriptions',
        'manage_own_weight',
        'read_own_weight',
        'update_own_profile',
        'manage_own_profile_picture',
        'manage_own_progress',
        'view_own_progress'
      ]
    };

    return rolePermissions[role] || [];
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
