const PermissionService = require('../services/permissionService');
const User = require('../models/User');

/**
 * Permission Controller
 * Handles dynamic permission management for supervisors and other roles
 */
class PermissionController {
  /**
   * Grant permission to a user
   * POST /api/permissions/grant
   */
  static async grantPermission(req, res) {
    try {
      const { userId, permissionName, expiresAt, reason } = req.body;
      const assignedBy = req.user.userId;

      // Validate input
      if (!userId || !permissionName) {
        return res.status(400).json({
          success: false,
          error: 'User ID and permission name are required'
        });
      }

      // Check if target user exists
      const targetUser = await User.findById(userId);
      if (!targetUser) {
        return res.status(404).json({
          success: false,
          error: 'Target user not found'
        });
      }

      // Grant permission
      const result = await PermissionService.grantPermission(userId, permissionName, assignedBy, expiresAt, reason);

      res.status(200).json({
        success: true,
        message: result.message,
        data: {
          assignment: result.assignment,
          permission: permissionName,
          user: {
            id: targetUser._id,
            name: targetUser.name,
            email: targetUser.email,
            role: targetUser.role
          }
        }
      });
    } catch (error) {
      console.error('❌ Grant permission error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Revoke permission from a user
   * POST /api/permissions/revoke
   */
  static async revokePermission(req, res) {
    try {
      const { userId, permissionName, reason } = req.body;
      const revokedBy = req.user.userId;

      // Validate input
      if (!userId || !permissionName) {
        return res.status(400).json({
          success: false,
          error: 'User ID and permission name are required'
        });
      }

      // Revoke permission
      const result = await PermissionService.revokePermission(userId, permissionName, revokedBy, reason);

      res.status(200).json({
        success: true,
        message: result.message,
        data: {
          revocation: result.revocation,
          permission: permissionName
        }
      });
    } catch (error) {
      console.error('❌ Revoke permission error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Get user permissions
   * GET /api/permissions/user/:userId
   */
  static async getUserPermissions(req, res) {
    try {
      const { userId } = req.params;
      const { includeInactive = false } = req.query;

      // Get permissions
      const permissions = await PermissionService.getUserPermissions(userId, includeInactive);

      res.status(200).json({
        success: true,
        data: {
          userId,
          permissions,
          count: permissions.length
        }
      });
    } catch (error) {
      console.error('❌ Get user permissions error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Get current user permissions
   * GET /api/permissions/my
   */
  static async getMyPermissions(req, res) {
    try {
      const userId = req.user.userId;
      const { includeInactive = false } = req.query;

      // Get permissions
      const permissions = await PermissionService.getUserPermissions(userId, includeInactive);

      res.status(200).json({
        success: true,
        data: {
          userId,
          permissions,
          count: permissions.length
        }
      });
    } catch (error) {
      console.error('❌ Get my permissions error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Get all available permissions
   * GET /api/permissions/all
   */
  static async getAllPermissions(req, res) {
    try {
      const { category, includeInactive = false } = req.query;

      // Get all permissions
      const permissions = await PermissionService.getAllPermissions(category, includeInactive);

      res.status(200).json({
        success: true,
        data: {
          permissions,
          count: permissions.length,
          filters: { category, includeInactive }
        }
      });
    } catch (error) {
      console.error('❌ Get all permissions error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Get permissions by category
   * GET /api/permissions/category/:category
   */
  static async getPermissionsByCategory(req, res) {
    try {
      const { category } = req.params;
      const { includeInactive = false } = req.query;

      // Get permissions by category
      const permissions = await PermissionService.getPermissionsByCategory(category, includeInactive);

      res.status(200).json({
        success: true,
        data: {
          category,
          permissions,
          count: permissions.length
        }
      });
    } catch (error) {
      console.error('❌ Get permissions by category error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Grant multiple permissions
   * POST /api/permissions/grant-multiple
   */
  static async grantMultiplePermissions(req, res) {
    try {
      const { userId, permissionNames, expiresAt, reason } = req.body;
      const assignedBy = req.user.userId;

      // Validate input
      if (!userId || !Array.isArray(permissionNames) || permissionNames.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'User ID and permission names array are required'
        });
      }

      // Grant multiple permissions
      const result = await PermissionService.grantMultiplePermissions(userId, permissionNames, assignedBy, expiresAt);

      res.status(200).json({
        success: result.success,
        message: `Granted ${result.summary.successful} of ${result.summary.total} permissions successfully`,
        data: {
          results,
          summary: result.summary
        }
      });
    } catch (error) {
      console.error('❌ Grant multiple permissions error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Revoke multiple permissions
   * POST /api/permissions/revoke-multiple
   */
  static async revokeMultiplePermissions(req, res) {
    try {
      const { userId, permissionNames, reason } = req.body;
      const revokedBy = req.user.userId;

      // Validate input
      if (!userId || !Array.isArray(permissionNames) || permissionNames.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'User ID and permission names array are required'
        });
      }

      // Revoke multiple permissions
      const result = await PermissionService.revokeMultiplePermissions(userId, permissionNames, revokedBy, reason);

      res.status(200).json({
        success: result.success,
        message: `Revoked ${result.summary.successful} of ${result.summary.total} permissions successfully`,
        data: {
          results,
          summary: result.summary
        }
      });
    } catch (error) {
      console.error('❌ Revoke multiple permissions error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Check user permission
   * GET /api/permissions/check/:userId/:permissionName
   */
  static async checkPermission(req, res) {
    try {
      const { userId, permissionName } = req.params;
      const { resource } = req.query;

      // Check permission
      const hasPermission = await PermissionService.checkUserPermission(userId, permissionName, resource);

      res.status(200).json({
        success: true,
        data: {
          userId,
          permissionName,
          resource,
          hasPermission,
          checkedAt: new Date()
        }
      });
    } catch (error) {
      console.error('❌ Check permission error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Get permission statistics
   * GET /api/permissions/stats
   */
  static async getPermissionStats(req, res) {
    try {
      const stats = await PermissionService.getPermissionStats();

      res.status(200).json({
        success: true,
        data: {
          statistics: stats,
          generatedAt: new Date()
        }
      });
    } catch (error) {
      console.error('❌ Get permission stats error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Initialize permission system
   * POST /api/permissions/initialize
   */
  static async initializePermissions(req, res) {
    try {
      // Only admins can initialize the system
      if (req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          error: 'Only administrators can initialize the permission system'
        });
      }

      const result = await PermissionService.initializePermissions();

      res.status(200).json({
        success: true,
        message: 'Permission system initialized successfully',
        data: {
          initialized: true,
          permissionsCreated: result.length
        }
      });
    } catch (error) {
      console.error('❌ Initialize permissions error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Cleanup expired permissions
   * POST /api/permissions/cleanup
   */
  static async cleanupExpiredPermissions(req, res) {
    try {
      // Only admins can cleanup
      if (req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          error: 'Only administrators can cleanup expired permissions'
        });
      }

      const result = await PermissionService.cleanupExpiredPermissions();

      res.status(200).json({
        success: true,
        message: 'Expired permissions cleaned up successfully',
        data: {
          cleanedUp: result.modifiedCount,
          cleanedAt: new Date()
        }
      });
    } catch (error) {
      console.error('❌ Cleanup permissions error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Get effective permissions for user
   * GET /api/permissions/effective/:userId
   */
  static async getEffectivePermissions(req, res) {
    try {
      const { userId } = req.params;

      // Get effective permissions (role + assigned)
      const permissions = await PermissionService.getEffectivePermissions(userId);

      res.status(200).json({
        success: true,
        data: {
          userId,
          effectivePermissions: permissions,
          count: permissions.length
        }
      });
    } catch (error) {
      console.error('❌ Get effective permissions error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
}

module.exports = PermissionController;
