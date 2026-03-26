/**
 * Workout Template Model
 * Defines reusable workout plan templates created by doctors
 */

const mongoose = require('mongoose');

const workoutTemplateSchema = new mongoose.Schema({
  // Doctor who owns this template
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // Template details
  name: {
    type: String,
    required: [true, 'Template name is required'],
    trim: true,
    maxlength: [100, 'Template name cannot exceed 100 characters']
  },

  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Template description cannot exceed 500 characters']
  },

  // Template metadata
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

  // Exercise data - stored as complete template
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

  // Template usage tracking
  usageCount: {
    type: Number,
    default: 0
  },

  // Template status
  isPublic: {
    type: Boolean,
    default: false
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
workoutTemplateSchema.index({ doctorId: 1, createdAt: -1 });
workoutTemplateSchema.index({ doctorId: 1, isPublic: 1 });
workoutTemplateSchema.index({ name: 'text', description: 'text' });

module.exports = mongoose.model('WorkoutTemplate', workoutTemplateSchema);
