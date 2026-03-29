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
    enum: ['dumbbells', 'barbell', 'machine', 'cable', 'bodyweight', 'resistance_bands', 'kettlebell', 'medicine_ball', 'foam_roller', 'none'],
    default: 'bodyweight'
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
    enum: ['chest', 'back', 'shoulders', 'biceps', 'triceps', 'legs', 'glutes', 'abs', 'calves', 'forearms', 'core', 'lower_back', 'traps', 'hamstrings', 'quads', 'adductors', 'abductors']
  }],
  muscles: [{
    type: String,
    required: true,
    enum: ['pectorals', 'lats', 'rhomboids', 'traps', 'deltoids', 'biceps', 'triceps', 'forearms', 'quads', 'hamstrings', 'glutes', 'calves', 'abs', 'obliques', 'erector_spinae']
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
    default: 7, // Fixed 7 days per week
    min: [1, 'Duration must be at least 1 week'],
    max: [52, 'Duration cannot exceed 52 weeks']
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
