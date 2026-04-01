const mongoose = require('mongoose');

const dietProgressSchema = new mongoose.Schema({
  // Client who owns this progress
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Client ID is required']
  },

  // Diet plan this progress belongs to
  dietPlanId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DietPlan',
    required: [true, 'Diet plan ID is required']
  },

  // Day name (Monday, Tuesday, etc.)
  dayName: {
    type: String,
    required: [true, 'Day name is required'],
    enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
  },

  // Meal type
  mealType: {
    type: String,
    required: [true, 'Meal type is required'],
    enum: ['breakfast', 'lunch', 'dinner']
  },

  // Food name (from Smart Input or Selector)
  foodName: {
    type: String,
    required: [true, 'Food name is required'],
    trim: true,
    maxlength: [100, 'Food name cannot exceed 100 characters']
  },

  // Nutrition values (stored from original food)
  nutrition: {
    calories: { type: Number, default: 0 },
    protein: { type: Number, default: 0 },
    carbs: { type: Number, default: 0 },
    fat: { type: Number, default: 0 },
    fiber: { type: Number, default: 0 },
    sugar: { type: Number, default: 0 },
    sodium: { type: Number, default: 0 }
  },

  // Optional food image
  image: {
    type: String,
    default: null
  },

  // Optional recipe instructions
  recipe: {
    type: String,
    default: null,
    maxlength: [1000, 'Recipe cannot exceed 1000 characters']
  },

  // Tracking status
  isEaten: {
    type: Boolean,
    default: false
  },

  // When the food was marked as eaten
  eatenAt: {
    type: Date,
    default: null
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
});

// Indexes for performance
dietProgressSchema.index({ clientId: 1, dietPlanId: 1, dayName: 1, mealType: 1 });
dietProgressSchema.index({ clientId: 1, dietPlanId: 1, isEaten: 1 });
dietProgressSchema.index({ dietPlanId: 1, dayName: 1, isEaten: 1 });

// Pre-save middleware to update timestamps
dietProgressSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  if (this.isEaten && !this.eatenAt) {
    this.eatenAt = new Date();
  }
  next();
});

module.exports = mongoose.model('DietProgress', dietProgressSchema);
