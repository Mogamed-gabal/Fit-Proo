const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticate } = require('../middlewares/auth');
const { 
  requirePermission, 
  canManageUser, 
  preventPrivilegeEscalation 
} = require('../middlewares/permissionMiddleware');
const { 
  auditSoftDeleteUser, 
  auditBlockUser, 
  auditUnblockUser, 
  auditCreateSupervisor, 
  auditDeleteSupervisor 
} = require('../middlewares/auditMiddleware');

// Apply authentication to all admin routes
router.use(authenticate);

// Dashboard
router.get('/dashboard', requirePermission('read_dashboard'), (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Dashboard access granted',
    data: {
      userRole: req.user.role,
      permissions: 'dashboard_access'
    }
  });
});

// Get all users
router.get('/users',
   requirePermission('read_users'),
    adminController.getAllUsers);

// Get user by ID
router.get('/users/:userId', 
  requirePermission('read_user_details'),
  canManageUser('userId'),
  adminController.getUserById
);

// Block user
router.post('/users/:userId/block', 
  requirePermission('block_client'),
  canManageUser('userId'),
  auditBlockUser,
  adminController.blockUser
);

// Unblock user
router.post('/users/:userId/unblock', 
  requirePermission('unblock_client'),
  canManageUser('userId'),
  auditUnblockUser,
  adminController.unblockUser
);

// Soft delete user
router.delete('/users/:userId', 
  requirePermission('delete_user'),
  canManageUser('userId'),
  preventPrivilegeEscalation('userId'),
  auditSoftDeleteUser,
  adminController.softDeleteUser
);

// Create supervisor
router.post('/supervisors', 
  requirePermission('manage_supervisors'),
  auditCreateSupervisor,
  adminController.createSupervisor
);

// Delete supervisor
router.delete('/supervisors/:userId', 
  requirePermission('manage_supervisors'),
  canManageUser('userId'),
  preventPrivilegeEscalation('userId'),
  auditDeleteSupervisor,
  adminController.deleteSupervisor
);
router.get('/supervisors',requirePermission('read_supervisors'),adminController.getAllSupervisors);

router.get('/blocked-users',requirePermission('read_users'),adminController.getBlockedUsers);
module.exports = router;
