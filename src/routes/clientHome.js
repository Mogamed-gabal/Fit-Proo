const express = require('express');
const router = express.Router();
const clientHomeController = require('../controllers/clientHomeController');
const { authenticate } = require('../middlewares/auth');
const { param, query } = require('express-validator');

// Apply authentication to all routes
router.use(authenticate);

// Add cache control headers for all client-home routes
router.use((req, res, next) => {
  res.set('Cache-Control', 'public, max-age=300'); // 5 minutes cache
  next();
});

/**
 * Get all doctors
 * GET /api/client-home/doctors
 */
router.get('/doctors',
  [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
    query('specialization')
      .optional()
      .isIn(['doctor', 'nutritionist', 'therapist', 'coach'])
      .withMessage('Invalid specialization'),
    query('search')
      .optional()
      .isLength({ min: 1, max: 100 })
      .withMessage('Search term must be between 1 and 100 characters'),
    query('sortBy')
      .optional()
      .isIn(['name', 'specialization', 'createdAt'])
      .withMessage('Sort by must be name, specialization, or createdAt')
  ],
  clientHomeController.getAllDoctors
);

/**
 * Get all specializations
 * GET /api/client-home/specializations
 */
router.get('/specializations',
  clientHomeController.getAllSpecializations
);

/**
 * Get doctor by ID
 * GET /api/client-home/doctors/:id
 */
router.get('/doctors/:id',
  [
    param('id')
      .isMongoId()
      .withMessage('Invalid doctor ID')
  ],
  clientHomeController.getDoctorById
);

/**
 * Get specialization details
 * GET /api/client-home/specializations/:specialization
 */
router.get('/specializations/:specialization',
  [
    param('specialization')
      .isIn(['doctor', 'nutritionist', 'therapist', 'coach'])
      .withMessage('Invalid specialization'),
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
    query('sortBy')
      .optional()
      .isIn(['name', 'experience', 'createdAt'])
      .withMessage('Sort by must be name, experience, or createdAt')
  ],
  clientHomeController.getSpecializationDetails
);

/**
 * Get doctors by specializations (filter endpoint)
 * GET /api/client-home/doctors/by-specializations
 */
router.get('/doctors/by-specializations',
  [
    query('specializations')
      .notEmpty()
      .withMessage('Specializations parameter is required')
      .custom((value) => {
        // Allow comma-separated string or array
        const specs = Array.isArray(value) ? value : value.split(',');
        if (specs.length === 0) {
          throw new Error('At least one specialization must be provided');
        }
        
        // Validate each specialization
        const validSpecs = ['doctor', 'nutritionist', 'therapist', 'coach'];
        const invalidSpecs = specs.filter(spec => !validSpecs.includes(spec.trim().toLowerCase()));
        
        if (invalidSpecs.length > 0) {
          throw new Error(`Invalid specializations: ${invalidSpecs.join(', ')}`);
        }
        
        if (specs.length > 10) {
          throw new Error('Maximum 10 specializations allowed per request');
        }
        
        return true;
      })
      .customSanitizer((value) => {
        // Sanitize input
        const specs = Array.isArray(value) ? value : value.split(',');
        return specs.map(spec => spec.trim().toLowerCase());
      }),
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
    query('sortBy')
      .optional()
      .isIn(['name', 'specialization', 'experience', 'createdAt'])
      .withMessage('Sort by must be name, specialization, experience, or createdAt')
  ],
  clientHomeController.getDoctorsBySpecializations
);

module.exports = router;
