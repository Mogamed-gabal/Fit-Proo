const express = require('express');
const router = express.Router();
const subscriptionController = require('../controllers/subscriptionController');
const { authenticate } = require('../middlewares/auth');
const { requirePermission } = require('../middlewares/permissionMiddleware');

// Apply authentication to all subscription routes
router.use(authenticate);

// Create subscription (client only)
router.post('/', requirePermission('manage_own_subscriptions'), subscriptionController.createSubscription.bind(subscriptionController));

// Confirm payment (client only)
router.post('/:subscriptionId/confirm-payment', requirePermission('manage_own_subscriptions'), subscriptionController.confirmPayment.bind(subscriptionController));

// Fail payment (client only)
router.post('/:subscriptionId/fail-payment', requirePermission('manage_own_subscriptions'), subscriptionController.failPayment.bind(subscriptionController));

// Get user subscriptions (client/doctor/admin/supervisor)
router.get('/my-subscriptions', requirePermission('read_subscriptions'), subscriptionController.getClientSubscriptions.bind(subscriptionController));

// Get doctor subscriptions (client/doctor/admin/supervisor)
router.get('/doctor-subscriptions', requirePermission('read_subscriptions'), subscriptionController.getDoctorSubscriptions.bind(subscriptionController));

// Cancel subscription (client only)
router.delete('/:subscriptionId', requirePermission('manage_own_subscriptions'), subscriptionController.cancelSubscription.bind(subscriptionController));

module.exports = router;
