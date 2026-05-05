/**
 * Permission Helper Utilities
 * 
 * Common permission operations and validations
 */

const PermissionService = require('../services/permissionService');

/**
 * Check if user has specific permission
 */
const hasPermission = (userPermissions, permissionName) => {
  return userPermissions.includes(permissionName);
};

/**
 * Check if user has any of the specified permissions
 */
const hasAnyPermission = (userPermissions, permissionNames) => {
  return permissionNames.some(permission => userPermissions.includes(permission));
};

/**
 * Check if user has all specified permissions
 */
const hasAllPermissions = (userPermissions, permissionNames) => {
  return permissionNames.every(permission => userPermissions.includes(permission));
};

/**
 * Get user's permissions by level
 */
const getUserPermissionsByLevel = async (userId, level) => {
  try {
    const allLevelPermissions = PermissionService.getPermissionsByLevel(level);
    const userPermissions = await PermissionService.getEffectivePermissions(userId);
    
    return allLevelPermissions.filter(permission => 
      userPermissions.includes(permission.name)
    );
  } catch (error) {
    console.error('Error getting user permissions by level:', error);
    return [];
  }
};

/**
 * Get user's permissions by category
 */
const getUserPermissionsByCategory = async (userId, category) => {
  try {
    const allCategoryPermissions = PermissionService.getPermissionsByCategory(category);
    const userPermissions = await PermissionService.getEffectivePermissions(userId);
    
    return allCategoryPermissions.filter(permission => 
      userPermissions.includes(permission.name)
    );
  } catch (error) {
    console.error('Error getting user permissions by category:', error);
    return [];
  }
};

/**
 * Validate permission name
 */
const validatePermissionName = (permissionName) => {
  if (!permissionName || typeof permissionName !== 'string') {
    return { valid: false, error: 'Permission name must be a non-empty string' };
  }

  if (!PermissionService.isValidPermission(permissionName)) {
    return { valid: false, error: 'Permission does not exist in the system' };
  }

  return { valid: true };
};

/**
 * Get permission summary for user
 */
const getUserPermissionSummary = async (userId) => {
  try {
    const userPermissions = await PermissionService.getEffectivePermissions(userId);
    const allCategories = PermissionService.getAllPermissionCategories();
    
    const summary = {
      totalPermissions: userPermissions.length,
      categories: {},
      levels: {
        SYSTEM: 0,
        LIMITED: 0,
        PERSONAL: 0
      }
    };

    // Count by category and level
    for (const permissionName of userPermissions) {
      const permissionInfo = PermissionService.getPermissionInfo(permissionName);
      if (permissionInfo) {
        // Count by category
        if (!summary.categories[permissionInfo.category]) {
          summary.categories[permissionInfo.category] = 0;
        }
        summary.categories[permissionInfo.category]++;

        // Count by level
        if (summary.levels[permissionInfo.level] !== undefined) {
          summary.levels[permissionInfo.level]++;
        }
      }
    }

    return summary;
  } catch (error) {
    console.error('Error getting user permission summary:', error);
    return null;
  }
};

/**
 * Filter assignable permissions for user role
 */
const getAssignablePermissionsForRole = (role) => {
  const rolePermissions = PermissionService.getRolePermissions(role);
  const allAssignablePermissions = PermissionService.getAssignablePermissionsList();
  
  return allAssignablePermissions.filter(permission => 
    !rolePermissions.includes(permission.name) // Only show permissions not already assigned
  );
};

/**
 * Check if permission can be assigned to role
 */
const canAssignPermissionToRole = (permissionName, role) => {
  const permissionInfo = PermissionService.getPermissionInfo(permissionName);
  if (!permissionInfo) {
    return false;
  }

  // Personal permissions cannot be assigned
  if (permissionInfo.level === 'PERSONAL') {
    return false;
  }

  // Check if role is in default roles or if permission is assignable
  return permissionInfo.isAssignable;
};

/**
 * Get permission hierarchy (parent-child relationships)
 */
const getPermissionHierarchy = () => {
  const hierarchy = {
    'SYSTEM_ADMINISTRATION': [
      'manage_users',
      'manage_doctors',
      'access_admin_panel',
      'view_sensitive_data',
      'export_user_data',
      'view_system_reports'
    ],
    'USER_MANAGEMENT': [
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
    'BUNDLE_MANAGEMENT': ['MANAGE_BUNDLES'],
    'DIET_MANAGEMENT': ['manage_diet_plans'],
    'WORKOUT_MANAGEMENT': [
      'manage_client_workout_plans',
      'view_client_workout_plans',
      'view_client_progress',
      'manage_workout_templates'
    ],
    'AUDIT_MANAGEMENT': [
      'read_supervisor_audit',
      'export_supervisor_audit',
      'manage_supervisor_audit'
    ],
    'PERMISSION_MANAGEMENT': [
      'read_permissions',
      'manage_permissions'
    ],
    'SELF_MANAGEMENT': [
      'read_own_profile',
      'manage_own_subscriptions',
      'read_own_subscriptions',
      'manage_own_certificates',
      'manage_own_packages',
      'manage_own_bio',
      'update_own_profile',
      'manage_own_profile_picture',
      'read_own_weight',
      'manage_own_weight',
      'manage_own_progress',
      'view_own_progress'
    ]
  };

  return hierarchy;
};

module.exports = {
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  getUserPermissionsByLevel,
  getUserPermissionsByCategory,
  validatePermissionName,
  getUserPermissionSummary,
  getAssignablePermissionsForRole,
  canAssignPermissionToRole,
  getPermissionHierarchy
};
