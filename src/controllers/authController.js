const User = require('../models/User');
const authService = require('../services/authService');
const emailService = require('../services/emailService');
const { createUserWithVerification } = require('../utils/transactionHelper');
const { withTransaction } = require('../utils/transactionHelper');
const { auditApproveUser, auditRejectUser, auditCreateSupervisor } = require('../middlewares/auditMiddleware');
const { uploadImage } = require('../services/cloudinaryService');

const validatePassword = require('../utils/passwordValidator');

class AuthController {
  async registerClient(req, res) {
    try {
      const { name, email, password, phone, address, age, height, goal } = req.body;
      
      // Validate password using centralized validator
      validatePassword(password);
      const existingUser = await User.findOne({ email }).select('_id');
      if (existingUser) {
        return res.status(400).json({
          success: false,
          error: 'Email already registered'
        });
      }

      // Use transaction helper for user creation with email verification
      const userData = {
        name,
        email,
        password,
        phone,
        address,
        role: 'client',
        age,
        height,
        goal,
        status: 'approved'
      };

      const user = await createUserWithVerification(userData, emailService);

      res.status(201).json({
        success: true,
        message: 'Registration successful. Please check your email for verification.',
        data: {
          user: user.toJSON()
        }
      });
    } catch (error) {
      // Handle validation errors
      if (error.name === 'ValidationError') {
        return res.status(400).json({
          success: false,
          error: error.message
        });
      }
      
      // Handle email service errors
      if (error.message === 'Failed to send email') {
        return res.status(500).json({
          success: false,
          error: 'Registration successful but verification email could not be sent. Please contact support.'
        });
      }
      
      // Handle duplicate key errors
      if (error.code === 11000) {
        return res.status(400).json({
          success: false,
          error: 'Email already registered'
        });
      }
      
      // Generic server error
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

async registerProfessional(req, res) {
  try {
    const { name, email, password, phone, address, age, short_bio, years_of_experience,specialization } = req.body;
    let { packages } = req.body;

    // Validate password using centralized validator
    validatePassword(password);

    // Parse packages if they come as JSON string from form-data
    if (typeof packages === 'string') {
      try {
        packages = JSON.parse(packages);
      } catch (err) {
        return res.status(400).json({
          success: false,
          error: 'Invalid packages format. Must be a JSON array.'
        });
      }
    }

    // Hardcode role to doctor
    const role = 'doctor';

    // Address validation
    // if (!address || address.trim().length === 0) {
    //   return res.status(400).json({
    //     success: false,
    //     error: 'Address is required'
    //   });
    // }
// Validate specialization
if (!specialization || !['doctor', 'nutritionist', 'therapist', 'coach'].includes(specialization)) {
  return res.status(400).json({
    success: false,
    error: 'Specialization is required and must be one of: doctor, nutritionist, therapist, coach'
  });}
    // Email uniqueness check
    const existingUser = await User.findOne({ email }).select('_id');
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'Email already registered'
      });
    }

    // Packages validation
    if (!packages || !Array.isArray(packages) || packages.length !== 3) {
      return res.status(400).json({
        success: false,
        error: 'Exactly 3 packages are required (1, 3, and 6 months)'
      });
    }

    const requiredDurations = [1, 3, 6];
    const packageDurations = packages.map(p => p.duration);
    if (!requiredDurations.every(duration => packageDurations.includes(duration))) {
      return res.status(400).json({
        success: false,
        error: 'Packages must include durations of 1, 3, and 6 months'
      });
    }

    for (const pkg of packages) {
      if (!pkg.price || pkg.price <= 0) {
        return res.status(400).json({
          success: false,
          error: 'All package prices must be positive numbers'
        });
      }
    }

 // Certificates & ID Cards
const files = req.files || {};

// ناخد الشهادات (certificates)
const certificatesFiles = files.certificates || [];
const certificates = [];

// Upload certificates to Cloudinary
for (const file of certificatesFiles) {
  try {
    const uploadResult = await uploadImage(file.buffer);
    certificates.push({
      filename: file.originalname,
      originalName: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      secure_url: uploadResult.secure_url,
      public_id: uploadResult.public_id
    });
  } catch (error) {
    console.error('❌ Certificate upload error:', error);
    // Continue with other certificates if one fails
  }
}

// ناخد الـ ID cards
const idCardFront = files.id_card_front ? files.id_card_front[0] : null;
const idCardBack = files.id_card_back ? files.id_card_back[0] : null;

if (certificates.length === 0) {
  return res.status(400).json({
    success: false,
    error: 'At least one certificate is required'
  });
}

const invalidCertificates = certificates.filter(cert => !cert.mimetype.startsWith('image/'));
const invalidIdCards = [idCardFront, idCardBack].filter(card => card && !card.mimetype.startsWith('image/'));

if (invalidCertificates.length > 0) {
  return res.status(400).json({
    success: false,
    error: 'Only image files are allowed for certificates'
  });
}

if (invalidIdCards.length > 0) {
  return res.status(400).json({
    success: false,
    error: 'Only image files are allowed for ID cards'
  });
}

if (!idCardFront || !idCardBack) {
  return res.status(400).json({
    success: false,
    error: 'Both front and back ID card images are required'
  });
}

// Upload ID cards to Cloudinary
let uploadedIdCardFront = null;
let uploadedIdCardBack = null;

try {
  if (idCardFront) {
    const uploadResult = await uploadImage(idCardFront.buffer);
    uploadedIdCardFront = {
      filename: idCardFront.originalname,
      originalName: idCardFront.originalname,
      mimetype: idCardFront.mimetype,
      size: idCardFront.size,
      secure_url: uploadResult.secure_url,
      public_id: uploadResult.public_id
    };
  }
} catch (error) {
  console.error('❌ ID card front upload error:', error);
  return res.status(500).json({
    success: false,
    error: 'Failed to upload front ID card'
  });
}

try {
  if (idCardBack) {
    const uploadResult = await uploadImage(idCardBack.buffer);
    uploadedIdCardBack = {
      filename: idCardBack.originalname,
      originalName: idCardBack.originalname,
      mimetype: idCardBack.mimetype,
      size: idCardBack.size,
      secure_url: uploadResult.secure_url,
      public_id: uploadResult.public_id
    };
  }
} catch (error) {
  console.error('❌ ID card back upload error:', error);
  return res.status(500).json({
    success: false,
    error: 'Failed to upload back ID card'
  });
}

    // Create user data
    const userData = {
      name,
      email,
      password,
      phone,
      address: address.trim(),
      age,
      short_bio,
      years_of_experience,
      role,
      specialization,
      packages, // <-- array now guaranteed
      certificates,
      id_card_front: uploadedIdCardFront,
      id_card_back: uploadedIdCardBack,
      status: 'pending'
    };

    // Create user with email verification
    const user = await createUserWithVerification(userData, emailService);

    res.status(201).json({
      success: true,
      message: 'Registration successful. Please check your email for verification and wait for admin approval.',
      data: { user: user.toJSON() }
    });

  } catch (error) {
    if (error.name === 'ValidationError') {
      const firstMessage = Object.values(error.errors)[0].message;
      return res.status(400).json({ success: false, error: firstMessage });
    }
    res.status(400).json({ success: false, error: error.message });
  }
}

  async verifyEmail(req, res) {
    try {
      const { token } = req.body;
      const ipAddress = req.ip; // 🔒 SECURITY FIX: Track IP for security

      const user = await User.findOne({
        emailVerificationToken: token,
        emailVerificationExpires: { $gt: Date.now() }
      }).select('_id emailVerified role status');

      if (!user) {
        return res.status(400).json({
          success: false,
          error: 'Invalid or expired verification token'
        });
      }

      user.emailVerified = true;
      user.emailVerificationToken = undefined;
      user.emailVerificationExpires = undefined;
      await user.save();

      // 🔒 SECURITY FIX: Log successful verification for audit
      console.log(`✅ [AUTH] Email verified for user: ${user._id} from IP: ${ipAddress}`);

      if (user.role === 'client') {
        res.status(200).json({
          success: true,
          message: 'Email verified successfully. You can now login.'
        });
      } else {
        res.status(200).json({
          success: true,
          message: 'Email verified successfully. Your account is pending admin approval.'
        });
      }
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }

  async login(req, res) {
    try {
      const { email, password } = req.body;
      const userAgent = req.get('User-Agent');
      const ipAddress = req.ip;

      // 🔒 SECURITY FIX: Pass IP address for security tracking
      const result = await authService.login(email, password, userAgent, ipAddress);

      res.status(200).json({
        success: true,
        message: 'Login successful',
        data: {
          user: result.user.toJSON(),
          accessToken: result.accessToken,
          refreshToken: result.refreshToken
        }
      });
    } catch (error) {
      // 🔒 DEBUG: Log the actual error for debugging
      console.error('❌ [AUTH CONTROLLER] Login error:', {
        error: error.message,
        stack: error.stack,
        code: error.code,
        email: req.body.email
      });
      
      // 🔒 SECURITY FIX: Enhanced error handling without revealing too much
      if (error.code === 'EMAIL_NOT_VERIFIED') {
        return res.status(403).json({
          success: false,
          message: 'Email not verified. Please check your email and verify your account.'
        });
      }
      
      if (error.message === 'Invalid credentials' || error.message === 'Account is blocked') {
        return res.status(401).json({
          success: false,
          error: error.message
        });
      }
      
      if (error.message.includes('Account temporarily locked')) {
        return res.status(423).json({
          success: false,
          error: error.message
        });
      }
      
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  async refresh(req, res) {
    try {
      const { refreshToken } = req.body;
      const userAgent = req.get('User-Agent');
      const ipAddress = req.ip;

      const result = await authService.refresh(refreshToken, userAgent, ipAddress);

      res.status(200).json({
        success: true,
        data: {
          accessToken: result.accessToken,
          refreshToken: result.refreshToken
        }
      });
    } catch (error) {
      res.status(401).json({
        success: false,
        error: error.message
      });
    }
  }

  async logout(req, res) {
    try {
      const { refreshToken } = req.body;

      await authService.logout(refreshToken);

      res.status(200).json({
        success: true,
        message: 'Logout successful'
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }

  async logoutAll(req, res) {
    try {
      const userId = req.user.userId;

      await authService.logoutAll(userId);

      res.status(200).json({
        success: true,
        message: 'Logged out from all devices'
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }

  async approveUser(req, res) {
    // Apply audit middleware
    auditApproveUser(req, res, async () => {
      try {
        const { userId } = req.params;
        const { reason } = req.body; // Capture approval reason

        const user = await User.findById(userId);
        if (!user) {
          return res.status(404).json({
            success: false,
            error: 'User not found'
          });
        }

        if (user.role === 'client') {
          return res.status(400).json({
            success: false,
            error: 'Client accounts do not require approval'
          });
        }

        const oldStatus = user.status;
        user.status = 'approved';
        await user.save();

        await emailService.sendApprovalEmail(user);

        res.status(200).json({
          success: true,
          message: 'User approved successfully',
          data: {
            user: user.toJSON()
          }
        });
      } catch (error) {
        res.status(400).json({
          success: false,
          error: error.message
        });
      }
    });
  }

  async rejectUser(req, res) {
    // Apply audit middleware
    auditRejectUser(req, res, async () => {
      try {
        const { userId } = req.params;
        const { reason } = req.body; // Capture rejection reason

        const user = await User.findById(userId);
        if (!user) {
          return res.status(404).json({
            success: false,
            error: 'User not found'
          });
        }

        if (user.role === 'client') {
          return res.status(400).json({
            success: false,
            error: 'Client accounts cannot be rejected'
          });
        }

        const oldStatus = user.status;
        user.status = 'rejected';
        await user.save();

        await emailService.sendRejectionEmail(user);

        res.status(200).json({
          success: true,
          message: 'User rejected successfully'
        });
      } catch (error) {
        res.status(400).json({
          success: false,
          error: error.message
        });
      }
    });
  }

  async blockUser(req, res) {
    try {
      const { userId } = req.params;

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      user.isBlocked = true;
      await user.save();

      await authService.revokeAllUserTokens(userId);
      await emailService.sendBlockedEmail(user);

      res.status(200).json({
        success: true,
        message: 'User blocked successfully'
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }

  async unblockUser(req, res) {
    try {
      const { userId } = req.params;

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      user.isBlocked = false;
      await user.save();

      res.status(200).json({
        success: true,
        message: 'User unblocked successfully'
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }

  async getMe(req, res) {
    try {
      const userId = req.user.userId;

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      if (user.isBlocked) {
        return res.status(403).json({
          success: false,
          error: 'Account is blocked'
        });
      }

      res.status(200).json({
        success: true,
        data: {
          user: user.toJSON()
        }
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }

  async testEmail(req, res) {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({
          success: false,
          error: 'Email is required'
        });
      }

      await emailService.sendEmail({
        to: email,
        subject: 'Test Email - Fitness Platform',
        html: `
          <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
            <h2 style="color: #333;">Test Email</h2>
            <p>This is a test email from Fitness Platform.</p>
            <p>If you received this email, the email service is working correctly.</p>
            <p>Best regards,<br>Fitness Platform Team</p>
          </div>
        `
      });

      res.status(200).json({
        success: true,
        message: 'Test email sent successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  async resetPasswordWithOtp(req, res) {
    try {
      const { email, otp, newPassword } = req.body;

      if (!email || !otp || !newPassword) {
        return res.status(400).json({
          success: false,
          error: 'Email, OTP, and new password are required'
        });
      }

      const result = await authService.resetPasswordWithOtp(email, otp, newPassword);

      res.status(200).json({
        success: true,
        message: result.message
      });
    } catch (error) {
      if (error.message === 'User not found') {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }
      
      if (error.message === 'No password reset OTP found. Please request a new OTP.') {
        return res.status(400).json({
          success: false,
          error: 'No password reset OTP found. Please request a new OTP.'
        });
      }
      
      if (error.message === 'Password reset OTP has expired. Please request a new OTP.') {
        return res.status(400).json({
          success: false,
          error: 'Password reset OTP has expired. Please request a new OTP.'
        });
      }
      
      if (error.message === 'Invalid OTP. Please check and try again.') {
        return res.status(400).json({
          success: false,
          error: 'Invalid OTP. Please check and try again.'
        });
      }
      
      if (error.message.includes('Password must be at least 8 characters')) {
        return res.status(400).json({
          success: false,
          error: error.message
        });
      }

      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  async resendResetPasswordOtp(req, res) {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({
          success: false,
          error: 'Email is required'
        });
      }

      const result = await authService.resendResetPasswordOtp(email);

      res.status(200).json({
        success: true,
        message: 'Password reset OTP has been resent to your email.'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  async forgotPassword(req, res) {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({
          success: false,
          error: 'Email is required'
        });
      }

      const result = await authService.forgotPassword(email);

      res.status(200).json({
        success: true,
        message: 'If an account with this email exists, a password reset OTP has been sent.'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  async changePassword(req, res) {
    try {
      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        return res.status(400).json({
          success: false,
          error: 'Current password and new password are required'
        });
      }

      if (currentPassword === newPassword) {
        return res.status(400).json({
          success: false,
          error: 'New password must be different from current password'
        });
      }

      await authService.changePassword(req.user.userId, currentPassword, newPassword);

      res.status(200).json({
        success: true,
        message: 'Password changed successfully. You will need to login again on all devices.'
      });
    } catch (error) {
      if (error.message === 'Current password is incorrect') {
        return res.status(400).json({
          success: false,
          error: error.message
        });
      }
      
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  async verifyOtp(req, res) {
    try {
      const { email, otp } = req.body;

      if (!email || !otp) {
        return res.status(400).json({
          success: false,
          error: 'Email and OTP are required'
        });
      }

      const result = await authService.verifyOtp(email, otp);

      res.status(200).json({
        success: true,
        message: result.message
      });
    } catch (error) {
      if (error.message === 'User not found') {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }
      
      if (error.message === 'Email is already verified') {
        return res.status(400).json({
          success: false,
          error: 'Email is already verified'
        });
      }
      
      if (error.message === 'No OTP found. Please request a new OTP.') {
        return res.status(400).json({
          success: false,
          error: 'No OTP found. Please request a new OTP.'
        });
      }
      
      if (error.message === 'OTP has expired. Please request a new OTP.') {
        return res.status(400).json({
          success: false,
          error: 'OTP has expired. Please request a new OTP.'
        });
      }
      
      if (error.message === 'Invalid OTP. Please check and try again.') {
        return res.status(400).json({
          success: false,
          error: 'Invalid OTP. Please check and try again.'
        });
      }

      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  async resendVerificationEmail(req, res) {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({
          success: false,
          error: 'Email is required'
        });
      }

      const result = await authService.resendVerificationEmail(email);

      // Send verification email if user exists and is not verified
      if (result.user) {
        try {
          await emailService.sendVerificationEmail(result.user);
        } catch (emailError) {
          console.error('Failed to send verification email:', emailError.message);
          // Don't fail the request for email issues
        }
      }

      res.status(200).json({
        success: true,
        message: result.message
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  async createSupervisor(req, res) {
    // Apply audit middleware
    auditCreateSupervisor(req, res, async () => {
      try {
        const { name, email, password, phone, address } = req.body;

        // Validate password using centralized validator
        validatePassword(password);

        if (!address || address.trim().length === 0) {
          return res.status(400).json({
            success: false,
            error: 'Address is required'
          });
        }

        // Use transaction for supervisor creation
        const result = await withTransaction(async (session) => {
          const existingUser = await User.findOne({ email }).session(session);
          if (existingUser) {
            throw new Error('Email already registered');
          }

          const supervisor = await User.create([{
            name,
            email,
            password,
            phone,
            address: address.trim(),
            role: 'supervisor',
            emailVerified: true,
            status: 'approved'
          }], { session });

          return supervisor[0];
        });

        await emailService.sendApprovalEmail(result);

        res.status(201).json({
          success: true,
          message: 'Supervisor created successfully',
          data: {
            user: result.toJSON()
          }
        });
      } catch (error) {
        res.status(400).json({
          success: false,
          error: error.message
        });
      }
    });
  }
}

module.exports = new AuthController();
