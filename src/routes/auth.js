const express = require('express');
const multer = require('multer');
const authController = require('../controllers/authController');
const { authenticate } = require('../middlewares/auth');
const { requirePermission } = require('../middlewares/permissionMiddleware');
const rateLimit = require('express-rate-limit');
const { asyncErrorHandler } = require('../middlewares/userErrorMiddleware');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 7 // Maximum 7 files (5 certificates + 2 ID cards)
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

const router = express.Router();

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
router.post('/register/client', registrationLimiter, asyncErrorHandler(authController.registerClient));

router.post('/register/professional', registrationLimiter, upload.fields([
  { name: 'certificates', maxCount: 5 },
  { name: 'id_card_front', maxCount: 1 },
  { name: 'id_card_back', maxCount: 1 }
]), asyncErrorHandler(authController.registerProfessional));

router.post('/verify-otp', emailVerificationLimiter, asyncErrorHandler(authController.verifyOtp));

router.post('/login', authLimiter, asyncErrorHandler(authController.login));

router.post('/refresh', refreshLimiter, asyncErrorHandler(authController.refresh));

router.post('/forgot-password', emailVerificationLimiter, asyncErrorHandler(authController.forgotPassword));

router.post('/reset-password-otp', emailVerificationLimiter, asyncErrorHandler(authController.resetPasswordWithOtp));

router.post('/resend-reset-otp', emailVerificationLimiter, asyncErrorHandler(authController.resendResetPasswordOtp));

router.post('/resend-verification', emailVerificationLimiter, asyncErrorHandler(authController.resendVerificationEmail));

router.post('/test-email', asyncErrorHandler(authController.testEmail));

// Authenticated routes
router.post('/logout', authenticate, asyncErrorHandler(authController.logout));

router.post('/logout-all', authenticate, asyncErrorHandler(authController.logoutAll));

router.put('/change-password', authenticate, asyncErrorHandler(authController.changePassword));

router.get('/me', authenticate, asyncErrorHandler(authController.getMe));

// Admin routes
router.post('/admin/create-supervisor', authenticate, requirePermission('manage_supervisors'), asyncErrorHandler(authController.createSupervisor));

router.post('/admin/approve/:userId', authenticate, requirePermission('manage_users_limited'), asyncErrorHandler(authController.approveUser));

router.post('/admin/reject/:userId', authenticate, requirePermission('manage_users_limited'), asyncErrorHandler(authController.rejectUser));

router.post('/admin/block/:userId', authenticate, requirePermission('block_client'), asyncErrorHandler(authController.blockUser));

router.post('/admin/unblock/:userId', authenticate, requirePermission('unblock_client'), asyncErrorHandler(authController.unblockUser));

module.exports = router;