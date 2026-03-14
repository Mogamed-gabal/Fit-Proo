const authService = require('../services/authService');
const User = require('../models/User');
const { isAdministrativeRole, hasPermission } = require('../utils/adminHelpers');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Access token required'
      });
    }

    const token = authHeader.substring(7);
    
    // 🔒 SECURITY FIX: Use enhanced token verification with blacklist check
    const decoded = await authService.verifyAccessToken(token);
    
    // 🔒 PERFORMANCE FIX: Use lean() for better performance
    const user = await User.findById(decoded.userId).lean();
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'User not found'
      });
    }

    if (user.isBlocked) {
      return res.status(401).json({
        success: false,
        error: 'Account is blocked'
      });
    }

    if (!user.emailVerified) {
      return res.status(401).json({
        success: false,
        message: 'Email not verified'
      });
    }

    // 🔒 SECURITY FIX: Include additional user info in request
    req.user = {
      userId: user._id,
      role: user.role,
      email: user.email,
      sessionId: decoded.sessionId,
      jti: decoded.jti // 🔒 SECURITY FIX: Add JWT ID for potential logout
    };

    next();
  } catch (error) {
    // 🔒 SECURITY FIX: Provide specific error messages without revealing too much
    let errorMessage = 'Authentication failed';
    
    if (error.message === 'Token has been revoked') {
      errorMessage = 'Token has been revoked';
    } else if (error.message === 'Token expired') {
      errorMessage = 'Token expired';
    } else if (error.message === 'Invalid token') {
      errorMessage = 'Invalid token';
    }
    
    res.status(401).json({
      success: false,
      error: errorMessage
    });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions'
      });
    }

    next();
  };
};

const adminOnly = (req, res, next) => {
  const adminKey = req.headers['x-admin-key'];
  
  if (!adminKey || adminKey !== process.env.ADMIN_KEY) {
    return res.status(403).json({
      success: false,
      error: 'Admin access required'
    });
  }

  next();
};

const restrictToAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required'
    });
  }

  if (!hasPermission(req.user, 'access_admin_panel')) {
    return res.status(403).json({
      success: false,
      error: 'Admin access required'
    });
  }

  next();
};

const restrictToSupervisor = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required'
    });
  }

  if (!hasPermission(req.user, 'access_supervisor_panel')) {
    return res.status(403).json({
      success: false,
      error: 'Supervisor access required'
    });
  }

  next();
};

const restrictToSuperAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required'
    });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: 'Admin access required'
    });
  }

  next();
};

module.exports = {
  authenticate,
  authorize,
  adminOnly,
  restrictToAdmin,
  restrictToSupervisor,
  restrictToSuperAdmin
};
