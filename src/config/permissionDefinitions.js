/**
 * Permission Definitions - Single Source of Truth
 * 
 * This file defines all available permissions in the system.
 * Each permission includes:
 * - description: Human-readable description
 * - category: Logical grouping
 * - level: Access level (SYSTEM, LIMITED, PERSONAL)
 * - defaultRoles: Roles that have this permission by default
 * - isAssignable: Can be granted to users individually
 */

const PERMISSION_DEFINITIONS = {
  // SYSTEM ADMINISTRATION
  manage_users: {
    description: 'Full user management access',
    category: 'SYSTEM_ADMINISTRATION',
    level: 'SYSTEM',
    defaultRoles: ['admin'],
    isAssignable: true
  },
  manage_doctors: {
    description: 'Manage doctor accounts and profiles',
    category: 'SYSTEM_ADMINISTRATION',
    level: 'SYSTEM',
    defaultRoles: ['admin'],
    isAssignable: true
  },
  access_admin_panel: {
    description: 'Access admin dashboard and panels',
    category: 'SYSTEM_ADMINISTRATION',
    level: 'SYSTEM',
    defaultRoles: ['admin'],
    isAssignable: true
  },
  view_sensitive_data: {
    description: 'View sensitive user and system data',
    category: 'SYSTEM_ADMINISTRATION',
    level: 'SYSTEM',
    defaultRoles: ['admin'],
    isAssignable: true
  },
  export_user_data: {
    description: 'Export user data and reports',
    category: 'SYSTEM_ADMINISTRATION',
    level: 'SYSTEM',
    defaultRoles: ['admin'],
    isAssignable: true
  },
  view_system_reports: {
    description: 'View system analytics and reports',
    category: 'SYSTEM_ADMINISTRATION',
    level: 'SYSTEM',
    defaultRoles: ['admin'],
    isAssignable: true
  },

  // BUNDLE MANAGEMENT
  MANAGE_BUNDLES: {
    description: 'Allow user to manage doctor bundles',
    category: 'BUNDLE_MANAGEMENT',
    level: 'SYSTEM',
    defaultRoles: ['admin'],
    isAssignable: true
  },

  // DIET MANAGEMENT
  manage_diet_plans: {
    description: 'Create and manage diet plans',
    category: 'DIET_MANAGEMENT',
    level: 'SYSTEM',
    defaultRoles: ['admin'],
    isAssignable: true
  },

  // WORKOUT MANAGEMENT
  manage_client_workout_plans: {
    description: 'Manage client workout plans',
    category: 'WORKOUT_MANAGEMENT',
    level: 'SYSTEM',
    defaultRoles: ['admin'],
    isAssignable: true
  },
  view_client_workout_plans: {
    description: 'View client workout plans',
    category: 'WORKOUT_MANAGEMENT',
    level: 'SYSTEM',
    defaultRoles: ['admin'],
    isAssignable: true
  },
  view_all_workout_plans: {
    description: 'View all workout plans in the system (admin only)',
    category: 'WORKOUT_MANAGEMENT',
    level: 'SYSTEM',
    defaultRoles: ['admin'],
    isAssignable: true
  },
  view_client_progress: {
    description: 'View client progress and analytics',
    category: 'WORKOUT_MANAGEMENT',
    level: 'SYSTEM',
    defaultRoles: ['admin'],
    isAssignable: true
  },
  manage_workout_templates: {
    description: 'Create and manage workout templates',
    category: 'WORKOUT_MANAGEMENT',
    level: 'SYSTEM',
    defaultRoles: ['admin'],
    isAssignable: true
  },

  // USER MANAGEMENT (LIMITED)
  read_users: {
    description: 'Read user information and profiles',
    category: 'USER_MANAGEMENT',
    level: 'LIMITED',
    defaultRoles: ['supervisor'],
    isAssignable: true
  },
  read_dashboard: {
    description: 'Access main dashboard',
    category: 'USER_MANAGEMENT',
    level: 'LIMITED',
    defaultRoles: ['supervisor'],
    isAssignable: true
  },
  view_dashboard_analytics: {
    description: 'View dashboard analytics and statistics',
    category: 'USER_MANAGEMENT',
    level: 'LIMITED',
    defaultRoles: ['supervisor'],
    isAssignable: true
  },
  read_subscriptions: {
    description: 'Read subscription information',
    category: 'USER_MANAGEMENT',
    level: 'LIMITED',
    defaultRoles: ['supervisor'],
    isAssignable: true
  },
  block_client: {
    description: 'Block client accounts',
    category: 'USER_MANAGEMENT',
    level: 'LIMITED',
    defaultRoles: ['supervisor'],
    isAssignable: true
  },
  unblock_client: {
    description: 'Unblock client accounts',
    category: 'USER_MANAGEMENT',
    level: 'LIMITED',
    defaultRoles: ['supervisor'],
    isAssignable: true
  },
  read_user_details: {
    description: 'Read detailed user information',
    category: 'USER_MANAGEMENT',
    level: 'LIMITED',
    defaultRoles: ['supervisor'],
    isAssignable: true
  },
  view_deleted_users: {
    description: 'View deleted and blocked users',
    category: 'USER_MANAGEMENT',
    level: 'LIMITED',
    defaultRoles: ['supervisor'],
    isAssignable: true
  },
  permanent_delete_users: {
    description: 'Permanently delete users from system',
    category: 'USER_MANAGEMENT',
    level: 'LIMITED',
    defaultRoles: ['supervisor'],
    isAssignable: true
  },
  manage_users_limited: {
    description: 'Limited user management capabilities',
    category: 'USER_MANAGEMENT',
    level: 'LIMITED',
    defaultRoles: ['supervisor'],
    isAssignable: true
  },
  manage_supervisors: {
    description: 'Manage supervisor accounts',
    category: 'USER_MANAGEMENT',
    level: 'LIMITED',
    defaultRoles: ['supervisor'],
    isAssignable: true
  },
  read_audit_logs: {
    description: 'Read system audit logs',
    category: 'USER_MANAGEMENT',
    level: 'LIMITED',
    defaultRoles: ['supervisor'],
    isAssignable: true
  },

  // AUDIT MANAGEMENT
  read_supervisor_audit: {
    description: 'Read supervisor audit logs',
    category: 'AUDIT_MANAGEMENT',
    level: 'SYSTEM',
    defaultRoles: ['admin'],
    isAssignable: true
  },
  export_supervisor_audit: {
    description: 'Export supervisor audit data',
    category: 'AUDIT_MANAGEMENT',
    level: 'SYSTEM',
    defaultRoles: ['admin'],
    isAssignable: true
  },
  manage_supervisor_audit: {
    description: 'Manage supervisor audit system',
    category: 'AUDIT_MANAGEMENT',
    level: 'SYSTEM',
    defaultRoles: ['admin'],
    isAssignable: true
  },

  // PERMISSION MANAGEMENT
  read_permissions: {
    description: 'Read permission assignments',
    category: 'PERMISSION_MANAGEMENT',
    level: 'SYSTEM',
    defaultRoles: ['admin'],
    isAssignable: true
  },
  manage_permissions: {
    description: 'Manage system permissions',
    category: 'PERMISSION_MANAGEMENT',
    level: 'SYSTEM',
    defaultRoles: ['admin'],
    isAssignable: true
  },

  // DOCTOR SELF-MANAGEMENT
  read_own_profile: {
    description: 'Read own profile information',
    category: 'SELF_MANAGEMENT',
    level: 'PERSONAL',
    defaultRoles: ['doctor', 'client'],
    isAssignable: false
  },
  manage_own_subscriptions: {
    description: 'Manage own subscriptions',
    category: 'SELF_MANAGEMENT',
    level: 'PERSONAL',
    defaultRoles: ['doctor', 'client'],
    isAssignable: false
  },
  read_own_subscriptions: {
    description: 'Read own subscription information',
    category: 'SELF_MANAGEMENT',
    level: 'PERSONAL',
    defaultRoles: ['doctor', 'client'],
    isAssignable: false
  },
  manage_own_certificates: {
    description: 'Manage own certificates',
    category: 'SELF_MANAGEMENT',
    level: 'PERSONAL',
    defaultRoles: ['doctor'],
    isAssignable: false
  },
  manage_own_packages: {
    description: 'Manage own service packages',
    category: 'SELF_MANAGEMENT',
    level: 'PERSONAL',
    defaultRoles: ['doctor'],
    isAssignable: false
  },
  manage_own_bio: {
    description: 'Manage own biography information',
    category: 'SELF_MANAGEMENT',
    level: 'PERSONAL',
    defaultRoles: ['doctor'],
    isAssignable: false
  },
  update_own_profile: {
    description: 'Update own profile information',
    category: 'SELF_MANAGEMENT',
    level: 'PERSONAL',
    defaultRoles: ['doctor', 'client'],
    isAssignable: false
  },
  manage_own_profile_picture: {
    description: 'Manage own profile picture',
    category: 'SELF_MANAGEMENT',
    level: 'PERSONAL',
    defaultRoles: ['doctor', 'client'],
    isAssignable: false
  },
  read_own_weight: {
    description: 'Read own weight tracking',
    category: 'SELF_MANAGEMENT',
    level: 'PERSONAL',
    defaultRoles: ['doctor', 'client'],
    isAssignable: false
  },

  // CLIENT SELF-MANAGEMENT
  manage_own_weight: {
    description: 'Manage own weight tracking',
    category: 'SELF_MANAGEMENT',
    level: 'PERSONAL',
    defaultRoles: ['client'],
    isAssignable: false
  },
  manage_own_progress: {
    description: 'Manage own progress tracking',
    category: 'SELF_MANAGEMENT',
    level: 'PERSONAL',
    defaultRoles: ['client'],
    isAssignable: false
  },
  view_own_progress: {
    description: 'View own progress tracking',
    category: 'SELF_MANAGEMENT',
    level: 'PERSONAL',
    defaultRoles: ['client'],
    isAssignable: false
  }
};

/**
 * Get all permission definitions
 */
const getAllPermissionDefinitions = () => {
  return PERMISSION_DEFINITIONS;
};

/**
 * Get permissions by category
 */
const getPermissionsByCategory = (category) => {
  return Object.entries(PERMISSION_DEFINITIONS)
    .filter(([_, def]) => def.category === category)
    .map(([name, def]) => ({ name, ...def }));
};

/**
 * Get permissions for a specific role
 */
const getRolePermissions = (role) => {
  return Object.entries(PERMISSION_DEFINITIONS)
    .filter(([_, def]) => def.defaultRoles.includes(role))
    .map(([name]) => name);
};

/**
 * Get all categories
 */
const getAllCategories = () => {
  const categories = [...new Set(
    Object.values(PERMISSION_DEFINITIONS).map(def => def.category)
  )];
  return categories.sort();
};

/**
 * Get permissions by level
 */
const getPermissionsByLevel = (level) => {
  return Object.entries(PERMISSION_DEFINITIONS)
    .filter(([_, def]) => def.level === level)
    .map(([name, def]) => ({ name, ...def }));
};

/**
 * Check if permission exists
 */
const permissionExists = (permissionName) => {
  return PERMISSION_DEFINITIONS.hasOwnProperty(permissionName);
};

/**
 * Get permission definition
 */
const getPermissionDefinition = (permissionName) => {
  return PERMISSION_DEFINITIONS[permissionName] || null;
};

/**
 * Get assignable permissions (can be granted to users)
 */
const getAssignablePermissions = () => {
  return Object.entries(PERMISSION_DEFINITIONS)
    .filter(([_, def]) => def.isAssignable)
    .map(([name, def]) => ({ name, ...def }));
};

module.exports = {
  PERMISSION_DEFINITIONS,
  getAllPermissionDefinitions,
  getPermissionsByCategory,
  getRolePermissions,
  getAllCategories,
  getPermissionsByLevel,
  permissionExists,
  getPermissionDefinition,
  getAssignablePermissions
};
