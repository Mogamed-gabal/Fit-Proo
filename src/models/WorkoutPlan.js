/**
 * Workout Plan Model
 * Defines the structure for workout plans created by doctors
 */

const mongoose = require('mongoose');

// Exercise schema for detailed exercise information
const exerciseSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: [100, 'Exercise name cannot exceed 100 characters']
  },
  gifUrl: {
    type: String,
    required: true,
    trim: true,
    maxlength: [500, 'GIF URL cannot exceed 500 characters']
  },
  equipment: {
    type: String,
    required: true,
    trim: true
  },
  instructions: {
    type: String,
    required: true,
    trim: true,
    maxlength: [1000, 'Exercise instructions cannot exceed 1000 characters']
  },
  sets: {
    type: Number,
    required: true,
    min: [1, 'Sets must be at least 1'],
    max: [10, 'Sets cannot exceed 10']
  },
  reps: {
    type: Number,
    required: true,
    min: [1, 'Reps must be at least 1'],
    max: [100, 'Reps cannot exceed 100']
  },
  restTime: {
    type: Number, // in seconds
    required: true,
    min: [0, 'Rest time cannot be negative'],
    max: [600, 'Rest time cannot exceed 10 minutes'],
    default: 60
  },
  note: {
    type: String,
    trim: true,
    maxlength: [200, 'Exercise note cannot exceed 200 characters']
  },
  status: {
    type: String,
    enum: ['incomplete', 'complete'],
    default: 'incomplete'
  },
  completedAt: {
    type: Date,
    default: null
  }
});

// Daily plan schema for each day of the week
const dailyPlanSchema = new mongoose.Schema({
  dayName: {
    type: String,
    required: true,
    enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
  },
  dailyPlanName: {
    type: String,
    required: true,
    trim: true,
    maxlength: [100, 'Daily plan name cannot exceed 100 characters']
  },
  bodyParts: [{
    type: String,
    required: true,
    trim: true
  }],
  muscles: [{
    type: String,
    required: true,
    trim: true
  }],
  exercises: [exerciseSchema],
  status: {
    type: String,
    enum: ['incomplete', 'complete'],
    default: 'incomplete'
  },
  completedAt: {
    type: Date,
    default: null
  }
});

const workoutPlanSchema = new mongoose.Schema({
  // Client who owns this workout plan
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // Doctor who created this workout plan
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // Doctor name for easy reference
  doctorName: {
    type: String,
    required: true,
    trim: true,
    maxlength: [100, 'Doctor name cannot exceed 100 characters']
  },

  // Plan details
  name: {
    type: String,
    required: [true, 'Workout plan name is required'],
    trim: true,
    maxlength: [100, 'Workout plan name cannot exceed 100 characters']
  },

  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Workout plan description cannot exceed 500 characters']
  },

  notes: {
    type: String,
    trim: true,
    maxlength: [1000, 'Workout plan notes cannot exceed 1000 characters']
  },

  // Plan lifecycle dates
  startDate: {
    type: Date,
    required: [true, 'Start date is required']
  },

  endDate: {
    type: Date,
    required: [true, 'End date is required']
  },

  // Status tracking
  isActive: {
    type: Boolean,
    default: true
  },

  // Plan metadata
  difficulty: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    default: 'intermediate'
  },

  durationWeeks: {
    type: Number,
    default: 1, // Fixed 1 week = 7 days
    min: [1, 'Duration must be exactly 1 week (7 days)'],
    max: [1, 'Duration must be exactly 1 week (7 days)']
  },

  // Weekly workout plan structure
  weeklyPlan: [dailyPlanSchema],

  // Optional: Reference to original plan if this is a clone/reuse
  clonedFrom: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'WorkoutPlan'
  },

  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },

  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Pre-save middleware to manage plan activation
workoutPlanSchema.pre('save', async function(next) {
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Set to start of day for comparison
  
  const startDate = new Date(this.startDate);
  startDate.setHours(0, 0, 0, 0);
  
  const endDate = new Date(this.endDate);
  endDate.setHours(23, 59, 59, 999); // Set to end of day for comparison
  
  // Auto-manage isActive based on dates
  if (today >= startDate && today <= endDate) {
    this.isActive = true;
  } else {
    this.isActive = false;
  }
  
  next();
});

// Static method to get active plans for a client
workoutPlanSchema.statics.getActivePlanForClient = function(clientId) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  return this.findOne({
    clientId,
    isActive: true,
    startDate: { $lte: today },
    endDate: { $gte: today }
  }).sort({ createdAt: -1 });
};

// Static method to deactivate expired plans
workoutPlanSchema.statics.deactivateExpiredPlans = function() {
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  
  return this.updateMany(
    {
      isActive: true,
      endDate: { $lt: today }
    },
    {
      $set: { isActive: false }
    }
  );
};

// Static method to activate future plans
workoutPlanSchema.statics.activateFuturePlans = function() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  return this.updateMany(
    {
      isActive: false,
      startDate: { $lte: today },
      endDate: { $gte: today }
    },
    {
      $set: { isActive: true }
    }
  );
};

// Validation for weekly plan
workoutPlanSchema.pre('save', function(next) {
  // Ensure at least one body part and one muscle are specified
  if (this.weeklyPlan && this.weeklyPlan.length > 0) {
    for (const dayPlan of this.weeklyPlan) {
      if (!dayPlan.bodyParts || dayPlan.bodyParts.length === 0) {
        return next(new Error('Each daily plan must have at least one body part'));
      }
      if (!dayPlan.muscles || dayPlan.muscles.length === 0) {
        return next(new Error('Each daily plan must have at least one muscle'));
      }
      if (!dayPlan.exercises || dayPlan.exercises.length === 0) {
        return next(new Error('Each daily plan must have at least one exercise'));
      }
    }
  }
  next();
});

// Indexes for performance
workoutPlanSchema.index({ clientId: 1, isActive: 1 });
workoutPlanSchema.index({ doctorId: 1, createdAt: -1 });
workoutPlanSchema.index({ clientId: 1, endDate: -1 });
workoutPlanSchema.index({ isActive: 1, endDate: 1 });

module.exports = mongoose.model('WorkoutPlan', workoutPlanSchema);
