/**
 * Workout Plan Model
 * Defines the structure for workout plans created by doctors
 */

const mongoose = require('mongoose');

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
    min: [1, 'Duration must be at least 1 week'],
    max: [52, 'Duration cannot exceed 52 weeks']
  },

  // Optional: Reference to original plan if this is a clone/reuse
  clonedFrom: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'WorkoutPlan'
  },

  // Exercise data - stored as complete plan
  exercises: [{
    name: {
      type: String,
      required: true,
      trim: true
    },
    muscle: {
      type: String,
      required: true,
      enum: ['chest', 'back', 'shoulders', 'biceps', 'triceps', 'legs', 'glutes', 'abs', 'calves', 'forearms']
    },
    image: {
      type: String,
      default: null
    },
    sets: {
      type: Number,
      required: true,
      min: [1, 'Sets must be at least 1']
    },
    reps: {
      type: Number,
      required: true,
      min: [1, 'Reps must be at least 1']
    },
    rest: {
      type: Number,
      default: 60, // seconds
      min: [0, 'Rest time cannot be negative']
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [200, 'Exercise notes cannot exceed 200 characters']
    }
  }],

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
workoutPlanSchema.index({ clientId: 1, isActive: 1 });
workoutPlanSchema.index({ doctorId: 1, createdAt: -1 });
workoutPlanSchema.index({ clientId: 1, endDate: -1 });
workoutPlanSchema.index({ isActive: 1, endDate: 1 });

module.exports = mongoose.model('WorkoutPlan', workoutPlanSchema);
