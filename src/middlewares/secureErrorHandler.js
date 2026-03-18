/**
 * Secure Error Handler Middleware
 * Prevents internal error details from being exposed
 */

const secureErrorHandler = (err, req, res, next) => {
  // Log full error for debugging (in production, use proper logging)
  if (process.env.NODE_ENV === 'development') {
    console.error('Error details:', {
      message: err.message,
      stack: err.stack,
      name: err.name,
      code: err.code,
      keyPattern: err.keyPattern,
      keyValue: err.keyValue,
      url: req.url,
      method: req.method
    });
  }

  // Determine safe error message
  let userMessage = 'Something went wrong. Please try again.';
  let statusCode = 500;

  // Handle specific error types with user-friendly messages
  if (err.name === 'ValidationError') {
    statusCode = 400;
    userMessage = 'Please check your input data and try again.';
  } else if (err.name === 'CastError') {
    statusCode = 400;
    userMessage = 'Invalid data format provided.';
  } else if (err.name === 'MongoError' || err.name === 'MongoServerError') {
    if (err.code === 11000) {
      statusCode = 400;
      // Extract the field name from the error message
      let field = 'data';
      const errorMessage = err.message || '';
      
      console.log('DEBUG: Duplicate key error:', {
        message: errorMessage,
        keyPattern: err.keyPattern,
        keyValue: err.keyValue
      });
      
      // Check for various patterns of duplicate key errors
      if (errorMessage.includes('phone') || errorMessage.includes('phone_1') || errorMessage.includes('dup key: { phone:')) {
        field = 'Phone number';
      } else if (errorMessage.includes('email') || errorMessage.includes('email_1') || errorMessage.includes('dup key: { email:')) {
        field = 'Email address';
      } else if (err.keyPattern) {
        const duplicateField = Object.keys(err.keyPattern)[0];
        field = duplicateField.charAt(0).toUpperCase() + duplicateField.slice(1);
      } else if (err.keyValue) {
        const duplicateField = Object.keys(err.keyValue)[0];
        field = duplicateField.charAt(0).toUpperCase() + duplicateField.slice(1);
      }
      userMessage = `${field} is already registered. Please use a different one.`;
    } else {
      statusCode = 500;
      userMessage = 'Database operation failed. Please try again later.';
    }
  } else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    userMessage = 'Invalid authentication token. Please login again.';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    userMessage = 'Your session has expired. Please login again.';
  } else if (err.name === 'MulterError') {
    statusCode = 400;
    if (err.code === 'LIMIT_FILE_SIZE') {
      userMessage = 'File size is too large. Maximum size is 5MB.';
    } else if (err.code === 'LIMIT_FILE_COUNT') {
      userMessage = 'Too many files uploaded. Maximum allowed is 7 files.';
    } else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      userMessage = 'Invalid file field. Please check your file uploads.';
    } else {
      userMessage = 'File upload failed. Please check your files and try again.';
    }
  } else if (err.message && err.message.includes('Cloudinary')) {
    statusCode = 503;
    userMessage = 'File upload service is temporarily unavailable. Please try again later.';
  } else if (err.message && err.message.includes('Email')) {
    statusCode = 503;
    userMessage = 'Email service is temporarily unavailable. Please try again later.';
  } else if (err.message && err.message.includes('Verification')) {
    statusCode = 400;
    userMessage = 'Email verification failed. Please check your email and try again.';
  } else if (err.message && err.message.includes('OTP')) {
    statusCode = 400;
    userMessage = 'Invalid or expired verification code. Please request a new one.';
  } else if (err.message && err.message.includes('Account temporarily locked')) {
    statusCode = 423;
    userMessage = 'Account temporarily locked due to too many failed attempts. Please try again later.';
  } else if (err.message && err.message.includes('Invalid credentials')) {
    statusCode = 401;
    userMessage = 'Invalid email or password. Please check your credentials and try again.';
  } else if (err.message && err.message.includes('Email not verified')) {
    statusCode = 403;
    userMessage = 'Please verify your email address before logging in.';
  } else if (err.message && err.message.includes('Account is blocked')) {
    statusCode = 403;
    userMessage = 'Your account has been blocked. Please contact support.';
  } else if (err.message && err.message.includes('User not found')) {
    statusCode = 404;
    userMessage = 'User account not found. Please check your credentials or register.';
  } else if (err.message && err.message.includes('Password')) {
    statusCode = 400;
    userMessage = 'Password does not meet requirements. Please use a stronger password.';
  } else if (err.message && err.message.includes('Age')) {
    statusCode = 400;
    userMessage = 'You must be at least 18 years old to register.';
  } else if (err.message && err.message.includes('File type')) {
    statusCode = 400;
    userMessage = 'Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.';
  }

  // Build safe response
  const response = {
    success: false,
    error: userMessage,
    timestamp: new Date().toISOString()
  };

  // Add request ID for debugging (if available)
  if (req.requestId) {
    response.requestId = req.requestId;
  }

  // Add validation details only in development
  if (process.env.NODE_ENV !== 'production' && err.name === 'ValidationError') {
    response.details = err.details || err.errors;
  }

  res.status(statusCode).json(response);
};

/**
 * 404 handler for undefined routes
 */
const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Resource not found',
    timestamp: new Date().toISOString()
  });
};

module.exports = {
  secureErrorHandler,
  notFoundHandler
};
