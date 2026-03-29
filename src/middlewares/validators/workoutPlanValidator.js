/**
 * Workout Plan Validation Middleware
 * Validates workout plan creation and updates
 */

const { body, param, validationResult } = require('express-validator');
const mongoose = require('mongoose');

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // ✅ Debug logging
    console.log('🔍 Validation errors:', JSON.stringify(errors.array(), null, 2));
    console.log('🔍 Request body:', JSON.stringify(req.body, null, 2));
    
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

  body('notes')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Notes cannot exceed 1000 characters')
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

  // Duration is fixed to 7 days per week, no need to validate
  // body('durationWeeks') - removed as it's now fixed

  // Exercises validation - updated for weekly plan structure
  body('weeklyPlan')
    .isArray({ min: 1 })
    .withMessage('Weekly plan must be an array with at least one day')
    .custom((weeklyPlan) => {
      // ✅ Add safety checks
      if (!weeklyPlan || !Array.isArray(weeklyPlan)) {
        throw new Error('Weekly plan must be a valid array');
      }

      for (let i = 0; i < weeklyPlan.length; i++) {
        const dayPlan = weeklyPlan[i];
        
        if (!dayPlan || typeof dayPlan !== 'object') {
          throw new Error(`Day ${i + 1} must be a valid object`);
        }

        if (!dayPlan.dayName || !['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].includes(dayPlan.dayName)) {
          throw new Error('Invalid day name in weekly plan');
        }

        if (!dayPlan.dailyPlanName || typeof dayPlan.dailyPlanName !== 'string') {
          throw new Error('Each day must have a daily plan name');
        }

        if (!dayPlan.bodyParts || !Array.isArray(dayPlan.bodyParts) || dayPlan.bodyParts.length === 0) {
          throw new Error('Each day must have at least one body part');
        }

        if (!dayPlan.muscles || !Array.isArray(dayPlan.muscles) || dayPlan.muscles.length === 0) {
          throw new Error('Each day must have at least one muscle');
        }

        // ✅ Better exercises validation
        if (!dayPlan.exercises) {
          throw new Error('Each day must have exercises');
        }

        if (!Array.isArray(dayPlan.exercises)) {
          throw new Error('Exercises must be an array');
        }

        if (dayPlan.exercises.length === 0) {
          throw new Error('Each day must have at least one exercise');
        }
        
        // Validate each exercise in the day
        for (let j = 0; j < dayPlan.exercises.length; j++) {
          const exercise = dayPlan.exercises[j];
          
          if (!exercise || typeof exercise !== 'object') {
            throw new Error(`Exercise ${j + 1} in day ${i + 1} must be a valid object`);
          }

          if (!exercise.name || typeof exercise.name !== 'string') {
            throw new Error('Each exercise must have a name');
          }

          if (!exercise.gifUrl || typeof exercise.gifUrl !== 'string') {
            throw new Error('Each exercise must have a GIF URL');
          }

          if (!exercise.equipment || !['dumbbells', 'barbell', 'machine', 'cable', 'bodyweight', 'resistance_bands', 'kettlebell', 'medicine_ball', 'foam_roller', 'none'].includes(exercise.equipment)) {
            throw new Error('Each exercise must have valid equipment');
          }

          if (!exercise.instructions || typeof exercise.instructions !== 'string') {
            throw new Error('Each exercise must have instructions');
          }

          if (!exercise.sets || typeof exercise.sets !== 'number' || exercise.sets < 1 || exercise.sets > 10) {
            throw new Error('Each exercise must have sets between 1 and 10');
          }

          if (!exercise.reps || typeof exercise.reps !== 'number' || exercise.reps < 1 || exercise.reps > 100) {
            throw new Error('Each exercise must have reps between 1 and 100');
          }

          if (!exercise.restTime || typeof exercise.restTime !== 'number' || exercise.restTime < 0 || exercise.restTime > 600) {
            throw new Error('Each exercise must have rest time between 0 and 600 seconds');
          }

          // ✅ Status validation (optional, defaults to incomplete)
          if (exercise.status && !['incomplete', 'complete'].includes(exercise.status)) {
            throw new Error('Exercise status must be incomplete or complete');
          }

          // ✅ Note validation (optional)
          if (exercise.note && typeof exercise.note !== 'string') {
            throw new Error('Exercise note must be a string');
          }
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

  body('notes')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Notes cannot exceed 1000 characters')
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

  // Duration is fixed to 7 days per week, no need to validate
  // body('durationWeeks') - removed as it's now fixed

  // Weekly plan validation for updates
  body('weeklyPlan')
    .optional()
    .isArray({ min: 1 })
    .withMessage('Weekly plan must be an array with at least one day')
    .custom((weeklyPlan) => {
      // ✅ Add safety checks
      if (!weeklyPlan || !Array.isArray(weeklyPlan)) {
        throw new Error('Weekly plan must be a valid array');
      }

      for (let i = 0; i < weeklyPlan.length; i++) {
        const dayPlan = weeklyPlan[i];
        
        if (!dayPlan || typeof dayPlan !== 'object') {
          throw new Error(`Day ${i + 1} must be a valid object`);
        }

        if (!dayPlan.dayName || !['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].includes(dayPlan.dayName)) {
          throw new Error('Invalid day name in weekly plan');
        }

        if (!dayPlan.dailyPlanName || typeof dayPlan.dailyPlanName !== 'string') {
          throw new Error('Each day must have a daily plan name');
        }

        if (!dayPlan.bodyParts || !Array.isArray(dayPlan.bodyParts) || dayPlan.bodyParts.length === 0) {
          throw new Error('Each day must have at least one body part');
        }

        if (!dayPlan.muscles || !Array.isArray(dayPlan.muscles) || dayPlan.muscles.length === 0) {
          throw new Error('Each day must have at least one muscle');
        }

        // ✅ Better exercises validation
        if (!dayPlan.exercises) {
          throw new Error('Each day must have exercises');
        }

        if (!Array.isArray(dayPlan.exercises)) {
          throw new Error('Exercises must be an array');
        }

        if (dayPlan.exercises.length === 0) {
          throw new Error('Each day must have at least one exercise');
        }
        
        // Validate each exercise in the day
        for (let j = 0; j < dayPlan.exercises.length; j++) {
          const exercise = dayPlan.exercises[j];
          
          if (!exercise || typeof exercise !== 'object') {
            throw new Error(`Exercise ${j + 1} in day ${i + 1} must be a valid object`);
          }

          if (!exercise.name || typeof exercise.name !== 'string') {
            throw new Error('Each exercise must have a name');
          }

          if (!exercise.gifUrl || typeof exercise.gifUrl !== 'string') {
            throw new Error('Each exercise must have a GIF URL');
          }

          if (!exercise.equipment || !['dumbbells', 'barbell', 'machine', 'cable', 'bodyweight', 'resistance_bands', 'kettlebell', 'medicine_ball', 'foam_roller', 'none'].includes(exercise.equipment)) {
            throw new Error('Each exercise must have valid equipment');
          }

          if (!exercise.instructions || typeof exercise.instructions !== 'string') {
            throw new Error('Each exercise must have instructions');
          }

          if (!exercise.sets || typeof exercise.sets !== 'number' || exercise.sets < 1 || exercise.sets > 10) {
            throw new Error('Each exercise must have sets between 1 and 10');
          }

          if (!exercise.reps || typeof exercise.reps !== 'number' || exercise.reps < 1 || exercise.reps > 100) {
            throw new Error('Each exercise must have reps between 1 and 100');
          }

          if (!exercise.restTime || typeof exercise.restTime !== 'number' || exercise.restTime < 0 || exercise.restTime > 600) {
            throw new Error('Each exercise must have rest time between 0 and 600 seconds');
          }

          // ✅ Status validation (optional, defaults to incomplete)
          if (exercise.status && !['incomplete', 'complete'].includes(exercise.status)) {
            throw new Error('Exercise status must be incomplete or complete');
          }

          // ✅ Note validation (optional)
          if (exercise.note && typeof exercise.note !== 'string') {
            throw new Error('Exercise note must be a string');
          }
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

// Get workout plan by ID validation
const getWorkoutPlanById = [
  param('planId')
    .isMongoId()
    .withMessage('Invalid workout plan ID format'),
  handleValidationErrors
];

module.exports = {
  createWorkoutPlan,
  updateWorkoutPlan,
  reuseWorkoutPlan,
  completeExercise,
  completeDay,
  updateProgressStatus,
  getClientProgress: getClientProgress, 
  workoutPlanId,                          
  clientId,
  getWorkoutPlanById                                 
};