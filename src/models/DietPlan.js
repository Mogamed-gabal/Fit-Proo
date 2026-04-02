const mongoose = require('mongoose');

// Food item schema for diet plans
const foodSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Food name is required'],
    trim: true,
    maxlength: [100, 'Food name cannot exceed 100 characters']
  },
  calories: {
    type: Number,
    required: [true, 'Calories are required'],
    min: [0, 'Calories cannot be negative']
  },
  protein: {
    type: Number,
    required: [true, 'Protein is required'],
    min: [0, 'Protein cannot be negative']
  },
  carbs: {
    type: Number,
    required: [true, 'Carbs are required'],
    min: [0, 'Carbs cannot be negative']
  },
  fat: {
    type: Number,
    required: [true, 'Fat is required'],
    min: [0, 'Fat cannot be negative']
  },
  fiber: {
    type: Number,
    default: 0,
    min: [0, 'Fiber cannot be negative']
  },
  sugar: {
    type: Number,
    default: 0,
    min: [0, 'Sugar cannot be negative']
  },
  sodium: {
    type: Number,
    default: 0,
    min: [0, 'Sodium cannot be negative']
  },
  source: {
    type: String,
    enum: ['smart_input', 'selector', 'manual'],
    default: 'manual'
  },
  edamamId: {
    type: String,
    default: null
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
  }
}, { _id: false });

// Meal schema for diet plans
const mealSchema = new mongoose.Schema({
  type: {
    type: String,
    required: [true, 'Meal type is required'],
    enum: ['breakfast', 'lunch', 'dinner']
  },
  food: [foodSchema],
  totalCalories: {
    type: Number,
    default: 0,
    min: [0, 'Total calories cannot be negative']
  },
  totalProtein: {
    type: Number,
    default: 0,
    min: [0, 'Total protein cannot be negative']
  },
  totalCarbs: {
    type: Number,
    default: 0,
    min: [0, 'Total carbs cannot be negative']
  },
  totalFat: {
    type: Number,
    default: 0,
    min: [0, 'Total fat cannot be negative']
  }
}, { _id: false });

// Daily plan schema for diet plans
const dailyPlanSchema = new mongoose.Schema({
  dayName: {
    type: String,
    required: [true, 'Day name is required'],
    enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
  },
  meals: [mealSchema],
  dailyTotals: {
    calories: {
      type: Number,
      default: 0,
      min: [0, 'Daily calories cannot be negative']
    },
    protein: {
      type: Number,
      default: 0,
      min: [0, 'Daily protein cannot be negative']
    },
    carbs: {
      type: Number,
      default: 0,
      min: [0, 'Daily carbs cannot be negative']
    },
    fat: {
      type: Number,
      default: 0,
      min: [0, 'Daily fat cannot be negative']
    }
  }
}, { _id: false });

// Main diet plan schema
const dietPlanSchema = new mongoose.Schema({
  // Client who owns this diet plan
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Client ID is required']
  },

  // Doctor who created this diet plan
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Doctor ID is required']
  },

  // Doctor name for easy reference
  doctorName: {
    type: String,
    required: [true, 'Doctor name is required'],
    trim: true,
    maxlength: [100, 'Doctor name cannot exceed 100 characters']
  },

  // Diet plan details
  name: {
    type: String,
    required: [true, 'Diet plan name is required'],
    trim: true,
    maxlength: [100, 'Diet plan name cannot exceed 100 characters']
  },

  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Diet plan description cannot exceed 500 characters']
  },

  // Plan lifecycle dates (exactly 7 days)
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

  // Duration in weeks (fixed to 1 week = 7 days)
  durationWeeks: {
    type: Number,
    default: 1, // Fixed 1 week = 7 days
    min: [1, 'Duration must be exactly 1 week (7 days)'],
    max: [1, 'Duration must be exactly 1 week (7 days)']
  },

  // Weekly diet plan structure (7 days with 3 meals each)
  weeklyPlan: [dailyPlanSchema],

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
dietPlanSchema.index({ clientId: 1, isActive: 1 });
dietPlanSchema.index({ doctorId: 1, createdAt: -1 });
dietPlanSchema.index({ clientId: 1, startDate: 1, endDate: 1 });
dietPlanSchema.index({ isActive: 1, endDate: 1 });

// Pre-save middleware to calculate totals
dietPlanSchema.pre('save', function(next) {
  // Calculate daily totals for each day
  this.weeklyPlan.forEach(day => {
    day.dailyTotals = {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0
    };

    day.meals.forEach(meal => {
      meal.totalCalories = 0;
      meal.totalProtein = 0;
      meal.totalCarbs = 0;
      meal.totalFat = 0;

      meal.food.forEach(food => {
        meal.totalCalories += food.calories || 0;
        meal.totalProtein += food.protein || 0;
        meal.totalCarbs += food.carbs || 0;
        meal.totalFat += food.fat || 0;
      });

      day.dailyTotals.calories += meal.totalCalories;
      day.dailyTotals.protein += meal.totalProtein;
      day.dailyTotals.carbs += meal.totalCarbs;
      day.dailyTotals.fat += meal.totalFat;
    });
  });

  // Calculate weekly totals
  this.weeklyTotals = {
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0
  };

  this.weeklyPlan.forEach(day => {
    this.weeklyTotals.calories += day.dailyTotals.calories;
    this.weeklyTotals.protein += day.dailyTotals.protein;
    this.weeklyTotals.carbs += day.dailyTotals.carbs;
    this.weeklyTotals.fat += day.dailyTotals.fat;
  });

  // Update timestamp
  this.updatedAt = new Date();
  next();
});

// Static method to get active diet plan for client
dietPlanSchema.statics.getActiveDietPlanForClient = function(clientId) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return this.findOne({
    clientId,
    isActive: true,
    startDate: { $lte: today },
    endDate: { $gte: today }
  }).sort({ createdAt: -1 });
};

// Static method to deactivate expired diet plans
dietPlanSchema.statics.deactivateExpiredDietPlans = function() {
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

// Static method to activate future diet plans
dietPlanSchema.statics.activateFutureDietPlans = function() {
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

module.exports = mongoose.model('DietPlan', dietPlanSchema);
