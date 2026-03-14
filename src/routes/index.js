const express = require('express');
const router = express.Router();
const authRoutes = require('./auth');
const subscriptionRoutes = require('./subscription');
const profileRoutes = require('./profile');
const adminRoutes = require('./admin');
const auditRoutes = require('./audit');

router.use('/auth', authRoutes);
router.use('/subscription', subscriptionRoutes);
router.use('/profile', profileRoutes);
router.use('/admin', adminRoutes);
router.use('/audit', auditRoutes);

module.exports = router;
