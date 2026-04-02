const express = require('express');
const router = express.Router();
const dietProgressController = require('../controllers/dietProgressController');
const { authenticate } = require('../middlewares/auth');
const { requirePermission } = require('../middlewares/permissionMiddleware');
const { body, param, query } = require('express-validator');

// Apply authentication middleware to all routes
router.use(authenticate);

/**
 * Mark food as eaten
 * POST /progress/food
 */
router.post('/food',
  requirePermission('manage_client_workout_plans'), // Clients can mark their own food
  [
    body('dietPlanId')
      .isMongoId()
      .withMessage('Invalid diet plan ID'),
    body('dayName')
      .isIn(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'])
      .withMessage('Invalid day name'),
    body('mealType')
      .isIn(['breakfast', 'lunch', 'dinner'])
      .withMessage('Invalid meal type'),
    body('foodName')
      .trim()
      .notEmpty()
      .withMessage('Food name is required')
      .isLength({ max: 100 })
      .withMessage('Food name cannot exceed 100 characters')
  ],
  dietProgressController.markFoodAsEaten.bind(dietProgressController)
);

/**
 * Get daily progress
 * GET /progress/:dietPlanId/day/:dayName
 */
router.get('/:dietPlanId/day/:dayName',
  requirePermission('view_client_workout_plans'),
  [
    param('dietPlanId')
      .isMongoId()
      .withMessage('Invalid diet plan ID'),
    param('dayName')
      .isIn(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'])
      .withMessage('Invalid day name')
  ],
  dietProgressController.getDailyProgress.bind(dietProgressController)
);

/**
 * Get diet progress for a client
 * GET /progress/client/:clientId
 */
router.get('/client/:clientId',
  requirePermission('view_client_workout_plans'),
  [
    param('clientId')
      .isMongoId()
      .withMessage('Invalid client ID')
  ],
  dietProgressController.getDietProgress.bind(dietProgressController)
);

/**
 * Get real-time nutrition tracking
 * GET /progress/:dietPlanId/nutrition
 */
router.get('/:dietPlanId/nutrition',
  requirePermission('view_client_workout_plans'),
  [
    param('dietPlanId')
      .isMongoId()
      .withMessage('Invalid diet plan ID')
  ],
  dietProgressController.getNutritionTracking.bind(dietProgressController)
);

module.exports = router;
