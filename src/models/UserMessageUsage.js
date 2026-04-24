const mongoose = require('mongoose');

/**
 * User Message Usage Model
 * Tracks global free message usage per user across the entire system
 */
const userMessageUsageSchema = new mongoose.Schema({
  // User identification
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },

  // Message usage tracking
  totalMessagesSent: {
    type: Number,
    default: 0,
    min: 0
  },

  // Free message tracking
  freeMessagesUsed: {
    type: Number,
    default: 0,
    min: 0
  },

  // Period tracking
  currentPeriodStart: {
    type: Date,
    required: true,
    default: () => {
      const now = new Date();
      return new Date(now.getFullYear(), now.getMonth(), 1); // First day of current month
    }
  },
  
  currentPeriodEnd: {
    type: Date,
    required: true,
    default: () => {
      const now = new Date();
      return new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59); // Last day of current month
    }
  },

  // Last activity tracking
  lastMessageAt: {
    type: Date,
    default: null
  },

  // Reset tracking
  lastResetAt: {
    type: Date,
    default: Date.now
  },

  // Metadata
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true,
  collection: 'user_message_usage'
});

// Indexes for performance
userMessageUsageSchema.index({ userId: 1, currentPeriodStart: 1 });
userMessageUsageSchema.index({ currentPeriodEnd: 1 });
userMessageUsageSchema.index({ lastMessageAt: 1 });

// Static methods
userMessageUsageSchema.statics.getUserUsage = async function(userId) {
  try {
    const now = new Date();
    const currentPeriodStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const currentPeriodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    let usage = await this.findOne({
      userId,
      currentPeriodStart,
      currentPeriodEnd
    });

    // Create new usage record if doesn't exist
    if (!usage) {
      usage = await this.create({
        userId,
        currentPeriodStart,
        currentPeriodEnd,
        freeMessagesUsed: 0,
        totalMessagesSent: 0
      });
    }

    return usage;
  } catch (error) {
    console.error('Error getting user message usage:', error);
    throw error;
  }
};

userMessageUsageSchema.statics.incrementUsage = async function(userId, isFreeMessage = false) {
  try {
    const usage = await this.getUserUsage(userId);
    
    // Update counters
    usage.totalMessagesSent += 1;
    if (isFreeMessage) {
      usage.freeMessagesUsed += 1;
    }
    usage.lastMessageAt = new Date();
    
    await usage.save();
    
    return usage;
  } catch (error) {
    console.error('Error incrementing message usage:', error);
    throw error;
  }
};

userMessageUsageSchema.statics.getRemainingFreeMessages = async function(userId) {
  try {
    const config = require('../config/chatAccessConfig');
    const usage = await this.getUserUsage(userId);
    
    const remaining = Math.max(0, config.FREE_USAGE.GLOBAL_MESSAGE_LIMIT - usage.freeMessagesUsed);
    
    return remaining;
  } catch (error) {
    console.error('Error getting remaining free messages:', error);
    return 0;
  }
};

userMessageUsageSchema.statics.hasFreeMessagesRemaining = async function(userId) {
  try {
    const remaining = await this.getRemainingFreeMessages(userId);
    return remaining > 0;
  } catch (error) {
    console.error('Error checking free messages remaining:', error);
    return false;
  }
};

userMessageUsageSchema.statics.resetMonthlyUsage = async function() {
  try {
    const now = new Date();
    const newPeriodStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const newPeriodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    // Find all users with old periods
    const oldUsages = await this.find({
      currentPeriodEnd: { $lt: newPeriodStart }
    });

    // Reset or create new records
    for (const oldUsage of oldUsages) {
      await this.create({
        userId: oldUsage.userId,
        currentPeriodStart: newPeriodStart,
        currentPeriodEnd: newPeriodEnd,
        freeMessagesUsed: 0,
        totalMessagesSent: 0,
        lastResetAt: new Date()
      });
    }

    console.log(`Reset monthly usage for ${oldUsages.length} users`);
    return oldUsages.length;
  } catch (error) {
    console.error('Error resetting monthly usage:', error);
    throw error;
  }
};

// Instance methods
userMessageUsageSchema.methods.getUsageStats = function() {
  const config = require('../config/chatAccessConfig');
  
  return {
    totalMessagesSent: this.totalMessagesSent,
    freeMessagesUsed: this.freeMessagesUsed,
    remainingFreeMessages: Math.max(0, config.FREE_USAGE.GLOBAL_MESSAGE_LIMIT - this.freeMessagesUsed),
    currentPeriodStart: this.currentPeriodStart,
    currentPeriodEnd: this.currentPeriodEnd,
    lastMessageAt: this.lastMessageAt,
    isFreeMessagesExhausted: this.freeMessagesUsed >= config.FREE_USAGE.GLOBAL_MESSAGE_LIMIT
  };
};

module.exports = mongoose.model('UserMessageUsage', userMessageUsageSchema);
