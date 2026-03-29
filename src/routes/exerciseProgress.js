const express = require('express');
const router = express.Router();

// Import middleware
const auth = require('../middlewares/auth');
const exerciseProgressValidator = require('../middlewares/validators/exerciseProgressValidator');

// Import controllers
const exerciseProgressController = require('../controllers/exerciseProgressController');

/**
 * @route   POST /api/exercise-progress/complete-exercise
 * @desc    Mark a specific exercise as complete
 * @access  Private (Client only)
 */
router.post(
  '/complete-exercise',
  auth.authenticate,
  auth.authorize('client'),
  exerciseProgressValidator.markExerciseComplete,
  exerciseProgressController.markExerciseComplete
);

/**
 * @route   POST /api/exercise-progress/complete-day
 * @desc    Mark all exercises in a day as complete
 * @access  Private (Client only)
 */
router.post(
  '/complete-day',
  auth.authenticate,
  auth.authorize('client'),
  exerciseProgressValidator.markDayComplete,
  exerciseProgressController.markDayComplete
);

/**
 * @route   GET /api/exercise-progress/:workoutPlanId
 * @desc    Get exercise progress for a workout plan
 * @access  Private (Client only)
 */
router.get(
  '/:workoutPlanId',
  auth.authenticate,
  auth.authorize('client'),
  exerciseProgressValidator.getExerciseProgress,
  exerciseProgressController.getExerciseProgress
);

/**
 * @route   POST /api/exercise-progress/reset
 * @desc    Reset exercise progress (for testing/admin)
 * @access  Private (Client only)
 */
router.post(
  '/reset',
  auth.authenticate,
  auth.authorize('client'),
  exerciseProgressValidator.resetExerciseProgress,
  exerciseProgressController.resetExerciseProgress
);

module.exports = router;
