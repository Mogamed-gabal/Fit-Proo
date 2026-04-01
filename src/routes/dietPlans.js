const express = require('express');
const router = express.Router();
const dietPlanController = require('../controllers/dietPlanController');
const { authenticate } = require('../middlewares/auth');
const { requirePermission } = require('../middlewares/permissionMiddleware');
const { body, param, query } = require('express-validator');

// Apply authentication middleware to all routes
router.use(authenticate);

/**
 * Create a new diet plan for a client
 * POST /api/diet-plans
 */
router.post('/',
  requirePermission('manage_client_workout_plans'),
  [
    body('clientId')
      .isMongoId()
      .withMessage('Invalid client ID'),
    body('name')
      .trim()
      .notEmpty()
      .withMessage('Diet plan name is required')
      .isLength({ max: 100 })
      .withMessage('Diet plan name cannot exceed 100 characters'),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Description cannot exceed 500 characters'),
    body('startDate')
      .isISO8601()
      .withMessage('Start date must be a valid date'),
    body('endDate')
      .isISO8601()
      .withMessage('End date must be a valid date'),
    body('weeklyPlan')
      .isArray({ min: 7, max: 7 })
      .withMessage('Weekly plan must contain exactly 7 days with 3 meals each')
  ],
  dietPlanController.createDietPlan.bind(dietPlanController)
);

/**
 * Get all diet plans for the current doctor
 * GET /api/diet-plans
 */
router.get('/',
  requirePermission('view_client_workout_plans'),
  [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
    query('search')
      .optional()
      .trim()
      .isLength({ max: 100 })
      .withMessage('Search term cannot exceed 100 characters'),
    query('clientId')
      .optional()
      .isMongoId()
      .withMessage('Invalid client ID')
  ],
  dietPlanController.getDoctorDietPlans.bind(dietPlanController)
);

/**
 * Get diet plans for a specific client (doctor's view)
 * GET /api/diet-plans/client/:clientId
 */
router.get('/client/:clientId',
  requirePermission('view_client_workout_plans'),
  [
    param('clientId')
      .isMongoId()
      .withMessage('Invalid client ID'),
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100')
  ],
  dietPlanController.getClientDietPlans.bind(dietPlanController)
);

/**
 * Get active diet plan for a client
 * GET /api/diet-plans/active/:clientId
 */
router.get('/active/:clientId',
  requirePermission('view_client_workout_plans'),
  [
    param('clientId')
      .isMongoId()
      .withMessage('Invalid client ID')
  ],
  dietPlanController.getActiveDietPlan.bind(dietPlanController)
);

/**
 * Get diet plan by ID
 * GET /api/diet-plans/:id
 */
router.get('/:id',
  requirePermission('view_client_workout_plans'),
  [
    param('id')
      .isMongoId()
      .withMessage('Invalid diet plan ID')
  ],
  dietPlanController.getDietPlan.bind(dietPlanController)
);

/**
 * Update an existing diet plan
 * PUT /api/diet-plans/:id
 */
router.put('/:id',
  requirePermission('manage_client_workout_plans'),
  [
    param('id')
      .isMongoId()
      .withMessage('Invalid diet plan ID'),
    body('name')
      .optional()
      .trim()
      .notEmpty()
      .withMessage('Diet plan name cannot be empty')
      .isLength({ max: 100 })
      .withMessage('Diet plan name cannot exceed 100 characters'),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Description cannot exceed 500 characters'),
    body('notes')
      .optional()
      .trim()
      .isLength({ max: 1000 })
      .withMessage('Notes cannot exceed 1000 characters'),
    body('startDate')
      .optional()
      .isISO8601()
      .withMessage('Start date must be a valid date'),
    body('endDate')
      .optional()
      .isISO8601()
      .withMessage('End date must be a valid date'),
    body('difficulty')
      .optional()
      .isIn(['beginner', 'intermediate', 'advanced'])
      .withMessage('Difficulty must be beginner, intermediate, or advanced'),
    body('weeklyPlan')
      .optional()
      .isArray({ min: 7, max: 7 })
      .withMessage('Weekly plan must contain exactly 7 days'),
    body('targetCalories')
      .optional()
      .isInt({ min: 1200, max: 5000 })
      .withMessage('Target calories must be between 1200 and 5000'),
    body('targetMacros.protein')
      .optional()
      .isInt({ min: 50, max: 300 })
      .withMessage('Target protein must be between 50 and 300'),
    body('targetMacros.carbs')
      .optional()
      .isInt({ min: 100, max: 500 })
      .withMessage('Target carbs must be between 100 and 500'),
    body('targetMacros.fat')
      .optional()
      .isInt({ min: 30, max: 150 })
      .withMessage('Target fat must be between 30 and 150')
  ],
  dietPlanController.updateDietPlan.bind(dietPlanController)
);

/**
 * Delete a diet plan
 * DELETE /api/diet-plans/:id
 */
router.delete('/:id',
  requirePermission('manage_client_workout_plans'),
  [
    param('id')
      .isMongoId()
      .withMessage('Invalid diet plan ID')
  ],
  dietPlanController.deleteDietPlan.bind(dietPlanController)
);

module.exports = router;
