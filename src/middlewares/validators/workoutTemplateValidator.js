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

  body('durationWeeks')
    .optional()
    .isInt({ min: 1, max: 52 })
    .withMessage('Duration must be between 1 and 52 weeks'),

  body('isPublic')
    .optional()
    .isBoolean()
    .withMessage('isPublic must be a boolean'),

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

  body('durationWeeks')
    .optional()
    .isInt({ min: 1, max: 52 })
    .withMessage('Duration must be between 1 and 52 weeks'),

  body('isPublic')
    .optional()
    .isBoolean()
    .withMessage('isPublic must be a boolean'),

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
