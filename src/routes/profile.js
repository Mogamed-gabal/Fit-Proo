const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const profileController = require('../controllers/profileController');
const { authenticate } = require('../middlewares/auth');
const { requirePermission } = require('../middlewares/permissionMiddleware');
const multer = require('multer');
const { asyncErrorHandler } = require('../middlewares/userErrorMiddleware');
const { sanitizeInputs } = require('../middlewares/validators/authValidator');
const {
  validateProfileUpdate,
  validatePackageUpdate,
  validateBioUpdate,
  validateWeightEntry
} = require('../middlewares/profileValidationMiddleware');
const { applyProfileRateLimit } = require('../middlewares/profileRateLimitMiddleware');
const { profileErrorHandler, asyncProfileHandler, requestLogger, securityLogger } = require('../middlewares/profileErrorHandlingMiddleware');
const { secureErrorHandler } = require('../middlewares/secureErrorHandler');

// Enhanced rate limiters for profile operations
const profileLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // 50 requests per 15 minutes
  message: {
    success: false,
    error: 'Too many profile requests. Please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false
});

const contentUpdateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // 20 content updates per 15 minutes
  message: {
    success: false,
    error: 'Too many content updates. Please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Multer configuration for profile picture upload
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 1
  },
  fileFilter: (req, file, cb) => {
    // Enhanced file type validation
    const allowedMimes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp'
    ];
    
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed'), false);
    }
  }
});

// Apply authentication to all profile routes
router.use(authenticate);

// Apply global sanitization to all routes
router.use(sanitizeInputs);

// Apply general rate limiting to all profile routes
router.use(profileLimiter);

// Apply request logging
router.use(requestLogger);

// Add weight entry (client only)
router.post('/weight', 
  applyProfileRateLimit('weight'),
  requirePermission('manage_own_weight'), 
  validateWeightEntry,
  asyncProfileHandler(profileController.addWeightEntry.bind(profileController))
);

// Get weight history (client only)
router.get('/weight', 
  applyProfileRateLimit('general'),
  requirePermission('read_own_weight'), 
  asyncProfileHandler(profileController.getWeightHistory.bind(profileController))
);

// Get weight history with pagination (client only)
router.get('/weight/paginated', 
  applyProfileRateLimit('general'),
  requirePermission('read_own_weight'), 
  asyncProfileHandler(profileController.getWeightHistoryPaginated.bind(profileController))
);

// Upload/Update profile picture (all users)
router.put('/picture', 
  upload.single('profilePicture'),
  contentUpdateLimiter,
  requirePermission('manage_own_profile_picture'),
  asyncProfileHandler(profileController.updateProfilePicture.bind(profileController))
);

// Delete profile picture (all users)
router.delete('/picture', 
  contentUpdateLimiter,
  requirePermission('manage_own_profile_picture'),
  asyncProfileHandler(profileController.deleteProfilePicture.bind(profileController))
);

// Doctor: Add certificate (doctor only)
router.post('/certificates', 
  upload.single('certificate'),
  contentUpdateLimiter,
  requirePermission('manage_own_certificates'), 
  asyncProfileHandler(profileController.addCertificate.bind(profileController))
);

// Doctor: Delete certificate (doctor only)
router.delete('/certificates/:certificateId', 
  contentUpdateLimiter,
  requirePermission('manage_own_certificates'), 
  asyncProfileHandler(profileController.deleteCertificate.bind(profileController))
);

// Doctor: Update packages pricing (doctor only)
router.put('/packages', 
  contentUpdateLimiter,
  requirePermission('manage_own_packages'), 
  validatePackageUpdate,
  asyncProfileHandler(profileController.updatePackages.bind(profileController))
);

// Doctor: Update short bio (doctor only)
router.put('/bio', 
  contentUpdateLimiter,
  requirePermission('manage_own_bio'), 
  validateBioUpdate,
  asyncProfileHandler(profileController.updateBio.bind(profileController))
);

// Get profile (client/doctor/admin/supervisor)
router.get('/', 
  applyProfileRateLimit('general'),
  requirePermission('read_own_profile'), 
  asyncProfileHandler(profileController.getProfile.bind(profileController))
);

// Update profile (client/doctor/admin/supervisor)
router.put('/', 
  applyProfileRateLimit('contentUpdate'),
  requirePermission('update_own_profile'), 
  validateProfileUpdate,
  asyncProfileHandler(profileController.updateProfile.bind(profileController))
);

// Apply secure error handling middleware
router.use(secureErrorHandler);

module.exports = router;
