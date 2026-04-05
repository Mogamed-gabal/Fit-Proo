/**
 * Central Permission Engine & Middleware
 */

// Define allowed actions for each role
const SUPERVISOR_ALLOWED_ACTIONS = [
  'read_users',
  'read_dashboard',
  'read_subscriptions',
  'block_client',
  'unblock_client',
  'read_user_details',
  'manage_users_limited',
  'manage_supervisors',
  'read_audit_logs'
  
];

const DOCTOR_ALLOWED_ACTIONS = [
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
];

const CLIENT_ALLOWED_ACTIONS = [
  'read_own_profile',
  'manage_own_subscriptions',
  'read_own_subscriptions',
  'manage_own_weight',
  'read_own_weight',
  'update_own_profile',
  'manage_own_profile_picture',
  'manage_own_progress',
  'view_own_progress'
];

/**
 * Role hierarchy levels (higher number = more privileges)
 */
const ROLE_HIERARCHY = {
  client: 1,
  doctor: 2,
  supervisor: 3,
  admin: 4
};

/**
 * Central permission checker
 * @param {Object} user - User object with role
 * @param {string} action - Action to check
 * @returns {boolean} - True if user has permission
 */
const hasPermission = (user, action) => {
  if (!user || !user.role) {
    return false;
  }

  const { role } = user;

  // Admin has full access to all actions
  if (role === 'admin') {
    return true;
  }

  // Supervisor has limited access
  if (role === 'supervisor') {
    return SUPERVISOR_ALLOWED_ACTIONS.includes(action);
  }

  // Doctor has limited access
  if (role === 'doctor') {
    return DOCTOR_ALLOWED_ACTIONS.includes(action);
  }

  // Client has limited access
  if (role === 'client') {
    return CLIENT_ALLOWED_ACTIONS.includes(action);
  }

  return false;
};

/**
 * Check if user can perform admin-specific actions
 * @param {Object} user - User object with role
 * @param {string} action - Action to check
 * @returns {boolean} - True if user has admin permission
 */
const hasAdminPermission = (user, action) => {
  if (!user || !user.role) {
    return false;
  }

  // Only admin can perform admin-specific actions
  if (user.role === 'admin') {
    return true;
  }

  return false;
};

/**
 * Check if user role has higher privilege than target role
 * @param {string} userRole - User's role
 * @param {string} targetRole - Target role to compare
 * @returns {boolean} - True if user has higher privilege
 */
const hasHigherPrivilege = (userRole, targetRole) => {
  return ROLE_HIERARCHY[userRole] > ROLE_HIERARCHY[targetRole];
};

/**
 * Check if user role has higher or equal privilege than target role
 * @param {string} userRole - User's role
 * @param {string} targetRole - Target role to compare
 * @returns {boolean} - True if user has higher or equal privilege
 */
const hasHigherOrEqualPrivilege = (userRole, targetRole) => {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[targetRole];
};

/**
 * Middleware wrapper for permission checking
 * @param {string} action - Required action
 * @returns {Function} Express middleware
 */
const requirePermission = (action) => {
  return (req, res, next) => {
    // Check if user is authenticated
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    // Special handling for view_client_workout_plans
    if (action === 'view_client_workout_plans') {
      // Allow admin and doctor based on existing permissions
      if (req.user.role === 'admin' || req.user.role === 'doctor') {
        return next();
      }
      
      // Allow client to access their own workout plans
      if (req.user.role === 'client') {
        const clientId = req.params.clientId;
        const dietPlanId = req.params.dietPlanId;
        
        // For workout plan endpoints
        if (clientId && clientId === req.user.userId.toString()) {
          return next();
        }
        
        // For diet plan endpoints - client can access their own diet plans
        if (dietPlanId) {
          return next(); // Controller will validate ownership
        }
        
        // Client trying to access other client's data
        return res.status(403).json({
          success: false,
          error: 'Access denied. You can only view your own data.'
        });
      }
      
      // If we reach here, it means access was not allowed
      return res.status(403).json({
        success: false,
        error: 'Access denied. You can only view your own data.'
      });
    }

    // Special handling for manage_client_workout_plans (diet progress)
    if (action === 'manage_client_workout_plans') {
      // Allow admin and doctor based on existing permissions
      if (req.user.role === 'admin' || req.user.role === 'doctor') {
        return next();
      }
      
      // Allow client to manage their own diet progress
      if (req.user.role === 'client') {
        return next(); // Client can manage their own diet progress
      }
      
      // If we reach here, it means access was not allowed
      return res.status(403).json({
        success: false,
        error: 'Access denied. You can only manage your own diet progress.'
      });
    }

    // Check if user has permission for the action
    if (!hasPermission(req.user, action)) {
      return res.status(403).json({
        success: false,
        error: `Insufficient permissions for action: ${action}`
      });
    }

    next();
  };
};

/**
 * Middleware to prevent privilege escalation
 * Checks if current user can manage target user based on role hierarchy
 * @param {string} targetUserIdParam - Parameter name for target user ID (default: 'userId')
 * @returns {Function} Express middleware
 */
const preventPrivilegeEscalation = (targetUserIdParam = 'userId') => {
  return async (req, res, next) => {
    try {
      // Check if user is authenticated
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
      }

      const targetUserId = req.params[targetUserIdParam];
      if (!targetUserId) {
        return res.status(400).json({
          success: false,
          error: 'Target user ID required'
        });
      }

      // Get target user from database
      const User = require('../models/User');
      const targetUser = await User.findById(targetUserId);

      if (!targetUser) {
        return res.status(404).json({
          success: false,
          error: 'Target user not found'
        });
      }

      const currentUserRole = req.user.role;
      const targetUserRole = targetUser.role;

      // Prevent self-modification of role
      if (req.user.userId === targetUserId && req.body.role) {
        return res.status(403).json({
          success: false,
          error: 'Cannot modify your own role'
        });
      }

      // Role hierarchy validation
      if (!hasHigherOrEqualPrivilege(currentUserRole, targetUserRole)) {
        return res.status(403).json({
          success: false,
          error: 'Cannot modify user with higher privilege'
        });
      }

      // Supervisor cannot modify admin or supervisor
      if (currentUserRole === 'supervisor') {
        if (targetUserRole === 'admin' || targetUserRole === 'supervisor') {
          return res.status(403).json({
            success: false,
            error: 'Supervisor cannot modify admin or supervisor accounts'
          });
        }
      }

      // Nobody can modify admin except admin
      if (targetUserRole === 'admin' && currentUserRole !== 'admin') {
        return res.status(403).json({
          success: false,
          error: 'Only admin can modify admin accounts'
        });
      }

      // Add target user to request for use in controller
      req.targetUser = targetUser;
      next();

    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Error checking user permissions'
      });
    }
  };
};

/**
 * Middleware to check if user can manage target user based on role
 * @param {string} targetUserIdParam - Parameter name for target user ID
 * @returns {Function} Express middleware
 */
const canManageUser = (targetUserIdParam = 'userId') => {
  return async (req, res, next) => {
    try {
      const targetUserId = req.params[targetUserIdParam];
      if (!targetUserId) {
        return res.status(400).json({
          success: false,
          error: 'Target user ID required'
        });
      }

      // Get target user from database
      const User = require('../models/User');
      const targetUser = await User.findById(targetUserId);

      if (!targetUser) {
        return res.status(404).json({
          success: false,
          error: 'Target user not found'
        });
      }

      const currentUserRole = req.user.role;
      const targetUserRole = targetUser.role;

      // Role hierarchy validation
      if (!hasHigherOrEqualPrivilege(currentUserRole, targetUserRole)) {
        return res.status(403).json({
          success: false,
          error: 'Cannot manage user with higher privilege'
        });
      }

      // Admin can manage everyone except themselves for role changes
      if (currentUserRole === 'admin') {
        if (req.user.userId === targetUserId && req.body.role) {
          return res.status(403).json({
            success: false,
            error: 'Admin cannot modify their own role'
          });
        }
        req.targetUser = targetUser;
        next();
        return;
      }

      // Supervisor can only manage client and doctor
      if (currentUserRole === 'supervisor') {
        if (targetUserRole === 'client' || targetUserRole === 'doctor') {
          req.targetUser = targetUser;
          next();
          return;
        } else {
          return res.status(403).json({
            success: false,
            error: 'Supervisor can only manage client and doctor accounts'
          });
        }
      }

      // Other roles cannot manage users
      return res.status(403).json({
        success: false,
        error: 'Insufficient privileges to manage users'
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Error checking user management permissions'
      });
    }
  };
};

module.exports = {
  hasPermission,
  hasAdminPermission,
  hasHigherPrivilege,
  hasHigherOrEqualPrivilege,
  requirePermission,
  preventPrivilegeEscalation,
  canManageUser,
  SUPERVISOR_ALLOWED_ACTIONS,
  DOCTOR_ALLOWED_ACTIONS,
  CLIENT_ALLOWED_ACTIONS,
  ROLE_HIERARCHY
};
