const { body, param, validationResult } = require('express-validator');

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array().map(error => ({
        field: error.path,
        message: error.msg
      }))
    });
  }
  next();
};

// Mark exercise complete validation
const markExerciseComplete = [
  // Workout plan ID validation
  body('workoutPlanId')
    .notEmpty()
    .withMessage('Workout plan ID is required')
    .isMongoId()
    .withMessage('Invalid workout plan ID format'),

  // Day index validation
  body('dayIndex')
    .notEmpty()
    .withMessage('Day index is required')
    .isInt({ min: 0 })
    .withMessage('Day index must be a non-negative integer'),

  // Exercise index validation
  body('exerciseIndex')
    .notEmpty()
    .withMessage('Exercise index is required')
    .isInt({ min: 0 })
    .withMessage('Exercise index must be a non-negative integer'),

  handleValidationErrors
];

// Mark day complete validation
const markDayComplete = [
  // Workout plan ID validation
  body('workoutPlanId')
    .notEmpty()
    .withMessage('Workout plan ID is required')
    .isMongoId()
    .withMessage('Invalid workout plan ID format'),

  // Day index validation
  body('dayIndex')
    .notEmpty()
    .withMessage('Day index is required')
    .isInt({ min: 0 })
    .withMessage('Day index must be a non-negative integer'),

  handleValidationErrors
];

// Get exercise progress validation
const getExerciseProgress = [
  // Workout plan ID validation
  param('workoutPlanId')
    .notEmpty()
    .withMessage('Workout plan ID is required')
    .isMongoId()
    .withMessage('Invalid workout plan ID format'),

  handleValidationErrors
];

// Reset exercise progress validation
const resetExerciseProgress = [
  // Workout plan ID validation
  body('workoutPlanId')
    .notEmpty()
    .withMessage('Workout plan ID is required')
    .isMongoId()
    .withMessage('Invalid workout plan ID format'),

  handleValidationErrors
];

module.exports = {
  markExerciseComplete,
  markDayComplete,
  getExerciseProgress,
  resetExerciseProgress
};
