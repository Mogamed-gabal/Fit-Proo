const { body, param, query, validationResult } = require('express-validator');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss');

// 🔒 SECURITY FIX: Sanitize middleware to prevent XSS and NoSQL injection
const sanitizeInput = (req, res, next) => {
  // 🔒 SECURITY FIX: Sanitize request body
  if (req.body) {
    Object.keys(req.body).forEach(key => {
      if (typeof req.body[key] === 'string') {
        req.body[key] = xss(req.body[key]);
      }
    });
  }
  
  // 🔒 SECURITY FIX: Sanitize query parameters
  if (req.query) {
    Object.keys(req.query).forEach(key => {
      if (typeof req.query[key] === 'string') {
        req.query[key] = xss(req.query[key]);
      }
    });
  }
  
  // 🔒 SECURITY FIX: Prevent NoSQL injection
  mongoSanitize()(req, res, next);
};

// 🔒 SECURITY FIX: Handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array().map(error => ({
        field: error.param,
        message: error.msg,
        value: error.value
      }))
    });
  }
  next();
};

// 🔒 SECURITY FIX: User ID validation
const validateUserId = [
  param('userId').isMongoId().withMessage('Invalid user ID format'),
  handleValidationErrors
];

// 🔒 SECURITY FIX: Email validation
const validateEmail = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  handleValidationErrors
];

// 🔒 SECURITY FIX: Password validation
const validatePassword = [
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/)
    .withMessage('Password must contain uppercase, lowercase, number, and special character'),
  handleValidationErrors
];

// 🔒 SECURITY FIX: Login validation
const validateLogin = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').notEmpty().withMessage('Password required'),
  handleValidationErrors
];

// 🔒 SECURITY FIX: Registration validation
const validateRegistration = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/)
    .withMessage('Password must contain uppercase, lowercase, number, and special character'),
  body('phone')
    .matches(/^\+?[1-9]\d{1,14}$/)
    .withMessage('Please enter a valid phone number in international format'),
  body('address')
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Address must be between 5 and 200 characters'),
  body('role')
    .isIn(['client', 'doctor'])
    .withMessage('Role must be either client or doctor'),
  handleValidationErrors
];

// 🔒 SECURITY FIX: Doctor-specific validation
const validateDoctorRegistration = [
  ...validateRegistration,
  body('specialization')
    .isIn(['doctor', 'nutritionist', 'therapist', 'coach'])
    .withMessage('Valid specialization required'),
  body('age')
    .isInt({ min: 18, max: 100 })
    .withMessage('Age must be between 18 and 100'),
  body('short_bio')
    .trim()
    .isLength({ max: 500 })
    .withMessage('Bio must not exceed 500 characters'),
  body('years_of_experience')
    .isInt({ min: 0, max: 50 })
    .withMessage('Years of experience must be between 0 and 50'),
  handleValidationErrors
];

// 🔒 SECURITY FIX: OTP validation
const validateOTP = [
  body('otp')
    .isLength({ min: 6, max: 6 })
    .isNumeric()
    .withMessage('OTP must be a 6-digit number'),
  handleValidationErrors
];

// 🔒 SECURITY FIX: Password reset validation
const validatePasswordReset = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  validateOTP,
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/)
    .withMessage('Password must contain uppercase, lowercase, number, and special character'),
  handleValidationErrors
];

// 🔒 SECURITY FIX: Admin action validation
const validateAdminAction = [
  body('reason')
    .optional()
    .trim()
    .isLength({ min: 5, max: 500 })
    .withMessage('Reason must be between 5 and 500 characters'),
  handleValidationErrors
];

// 🔒 SECURITY FIX: Pagination validation
const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  handleValidationErrors
];

// 🔒 SECURITY FIX: Date range validation
const validateDateRange = [
  query('dateFrom')
    .optional()
    .isISO8601()
    .withMessage('Date from must be a valid date'),
  query('dateTo')
    .optional()
    .isISO8601()
    .withMessage('Date to must be a valid date'),
  (req, res, next) => {
    if (req.query.dateFrom && req.query.dateTo) {
      const from = new Date(req.query.dateFrom);
      const to = new Date(req.query.dateTo);
      
      if (from > to) {
        return res.status(400).json({
          success: false,
          error: 'Date from must be before date to'
        });
      }
      
      // 🔒 SECURITY FIX: Limit date range to 1 year
      const maxRange = 365 * 24 * 60 * 60 * 1000; // 1 year
      if (to - from > maxRange) {
        return res.status(400).json({
          success: false,
          error: 'Date range cannot exceed 1 year'
        });
      }
    }
    next();
  }
];

module.exports = {
  sanitizeInput,
  handleValidationErrors,
  validateUserId,
  validateEmail,
  validatePassword,
  validateLogin,
  validateRegistration,
  validateDoctorRegistration,
  validateOTP,
  validatePasswordReset,
  validateAdminAction,
  validatePagination,
  validateDateRange
};
