/**
 * Workout Template Model
 * Defines reusable workout plan templates created by doctors
 */

const mongoose = require('mongoose');

// Exercise schema for templates
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
  }
});

// Daily plan schema for templates
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
  exercises: [exerciseSchema]
});

const workoutTemplateSchema = new mongoose.Schema({
  // Doctor who owns this template
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
    default: 7, // Fixed 7 days per week
    min: [1, 'Duration must be at least 1 week'],
    max: [52, 'Duration cannot exceed 52 weeks']
  },

  // Weekly workout plan structure
  weeklyPlan: [dailyPlanSchema],

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

  // Template metadata
  tags: [{
    type: String,
    trim: true,
    maxlength: [50, 'Tag cannot exceed 50 characters']
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

// Index for better query performance
workoutTemplateSchema.index({ doctorId: 1, name: 1 });
workoutTemplateSchema.index({ isPublic: 1, difficulty: 1 });
workoutTemplateSchema.index({ tags: 1 });

// Pre-save middleware to update doctor name
workoutTemplateSchema.pre('save', async function(next) {
  if (this.isNew && this.doctorId) {
    try {
      const doctor = await mongoose.model('User').findById(this.doctorId);
      if (doctor) {
        this.doctorName = doctor.name;
      }
    } catch (error) {
      console.error('Error fetching doctor name:', error);
    }
  }
  next();
});

const WorkoutTemplate = mongoose.model('WorkoutTemplate', workoutTemplateSchema);

module.exports = WorkoutTemplate;
