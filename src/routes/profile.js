const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profileController');
const { authenticate } = require('../middlewares/auth');
const { requirePermission } = require('../middlewares/permissionMiddleware');
const multer = require('multer');
const { asyncErrorHandler } = require('../middlewares/userErrorMiddleware');
const {
  validateProfileUpdate,
  validatePackageUpdate,
  validateBioUpdate,
  validateWeightEntry
} = require('../middlewares/profileValidationMiddleware');
const { applyProfileRateLimit } = require('../middlewares/profileRateLimitMiddleware');
const { profileErrorHandler, asyncProfileHandler, requestLogger, securityLogger } = require('../middlewares/profileErrorHandlingMiddleware');

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
  applyProfileRateLimit('fileUpload'),
  requirePermission('manage_own_profile_picture'),
  upload.single('profilePicture'), 
  asyncProfileHandler(profileController.updateProfilePicture.bind(profileController))
);

// Delete profile picture (all users)
router.delete('/picture', 
  applyProfileRateLimit('fileUpload'),
  requirePermission('manage_own_profile_picture'),
  asyncProfileHandler(profileController.deleteProfilePicture.bind(profileController))
);

// Doctor: Add certificate (doctor only)
router.post('/certificates', 
  applyProfileRateLimit('certificate'),
  requirePermission('manage_own_certificates'), 
  upload.single('certificate'), 
  asyncProfileHandler(profileController.addCertificate.bind(profileController))
);

// Doctor: Delete certificate (doctor only)
router.delete('/certificates/:certificateId', 
  applyProfileRateLimit('certificate'),
  requirePermission('manage_own_certificates'), 
  asyncProfileHandler(profileController.deleteCertificate.bind(profileController))
);

// Doctor: Update packages pricing (doctor only)
router.put('/packages', 
  applyProfileRateLimit('contentUpdate'),
  requirePermission('manage_own_packages'), 
  validatePackageUpdate,
  asyncProfileHandler(profileController.updatePackages.bind(profileController))
);

// Doctor: Update short bio (doctor only)
router.put('/bio', 
  applyProfileRateLimit('contentUpdate'),
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

// Apply error handling middleware
router.use(profileErrorHandler);

module.exports = router;
