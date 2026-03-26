/**
 * Client Progress Model
 * Tracks client progress on workout plans and exercises
 */

const mongoose = require('mongoose');

const clientProgressSchema = new mongoose.Schema({
  // Client who owns this progress
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // Associated workout plan
  workoutPlanId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'WorkoutPlan',
    required: true
  },

  // Progress tracking
  completedExercises: [{
    exerciseId: {
      type: String,
      required: true
    },
    exerciseName: {
      type: String,
      required: true
    },
    completedAt: {
      type: Date,
      default: Date.now
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [200, 'Progress notes cannot exceed 200 characters']
    }
  }],

  // Day completion tracking
  completedDays: [{
    date: {
      type: Date,
      required: true
    },
    completedAt: {
      type: Date,
      default: Date.now
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [200, 'Day completion notes cannot exceed 200 characters']
    }
  }],

  // Overall progress status
  status: {
    type: String,
    enum: ['in_progress', 'completed', 'paused'],
    default: 'in_progress'
  },

  // Progress percentage (0-100)
  completionPercentage: {
    type: Number,
    min: [0, 'Completion percentage cannot be less than 0'],
    max: [100, 'Completion percentage cannot exceed 100'],
    default: 0
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

// Indexes for performance
clientProgressSchema.index({ clientId: 1, workoutPlanId: 1 });
clientProgressSchema.index({ clientId: 1, status: 1 });
clientProgressSchema.index({ workoutPlanId: 1, status: 1 });
clientProgressSchema.index({ completedAt: -1 });

module.exports = mongoose.model('ClientProgress', clientProgressSchema);
