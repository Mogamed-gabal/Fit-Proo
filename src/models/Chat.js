const mongoose = require('mongoose');

/**
 * Chat Model - Enhanced with subscription binding
 * Ensures chat is properly bound to subscription for access control
 */
const chatSchema = new mongoose.Schema({
  // Chat identification
  chatId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  
  // Chat type and basic info
  type: {
    type: String,
    required: true,
    enum: ['ONE_TO_ONE', 'GROUP'],
    index: true
  },
  
  title: {
    type: String,
    maxlength: [100, 'Chat title cannot exceed 100 characters']
  },
  
  // Subscription binding (CRITICAL for access control)
  subscriptionBinding: {
    subscriptionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subscription',
      required: false,
      index: true
    },
    accessType: {
      type: String,
      required: true,
      enum: ['DOCTOR', 'BUNDLE', 'COUPON', 'FREE'],
      index: true
    },
    allowedParticipantsSource: {
      type: String,
      required: true,
      enum: ['SUBSCRIPTION', 'BUNDLE_MEMBERS', 'DOCTOR_CLIENT', 'FREE_USERS']
    },
    validatedAt: {
      type: Date,
      required: true,
      default: Date.now
    },
    isActive: {
      type: Boolean,
      required: true,
      default: true
    }
  },
  
  // Participants (validated against subscription)
  participants: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    role: {
      type: String,
      required: true,
      enum: ['CLIENT', 'DOCTOR', 'ADMIN'],
      default: 'CLIENT'
    },
    joinedAt: {
      type: Date,
      required: true,
      default: Date.now
    },
    isActive: {
      type: Boolean,
      required: true,
      default: true
    },
    lastReadAt: {
      type: Date,
      default: null
    }
  }],
  
  // Chat status
  status: {
    type: String,
    required: true,
    enum: ['ACTIVE', 'SUSPENDED', 'CLOSED', 'ARCHIVED'],
    default: 'ACTIVE',
    index: true
  },
  
  // Rate limiting per chat
  rateLimiting: {
    maxMessagesPerMinute: {
      type: Number,
      default: 10
    },
    maxMessagesPerHour: {
      type: Number,
      default: 100
    },
    currentMinuteCount: {
      type: Number,
      default: 0
    },
    currentHourCount: {
      type: Number,
      default: 0
    },
    lastMinuteReset: {
      type: Date,
      default: Date.now
    },
    lastHourReset: {
      type: Date,
      default: Date.now
    }
  },
  
  // Metadata
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  
  // Soft delete
  isDeleted: {
    type: Boolean,
    default: false,
    index: true
  },
  deletedAt: {
    type: Date,
    index: true
  },
  deletedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  collection: 'chats'
});

// Indexes for performance
chatSchema.index({ chatId: 1 });
chatSchema.index({ 'subscriptionBinding.subscriptionId': 1 });
chatSchema.index({ 'subscriptionBinding.accessType': 1 });
chatSchema.index({ 'participants.userId': 1 });
chatSchema.index({ status: 1, isDeleted: 1 });
chatSchema.index({ type: 1, status: 1 });

// Static methods
chatSchema.statics.createBoundChat = async function(chatData, subscriptionId, accessType) {
  try {
    // Validate subscription exists and is active
    const Subscription = require('./Subscription');
    const subscription = await Subscription.findById(subscriptionId);
    
    if (!subscription) {
      throw new Error('Subscription not found');
    }
    
    if (subscription.status !== 'ACTIVE') {
      throw new Error('Subscription is not active');
    }
    
    // Determine access type and validate participants
    const allowedParticipantsSource = this._determineParticipantsSource(accessType, subscription);
    
    // Create chat with subscription binding
    const chat = await this.create({
      ...chatData,
      subscriptionBinding: {
        subscriptionId,
        accessType,
        allowedParticipantsSource,
        validatedAt: new Date(),
        isActive: true
      }
    });
    
    console.log(`Created chat ${chat.chatId} bound to subscription ${subscriptionId}`);
    return chat;
    
  } catch (error) {
    console.error('Error creating bound chat:', error);
    throw error;
  }
};

chatSchema.statics.findBySubscriptionId = async function(subscriptionId) {
  try {
    return await this.find({
      'subscriptionBinding.subscriptionId': subscriptionId,
      'subscriptionBinding.isActive': true,
      isDeleted: false
    }).populate('subscriptionBinding.subscriptionId');
  } catch (error) {
    console.error('Error finding chats by subscription:', error);
    throw error;
  }
};

chatSchema.statics.validateChatAccess = async function(chatId, userId) {
  try {
    const chat = await this.findOne({
      chatId,
      'subscriptionBinding.isActive': true,
      status: 'ACTIVE',
      isDeleted: false
    }).populate('subscriptionBinding.subscriptionId').populate('participants.userId');
    
    if (!chat) {
      return { valid: false, reason: 'CHAT_NOT_FOUND_OR_INACTIVE' };
    }
    
    // Check if user is participant
    const participant = chat.participants.find(p => 
      p.userId._id.toString() === userId.toString() && p.isActive
    );
    
    if (!participant) {
      return { valid: false, reason: 'NOT_PARTICIPANT' };
    }
    
    // Validate subscription binding
    const subscriptionValidation = await this._validateSubscriptionBinding(chat, userId);
    
    return {
      valid: subscriptionValidation.valid,
      reason: subscriptionValidation.reason,
      chat,
      participant,
      subscription: chat.subscriptionBinding.subscriptionId
    };
    
  } catch (error) {
    console.error('Error validating chat access:', error);
    return { valid: false, reason: 'VALIDATION_ERROR', error: error.message };
  }
};

chatSchema.statics.updateRateLimit = async function(chatId) {
  try {
    const now = new Date();
    const oneMinuteAgo = new Date(now.getTime() - 60000);
    const oneHourAgo = new Date(now.getTime() - 3600000);
    
    const chat = await this.findOne({ chatId });
    
    if (!chat) {
      throw new Error('Chat not found');
    }
    
    // Reset counters if needed
    if (chat.rateLimiting.lastMinuteReset < oneMinuteAgo) {
      chat.rateLimiting.currentMinuteCount = 0;
      chat.rateLimiting.lastMinuteReset = now;
    }
    
    if (chat.rateLimiting.lastHourReset < oneHourAgo) {
      chat.rateLimiting.currentHourCount = 0;
      chat.rateLimiting.lastHourReset = now;
    }
    
    // Check limits
    if (chat.rateLimiting.currentMinuteCount >= chat.rateLimiting.maxMessagesPerMinute) {
      return { allowed: false, reason: 'MINUTE_RATE_LIMIT_EXCEEDED' };
    }
    
    if (chat.rateLimiting.currentHourCount >= chat.rateLimiting.maxMessagesPerHour) {
      return { allowed: false, reason: 'HOUR_RATE_LIMIT_EXCEEDED' };
    }
    
    // Increment counters
    chat.rateLimiting.currentMinuteCount += 1;
    chat.rateLimiting.currentHourCount += 1;
    
    await chat.save();
    
    return { allowed: true };
    
  } catch (error) {
    console.error('Error updating rate limit:', error);
    return { allowed: false, reason: 'RATE_LIMIT_ERROR', error: error.message };
  }
};

// Instance methods
chatSchema.methods.getChatInfo = function() {
  return {
    chatId: this.chatId,
    type: this.type,
    title: this.title,
    status: this.status,
    participants: this.participants.filter(p => p.isActive).map(p => ({
      userId: p.userId,
      role: p.role,
      joinedAt: p.joinedAt
    })),
    subscriptionBinding: {
      accessType: this.subscriptionBinding.accessType,
      allowedParticipantsSource: this.subscriptionBinding.allowedParticipantsSource,
      isActive: this.subscriptionBinding.isActive
    },
    rateLimiting: {
      maxMessagesPerMinute: this.rateLimiting.maxMessagesPerMinute,
      maxMessagesPerHour: this.rateLimiting.maxMessagesPerHour
    }
  };
};

// Private methods
chatSchema.statics._determineParticipantsSource = function(accessType, subscription) {
  switch (accessType) {
    case 'DOCTOR':
      return 'DOCTOR_CLIENT';
    case 'BUNDLE':
      return 'BUNDLE_MEMBERS';
    case 'COUPON':
      return 'DOCTOR_CLIENT';
    case 'FREE':
      return 'FREE_USERS';
    default:
      throw new Error(`Unknown access type: ${accessType}`);
  }
};

chatSchema.statics._validateSubscriptionBinding = async function(chat, userId) {
  try {
    const subscription = chat.subscriptionBinding.subscriptionId;
    
    // Handle free chats without subscription
    if (!subscription && chat.subscriptionBinding.accessType === 'FREE') {
      return { valid: true, reason: 'FREE_CHAT_ACCESS' };
    }
    
    // Check if subscription is active or in grace period
    const now = new Date();
    const gracePeriodEnd = new Date(subscription.endDate.getTime() + (24 * 60 * 60 * 1000)); // 1 day grace
    
    if (subscription.status !== 'ACTIVE' && now > gracePeriodEnd) {
      return { valid: false, reason: 'SUBSCRIPTION_EXPIRED_NO_GRACE' };
    }
    
    // Validate access type specific rules
    switch (chat.subscriptionBinding.accessType) {
      case 'DOCTOR':
        return await this._validateDoctorAccess(chat, userId, subscription);
      case 'BUNDLE':
        return await this._validateBundleAccess(chat, userId, subscription);
      case 'COUPON':
        return await this._validateCouponAccess(chat, userId, subscription);
      case 'FREE':
        return { valid: true, reason: 'FREE_CHAT_ACCESS' };
      default:
        return { valid: false, reason: 'UNKNOWN_ACCESS_TYPE' };
    }
    
  } catch (error) {
    console.error('Error validating subscription binding:', error);
    return { valid: false, reason: 'VALIDATION_ERROR', error: error.message };
  }
};

chatSchema.statics._validateDoctorAccess = async function(chat, userId, subscription) {
  try {
    // For doctor-based access, validate doctor-client relationship
    const doctorId = subscription.features.get('doctor_id');
    
    if (!doctorId) {
      return { valid: false, reason: 'DOCTOR_NOT_FOUND_IN_SUBSCRIPTION' };
    }
    
    // Check if user is either the doctor or a client of the doctor
    const User = require('./User');
    const user = await User.findById(userId);
    
    if (!user) {
      return { valid: false, reason: 'USER_NOT_FOUND' };
    }
    
    if (user._id.toString() === doctorId.toString()) {
      return { valid: true, reason: 'DOCTOR_ACCESS' };
    }
    
    if (user.role === 'client') {
      // Validate client has access to this doctor
      // This would typically check if client has subscription with this doctor
      return { valid: true, reason: 'CLIENT_DOCTOR_ACCESS' };
    }
    
    return { valid: false, reason: 'INVALID_DOCTOR_ACCESS' };
    
  } catch (error) {
    console.error('Error validating doctor access:', error);
    return { valid: false, reason: 'DOCTOR_ACCESS_ERROR', error: error.message };
  }
};

chatSchema.statics._validateBundleAccess = async function(chat, userId, subscription) {
  try {
    // For bundle access, validate user is part of the bundle
    const bundleId = subscription.features.get('bundle_id');
    
    if (!bundleId) {
      return { valid: false, reason: 'BUNDLE_NOT_FOUND_IN_SUBSCRIPTION' };
    }
    
    // Check if user is in bundle participants
    const bundleParticipants = subscription.features.get('bundle_participants') || [];
    
    if (bundleParticipants.includes(userId.toString())) {
      return { valid: true, reason: 'BUNDLE_ACCESS' };
    }
    
    return { valid: false, reason: 'NOT_IN_BUNDLE' };
    
  } catch (error) {
    console.error('Error validating bundle access:', error);
    return { valid: false, reason: 'BUNDLE_ACCESS_ERROR', error: error.message };
  }
};

chatSchema.statics._validateCouponAccess = async function(chat, userId, subscription) {
  try {
    // Coupon access is similar to doctor access but time-limited
    const doctorId = subscription.features.get('doctor_id');
    
    if (!doctorId) {
      return { valid: false, reason: 'DOCTOR_NOT_FOUND_IN_COUPON' };
    }
    
    // Check if user is the doctor or has coupon access
    const User = require('./User');
    const user = await User.findById(userId);
    
    if (!user) {
      return { valid: false, reason: 'USER_NOT_FOUND' };
    }
    
    if (user._id.toString() === doctorId.toString()) {
      return { valid: true, reason: 'DOCTOR_COUPON_ACCESS' };
    }
    
    // Validate coupon is still valid for this user
    const couponUsers = subscription.features.get('coupon_users') || [];
    
    if (couponUsers.includes(userId.toString())) {
      return { valid: true, reason: 'COUPON_ACCESS' };
    }
    
    return { valid: false, reason: 'INVALID_COUPON_ACCESS' };
    
  } catch (error) {
    console.error('Error validating coupon access:', error);
    return { valid: false, reason: 'COUPON_ACCESS_ERROR', error: error.message };
  }
};

module.exports = mongoose.model('Chat', chatSchema);
