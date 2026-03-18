const { body, param, validationResult } = require('express-validator');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss');

/**
 * Global sanitization middleware
 */
const sanitizeInputs = (req, res, next) => {
  // Sanitize body, query, params
  if (req.body) req.body = mongoSanitize(req.body);
  if (req.query) req.query = mongoSanitize(req.query);
  if (req.params) req.params = mongoSanitize(req.params);
  next();
};

/**
 * XSS protection for strings
 */
const sanitizeString = (value) => {
  if (typeof value === 'string') {
    return xss(value, {
      whiteList: {},
      stripIgnoreTag: true,
      stripIgnoreTagBody: ['script']
    });
  }
  return value;
};

/**
 * Validation error handler
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array().map(err => ({
        field: err.path || err.param,
        message: err.msg,
        value: err.value
      }))
    });
  }
  next();
};

/**
 * Common validations
 */
const validations = {
  registerClient: [
    body('name').trim().notEmpty().withMessage('Name is required').isLength({ min: 2, max: 50 }).withMessage('Name must be 2-50 characters'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters').matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage('Password must have uppercase, lowercase, and number'),
    body('phone').notEmpty().withMessage('Phone is required').matches(/^\+?[1-9]\d{1,14}$/).withMessage('Valid phone number required'),
    body('address').trim().notEmpty().withMessage('Address is required').isLength({ min: 5, max: 200 }).withMessage('Address must be 5-200 characters'),
    body('dateOfBirth').notEmpty().withMessage('Date of birth is required').isISO8601().withMessage('Valid date required').custom((value) => {
      const age = Math.floor((Date.now() - new Date(value)) / (365.25 * 24 * 60 * 60 * 1000));
      if (age < 18 || age > 120) throw new Error('Age must be 18-120');
      return true;
    }),
    body('gender').notEmpty().withMessage('Gender is required').isIn(['male', 'female', 'other']).withMessage('Invalid gender'),
    body('region').notEmpty().withMessage('Region is required').isIn(['Cairo', 'Giza', 'Alexandria', 'Dakahlia', 'Red Sea', 'Beheira', 'Fayoum', 'Gharbia', 'Ismailia', 'Menofia', 'Minya', 'Qaliubiya', 'New Valley', 'Suez', 'Aswan', 'Assiut', 'Beni Suef', 'Port Said', 'Damietta', 'Sharkia', 'South Sinai', 'Kafr El Sheikh', 'Matrouh', 'Luxor', 'Qena', 'North Sinai', 'Sohag']).withMessage('Invalid region'),
    body('height').optional().isFloat({ min: 50, max: 300 }).withMessage('Height must be 50-300 cm'),
    body('goal').optional().trim().isLength({ max: 500 }).withMessage('Goal too long')
  ],
  
  registerProfessional: [
    body('name').trim().notEmpty().withMessage('Name is required').isLength({ min: 2, max: 50 }).withMessage('Name must be 2-50 characters'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters').matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage('Password must have uppercase, lowercase, and number'),
    body('phone').notEmpty().withMessage('Phone is required').matches(/^\+?[1-9]\d{1,14}$/).withMessage('Valid phone number required'),
    body('address').trim().notEmpty().withMessage('Address is required').isLength({ min: 5, max: 200 }).withMessage('Address must be 5-200 characters'),
    body('dateOfBirth').notEmpty().withMessage('Date of birth is required').isISO8601().withMessage('Valid date required').custom((value) => {
      const age = Math.floor((Date.now() - new Date(value)) / (365.25 * 24 * 60 * 60 * 1000));
      if (age < 18 || age > 120) throw new Error('Age must be 18-120');
      return true;
    }),
    body('gender').notEmpty().withMessage('Gender is required').isIn(['male', 'female', 'other']).withMessage('Invalid gender'),
    body('region').notEmpty().withMessage('Region is required').isIn(['Cairo', 'Giza', 'Alexandria', 'Dakahlia', 'Red Sea', 'Beheira', 'Fayoum', 'Gharbia', 'Ismailia', 'Menofia', 'Minya', 'Qaliubiya', 'New Valley', 'Suez', 'Aswan', 'Assiut', 'Beni Suef', 'Port Said', 'Damietta', 'Sharkia', 'South Sinai', 'Kafr El Sheikh', 'Matrouh', 'Luxor', 'Qena', 'North Sinai', 'Sohag']).withMessage('Invalid region'),
    body('specialization').optional().isIn(['doctor', 'nutritionist', 'therapist', 'coach']).withMessage('Invalid specialization'),
    body('years_of_experience').optional().isInt({ min: 0, max: 70 }).withMessage('Experience must be 0-70 years'),
    body('short_bio').optional().trim().isLength({ max: 500 }).withMessage('Bio too long'),
    body('packages').optional().custom((value) => {
      if (!value) return true;
      if (typeof value === 'string') {
        try {
          value = JSON.parse(value);
        } catch (err) {
          throw new Error('Invalid packages format');
        }
      }
      if (!Array.isArray(value)) {
        throw new Error('Packages must be an array');
      }
      if (value.length !== 3) {
        throw new Error('Exactly 3 packages required');
      }
      return true;
    }),
    body('packages.*.duration').optional().isIn([1, 3, 6]).withMessage('Duration must be 1, 3, or 6 months'),
    body('packages.*.price').optional().isFloat({ min: 0 }).withMessage('Price must be positive'),
    body('packages').optional().custom((packages) => {
      if (!packages || !Array.isArray(packages)) return true;
      const durations = packages.map(p => p.duration);
      if (durations.length === 3 && ![1, 3, 6].every(d => durations.includes(d))) {
        throw new Error('Must include 1, 3, and 6 month packages');
      }
      return true;
    }),
    // File validation
    (req, res, next) => {
      if (!req.files || (!req.files.certificates || req.files.certificates.length === 0)) {
        return res.status(400).json({
          success: false,
          errors: [{
            field: 'certificates',
            message: 'At least one certificate is required'
          }]
        });
      }
      if (!req.files.id_card_front || req.files.id_card_front.length === 0) {
        return res.status(400).json({
          success: false,
          errors: [{
            field: 'id_card_front',
            message: 'Front ID card is required'
          }]
        });
      }
      if (!req.files.id_card_back || req.files.id_card_back.length === 0) {
        return res.status(400).json({
          success: false,
          errors: [{
            field: 'id_card_back',
            message: 'Back ID card is required'
          }]
        });
      }
      next();
    }
  ],
  
  login: [
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('password').notEmpty().withMessage('Password required')
  ],
  
  verifyOtp: [
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('otp').isLength({ min: 6, max: 6 }).isNumeric().withMessage('OTP must be 6 digits')
  ],
  
  forgotPassword: [
    body('email').isEmail().normalizeEmail().withMessage('Valid email required')
  ],
  
  resetPasswordWithOtp: [
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('otp').isLength({ min: 6, max: 6 }).isNumeric().withMessage('OTP must be 6 digits'),
    body('password').isLength({ min: 8 }).matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage('Password must have uppercase, lowercase, and number')
  ],
  
  resendResetPasswordOtp: [
    body('email').isEmail().normalizeEmail().withMessage('Valid email required')
  ],
  
  resendVerificationEmail: [
    body('email').isEmail().normalizeEmail().withMessage('Valid email required')
  ],
  
  refresh: [
    body('refreshToken').notEmpty().withMessage('Refresh token required')
  ],
  
  approveUser: [
    param('userId').isMongoId().withMessage('Invalid user ID')
  ],
  
  rejectUser: [
    param('userId').isMongoId().withMessage('Invalid user ID')
  ],
  
  blockUser: [
    param('userId').isMongoId().withMessage('Invalid user ID')
  ],
  
  unblockUser: [
    param('userId').isMongoId().withMessage('Invalid user ID')
  ],
  
  createSupervisor: [
    body('name').trim().isLength({ min: 2, max: 50 }).withMessage('Name must be 2-50 characters'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('password').isLength({ min: 8 }).matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage('Password must have uppercase, lowercase, and number')
  ],
  
  testEmail: [
    body('email').isEmail().normalizeEmail().withMessage('Valid email required')
  ]
};

module.exports = {
  sanitizeInputs,
  handleValidationErrors,
  validations,
  sanitizeString
};
