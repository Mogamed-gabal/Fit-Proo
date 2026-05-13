const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { authenticate } = require('../middlewares/auth');
const { requirePermission } = require('../middlewares/permissionMiddleware');
const { query } = require('express-validator');

// Apply authentication to all routes
router.use(authenticate);

/**
 * Get complete dashboard analytics
 * GET /api/dashboard/analytics
 */
router.get('/analytics',
  requirePermission('view_dashboard_analytics'),
  [
    query('period')
      .optional()
      .isIn(['7d', '30d', '90d', '1y'])
      .withMessage('Period must be 7d, 30d, 90d, or 1y'),
    query('startDate')
      .optional()
      .isISO8601()
      .withMessage('Start date must be a valid date'),
    query('endDate')
      .optional()
      .isISO8601()
      .withMessage('End date must be a valid date')
  ],
  dashboardController.getDashboardAnalytics.bind(dashboardController)
);

/**
 * Get users distribution
 * GET /api/dashboard/users-distribution
 */
router.get('/users-distribution',
  requirePermission('view_dashboard_analytics'),
  dashboardController.getUsersDistribution.bind(dashboardController)
);

/**
 * Get subscriptions growth
 * GET /api/dashboard/subscriptions-growth
 */
router.get('/subscriptions-growth',
  requirePermission('view_dashboard_analytics'),
  [
    query('period')
      .optional()
      .isIn(['7d', '30d', '90d', '1y'])
      .withMessage('Period must be 7d, 30d, 90d, or 1y')
  ],
  dashboardController.getSubscriptionsGrowth.bind(dashboardController)
);

/**
 * Get diet vs workout usage
 * GET /api/dashboard/feature-usage
 */
router.get('/feature-usage',
  requirePermission('view_dashboard_analytics'),
  [
    query('period')
      .optional()
      .isIn(['7d', '30d', '90d', '1y'])
      .withMessage('Period must be 7d, 30d, 90d, or 1y')
  ],
  dashboardController.getFeatureUsage.bind(dashboardController)
);

/**
 * Get activity trends
 * GET /api/dashboard/activity-trends
 */
router.get('/activity-trends',
  requirePermission('view_dashboard_analytics'),
  [
    query('period')
      .optional()
      .isIn(['7d', '30d', '90d'])
      .withMessage('Period must be 7d, 30d, or 90d')
  ],
  dashboardController.getActivityTrends.bind(dashboardController)
);

/**
 * Get total users count
 * GET /api/dashboard/total-users
 */
router.get('/total-users',
  requirePermission('view_dashboard_analytics'),
  dashboardController.getTotalUsers.bind(dashboardController)
);

/**
 * Get top doctors
 * GET /api/dashboard/top-doctors
 */
router.get('/top-doctors',
  requirePermission('view_dashboard_analytics'),
  [
    query('period')
      .optional()
      .isIn(['7d', '30d', '90d'])
      .withMessage('Period must be 7d, 30d, or 90d'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 50 })
      .withMessage('Limit must be between 1 and 50')
  ],
  dashboardController.getTopDoctors.bind(dashboardController)
);

module.exports = router;
