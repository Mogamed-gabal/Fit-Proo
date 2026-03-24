const { body, validationResult } = require('express-validator');
const mongoose = require('mongoose');
const xss = require('xss');

// Egyptian regions for validation
const EGYPTIAN_REGIONS = [
  'Cairo', 'Alexandria', 'Giza', 'Shubra El Kheima', 'Port Said', 'Suez',
  'Luxor', 'Aswan', 'Asyut', 'Ismailia', 'Kafr El Sheikh', 'Faiyum',
  'Beni Suef', 'Minya', 'Qena', 'Sohag', 'Damietta', 'Mansoura',
  'Tanta', 'Damanhur', 'El Mahalla El Kubra', 'Hurghada', '6th of October City',
  'New Cairo', 'Obour', '10th of Ramadan City', 'Sharm El Sheikh', 'Dahab', 'Nuweiba'
];

// Sanitize text fields to prevent XSS
const sanitizeText = (value) => {
  if (!value) return value;
  return xss(value.trim());
};

// Validation middleware for profile updates
const validateProfileUpdate = [
  // Name validation
  body('name')
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters')
    .customSanitizer(value => sanitizeText(value)),
  
  // Phone validation
  body('phone')
    .optional()
    .isMobilePhone('any')
    .withMessage('Please provide a valid phone number')
    .custom(value => {
      // Egyptian phone number validation (starts with +20 or 01)
      const egyptianPhoneRegex = /^(\+20|01)[0-9]{9,12}$/;
      if (!egyptianPhoneRegex.test(value)) {
        throw new Error('Please provide a valid Egyptian phone number');
      }
      return true;
    }),
  
  // Address validation
  body('address')
    .optional()
    .isLength({ min: 5, max: 500 })
    .withMessage('Address must be between 5 and 500 characters')
    .customSanitizer(value => sanitizeText(value)),
  
  // Region validation
  body('region')
    .optional()
    .isIn(EGYPTIAN_REGIONS)
    .withMessage('Region must be a valid Egyptian region'),
  
  // Height validation
  body('height')
    .optional()
    .isFloat({ min: 50, max: 300 })
    .withMessage('Height must be between 50 and 300 cm'),
  
  // Goal validation
  body('goal')
    .optional()
    .isLength({ min: 3, max: 200 })
    .withMessage('Goal must be between 3 and 200 characters')
    .customSanitizer(value => sanitizeText(value)),
  
  // Handle validation errors
  (req, res, next) => {
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
  }
];

// Validation for package updates
const validatePackageUpdate = [
  body('packages')
    .isArray({ min: 1 })
    .withMessage('At least one package is required'),
  
  body('packages.*.duration')
    .isInt({ min: 1 })
    .isIn([1, 3, 6])
    .withMessage('Package duration must be one of: 1 (1 month), 3 (3 months), 6 (6 months)'),
  
  body('packages.*.price')
    .isFloat({ min: 50, max: 10000 })
    .withMessage('Package price must be between 50 and 10000 EGP'),
  
  body('packages.*.description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Package description must not exceed 500 characters')
    .customSanitizer(value => sanitizeText(value)),
  
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Package validation failed',
        details: errors.array().map(error => ({
          field: error.path,
          message: error.msg
        }))
      });
    }
    next();
  }
];

// Validation for bio updates
const validateBioUpdate = [
  body('short_bio')
    .isLength({ min: 10, max: 500 })
    .withMessage('Bio must be between 10 and 500 characters')
    .customSanitizer(value => sanitizeText(value)),
  
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Bio validation failed',
        details: errors.array().map(error => ({
          field: error.path,
          message: error.msg
        }))
      });
    }
    next();
  }
];

// Validation for weight entries
const validateWeightEntry = [
  body('weight')
    .isFloat({ min: 20, max: 500 })
    .withMessage('Weight must be between 20 and 500 kg'),
  
  body('date')
    .optional()
    .isISO8601()
    .withMessage('Date must be a valid ISO 8601 date'),
  
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Weight entry validation failed',
        details: errors.array().map(error => ({
          field: error.path,
          message: error.msg
        }))
      });
    }
    next();
  }
];

module.exports = {
  validateProfileUpdate,
  validatePackageUpdate,
  validateBioUpdate,
  validateWeightEntry,
  EGYPTIAN_REGIONS
};
