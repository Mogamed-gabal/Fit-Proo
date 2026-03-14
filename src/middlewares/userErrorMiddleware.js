/**
 * 🔒 USER-FRIENDLY ERROR HANDLING MIDDLEWARE
 * Catches all errors and returns user-friendly messages
 */

/**
 * 🔒 SECURITY FIX: Main error handling middleware
 * @param {Error} err - Error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const userErrorHandler = (err, req, res, next) => {
  // Log error for debugging (developers can see this)
  console.error('❌ [ERROR]', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    timestamp: new Date().toISOString()
  });

  // 🔒 SECURITY FIX: Default user-friendly message
  let userMessage = 'Something went wrong. Please try again.';

  // ===== MONGODB / MONGOOSE ERRORS =====
  // Duplicate key error
  if ((err.name === 'MongoServerError' || err.name === 'MongoError') && err.code === 11000) {
    let field = null;

    if (err.keyPattern) {
      field = Object.keys(err.keyPattern)[0];
    } else if (err.keyValue) {
      field = Object.keys(err.keyValue)[0];
    } else if (err.message) {
      const match = err.message.match(/index:\s([a-zA-Z0-9_]+)_1\sdup key/);
      field = match ? match[1] : null;
    }

    if (field === 'email') {
      userMessage = 'Email already registered';
    } else if (field === 'phone') {
      userMessage = 'Phone number already registered';
    } else if (field) {
      userMessage = `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`;
    } else {
      userMessage = 'Duplicate value already exists';
    }
  }
  // Mongoose validation errors
  else if (err.name === 'ValidationError') {
    const firstError = Object.values(err.errors)[0];
    userMessage = firstError ? firstError.message : 'Validation failed';
  }
  // Mongoose cast errors
  else if (err.name === 'CastError') {
    userMessage = 'Invalid data format provided';
  }

  // ===== JWT ERRORS =====
  else if (err.name === 'JsonWebTokenError') {
    userMessage = 'Invalid authentication token';
  }
  else if (err.name === 'TokenExpiredError') {
    userMessage = 'Session expired. Please login again';
  }

  // ===== MULTER FILE UPLOAD ERRORS =====
  else if (err.code === 'LIMIT_FILE_SIZE') {
    userMessage = 'File size too large. Maximum size is 5MB';
  }
  else if (err.code === 'LIMIT_FILE_COUNT') {
    userMessage = 'Too many files uploaded';
  }
  else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    userMessage = 'Unexpected file field';
  }

  // ===== CLOUDINARY ERRORS =====
  else if (err.message && err.message.includes('Cloudinary')) {
    userMessage = 'Image upload failed. Please try again';
  }

  // ===== CUSTOM APPLICATION ERRORS =====
  else if (err.message) {
    const msg = err.message.toLowerCase();
    if (msg.includes('required') || msg.includes('missing') || msg.includes('must')) {
      userMessage = err.message;
    } else if (msg.includes('invalid')) {
      userMessage = err.message;
    } else if (msg.includes('not found')) {
      userMessage = 'Resource not found';
    } else if (msg.includes('unauthorized') || msg.includes('forbidden')) {
      userMessage = 'Access denied';
    }
  }

  // 🔒 SECURITY FIX: Always return consistent JSON format
  res.status(err.statusCode || 500).json({
    success: false,
    error: userMessage
  });
};

/**
 * 🔒 SECURITY FIX: Async error wrapper for controllers
 * This can be used to wrap async controller functions
 * @param {Function} fn - Async function to wrap
 * @returns {Function} Wrapped function
 */
const asyncErrorHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * 🔒 SECURITY FIX: 404 handler for undefined routes
 */
const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found'
  });
};

module.exports = {
  userErrorHandler,
  asyncErrorHandler,
  notFoundHandler
};