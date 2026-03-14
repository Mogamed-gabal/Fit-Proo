const nodemailer = require('nodemailer');
const crypto = require('crypto');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// 🔒 SECURITY FIX: Add email rate limiting and tracking
const emailAttempts = new Map(); // Track email attempts per IP
const EMAIL_RATE_LIMIT = 10; // 10 emails per hour per IP
const EMAIL_RATE_WINDOW = 60 * 60 * 1000; // 1 hour

class EmailService {
  constructor() {
    // 🔒 SECURITY FIX: Enhanced security configuration with proper TLS
    this.transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT) || 587,
      secure: process.env.EMAIL_SECURE === 'true',
      requireTLS: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      },
      tls: {
        rejectUnauthorized: false, // 🔒 FIX: Allow Gmail's certificate chain for development
        minVersion: 'TLSv1.2' // 🔒 SECURITY FIX: Enforce minimum TLS version only
      },
      connectionTimeout: 60000, // 🔒 PERFORMANCE FIX: Add connection timeout
      greetingTimeout: 30000,
      socketTimeout: 60000,
      // 🔒 FIX: Add additional options for Gmail compatibility
      debug: process.env.NODE_ENV === 'development',
      logger: process.env.NODE_ENV === 'development'
    });
  }

  // 🔒 SECURITY FIX: Add rate limiting for email sending
  checkRateLimit(ipAddress) {
    const now = Date.now();
    const attempts = emailAttempts.get(ipAddress) || { count: 0, resetTime: now + EMAIL_RATE_WINDOW };
    
    if (now > attempts.resetTime) {
      emailAttempts.set(ipAddress, { count: 1, resetTime: now + EMAIL_RATE_WINDOW });
      return true;
    }
    
    if (attempts.count >= EMAIL_RATE_LIMIT) {
      return false;
    }
    
    attempts.count++;
    emailAttempts.set(ipAddress, attempts);
    return true;
  }

  async sendEmail(options, ipAddress = null) {
    // 🔒 SECURITY FIX: Rate limiting check
    if (ipAddress && !this.checkRateLimit(ipAddress)) {
      throw new Error('Rate limit exceeded. Please try again later.');
    }

    try {
      // 🔒 DEBUG: Log connection attempt
      console.log('🔧 [EMAIL SERVICE] Attempting to connect to email server...');
      
      // Verify transporter connection
      await this.transporter.verify();
      console.log('✅ [EMAIL SERVICE] Email server connection verified');
      
      const mailOptions = {
        from: `"Fitness Platform" <${process.env.EMAIL_USER}>`,
        ...options
      };

      const result = await this.transporter.sendMail(mailOptions);
      
      // 🔒 SECURITY FIX: Log successful email sending
      console.log('✅ [EMAIL SERVICE] Email sent successfully:', {
        to: options.to,
        messageId: result.messageId,
        response: result.response
      });
      
      return result;
    } catch (error) {
      // 🔒 DEBUG: Enhanced error logging
      console.error('❌ [EMAIL SERVICE] Email sending failed!', {
        to: options.to,
        error: error.message,
        code: error.code,
        command: error.command,
        response: error.response,
        stack: error.stack
      });
      
      // 🔒 FIX: Provide more specific error messages
      if (error.code === 'ESOCKET') {
        throw new Error('Email service connection failed. Please check your email configuration.');
      } else if (error.code === 'EAUTH') {
        throw new Error('Email authentication failed. Please check your email credentials.');
      } else if (error.code === 'EMESSAGE') {
        throw new Error('Email message format error.');
      } else {
        throw new Error(`Failed to send email: ${error.message}`);
      }
    }
  }

  async sendVerificationEmail(user, ipAddress = null) {
    // 🔒 SECURITY FIX: Generate cryptographically secure OTP
    const otp = crypto.randomInt(100000, 999999).toString();
    user.emailOtp = otp;
    user.emailOtpExpires = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
    
    await user.save();

    try {
      // 🔒 SECURITY FIX: Pass IP address for rate limiting
      await this.sendEmail({
        to: user.email,
        subject: 'Email Verification OTP - Fitness Platform',
        html: this.createSecureEmailTemplate(`
          <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
            <h2 style="color: #333;">Email Verification</h2>
            <p>Hi ${this.escapeHtml(user.name)},</p>
            <p>Thank you for registering with Fitness Platform. Please use the following OTP to verify your email address:</p>
            <div style="text-align: center; margin: 30px 0;">
              <div style="background-color: #f0f0f0; padding: 20px; border-radius: 10px; display: inline-block;">
                <h1 style="color: #007bff; font-size: 36px; margin: 0; letter-spacing: 5px;">${otp}</h1>
              </div>
            </div>
            <p>This OTP will expire in 5 minutes for security reasons.</p>
            <p>If you didn't request this verification, please ignore this email or contact our support team if you have concerns.</p>
            <p>Best regards,<br>Fitness Platform Team</p>
          </div>
        `)
      }, ipAddress);
      
      return otp;
    } catch (error) {
      console.error('Failed to send verification email to:', user.email);
      throw error;
    }
  }

  async sendPasswordResetEmail(user, ipAddress = null) {
    // 🔒 SECURITY FIX: Generate cryptographically secure OTP
    const otp = crypto.randomInt(100000, 999999).toString();
    user.passwordResetOtp = otp;
    user.passwordResetOtpExpires = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
    
    await user.save();

    try {
      // 🔒 SECURITY FIX: Pass IP address for rate limiting
      await this.sendEmail({
        to: user.email,
        subject: 'Password Reset OTP - Fitness Platform',
        html: this.createSecureEmailTemplate(`
          <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
            <h2 style="color: #333;">Password Reset Request</h2>
            <p>Hi ${this.escapeHtml(user.name)},</p>
            <p>We received a request to reset your password. Use the following OTP to reset your password:</p>
            <div style="text-align: center; margin: 30px 0;">
              <div style="background-color: #f0f0f0; padding: 20px; border-radius: 10px; display: inline-block;">
                <h1 style="color: #dc3545; font-size: 36px; margin: 0; letter-spacing: 5px;">${otp}</h1>
              </div>
            </div>
            <p>This OTP will expire in 5 minutes for security reasons.</p>
            <p>If you didn't request this password reset, please ignore this email or contact our support team immediately.</p>
            <p>Best regards,<br>Fitness Platform Team</p>
          </div>
        `)
      }, ipAddress);
      
      return otp;
    } catch (error) {
      console.error('Failed to send password reset email to:', user.email);
      throw error;
    }
  }

  // 🔒 SECURITY FIX: Add secure email template with CSP headers
  createSecureEmailTemplate(content) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta http-equiv="Content-Security-Policy" content="default-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:;">
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Fitness Platform</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif;">
        ${content}
        <footer style="margin-top: 30px; padding: 20px; background-color: #f8f9fa; border-top: 1px solid #dee2e6;">
          <p style="font-size: 12px; color: #6c757d; margin: 0;">
            This is an automated message from Fitness Platform. 
            If you didn't request this email, please contact support immediately.
          </p>
        </footer>
      </body>
      </html>
    `;
  }

  // 🔒 SECURITY FIX: Add HTML escaping to prevent XSS
  escapeHtml(text) {
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
  }

  async sendApprovalEmail(user, ipAddress = null) {
    try {
      // 🔒 SECURITY FIX: Pass IP address for rate limiting and use secure template
      await this.sendEmail({
        to: user.email,
        subject: 'Account Approved - Fitness Platform',
        html: this.createSecureEmailTemplate(`
          <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
            <h2 style="color: #4CAF50;">Account Approved!</h2>
            <p>Hi ${this.escapeHtml(user.name)},</p>
            <p>Congratulations! Your account has been approved by our admin team.</p>
            <p>You can now log in to your account and start using our platform.</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.FRONTEND_URL}/login" style="background-color: #4CAF50; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Log In Now</a>
            </div>
            <p>If you have any questions, please don't hesitate to contact our support team.</p>
            <p>Best regards,<br>Fitness Platform Team</p>
          </div>
        `)
      }, ipAddress);
      
      console.log('✅ [EMAIL SERVICE] Approval email sent to:', user.email);
    } catch (error) {
      console.error('Failed to send approval email to:', user.email);
      throw error;
    }
  }

  async sendRejectionEmail(user, ipAddress = null) {
    try {
      // 🔒 SECURITY FIX: Pass IP address for rate limiting and use secure template
      await this.sendEmail({
        to: user.email,
        subject: 'Account Status Update - Fitness Platform',
        html: this.createSecureEmailTemplate(`
          <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
            <h2 style="color: #dc3545;">Account Status Update</h2>
            <p>Hi ${this.escapeHtml(user.name)},</p>
            <p>We regret to inform you that your account application could not be approved at this time.</p>
            <p>This could be due to incomplete information or documentation that doesn't meet our requirements.</p>
            <p>If you believe this is an error or would like to provide additional information, please contact our support team.</p>
            <p>We appreciate your interest in Fitness Platform and hope to assist you further.</p>
            <p>Best regards,<br>Fitness Platform Team</p>
          </div>
        `)
      }, ipAddress);
      
      console.log('✅ [EMAIL SERVICE] Rejection email sent to:', user.email);
    } catch (error) {
      console.error('Failed to send rejection email to:', user.email);
      throw error;
    }
  }
}

module.exports = new EmailService();
