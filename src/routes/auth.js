const express = require('express');
const multer = require('multer');
const authController = require('../controllers/authController');
const { authenticate } = require('../middlewares/auth');
const { requirePermission } = require('../middlewares/permissionMiddleware');
const rateLimit = require('express-rate-limit');
const { asyncErrorHandler } = require('../middlewares/userErrorMiddleware');
const { sanitizeInputs, handleValidationErrors, validations } = require('../middlewares/validators/authValidator');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 7 // Maximum 7 files (5 certificates + 2 ID cards)
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed'), false);
    }
  }
});

const router = express.Router();

// Apply global sanitization to all routes
router.use(sanitizeInputs);

// Rate limiters
const registrationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many registration attempts, please try again later'
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Too many authentication attempts, please try again later'
});

const refreshLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: 'Too many refresh attempts, please try again later'
});

const emailVerificationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many verification attempts, please try again later'
});

// Public routes
router.post('/register/client', 
  registrationLimiter, 
  ...validations.registerClient,
  handleValidationErrors,
  asyncErrorHandler(authController.registerClient)
);

router.post('/register/professional', 
  registrationLimiter, 
  upload.fields([
    { name: 'certificates', maxCount: 5 },
    { name: 'id_card_front', maxCount: 1 },
    { name: 'id_card_back', maxCount: 1 }
  ]),
  ...validations.registerProfessional,
  handleValidationErrors,
  asyncErrorHandler(authController.registerProfessional)
);

router.post('/verify-otp', 
  emailVerificationLimiter,
  ...validations.verifyOtp,
  handleValidationErrors,
  asyncErrorHandler(authController.verifyOtp)
);

router.post('/login', 
  authLimiter,
  ...validations.login,
  handleValidationErrors,
  asyncErrorHandler(authController.login)
);

router.post('/refresh', 
  refreshLimiter,
  ...validations.refresh,
  handleValidationErrors,
  asyncErrorHandler(authController.refresh)
);

router.post('/forgot-password', 
  emailVerificationLimiter,
  ...validations.forgotPassword,
  handleValidationErrors,
  asyncErrorHandler(authController.forgotPassword)
);

router.post('/reset-password-otp', 
  emailVerificationLimiter,
  ...validations.resetPasswordWithOtp,
  handleValidationErrors,
  asyncErrorHandler(authController.resetPasswordWithOtp)
);

router.post('/resend-reset-otp', 
  emailVerificationLimiter,
  ...validations.resendResetPasswordOtp,
  handleValidationErrors,
  asyncErrorHandler(authController.resendResetPasswordOtp)
);

router.post('/resend-verification', 
  emailVerificationLimiter,
  ...validations.resendVerificationEmail,
  handleValidationErrors,
  asyncErrorHandler(authController.resendVerificationEmail)
);

router.post('/test-email', 
  ...validations.testEmail,
  handleValidationErrors,
  asyncErrorHandler(authController.testEmail)
);

// Authenticated routes
router.post('/logout', authenticate, asyncErrorHandler(authController.logout));

router.post('/logout-all', authenticate, asyncErrorHandler(authController.logoutAll));

router.put('/change-password', authenticate, asyncErrorHandler(authController.changePassword));

router.get('/me', authenticate, asyncErrorHandler(authController.getMe));

// Admin routes
router.post('/admin/create-supervisor', 
  authenticate, 
  requirePermission('manage_supervisors'),
  ...validations.createSupervisor,
  handleValidationErrors,
  asyncErrorHandler(authController.createSupervisor)
);

router.post('/admin/approve/:userId', 
  authenticate, 
  requirePermission('manage_users_limited'),
  ...validations.approveUser,
  handleValidationErrors,
  asyncErrorHandler(authController.approveUser)
);

router.post('/admin/reject/:userId', 
  authenticate, 
  requirePermission('manage_users_limited'),
  ...validations.rejectUser,
  handleValidationErrors,
  asyncErrorHandler(authController.rejectUser)
);

router.post('/admin/block/:userId', 
  authenticate, 
  requirePermission('block_client'),
  ...validations.blockUser,
  handleValidationErrors,
  asyncErrorHandler(authController.blockUser)
);

router.post('/admin/unblock/:userId', 
  authenticate, 
  requirePermission('unblock_client'),
  ...validations.unblockUser,
  handleValidationErrors,
  asyncErrorHandler(authController.unblockUser)
);

module.exports = router;