const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profileController');
const { authenticate } = require('../middlewares/auth');
const { requirePermission } = require('../middlewares/permissionMiddleware');

// Apply authentication to all profile routes
router.use(authenticate);

// Add weight entry (client only)
router.post('/weight', requirePermission('manage_own_weight'), profileController.addWeightEntry.bind(profileController));

// Get weight history (client only)
router.get('/weight', requirePermission('read_own_weight'), profileController.getWeightHistory.bind(profileController));

// Get profile (client/doctor/admin/supervisor)
router.get('/', requirePermission('read_own_profile'), profileController.getProfile.bind(profileController));

// Update profile (client/doctor/admin/supervisor)
router.put('/', requirePermission('read_own_profile'), profileController.updateProfile.bind(profileController));

module.exports = router;
