const winston = require('winston');

// Configure winston logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'profile-service' },
  transports: [
    new winston.transports.File({ filename: 'logs/profile-error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/profile-combined.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

// Production-safe error handler
const profileErrorHandler = (err, req, res, next) => {
  // Log the full error for debugging
  logger.error('Profile Error', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    userId: req.user?.userId,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  });

  // Determine if this is a known error type
  let userMessage = 'Something went wrong. Please try again later.';
  let statusCode = 500;

  // Validation errors
  if (err.name === 'ValidationError') {
    statusCode = 400;
    userMessage = 'Invalid input data provided';
  }

  // Multer errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    statusCode = 413;
    userMessage = 'File size too large. Maximum size is 5MB';
  }

  if (err.code === 'LIMIT_FILE_COUNT') {
    statusCode = 400;
    userMessage = 'Too many files uploaded';
  }

  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    statusCode = 400;
    userMessage = 'Unexpected file field';
  }

  // Cloudinary errors
  if (err.message && err.message.includes('Cloudinary')) {
    statusCode = 503;
    userMessage = 'File upload service unavailable. Please try again later';
  }

  // MongoDB errors
  if (err.name === 'CastError') {
    statusCode = 400;
    userMessage = 'Invalid data format';
  }

  if (err.name === 'MongoError' || err.name === 'MongoServerError') {
    statusCode = 500;
    userMessage = 'Database error occurred';
  }

  // Permission errors
  if (err.message && err.message.includes('permission')) {
    statusCode = 403;
    userMessage = 'Insufficient permissions';
  }

  // Rate limiting errors
  if (statusCode === 429) {
    userMessage = err.message || 'Too many requests. Please try again later';
  }

  // In production, don't expose internal error details
  const response = {
    success: false,
    error: userMessage,
    timestamp: new Date().toISOString()
  };

  // Add error code for client handling
  if (process.env.NODE_ENV !== 'production') {
    response.debug = {
      message: err.message,
      stack: err.stack,
      code: err.code
    };
  }

  // Add request ID if available
  if (req.requestId) {
    response.requestId = req.requestId;
  }

  res.status(statusCode).json(response);
};

// Async error wrapper
const asyncProfileHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Request logger middleware
const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    
    logger.info('Profile Request', {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      userId: req.user?.userId,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      timestamp: new Date().toISOString()
    });
  });

  next();
};

// Security event logger
const securityLogger = (event, details) => {
  logger.warn('Security Event', {
    event,
    ...details,
    timestamp: new Date().toISOString()
  });
};

module.exports = {
  profileErrorHandler,
  asyncProfileHandler,
  requestLogger,
  securityLogger,
  logger
};
