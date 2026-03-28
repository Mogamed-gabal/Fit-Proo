const express = require('express');
const router = express.Router();
const authRoutes = require('./auth');
const subscriptionRoutes = require('./subscription');
const profileRoutes = require('./profile');
const adminRoutes = require('./admin');
const auditRoutes = require('./audit');
const workoutPlanRoutes = require('./workoutPlans');
const workoutTemplateRoutes = require('./workoutTemplates');
const notificationRoutes = require('./notifications');

router.use('/auth', authRoutes);
router.use('/subscription', subscriptionRoutes);
router.use('/profile', profileRoutes);
router.use('/admin', adminRoutes);
router.use('/audit', auditRoutes);
router.use('/workout-plans', workoutPlanRoutes);
router.use('/workout-templates', workoutTemplateRoutes);
router.use('/notifications', notificationRoutes);

module.exports = router;
