const rateLimit = require('express-rate-limit');

// Different rate limits for different operations
const profileRateLimits = {
  // General profile operations - more restrictive
  general: rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 50, // 50 requests per 15 minutes
    message: {
      success: false,
      error: 'Too many profile requests. Please try again later.',
      retryAfter: '15 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      res.status(429).json({
        success: false,
        error: 'Too many profile requests. Please try again later.',
        retryAfter: '15 minutes'
      });
    }
  }),

  // File upload operations - very restrictive
  fileUpload: rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10, // 10 file uploads per hour
    message: {
      success: false,
      error: 'Too many file upload attempts. Please try again later.',
      retryAfter: '1 hour'
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      res.status(429).json({
        success: false,
        error: 'Too many file upload attempts. Please try again later.',
        retryAfter: '1 hour'
      });
    }
  }),

  // Weight operations - moderate restriction
  weight: rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 30, // 30 weight operations per hour
    message: {
      success: false,
      error: 'Too many weight tracking requests. Please try again later.',
      retryAfter: '1 hour'
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      res.status(429).json({
        success: false,
        error: 'Too many weight tracking requests. Please try again later.',
        retryAfter: '1 hour'
      });
    }
  }),

  // Certificate operations - very restrictive
  certificate: rateLimit({
    windowMs: 24 * 60 * 60 * 1000, // 24 hours
    max: 5, // 5 certificate operations per day
    message: {
      success: false,
      error: 'Too many certificate operations. Please try again later.',
      retryAfter: '24 hours'
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      res.status(429).json({
        success: false,
        error: 'Too many certificate operations. Please try again later.',
        retryAfter: '24 hours'
      });
    }
  }),

  // Package/Bio updates - moderate restriction
  contentUpdate: rateLimit({
    windowMs: 30 * 60 * 1000, // 30 minutes
    max: 20, // 20 content updates per 30 minutes
    message: {
      success: false,
      error: 'Too many profile update requests. Please try again later.',
      retryAfter: '30 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      res.status(429).json({
        success: false,
        error: 'Too many profile update requests. Please try again later.',
        retryAfter: '30 minutes'
      });
    }
  })
};

// Middleware to apply appropriate rate limit based on endpoint
const applyProfileRateLimit = (type) => {
  return (req, res, next) => {
    const limiter = profileRateLimits[type] || profileRateLimits.general;
    return limiter(req, res, next);
  };
};

module.exports = {
  applyProfileRateLimit,
  profileRateLimits
};
