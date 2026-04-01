const express = require('express');
const router = express.Router();
const dietProgressController = require('../controllers/dietProgressController');
const { authenticate } = require('../middlewares/auth');
const { requirePermission } = require('../middlewares/permissionMiddleware');
const { param } = require('express-validator');

// Apply authentication middleware to all routes
router.use(authenticate);

/**
 * Get chart data for diet plan
 * GET /diet-plans/:id/stats
 */
router.get('/:id/stats',
  requirePermission('view_client_workout_plans'),
  [
    param('id')
      .isMongoId()
      .withMessage('Invalid diet plan ID')
  ],
  dietProgressController.getDietPlanStats.bind(dietProgressController)
);

module.exports = router;
