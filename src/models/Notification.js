const mongoose = require('mongoose');

/**
 * Notification Schema
 * Handles user notifications for workout plans and other events
 */

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  message: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500
  },
  type: {
    type: String,
    required: true,
    enum: ['workout_plan', 'diet_plan', 'progress_update', 'system', 'reminder'],
    default: 'workout_plan'
  },
  relatedId: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'relatedModel',
    required: false
  },
  relatedModel: {
    type: String,
    enum: ['WorkoutPlan', 'DietPlan', 'ClientProgress', 'User'],
    required: false
  },
  isRead: {
    type: Boolean,
    default: false,
    index: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  actionUrl: {
    type: String,
    required: false
  },
  expiresAt: {
    type: Date,
    required: false
  }
}, {
  timestamps: true
});

// Index for better query performance
notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Static method to create workout plan notification
notificationSchema.statics.createWorkoutPlanNotification = async function(userId, workoutPlanId, planName) {
  return this.create({
    userId,
    title: 'New Workout Plan Assigned',
    message: `Dr. has assigned you a new workout plan: ${planName}`,
    type: 'workout_plan',
    relatedId: workoutPlanId,
    relatedModel: 'WorkoutPlan',
    priority: 'high',
    actionUrl: `/workout-plans/${workoutPlanId}`,
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
  });
};

// Static method to create diet plan notification
notificationSchema.statics.createDietPlanNotification = async function(userId, dietPlanId, planName) {
  return this.create({
    userId,
    title: 'New Diet Plan Assigned',
    message: `Your doctor has assigned a new diet plan: ${planName}`,
    type: 'diet_plan',
    relatedId: dietPlanId,
    relatedModel: 'DietPlan',
    priority: 'high',
    actionUrl: `/diet-plans/${dietPlanId}`,
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
  });
};

// Static method to get unread notifications count
notificationSchema.statics.getUnreadCount = async function(userId) {
  return this.countDocuments({ userId, isRead: false });
};

// Static method to mark notifications as read
notificationSchema.statics.markAsRead = async function(userId, notificationIds) {
  return this.updateMany(
    { 
      userId, 
      _id: { $in: notificationIds },
      isRead: false 
    },
    { isRead: true }
  );
};

// Instance method to mark as read
notificationSchema.methods.markAsRead = async function() {
  this.isRead = true;
  return this.save();
};

// Pre-save middleware to validate expiration
notificationSchema.pre('save', function(next) {
  if (this.expiresAt && this.expiresAt <= new Date()) {
    return next(new Error('Expiration date must be in the future'));
  }
  next();
});

module.exports = mongoose.model('Notification', notificationSchema);
