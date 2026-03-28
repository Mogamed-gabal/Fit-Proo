/**
 * Workout Plans Routes
 * Handles all workout plan related endpoints
 */

const express = require('express');
const router = express.Router();
const workoutPlanController = require('../controllers/workoutPlanController');
const clientProgressController = require('../controllers/clientProgressController');
const { authenticate } = require('../middlewares/auth');
const { requirePermission } = require('../middlewares/permissionMiddleware');
const { sanitizeInputs } = require('../middlewares/validators/authValidator');
const { 
  createWorkoutPlan,
  updateWorkoutPlan,
  reuseWorkoutPlan,
  completeExercise,
  completeDay,
  updateProgressStatus,
  clientId,
  workoutPlanId,
  getWorkoutPlanById
} = require('../middlewares/validators/workoutPlanValidator');

// Apply authentication to all routes
router.use(authenticate);

// Apply global sanitization
router.use(sanitizeInputs);

// DOCTOR ROUTES

/**
 * Create a new workout plan for a client
 */
router.post('/plans', 
  requirePermission('manage_client_workout_plans'),
  createWorkoutPlan,
  workoutPlanController.createWorkoutPlan.bind(workoutPlanController)
);

/**
 * Update an existing workout plan
 */
router.put('/plans/:planId', 
  requirePermission('manage_client_workout_plans'),
  updateWorkoutPlan,   // ده بالفعل فيه param('planId') داخل الـ array
  workoutPlanController.updateWorkoutPlan.bind(workoutPlanController)
);

/**
 * Get workout plans for a specific client
 */
router.get('/plans/client/:clientId', 
  requirePermission('view_client_workout_plans'),
  clientId,
  workoutPlanController.getClientWorkoutPlans.bind(workoutPlanController)
);

/**
 * Get active workout plan for a client
 */
router.get('/plans/client/:clientId/active', 
  requirePermission('view_client_workout_plans'),
  clientId,
  workoutPlanController.getActiveWorkoutPlan.bind(workoutPlanController)
);

/**
 * Get workout plan history for a client
 */
router.get('/plans/client/:clientId/history', 
  requirePermission('view_client_workout_plans'),
  clientId,
  workoutPlanController.getClientWorkoutHistory.bind(workoutPlanController)
);

/**
 * Reuse an existing workout plan
 */
router.post('/plans/reuse', 
  requirePermission('manage_client_workout_plans'),
  reuseWorkoutPlan,
  workoutPlanController.reuseWorkoutPlan.bind(workoutPlanController)
);

/**
 * Get workout plan by ID (for viewing details)
 */
router.get('/plans/:planId', 
  requirePermission('view_client_workout_plans'),
  getWorkoutPlanById,
  workoutPlanController.getWorkoutPlanById.bind(workoutPlanController)
);

/**
 * Deactivate a workout plan
 */
router.put('/plans/:planId/deactivate', 
  requirePermission('manage_client_workout_plans'),
  workoutPlanId,   // هيشتغل دلوقتي
  workoutPlanController.deactivateWorkoutPlan.bind(workoutPlanController)
);

/**
 * Delete a workout plan
 */
router.delete('/plans/:planId', 
  requirePermission('manage_client_workout_plans'),
  workoutPlanId,   // هيشتغل دلوقتي
  workoutPlanController.deleteWorkoutPlan.bind(workoutPlanController)
);

// CLIENT PROGRESS ROUTES

/**
 * Mark an exercise as completed
 */
router.post('/progress/exercise', 
  requirePermission('manage_own_progress'),
  completeExercise,
  clientProgressController.completeExercise.bind(clientProgressController)
);

/**
 * Mark a day as completed
 */
router.post('/progress/day', 
  requirePermission('manage_own_progress'),
  completeDay,
  clientProgressController.completeDay.bind(clientProgressController)
);

/**
 * Get progress for a specific workout plan
 */
router.get('/progress/:workoutPlanId', 
  requirePermission('view_own_progress'),
  workoutPlanId,
  clientProgressController.getProgress.bind(clientProgressController)
);

/**
 * Get all progress for a client (doctor view)
 */
router.get('/progress/client/:clientId', 
  requirePermission('view_client_progress'),
  clientId,
  clientProgressController.getClientProgress.bind(clientProgressController)
);

/**
 * Update progress status
 */
router.put('/progress/:workoutPlanId/status', 
  requirePermission('manage_own_progress'),
  updateProgressStatus,   // ده body مش param، فهو شغال أصلاً
  clientProgressController.updateProgressStatus.bind(clientProgressController)
);

module.exports = router;