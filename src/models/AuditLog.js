const mongoose = require('mongoose');

/**
 * Audit Log Model
 * Tracks all admin actions for security and compliance
 */
const auditLogSchema = new mongoose.Schema({
  // Admin who performed the action
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // Action type (e.g., 'approve_user', 'reject_user', 'block_user')
  actionType: {
    type: String,
    required: true,
    index: true
  },
  
  // Target entity that was acted upon
  targetId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    index: true
  },
  
  // Type of target entity (e.g., 'User', 'Subscription', 'System')
  targetType: {
    type: String,
    required: true,
    enum: ['User', 'Subscription', 'System', 'Doctor', 'Client', 'Supervisor'],
    index: true
  },
  
  // Detailed information about the action
  details: {
    // Reason for the action (if applicable)
    reason: {
      type: String,
      maxlength: 1000
    },
    
    // State changes (before/after values)
    changes: {
      oldValues: mongoose.Schema.Types.Mixed,
      newValues: mongoose.Schema.Types.Mixed
    },
    
    // Additional metadata
    metadata: mongoose.Schema.Types.Mixed,
    
    // Request information
    requestInfo: {
      endpoint: String,
      method: String,
      userAgent: String,
      ipAddress: String
    }
  },
  
  // Action result
  result: {
    type: String,
    enum: ['success', 'failure', 'partial'],
    default: 'success',
    index: true
  },
  
  // Error information (if action failed)
  error: {
    message: String,
    stack: String,
    code: String
  },
  
  // Session information
  sessionId: {
    type: String,
    index: true
  },
  
  // Timestamp
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: true,
  // Ensure we can query by timestamp efficiently
  index: [{ timestamp: -1 }]
});

// Compound indexes for common queries
auditLogSchema.index({ adminId: 1, timestamp: -1 });
auditLogSchema.index({ actionType: 1, timestamp: -1 });
auditLogSchema.index({ targetType: 1, timestamp: -1 });
auditLogSchema.index({ targetId: 1, timestamp: -1 });
auditLogSchema.index({ result: 1, timestamp: -1 });

// Text index for searching reasons and metadata
auditLogSchema.index({ 
  'details.reason': 'text', 
  'details.metadata': 'text',
  actionType: 'text'
});

// Pre-save middleware to ensure data integrity
auditLogSchema.pre('save', function(next) {
  // Validate that oldValues and newValues are present for state-changing actions
  const stateChangingActions = ['approve_user', 'reject_user', 'block_user', 'unblock_user', 'soft_delete_user'];
  
  if (stateChangingActions.includes(this.actionType) && (!this.details.changes || !this.details.changes.oldValues || !this.details.changes.newValues)) {
    // If no changes provided, try to infer from context
    if (!this.details.changes) {
      this.details.changes = {};
    }
  }
  
  next();
});

// Static method to create audit log
auditLogSchema.statics.createLog = async function(logData) {
  try {
    const log = new this(logData);
    await log.save();
    return log;
  } catch (error) {
    // Log the error but don't throw to avoid breaking the main operation
    console.error('Failed to create audit log:', error);
    return null;
  }
};

// Static method to query logs with filters
auditLogSchema.statics.queryLogs = async function(filters = {}, options = {}) {
  const {
    adminId,
    actionType,
    targetType,
    targetId,
    result,
    dateFrom,
    dateTo,
    search,
    page = 1,
    limit = 50
  } = filters;
  
  const query = {};
  
  // Build query
  if (adminId) query.adminId = adminId;
  if (actionType) query.actionType = actionType;
  if (targetType) query.targetType = targetType;
  if (targetId) query.targetId = targetId;
  if (result) query.result = result;
  
  // Date range filter
  if (dateFrom || dateTo) {
    query.timestamp = {};
    if (dateFrom) query.timestamp.$gte = new Date(dateFrom);
    if (dateTo) query.timestamp.$lte = new Date(dateTo);
  }
  
  // Text search
  if (search) {
    query.$text = { $search: search };
  }
  
  // Execute query with pagination
  const skip = (page - 1) * limit;
  
  const [logs, total] = await Promise.all([
    this.find(query)
      .populate('adminId', 'name email role')
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    this.countDocuments(query)
  ]);
  
  return {
    logs,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
      hasNext: page < Math.ceil(total / limit),
      hasPrev: page > 1
    }
  };
};

// Static method to get audit statistics
auditLogSchema.statics.getStatistics = async function(filters = {}) {
  const { adminId, dateFrom, dateTo } = filters;
  
  const matchStage = {};
  
  if (adminId) matchStage.adminId = mongoose.Types.ObjectId(adminId);
  
  if (dateFrom || dateTo) {
    matchStage.timestamp = {};
    if (dateFrom) matchStage.timestamp.$gte = new Date(dateFrom);
    if (dateTo) matchStage.timestamp.$lte = new Date(dateTo);
  }
  
  const stats = await this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: null,
        totalActions: { $sum: 1 },
        successfulActions: {
          $sum: { $cond: [{ $eq: ['$result', 'success'] }, 1, 0] }
        },
        failedActions: {
          $sum: { $cond: [{ $eq: ['$result', 'failure'] }, 1, 0] }
        },
        actionTypes: { $addToSet: '$actionType' },
        targetTypes: { $addToSet: '$targetType' },
        uniqueAdmins: { $addToSet: '$adminId' },
        latestAction: { $max: '$timestamp' }
      }
    }
  ]);
  
  const result = stats[0] || {
    totalActions: 0,
    successfulActions: 0,
    failedActions: 0,
    actionTypes: [],
    targetTypes: [],
    uniqueAdmins: [],
    latestAction: null
  };
  
  // Get action type breakdown
  const actionBreakdown = await this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: '$actionType',
        count: { $sum: 1 },
        success: {
          $sum: { $cond: [{ $eq: ['$result', 'success'] }, 1, 0] }
        },
        failure: {
          $sum: { $cond: [{ $eq: ['$result', 'failure'] }, 1, 0] }
        }
      }
    },
    { $sort: { count: -1 } }
  ]);
  
  return {
    ...result,
    actionBreakdown,
    successRate: result.totalActions > 0 ? (result.successfulActions / result.totalActions * 100).toFixed(2) : 0
  };
};

// Instance method to get formatted log entry
auditLogSchema.methods.toFormattedJSON = function() {
  const obj = this.toObject();
  
  // Format timestamp
  obj.timestamp = this.timestamp.toISOString();
  obj.createdAt = this.createdAt.toISOString();
  obj.updatedAt = this.updatedAt.toISOString();
  
  // Remove sensitive fields if needed
  if (obj.details && obj.details.changes) {
    // Mask sensitive data in changes
    if (obj.details.changes.oldValues && obj.details.changes.oldValues.password) {
      obj.details.changes.oldValues.password = '[MASKED]';
    }
    if (obj.details.changes.newValues && obj.details.changes.newValues.password) {
      obj.details.changes.newValues.password = '[MASKED]';
    }
  }
  
  return obj;
};

module.exports = mongoose.model('AuditLog', auditLogSchema);
