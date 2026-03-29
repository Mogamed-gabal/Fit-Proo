/**
 * Workout Template Validation Middleware
 * Validates workout template creation and updates
 */

const { body, param, validationResult } = require('express-validator');
const mongoose = require('mongoose');

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.array().length > 0) {
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

// Create template validation
const createTemplate = [
  // Template details validation
  body('name')
    .notEmpty()
    .withMessage('Template name is required')
    .isLength({ min: 3, max: 100 })
    .withMessage('Template name must be between 3 and 100 characters')
    .trim(),

  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Template description cannot exceed 500 characters')
    .trim(),

  body('difficulty')
    .optional()
    .isIn(['beginner', 'intermediate', 'advanced'])
    .withMessage('Difficulty must be beginner, intermediate, or advanced'),

  // Duration is fixed to 7 days per week, no need to validate
  // body('durationWeeks') - removed as it's now fixed

  body('isPublic')
    .optional()
    .isBoolean()
    .withMessage('isPublic must be a boolean'),

  // Weekly plan validation - updated for new structure
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

// Update template validation
const updateTemplate = [
  // Template ID validation
  param('templateId')
    .isMongoId()
    .withMessage('Invalid template ID format'),

  // Optional updates (same as create but all optional)
  body('name')
    .optional()
    .isLength({ min: 3, max: 100 })
    .withMessage('Template name must be between 3 and 100 characters')
    .trim(),

  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Template description cannot exceed 500 characters')
    .trim(),

  body('difficulty')
    .optional()
    .isIn(['beginner', 'intermediate', 'advanced'])
    .withMessage('Difficulty must be beginner, intermediate, or advanced'),

  // Duration is fixed to 7 days per week, no need to validate
  // body('durationWeeks') - removed as it's now fixed

  body('isPublic')
    .optional()
    .isBoolean()
    .withMessage('isPublic must be a boolean'),

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

// Assign template to client validation
const assignTemplateToClient = [
  // Template ID validation
  body('templateId')
    .notEmpty()
    .withMessage('Template ID is required')
    .isMongoId()
    .withMessage('Invalid template ID format'),

  // Client ID validation
  body('clientId')
    .notEmpty()
    .withMessage('Client ID is required')
    .isMongoId()
    .withMessage('Invalid client ID format'),

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
        throw new Error('Start date cannot be in past');
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

  handleValidationErrors
];

// Duplicate template validation
const duplicateTemplate = [
  // Template ID validation
  body('templateId')
    .notEmpty()
    .withMessage('Template ID is required')
    .isMongoId()
    .withMessage('Invalid template ID format'),

  // Name validation (optional for duplicate)
  body('name')
    .optional()
    .isLength({ min: 3, max: 100 })
    .withMessage('Template name must be between 3 and 100 characters')
    .trim(),

  handleValidationErrors
];

// Template ID validation for params
const templateId = [
  param('templateId')
    .isMongoId()
    .withMessage('Invalid template ID format')
];

// Search validation
const searchTemplates = [
  body('search')
    .optional()
    .isLength({ min: 1, max: 50 })
    .withMessage('Search term must be between 1 and 50 characters')
    .trim(),
  
  body('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  body('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50'),
  
  handleValidationErrors
];

module.exports = {
  createTemplate,
  updateTemplate,
  assignTemplateToClient,
  duplicateTemplate,
  searchTemplates,
  templateId
};
