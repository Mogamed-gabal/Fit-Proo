/**
 * Administrative Role Helper Functions
 */

/**
 * Check if a role is administrative (admin or supervisor)
 * @param {string} role - User role
 * @returns {boolean} - True if role is administrative
 */
const isAdministrativeRole = (role) => {
  return role === 'admin' || role === 'supervisor';
};

/**
 * Check if a role can be managed by admin
 * @param {string} targetRole - Role of the user to be managed
 * @returns {boolean} - True if admin can manage this role
 */
const canBeManagedByAdmin = (targetRole) => {
  return targetRole === 'client' || targetRole === 'doctor' || targetRole === 'supervisor';
};

/**
 * Check if a role can be managed by supervisor
 * @param {string} targetRole - Role of the user to be managed
 * @returns {boolean} - True if supervisor can manage this role
 */
const canBeManagedBySupervisor = (targetRole) => {
  return targetRole === 'client' || targetRole === 'doctor';
};

/**
 * Check if role has full system access
 * @param {string} role - User role
 * @returns {boolean} - True if role has full access
 */
const hasFullAccess = (role) => {
  return role === 'admin';
};

/**
 * Check if role has read-only access
 * @param {string} role - User role
 * @returns {boolean} - True if role has read-only access
 */
const hasReadOnlyAccess = (role) => {
  return role === 'supervisor';
};

/**
 * Centralized permission checker
 * @param {Object} user - User object with role
 * @param {string} action - Action to check
 * @returns {boolean} - True if user has permission
 */
const hasPermission = (user, action) => {
  const { role } = user;
  
  // Admin has full access
  if (role === 'admin') {
    return true;
  }
  
  // Supervisor permissions
  if (role === 'supervisor') {
    switch (action) {
      case 'read_dashboard':
      case 'read_users':
      case 'read_subscriptions':
        return true;
      case 'manage_users_limited':
        return true;
      case 'delete_admin':
      case 'modify_roles':
      case 'access_system_settings':
        return false;
      default:
        return false;
    }
  }
  
  // Doctor permissions
  if (role === 'doctor') {
    switch (action) {
      case 'read_own_profile':
      case 'manage_own_subscriptions':
        return true;
      default:
        return false;
    }
  }
  
  // Client permissions
  if (role === 'client') {
    switch (action) {
      case 'read_own_profile':
      case 'manage_own_subscriptions':
      case 'manage_own_weight':
        return true;
      default:
        return false;
    }
  }
  
  return false;
};

/**
 * Role hierarchy levels (higher number = more privileges)
 */
const roleHierarchy = {
  client: 1,
  doctor: 2,
  supervisor: 3,
  admin: 4
};

/**
 * Check if user role has higher or equal privilege than target role
 * @param {string} userRole - User's role
 * @param {string} targetRole - Target role to compare
 * @returns {boolean} - True if user has higher or equal privilege
 */
const hasHigherOrEqualPrivilege = (userRole, targetRole) => {
  return roleHierarchy[userRole] >= roleHierarchy[targetRole];
};

module.exports = {
  isAdministrativeRole,
  canBeManagedByAdmin,
  canBeManagedBySupervisor,
  hasFullAccess,
  hasReadOnlyAccess,
  hasPermission,
  hasHigherOrEqualPrivilege,
  roleHierarchy
};
