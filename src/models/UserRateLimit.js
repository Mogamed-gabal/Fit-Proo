const mongoose = require('mongoose');

/**
 * User Rate Limit Model
 * Prevents message spam and abuse with per-user rate limiting
 */
const userRateLimitSchema = new mongoose.Schema({
  // User identification
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true
  },

  // Rate limiting counters
  messageCounters: {
    lastMinute: {
      count: {
        type: Number,
        default: 0,
        min: 0
      },
      resetAt: {
        type: Date,
        default: Date.now
      }
    },
    lastHour: {
      count: {
        type: Number,
        default: 0,
        min: 0
      },
      resetAt: {
        type: Date,
        default: Date.now
      }
    },
    lastDay: {
      count: {
        type: Number,
        default: 0,
        min: 0
      },
      resetAt: {
        type: Date,
        default: Date.now
      }
    }
  },

  // Rate limiting configuration
  limits: {
    maxPerMinute: {
      type: Number,
      default: 5,
      min: 1
    },
    maxPerHour: {
      type: Number,
      default: 50,
      min: 1
    },
    maxPerDay: {
      type: Number,
      default: 200,
      min: 1
    }
  },

  // Violation tracking
  violations: {
    totalViolations: {
      type: Number,
      default: 0,
      min: 0
    },
    lastViolationAt: {
      type: Date,
      default: null
    },
    currentBlockUntil: {
      type: Date,
      default: null
    },
    blockHistory: [{
      blockedAt: Date,
      reason: String,
      duration: Number,
      unblockedAt: Date
    }]
  },

  // Metadata
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true,
  collection: 'user_rate_limits'
});

// Indexes for performance
userRateLimitSchema.index({ userId: 1 });
userRateLimitSchema.index({ 'violations.currentBlockUntil': 1 });
userRateLimitSchema.index({ 'messageCounters.lastMinute.resetAt': 1 });

// Static methods
userRateLimitSchema.statics.checkRateLimit = async function(userId, operation = 'SEND_MESSAGE') {
  try {
    const now = new Date();
    const oneMinuteAgo = new Date(now.getTime() - 60000);
    const oneHourAgo = new Date(now.getTime() - 3600000);
    const oneDayAgo = new Date(now.getTime() - 86400000);

    // Find or create rate limit record
    let rateLimit = await this.findOne({ userId });
    
    if (!rateLimit) {
      rateLimit = await this.create({
        userId,
        messageCounters: {
          lastMinute: { count: 0, resetAt: now },
          lastHour: { count: 0, resetAt: now },
          lastDay: { count: 0, resetAt: now }
        }
      });
    }

    // Check if user is currently blocked
    if (rateLimit.violations.currentBlockUntil && rateLimit.violations.currentBlockUntil > now) {
      return {
        allowed: false,
        reason: 'USER_BLOCKED',
        blockedUntil: rateLimit.violations.currentBlockUntil,
        remainingTime: rateLimit.violations.currentBlockUntil - now
      };
    }

    // Reset counters if needed
    if (rateLimit.messageCounters.lastMinute.resetAt < oneMinuteAgo) {
      rateLimit.messageCounters.lastMinute.count = 0;
      rateLimit.messageCounters.lastMinute.resetAt = now;
    }

    if (rateLimit.messageCounters.lastHour.resetAt < oneHourAgo) {
      rateLimit.messageCounters.lastHour.count = 0;
      rateLimit.messageCounters.lastHour.resetAt = now;
    }

    if (rateLimit.messageCounters.lastDay.resetAt < oneDayAgo) {
      rateLimit.messageCounters.lastDay.count = 0;
      rateLimit.messageCounters.lastDay.resetAt = now;
    }

    // Check limits
    if (rateLimit.messageCounters.lastMinute.count >= rateLimit.limits.maxPerMinute) {
      const blockDuration = await this._handleViolation(rateLimit, 'MINUTE_LIMIT_EXCEEDED');
      return {
        allowed: false,
        reason: 'MINUTE_RATE_LIMIT_EXCEEDED',
        limit: rateLimit.limits.maxPerMinute,
        resetIn: 60 - Math.floor((now - rateLimit.messageCounters.lastMinute.resetAt) / 1000),
        blockedUntil: blockDuration > 0 ? new Date(now.getTime() + blockDuration) : null
      };
    }

    if (rateLimit.messageCounters.lastHour.count >= rateLimit.limits.maxPerHour) {
      const blockDuration = await this._handleViolation(rateLimit, 'HOUR_LIMIT_EXCEEDED');
      return {
        allowed: false,
        reason: 'HOUR_RATE_LIMIT_EXCEEDED',
        limit: rateLimit.limits.maxPerHour,
        resetIn: 3600 - Math.floor((now - rateLimit.messageCounters.lastHour.resetAt) / 1000),
        blockedUntil: blockDuration > 0 ? new Date(now.getTime() + blockDuration) : null
      };
    }

    if (rateLimit.messageCounters.lastDay.count >= rateLimit.limits.maxPerDay) {
      const blockDuration = await this._handleViolation(rateLimit, 'DAY_LIMIT_EXCEEDED');
      return {
        allowed: false,
        reason: 'DAY_RATE_LIMIT_EXCEEDED',
        limit: rateLimit.limits.maxPerDay,
        resetIn: 86400 - Math.floor((now - rateLimit.messageCounters.lastDay.resetAt) / 1000),
        blockedUntil: blockDuration > 0 ? new Date(now.getTime() + blockDuration) : null
      };
    }

    // Increment counters
    rateLimit.messageCounters.lastMinute.count += 1;
    rateLimit.messageCounters.lastHour.count += 1;
    rateLimit.messageCounters.lastDay.count += 1;

    await rateLimit.save();

    return {
      allowed: true,
      remainingMinute: rateLimit.limits.maxPerMinute - rateLimit.messageCounters.lastMinute.count,
      remainingHour: rateLimit.limits.maxPerHour - rateLimit.messageCounters.lastHour.count,
      remainingDay: rateLimit.limits.maxPerDay - rateLimit.messageCounters.lastDay.count
    };

  } catch (error) {
    console.error('Error checking rate limit:', error);
    return {
      allowed: false,
      reason: 'RATE_LIMIT_ERROR',
      error: error.message
    };
  }
};

userRateLimitSchema.statics.getUserRateLimitStatus = async function(userId) {
  try {
    const rateLimit = await this.findOne({ userId });
    
    if (!rateLimit) {
      return {
        userId,
        status: 'NO_LIMITS_SET',
        limits: {
          maxPerMinute: 5,
          maxPerHour: 50,
          maxPerDay: 200
        },
        current: {
          minute: 0,
          hour: 0,
          day: 0
        },
        violations: {
          total: 0,
          currentlyBlocked: false
        }
      };
    }

    const now = new Date();
    const isBlocked = rateLimit.violations.currentBlockUntil && rateLimit.violations.currentBlockUntil > now;

    return {
      userId,
      status: isBlocked ? 'BLOCKED' : 'ACTIVE',
      limits: rateLimit.limits,
      current: {
        minute: rateLimit.messageCounters.lastMinute.count,
        hour: rateLimit.messageCounters.lastHour.count,
        day: rateLimit.messageCounters.lastDay.count
      },
      violations: {
        total: rateLimit.violations.totalViolations,
        currentlyBlocked: isBlocked,
        blockedUntil: isBlocked ? rateLimit.violations.currentBlockUntil : null,
        lastViolation: rateLimit.violations.lastViolationAt
      }
    };

  } catch (error) {
    console.error('Error getting user rate limit status:', error);
    throw error;
  }
};

userRateLimitSchema.statics.unblockUser = async function(userId, unblockedBy = null) {
  try {
    const rateLimit = await this.findOne({ userId });
    
    if (!rateLimit) {
      throw new Error('User rate limit record not found');
    }

    const wasBlocked = rateLimit.violations.currentBlockUntil && rateLimit.violations.currentBlockUntil > new Date();

    rateLimit.violations.currentBlockUntil = null;
    
    if (wasBlocked) {
      rateLimit.violations.blockHistory.push({
        blockedAt: rateLimit.violations.lastViolationAt,
        reason: 'RATE_LIMIT_VIOLATION',
        duration: 0, // Manual unblock
        unblockedAt: new Date(),
        unblockedBy
      });
    }

    await rateLimit.save();

    return {
      success: true,
      wasBlocked,
      unblockedAt: new Date()
    };

  } catch (error) {
    console.error('Error unblocking user:', error);
    throw error;
  }
};

userRateLimitSchema.statics.updateUserLimits = async function(userId, newLimits) {
  try {
    const rateLimit = await this.findOneAndUpdate(
      { userId },
      { 
        $set: { 
          'limits.maxPerMinute': newLimits.maxPerMinute,
          'limits.maxPerHour': newLimits.maxPerHour,
          'limits.maxPerDay': newLimits.maxPerDay
        }
      },
      { new: true, upsert: true }
    );

    return rateLimit;

  } catch (error) {
    console.error('Error updating user limits:', error);
    throw error;
  }
};

// Private methods
userRateLimitSchema.statics._handleViolation = async function(rateLimit, reason) {
  try {
    const now = new Date();
    rateLimit.violations.totalViolations += 1;
    rateLimit.violations.lastViolationAt = now;

    // Calculate block duration based on violation count
    let blockDuration = 0;
    
    if (rateLimit.violations.totalViolations <= 2) {
      // First violations - short block
      blockDuration = 5 * 60 * 1000; // 5 minutes
    } else if (rateLimit.violations.totalViolations <= 5) {
      // Moderate violations - medium block
      blockDuration = 30 * 60 * 1000; // 30 minutes
    } else {
      // Many violations - long block
      blockDuration = 2 * 60 * 60 * 1000; // 2 hours
    }

    if (blockDuration > 0) {
      rateLimit.violations.currentBlockUntil = new Date(now.getTime() + blockDuration);
      rateLimit.violations.blockHistory.push({
        blockedAt: now,
        reason,
        duration: blockDuration,
        unblockedAt: null
      });
    }

    await rateLimit.save();
    return blockDuration;

  } catch (error) {
    console.error('Error handling violation:', error);
    return 0;
  }
};

// Instance methods
userRateLimitSchema.methods.getRemainingLimits = function() {
  const now = new Date();
  
  return {
    minute: {
      remaining: Math.max(0, this.limits.maxPerMinute - this.messageCounters.lastMinute.count),
      resetIn: Math.max(0, 60 - Math.floor((now - this.messageCounters.lastMinute.resetAt) / 1000))
    },
    hour: {
      remaining: Math.max(0, this.limits.maxPerHour - this.messageCounters.lastHour.count),
      resetIn: Math.max(0, 3600 - Math.floor((now - this.messageCounters.lastHour.resetAt) / 1000))
    },
    day: {
      remaining: Math.max(0, this.limits.maxPerDay - this.messageCounters.lastDay.count),
      resetIn: Math.max(0, 86400 - Math.floor((now - this.messageCounters.lastDay.resetAt) / 1000))
    }
  };
};

module.exports = mongoose.model('UserRateLimit', userRateLimitSchema);
