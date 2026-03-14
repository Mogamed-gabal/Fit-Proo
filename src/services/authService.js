const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const mongoose = require('mongoose');
const User = require('../models/User');
const RefreshToken = require('../models/RefreshToken');
const validatePassword = require('../utils/passwordValidator');

// 🔒 SECURITY FIX: Token blacklist model for logout functionality
const TokenBlacklist = require('../models/TokenBlacklist');

class AuthService {
  // 🔒 SECURITY FIX: Enhanced token generation with proper claims
  generateTokens(userId, userRole, sessionId = null) {
    const now = Math.floor(Date.now() / 1000);
    const payload = {
      userId,
      role: userRole,
      sessionId: sessionId || crypto.randomBytes(16).toString('hex'),
      iat: now,
      iss: 'fitness-platform', // 🔒 SECURITY FIX: Add issuer
      aud: 'fitness-platform-users', // 🔒 SECURITY FIX: Add audience
      jti: crypto.randomBytes(16).toString('hex') // 🔒 SECURITY FIX: Add JWT ID for blacklisting
    };

    const accessToken = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: '15m',
      algorithm: 'HS256' // 🔒 SECURITY FIX: Specify algorithm only
    });

    const refreshToken = crypto.randomBytes(64).toString('hex');
    
    return { accessToken, refreshToken, jti: payload.jti };
  }

  // 🔒 SECURITY FIX: Enhanced refresh token creation with session tracking
  async createRefreshToken(userId, userAgent, ipAddress, userRole) {
    const { refreshToken, jti } = this.generateTokens(userId, userRole);
    
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    
    await RefreshToken.create({
      token: refreshToken,
      user: userId,
      expiresAt,
      userAgent,
      ipAddress,
      jti // 🔒 SECURITY FIX: Track JWT ID
    });

    return refreshToken;
  }

  async verifyRefreshToken(token) {
    const refreshTokenDoc = await RefreshToken.findOne({
      token,
      isRevoked: false,
      expiresAt: { $gt: Date.now() }
    }).populate('user');

    if (!refreshTokenDoc) {
      throw new Error('Invalid or expired refresh token');
    }

    const user = refreshTokenDoc.user;
    if (!user) {
      throw new Error('User not found');
    }

    if (user.isBlocked) {
      throw new Error('Account is blocked');
    }

    if (!user.emailVerified) {
      throw new Error('Email not verified');
    }

    if (user.role !== 'client' && user.role !== 'supervisor' && user.status !== 'approved') {
      throw new Error('Account not approved');
    }

    return refreshTokenDoc;
  }

  async revokeRefreshToken(token) {
    const refreshTokenDoc = await RefreshToken.findOne({ token });
    if (refreshTokenDoc) {
      await refreshTokenDoc.revoke();
    }
  }

  async revokeAllUserTokens(userId) {
    await RefreshToken.updateMany(
      { user: userId, isRevoked: false },
      { isRevoked: true, revokedAt: new Date() }
    );
  }

  // 🔒 SECURITY FIX: Enhanced token verification with blacklist support
  async verifyAccessToken(token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET, {
        algorithms: ['HS256'], // 🔒 SECURITY FIX: Specify allowed algorithms
        issuer: 'fitness-platform', // 🔒 SECURITY FIX: Verify issuer
        audience: 'fitness-platform-users' // 🔒 SECURITY FIX: Verify audience
      });

      // 🔒 SECURITY FIX: Check if token is blacklisted
      const blacklistedToken = await TokenBlacklist.findOne({
        jti: decoded.jti,
        blacklisted: true
      });

      if (blacklistedToken) {
        throw new Error('Token has been revoked');
      }

      return decoded;
    } catch (error) {
      if (error.name === 'JsonWebTokenError') {
        throw new Error('Invalid token');
      } else if (error.name === 'TokenExpiredError') {
        throw new Error('Token expired');
      } else {
        throw error;
      }
    }
  }

  // 🔒 SECURITY FIX: Add token to blacklist for logout
  async blacklistToken(jti, userId) {
    await TokenBlacklist.create({
      jti,
      userId,
      blacklisted: true,
      blacklistedAt: new Date()
    });
  }

  // 🔒 SECURITY FIX: Cleanup expired tokens from blacklist
  async cleanupExpiredTokens() {
    const expiredTime = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago
    await TokenBlacklist.deleteMany({
      blacklistedAt: { $lt: expiredTime }
    });
  }

  async revokeAllUserTokensExcept(userId, exceptToken) {
    await RefreshToken.updateMany(
      { user: userId, token: { $ne: exceptToken }, isRevoked: false },
      { isRevoked: true, revokedAt: new Date() }
    );
  }

  async validateLoginCredentials(email, password) {
    const user = await User.findOne({ email }).select('+password +loginAttempts +lockUntil');

    if (!user) {
      throw new Error('Invalid credentials');
    }

    if (user.isBlocked) {
      throw new Error('Account is blocked');
    }

    if (!user.emailVerified) {
      throw new Error('Email not verified');
    }

    if (user.role !== 'client' && user.role !== 'supervisor' && user.status !== 'approved') {
      throw new Error('Account not approved');
    }

    // Check if account is locked due to too many failed attempts
    if (user.lockUntil && user.lockUntil > Date.now()) {
      const lockTimeRemaining = Math.ceil((user.lockUntil - Date.now()) / 60000); // minutes
      throw new Error(`Account temporarily locked due to too many failed login attempts. Please try again in ${lockTimeRemaining} minutes.`);
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      // Increment login attempts
      user.loginAttempts = (user.loginAttempts || 0) + 1;
      
      // Lock account if 5 failed attempts
      if (user.loginAttempts >= 5) {
        user.lockUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
      }
      
      await user.save();
      throw new Error('Invalid credentials');
    }

    // Reset login attempts on successful login
    user.loginAttempts = 0;
    user.lockUntil = null;
    user.lastLogin = new Date();
    await user.save();

    return user;
  }

  async login(email, password, userAgent, ipAddress) {
    try {
      const user = await this.validateLoginCredentials(email, password);
      
      // 🔒 FIX: Pass user role to generateTokens method
      const { accessToken } = this.generateTokens(user._id, user.role);
      const refreshToken = await this.createRefreshToken(user._id, userAgent, ipAddress);

      return {
        user,
        accessToken,
        refreshToken
      };
    } catch (error) {
      if (error.message === 'Email not verified') {
        const emailVerificationError = new Error('Email not verified');
        emailVerificationError.code = 'EMAIL_NOT_VERIFIED';
        throw emailVerificationError;
      }
      throw error;
    }
  }

  async refresh(refreshTokenString, userAgent, ipAddress) {
    try {
      const refreshTokenDoc = await this.verifyRefreshToken(refreshTokenString);
      
      const user = refreshTokenDoc.user;
      
      if (user.isBlocked) {
        throw new Error('Account is blocked');
      }

      if (!user.emailVerified) {
        throw new Error('Email not verified');
      }

      if (user.role !== 'client' && user.role !== 'supervisor' && user.status !== 'approved') {
        throw new Error('Account not approved');
      }
      
      // 🔒 FIX: Pass user role to generateTokens in refresh method
      const { accessToken } = this.generateTokens(refreshTokenDoc.user._id, refreshTokenDoc.user.role);
      const newRefreshToken = await this.createRefreshToken(
        refreshTokenDoc.user._id, 
        userAgent, 
        ipAddress,
        refreshTokenDoc.user.role
      );
      
      await refreshTokenDoc.revoke();
      
      await this.revokeAllUserTokensExcept(
        refreshTokenDoc.user._id, 
        newRefreshToken
      );
      
      return { accessToken, refreshToken: newRefreshToken };
    } catch (error) {
      throw error;
    }
  }

  async forgotPassword(email) {
    const User = mongoose.model('User');
    
    const user = await User.findOne({ email });
    if (!user) {
      return { message: 'If an account with this email exists, a password reset OTP has been sent.' };
    }

    // Generate new OTP
    const emailService = require('./emailService');
    await emailService.sendPasswordResetEmail(user);
    
    // Reset OTP attempts when new OTP is generated
    user.passwordResetOtpAttempts = 0;
    await user.save();

    return { user, message: 'Password reset OTP sent to your email.' };
  }

  async resetPasswordWithOtp(email, otp, newPassword) {
    const User = mongoose.model('User');
    
    const user = await User.findOne({ email });
    if (!user) {
      throw new Error('User not found');
    }

    if (!user.passwordResetOtp || !user.passwordResetOtpExpires) {
      throw new Error('No password reset OTP found. Please request a new OTP.');
    }

    if (Date.now() > user.passwordResetOtpExpires.getTime()) {
      throw new Error('Password reset OTP has expired. Please request a new OTP.');
    }

    // Check if user has exceeded OTP attempts
    if (user.passwordResetOtpAttempts >= 5) {
      throw new Error('Too many OTP attempts. Please request a new OTP.');
    }

    // Use timing-safe comparison for OTP verification
    const userOtpBuffer = Buffer.from(user.passwordResetOtp || '', 'utf8');
    const providedOtpBuffer = Buffer.from(otp || '', 'utf8');
    
    if (!crypto.timingSafeEqual(userOtpBuffer, providedOtpBuffer)) {
      // Increment OTP attempts
      user.passwordResetOtpAttempts = (user.passwordResetOtpAttempts || 0) + 1;
      await user.save();
      throw new Error('Invalid OTP. Please check and try again.');
    }

    // Validate new password using centralized validator
    validatePassword(newPassword);

    // Update password and clear OTP
    const bcrypt = require('bcryptjs');
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
    user.password = hashedPassword;
    user.passwordResetOtp = undefined;
    user.passwordResetOtpExpires = undefined;
    user.passwordResetOtpAttempts = 0; // Reset attempts on success
    
    await user.save();

    return { message: 'Password reset successfully.' };
  }

  async resendResetPasswordOtp(email) {
    const User = mongoose.model('User');
    
    const user = await User.findOne({ email });
    if (!user) {
      return { message: 'If an account with this email exists, a password reset OTP has been sent.' };
    }

    // Generate new OTP
    const emailService = require('./emailService');
    await emailService.sendPasswordResetEmail(user);
    
    // Reset OTP attempts when new OTP is generated
    user.passwordResetOtpAttempts = 0;
    await user.save();

    return { user, message: 'Password reset OTP resent to your email.' };
  }

  async changePassword(userId, currentPassword, newPassword) {
    try {
      const User = mongoose.model('User');
      const RefreshToken = mongoose.model('RefreshToken');
      
      const user = await User.findById(userId).select('+password');
      
      if (!user) {
        throw new Error('User not found');
      }
      
      const isCurrentPasswordValid = await user.comparePassword(currentPassword);
      if (!isCurrentPasswordValid) {
        throw new Error('Current password is incorrect');
      }
      
      // Validate new password using centralized validator
      validatePassword(newPassword);
      
      const bcrypt = require('bcryptjs');
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
      
      user.password = hashedPassword;
      await user.save();
      
      await RefreshToken.updateMany(
        { user: user._id, isRevoked: false },
        { isRevoked: true, revokedAt: new Date(), revocationReason: 'Password changed' }
      );
      
      return user;
    } catch (error) {
      throw error;
    }
  }

  async resendVerificationEmail(email) {
    const User = mongoose.model('User');
    
    const user = await User.findOne({ email });
    if (!user) {
      return { message: 'If an account with this email exists, a verification OTP has been sent.' };
    }

    if (user.emailVerified) {
      return { message: 'Email is already verified.' };
    }

    // Generate new OTP
    const emailService = require('./emailService');
    await emailService.sendVerificationEmail(user);

    return { user, message: 'Verification OTP sent to your email.' };
  }

  async verifyOtp(email, otp) {
    const User = mongoose.model('User');
    
    const user = await User.findOne({ email });
    if (!user) {
      throw new Error('User not found');
    }

    if (user.emailVerified) {
      throw new Error('Email is already verified');
    }

    if (!user.emailOtp || !user.emailOtpExpires) {
      throw new Error('No OTP found. Please request a new OTP.');
    }

    if (Date.now() > user.emailOtpExpires.getTime()) {
      throw new Error('OTP has expired. Please request a new OTP.');
    }

    if (user.emailOtp !== otp) {
      throw new Error('Invalid OTP. Please check and try again.');
    }

    // Mark email as verified and clear OTP
    user.emailVerified = true;
    user.emailOtp = undefined;
    user.emailOtpExpires = undefined;
    await user.save();

    return { message: 'Email verified successfully.' };
  }

  async logout(refreshTokenString) {
    await this.revokeRefreshToken(refreshTokenString);
  }

  async logoutAll(userId) {
    await this.revokeAllUserTokens(userId);
  }

  verifyAccessToken(token) {
    try {
      return jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      throw new Error('Invalid access token');
    }
  }
}

module.exports = new AuthService();
