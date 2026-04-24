const mongoose = require('mongoose');

/**
 * Supervisor Audit Log Schema
 * Dedicated logging system for supervisor actions across the platform
 * Completely separate from admin audit logging system
 */
const supervisorAuditLogSchema = new mongoose.Schema({
  // Actor information
  actor: {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    name: {
      type: String,
      required: true,
      index: true
    },
    email: {
      type: String,
      required: true,
      index: true
    },
    role: {
      type: String,
      enum: ['supervisor'],
      default: 'supervisor',
      index: true
    }
  },

  // Action information
  action: {
    type: String,
    required: true,
    enum: [
      // User management actions
      'APPROVE_DOCTOR',
      'REJECT_DOCTOR',
      'BLOCK_CLIENT',
      'UNBLOCK_CLIENT',
      'VIEW_CLIENT_DATA',
      'MODIFY_CLIENT_DATA',
      'DELETE_CLIENT_DATA',
      
      // Doctor management actions
      'RESTORE_DOCTOR',
      'VIEW_DOCTOR_PROFILE',
      'UPDATE_DOCTOR_STATUS',
      'VIEW_DOCTOR_CERTIFICATES',
      
      // Diet plan actions
      'CREATE_DIET_PLAN',
      'UPDATE_DIET_PLAN',
      'DELETE_DIET_PLAN',
      'APPROVE_DIET_PLAN',
      'REJECT_DIET_PLAN',
      'VIEW_DIET_PLAN',
      'MODIFY_MEAL_PLANS',
      
      // Progress tracking actions
      'VIEW_CLIENT_PROGRESS',
      'UPDATE_CLIENT_PROGRESS',
      'DELETE_PROGRESS_DATA',
      'EXPORT_PROGRESS_REPORT',
      
      // System access actions
      'LOGIN_SUPERVISOR_PANEL',
      'ACCESS_ADMIN_FEATURES',
      'VIEW_SENSITIVE_DATA',
      'EXPORT_USER_DATA',
      'VIEW_SYSTEM_REPORTS',
      
      // Configuration actions
      'UPDATE_SETTINGS',
      'MODIFY_PERMISSIONS',
      'CHANGE_USER_ROLES',
      'SYSTEM_CONFIGURATION'
    ],
    index: true
  },

  // Module/feature affected
  module: {
    type: String,
    required: true,
    enum: [
      'DOCTORS',
      'CLIENTS',
      'DIET_PLANS',
      'DIET_PROGRESS',
      'USER_MANAGEMENT',
      'SYSTEM_ACCESS',
      'REPORTS',
      'SETTINGS',
      'DATA_EXPORT',
      'SECURITY'
    ],
    index: true
  },

  // Target entity details
  target: {
    entityType: {
      type: String,
      enum: ['USER', 'DOCTOR', 'CLIENT', 'DIET_PLAN', 'PROGRESS', 'SETTINGS', 'REPORT'],
      index: true
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      index: true
    },
    entityName: {
      type: String,
      index: true
    },
    previousState: {
      type: mongoose.Schema.Types.Mixed
    },
    newState: {
      type: mongoose.Schema.Types.Mixed
    }
  },

  // Detailed context
  context: {
    description: {
      type: String,
      required: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters']
    },
    reason: {
      type: String,
      maxlength: [500, 'Reason cannot exceed 500 characters']
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },

  // Technical details
  technical: {
    ipAddress: {
      type: String,
      index: true
    },
    userAgent: {
      type: String
    },
    sessionId: {
      type: String,
      index: true
    },
    endpoint: {
      type: String,
      index: true
    },
    method: {
      type: String,
      enum: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']
    },
    duration: {
      type: Number, // milliseconds
      default: 0
    }
  },

  // Result and outcome
  outcome: {
    status: {
      type: String,
      enum: ['SUCCESS', 'FAILURE', 'PARTIAL', 'PENDING'],
      default: 'SUCCESS',
      index: true
    },
    message: {
      type: String,
      maxlength: [1000, 'Message cannot exceed 1000 characters']
    },
    errorCode: {
      type: String
    }
  },

  // Timestamps and environment
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  environment: {
    type: String,
    enum: ['development', 'staging', 'production'],
    default: 'development',
    index: true
  },

  // Data management
  isArchived: {
    type: Boolean,
    default: false,
    index: true
  },
  archivedAt: {
    type: Date,
    index: true
  },
  archivedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  collection: 'supervisor_audit_logs'
});

// Performance indexes
supervisorAuditLogSchema.index({ 'actor.userId': 1, action: 1, timestamp: -1 });
supervisorAuditLogSchema.index({ module: 1, action: 1, timestamp: -1 });
supervisorAuditLogSchema.index({ 'target.entityType': 1, 'target.entityId': 1, timestamp: -1 });
supervisorAuditLogSchema.index({ 'outcome.status': 1, timestamp: -1 });
supervisorAuditLogSchema.index({ environment: 1, timestamp: -1 });
supervisorAuditLogSchema.index({ 'technical.ipAddress': 1, timestamp: -1 });

// Static methods for queries
supervisorAuditLogSchema.statics.findBySupervisor = function(supervisorId, options = {}) {
  const query = {
    'actor.userId': supervisorId,
    isArchived: false
  };

  if (options.action) query.action = options.action;
  if (options.module) query.module = options.module;
  if (options.status) query['outcome.status'] = options.status;
  if (options.dateFrom) query.timestamp = { $gte: options.dateFrom };
  if (options.dateTo) query.timestamp = { $lte: options.dateTo };

  return this.find(query)
    .sort({ timestamp: -1 })
    .skip(options.skip || 0)
    .limit(options.limit || 100);
};

supervisorAuditLogSchema.statics.findByAction = function(action, options = {}) {
  const query = {
    action: action,
    isArchived: false
  };

  if (options.supervisorId) query['actor.userId'] = options.supervisorId;
  if (options.dateFrom) query.timestamp = { $gte: options.dateFrom };
  if (options.dateTo) query.timestamp = { $lte: options.dateTo };

  return this.find(query)
    .sort({ timestamp: -1 })
    .skip(options.skip || 0)
    .limit(options.limit || 100);
};

supervisorAuditLogSchema.statics.getSupervisorActivity = function(options = {}) {
  const matchStage = {
    isArchived: false
  };

  if (options.supervisorId) {
    matchStage['actor.userId'] = mongoose.Types.ObjectId(options.supervisorId);
  }
  if (options.dateFrom) {
    matchStage.timestamp = { $gte: options.dateFrom };
  }
  if (options.dateTo) {
    matchStage.timestamp = { $lte: options.dateTo };
  }

  return this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: {
          supervisor: '$actor.userId',
          action: '$action',
          module: '$module',
          status: '$outcome.status'
        },
        count: { $sum: 1 },
        lastActivity: { $max: '$timestamp' },
        avgDuration: { $avg: '$technical.duration' }
      }
    },
    { $sort: { lastActivity: -1 } }
  ]);
};

// Pre-save middleware
supervisorAuditLogSchema.pre('save', function(next) {
  if (!this.timestamp) {
    this.timestamp = new Date();
  }
  
  if (!this.environment) {
    this.environment = process.env.NODE_ENV || 'development';
  }
  
  next();
});

// Virtual fields
supervisorAuditLogSchema.virtual('id').get(function() {
  return this._id;
});

// JSON transformation
supervisorAuditLogSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.model('SupervisorAuditLog', supervisorAuditLogSchema);
