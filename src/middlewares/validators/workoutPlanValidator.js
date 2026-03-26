/**
 * Workout Plan Validation Middleware
 * Validates workout plan creation and updates
 */

const { body, param, validationResult } = require('express-validator');
const mongoose = require('mongoose');

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

// Create workout plan validation
const createWorkoutPlan = [
  // Client ID validation
  body('clientId')
    .notEmpty()
    .withMessage('Client ID is required')
    .isMongoId()
    .withMessage('Invalid client ID format'),

  // Plan details validation
  body('name')
    .notEmpty()
    .withMessage('Workout plan name is required')
    .isLength({ min: 3, max: 100 })
    .withMessage('Workout plan name must be between 3 and 100 characters')
    .trim(),

  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters')
    .trim(),

  // Date validation
  body('startDate')
    .notEmpty()
    .withMessage('Start date is required')
    .isISO8601()
    .withMessage('Start date must be a valid date')
    .custom((value, { req }) => {
      const startDate = new Date(value);
      const today = new Date();
      if (startDate < today) {
        throw new Error('Start date cannot be in the past');
      }
      return true;
    }),

  body('endDate')
    .notEmpty()
    .withMessage('End date is required')
    .isISO8601()
    .withMessage('End date must be a valid date')
    .custom((value, { req }) => {
      const startDate = new Date(req.body.startDate);
      const endDate = new Date(value);
      if (endDate <= startDate) {
        throw new Error('End date must be after start date');
      }
      return true;
    }),

  // Plan metadata validation
  body('difficulty')
    .optional()
    .isIn(['beginner', 'intermediate', 'advanced'])
    .withMessage('Difficulty must be beginner, intermediate, or advanced'),

  body('durationWeeks')
    .optional()
    .isInt({ min: 1, max: 52 })
    .withMessage('Duration must be between 1 and 52 weeks'),

  // Exercises validation
  body('exercises')
    .isArray({ min: 1 })
    .withMessage('At least one exercise is required')
    .custom((exercises) => {
      for (const exercise of exercises) {
        if (!exercise.name || typeof exercise.name !== 'string') {
          throw new Error('Each exercise must have a name');
        }
        if (!exercise.muscle || typeof exercise.muscle !== 'string') {
          throw new Error('Each exercise must have a muscle group');
        }
        if (!exercise.sets || typeof exercise.sets !== 'number' || exercise.sets < 1) {
          throw new Error('Each exercise must have at least 1 set');
        }
        if (!exercise.reps || typeof exercise.reps !== 'number' || exercise.reps < 1) {
          throw new Error('Each exercise must have at least 1 rep');
        }
        if (exercise.rest !== undefined && (typeof exercise.rest !== 'number' || exercise.rest < 0)) {
          throw new Error('Exercise rest time must be a non-negative number');
        }
      }
      return true;
    }),

  handleValidationErrors
];

// Update workout plan validation
const updateWorkoutPlan = [
  // Plan ID validation
  param('planId')
    .isMongoId()
    .withMessage('Invalid workout plan ID format'),

  // Optional updates (same as create but all optional)
  body('name')
    .optional()
    .isLength({ min: 3, max: 100 })
    .withMessage('Workout plan name must be between 3 and 100 characters')
    .trim(),

  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters')
    .trim(),

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

  body('durationWeeks')
    .optional()
    .isInt({ min: 1, max: 52 })
    .withMessage('Duration must be between 1 and 52 weeks'),

  body('exercises')
    .optional()
    .isArray()
    .custom((exercises) => {
      for (const exercise of exercises) {
        if (exercise.name && typeof exercise.name !== 'string') {
          throw new Error('Each exercise must have a valid name');
        }
        if (exercise.muscle && typeof exercise.muscle !== 'string') {
          throw new Error('Each exercise must have a valid muscle group');
        }
        if (exercise.sets !== undefined && (typeof exercise.sets !== 'number' || exercise.sets < 1)) {
          throw new Error('Each exercise must have at least 1 set');
        }
        if (exercise.reps !== undefined && (typeof exercise.reps !== 'number' || exercise.reps < 1)) {
          throw new Error('Each exercise must have at least 1 rep');
        }
        if (exercise.rest !== undefined && (typeof exercise.rest !== 'number' || exercise.rest < 0)) {
          throw new Error('Exercise rest time must be a non-negative number');
        }
      }
      return true;
    }),

  handleValidationErrors
];

// Reuse workout plan validation
const reuseWorkoutPlan = [
  // Client ID validation
  body('clientId')
    .notEmpty()
    .withMessage('Client ID is required')
    .isMongoId()
    .withMessage('Invalid client ID format'),

  // Original plan ID validation
  body('originalPlanId')
    .notEmpty()
    .withMessage('Original plan ID is required')
    .isMongoId()
    .withMessage('Invalid original plan ID format'),

  // New dates validation
  body('newStartDate')
    .notEmpty()
    .withMessage('New start date is required')
    .isISO8601()
    .withMessage('New start date must be a valid date')
    .custom((value, { req }) => {
      const startDate = new Date(value);
      const today = new Date();
      if (startDate < today) {
        throw new Error('New start date cannot be in the past');
      }
      return true;
    }),

  body('newEndDate')
    .notEmpty()
    .withMessage('New end date is required')
    .isISO8601()
    .withMessage('New end date must be a valid date')
    .custom((value, { req }) => {
      const startDate = new Date(req.body.newStartDate);
      const endDate = new Date(value);
      if (endDate <= startDate) {
        throw new Error('New end date must be after new start date');
      }
      return true;
    }),

  handleValidationErrors
];

// Progress validation
const completeExercise = [
  // Workout plan ID validation
  body('workoutPlanId')
    .notEmpty()
    .withMessage('Workout plan ID is required')
    .isMongoId()
    .withMessage('Invalid workout plan ID format'),

  // Exercise validation
  body('exerciseId')
    .notEmpty()
    .withMessage('Exercise ID is required')
    .trim(),

  body('exerciseName')
    .notEmpty()
    .withMessage('Exercise name is required')
    .isLength({ min: 1, max: 100 })
    .withMessage('Exercise name must be between 1 and 100 characters')
    .trim(),

  body('notes')
    .optional()
    .isLength({ max: 200 })
    .withMessage('Notes cannot exceed 200 characters')
    .trim(),

  handleValidationErrors
];

const completeDay = [
  // Workout plan ID validation
  body('workoutPlanId')
    .notEmpty()
    .withMessage('Workout plan ID is required')
    .isMongoId()
    .withMessage('Invalid workout plan ID format'),

  // Date validation
  body('date')
    .notEmpty()
    .withMessage('Date is required')
    .isISO8601()
    .withMessage('Date must be a valid date')
    .trim(),

  body('notes')
    .optional()
    .isLength({ max: 200 })
    .withMessage('Notes cannot exceed 200 characters')
    .trim(),

  handleValidationErrors
];

const updateProgressStatus = [
  // Workout plan ID validation
  body('workoutPlanId')
    .notEmpty()
    .withMessage('Workout plan ID is required')
    .isMongoId()
    .withMessage('Invalid workout plan ID format'),

  // Status validation
  body('status')
    .notEmpty()
    .withMessage('Status is required')
    .isIn(['in_progress', 'completed', 'paused'])
    .withMessage('Status must be in_progress, completed, or paused'),

  handleValidationErrors
];

// Client ID validation for params  ← تم تعديله
const clientId = [
  param('clientId')
    .isMongoId()
    .withMessage('Invalid client ID format'),
  handleValidationErrors
];

// Workout plan ID validation for params  ← تم تعديله
const workoutPlanId = [
  param('workoutPlanId')
    .isMongoId()
    .withMessage('Invalid workout plan ID format'),
  handleValidationErrors
];

// Get client progress validation  ← تم تعديله
const getClientProgress = [
  param('clientId')
    .isMongoId()
    .withMessage('Invalid client ID format'),
  handleValidationErrors
];

module.exports = {
  createWorkoutPlan,
  updateWorkoutPlan,
  reuseWorkoutPlan,
  completeExercise,
  completeDay,
  updateProgressStatus,
  getClientProgress: getClientProgress,   // تم تصليحه
  workoutPlanId,                          // تم تصليحه
  clientId                                // تم تصليحه (تمت إضافته)
};