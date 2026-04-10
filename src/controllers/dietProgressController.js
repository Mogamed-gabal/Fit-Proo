const DietProgress = require('../models/DietProgress');
const DietPlan = require('../models/DietPlan');
const User = require('../models/User');
const Notification = require('../models/Notification');

class DietProgressController {
  /**
   * Mark food as eaten
   * POST /progress/food
   */
  async markFoodAsEaten(req, res, next) {
    try {
      const { dietPlanId, dayName, mealType, foodName } = req.body;
      const clientId = req.user.userId;

      // Validate ownership - client can only mark their own food
      const dietPlan = await DietPlan.findOne({ 
        _id: dietPlanId, 
        clientId 
      });

      if (!dietPlan) {
        return res.status(404).json({
          success: false,
          error: 'Diet plan not found or access denied'
        });
      }

      // Find or create progress entry
      let progress = await DietProgress.findOne({
        clientId,
        dietPlanId,
        dayName,
        mealType,
        foodName
      });

      if (!progress) {
        // Find the food in the diet plan to get nutrition values
        const dayPlan = dietPlan.weeklyPlan.find(day => day.dayName === dayName);
        if (!dayPlan) {
          return res.status(404).json({
            success: false,
            error: 'Day not found in diet plan'
          });
        }

        const meal = dayPlan.meals.find(m => m.type === mealType);
        if (!meal) {
          return res.status(404).json({
            success: false,
            error: 'Meal not found in diet plan'
          });
        }

        const food = meal.food.find(f => f.name === foodName);
        if (!food) {
          return res.status(404).json({
            success: false,
            error: 'Food not found in diet plan'
          });
        }

        // Create progress entry with nutrition values
        progress = new DietProgress({
          clientId,
          dietPlanId,
          dayName,
          mealType,
          foodName,
          nutrition: food.nutrition || {
            calories: 0,
            protein: 0,
            carbs: 0,
            fat: 0
          },
          image: food.image || null,
          recipe: food.recipe || null
        });
      }

      // Mark as eaten
      progress.isEaten = true;
      progress.eatenAt = new Date();
      await progress.save();

      res.status(200).json({
        success: true,
        message: 'Food marked as eaten successfully',
        data: { progress }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get daily progress
   * GET /progress/:dietPlanId/day/:dayName
   */
  async getDailyProgress(req, res, next) {
    try {
      const { dietPlanId, dayName } = req.params;
      const userId = req.user.userId;
      const userRole = req.user.role;

      // Validate access
      let dietPlan;
      if (userRole === 'client') {
        dietPlan = await DietPlan.findOne({ 
          _id: dietPlanId, 
          clientId: userId 
        });
      } else if (userRole === 'doctor') {
        dietPlan = await DietPlan.findOne({ 
          _id: dietPlanId,
          doctorId: userId 
        });
      }

      if (!dietPlan) {
        return res.status(404).json({
          success: false,
          error: 'Diet plan not found or access denied'
        });
      }

      // Get all progress for the day
      const progressEntries = await DietProgress.find({
        dietPlanId,
        dayName
      }).sort({ mealType: 1, foodName: 1 });

      // Group by meal type
      const groupedProgress = {
        breakfast: { eaten: [], notEaten: [] },
        lunch: { eaten: [], notEaten: [] },
        dinner: { eaten: [], notEaten: [] },
        snack: { eaten: [], notEaten: [] }
      };

      progressEntries.forEach(entry => {
        const mealData = {
          foodName: entry.foodName,
          nutrition: entry.nutrition,
          image: entry.image,
          recipe: entry.recipe,
          eatenAt: entry.eatenAt
        };

        if (entry.isEaten) {
          groupedProgress[entry.mealType].eaten.push(mealData);
        } else {
          groupedProgress[entry.mealType].notEaten.push(mealData);
        }
      });

      // Calculate daily nutrition totals
      const dailyTotals = {
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0
      };

      progressEntries.forEach(entry => {
        if (entry.isEaten) {
          dailyTotals.calories += entry.nutrition.calories || 0;
          dailyTotals.protein += entry.nutrition.protein || 0;
          dailyTotals.carbs += entry.nutrition.carbs || 0;
          dailyTotals.fat += entry.nutrition.fat || 0;
        }
      });

      res.status(200).json({
        success: true,
        data: {
          dayName,
          progress: groupedProgress,
          dailyTotals,
          totalFoods: progressEntries.length,
          eatenFoods: progressEntries.filter(p => p.isEaten).length,
          completionRate: progressEntries.length > 0 
            ? Math.round((progressEntries.filter(p => p.isEaten).length / progressEntries.length) * 100)
            : 0
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get diet progress for a client
   * GET /progress/client/:clientId
   */
  async getDietProgress(req, res, next) {
    try {
      const { clientId } = req.params;
      const userId = req.user.userId;
      const userRole = req.user.role;

      // Validate access - doctors can view their clients
      if (userRole === 'doctor') {
        // Verify the client belongs to the doctor
        const client = await User.findOne({ 
          _id: clientId, 
          doctorId: userId 
        });
        
        if (!client) {
          return res.status(404).json({
            success: false,
            error: 'Client not found or access denied'
          });
        }
      }
      // Client access is validated by middleware

      // Get active diet plan for the client
      const dietPlan = await DietPlan.findOne({ 
        clientId,
        isActive: true 
      }).sort({ createdAt: -1 });

      if (!dietPlan) {
        return res.status(404).json({
          success: false,
          error: 'No active diet plan found for this client'
        });
      }

      // Get all progress entries for the client
      const progressEntries = await DietProgress.find({
        clientId,
        dietPlanId: dietPlan._id
      }).sort({ createdAt: 1 });

      // Group progress by day
      const dailyProgress = {};
      progressEntries.forEach(entry => {
        if (!dailyProgress[entry.dayName]) {
          dailyProgress[entry.dayName] = {
            dayName: entry.dayName,
            meals: {
              breakfast: [],
              lunch: [],
              dinner: []
            },
            totalNutrition: {
              calories: 0,
              protein: 0,
              carbs: 0,
              fat: 0
            },
            completionRate: 0
          };
        }

        dailyProgress[entry.dayName].meals[entry.mealType].push({
          foodName: entry.foodName,
          isEaten: entry.isEaten,
          nutrition: entry.nutrition,
          eatenAt: entry.eatenAt
        });

        if (entry.isEaten) {
          dailyProgress[entry.dayName].totalNutrition.calories += entry.nutrition.calories || 0;
          dailyProgress[entry.dayName].totalNutrition.protein += entry.nutrition.protein || 0;
          dailyProgress[entry.dayName].totalNutrition.carbs += entry.nutrition.carbs || 0;
          dailyProgress[entry.dayName].totalNutrition.fat += entry.nutrition.fat || 0;
        }
      });

      // Calculate completion rates
      Object.keys(dailyProgress).forEach(dayName => {
        const day = dailyProgress[dayName];
        let totalFoods = 0;
        let eatenFoods = 0;

        Object.keys(day.meals).forEach(mealType => {
          day.meals[mealType].forEach(food => {
            totalFoods++;
            if (food.isEaten) eatenFoods++;
          });
        });

        day.completionRate = totalFoods > 0 ? Math.round((eatenFoods / totalFoods) * 100) : 0;
      });

      // Calculate overall progress
      const totalDays = Object.keys(dailyProgress).length;
      const overallCompletion = totalDays > 0 
        ? Math.round(Object.values(dailyProgress).reduce((sum, day) => sum + day.completionRate, 0) / totalDays)
        : 0;

      // Get target nutrition from diet plan
      const targetNutrition = {
        calories: dietPlan.weeklyTotals?.calories || 0,
        protein: dietPlan.weeklyTotals?.protein || 0,
        carbs: dietPlan.weeklyTotals?.carbs || 0,
        fat: dietPlan.weeklyTotals?.fat || 0
      };

      // Calculate consumed nutrition
      const consumedNutrition = Object.values(dailyProgress).reduce((total, day) => ({
        calories: total.calories + day.totalNutrition.calories,
        protein: total.protein + day.totalNutrition.protein,
        carbs: total.carbs + day.totalNutrition.carbs,
        fat: total.fat + day.totalNutrition.fat
      }), { calories: 0, protein: 0, carbs: 0, fat: 0 });

      res.status(200).json({
        success: true,
        data: {
          clientId,
          dietPlan: {
            id: dietPlan._id,
            name: dietPlan.name,
            startDate: dietPlan.startDate,
            endDate: dietPlan.endDate,
            durationWeeks: dietPlan.durationWeeks
          },
          dailyProgress: Object.values(dailyProgress),
          overallStats: {
            totalDays,
            overallCompletion,
            targetNutrition,
            consumedNutrition,
            remainingNutrition: {
              calories: Math.max(0, targetNutrition.calories - consumedNutrition.calories),
              protein: Math.max(0, targetNutrition.protein - consumedNutrition.protein),
              carbs: Math.max(0, targetNutrition.carbs - consumedNutrition.carbs),
              fat: Math.max(0, targetNutrition.fat - consumedNutrition.fat)
            }
          },
          generatedAt: new Date()
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get real-time nutrition tracking
   * GET /progress/:dietPlanId/nutrition
   */
  async getNutritionTracking(req, res, next) {
    try {
      const { dietPlanId } = req.params;
      const userId = req.user.userId;
      const userRole = req.user.role;

      // Validate access
      let dietPlan;
      if (userRole === 'client') {
        dietPlan = await DietPlan.findOne({ 
          _id: dietPlanId, 
          clientId: userId 
        });
      } else if (userRole === 'doctor') {
        dietPlan = await DietPlan.findOne({ 
          _id: dietPlanId,
          doctorId: userId 
        });
      }

      if (!dietPlan) {
        return res.status(404).json({
          success: false,
          error: 'Diet plan not found or access denied'
        });
      }

      // Get all eaten foods for the diet plan
      const eatenFoods = await DietProgress.find({
        dietPlanId,
        isEaten: true
      });

      // Calculate consumed nutrition
      const consumed = {
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0
      };

      eatenFoods.forEach(food => {
        consumed.calories += food.nutrition.calories || 0;
        consumed.protein += food.nutrition.protein || 0;
        consumed.carbs += food.nutrition.carbs || 0;
        consumed.fat += food.nutrition.fat || 0;
      });

      // Get target nutrition from diet plan
      const target = {
        calories: dietPlan.targetCalories || 2000,
        protein: dietPlan.targetMacros?.protein || 150,
        carbs: dietPlan.targetMacros?.carbs || 250,
        fat: dietPlan.targetMacros?.fat || 65
      };

      // Calculate remaining
      const remaining = {
        calories: Math.max(0, target.calories - consumed.calories),
        protein: Math.max(0, target.protein - consumed.protein),
        carbs: Math.max(0, target.carbs - consumed.carbs),
        fat: Math.max(0, target.fat - consumed.fat)
      };

      // Calculate percentages
      const percentages = {
        calories: target.calories > 0 ? Math.round((consumed.calories / target.calories) * 100) : 0,
        protein: target.protein > 0 ? Math.round((consumed.protein / target.protein) * 100) : 0,
        carbs: target.carbs > 0 ? Math.round((consumed.carbs / target.carbs) * 100) : 0,
        fat: target.fat > 0 ? Math.round((consumed.fat / target.fat) * 100) : 0
      };

      res.status(200).json({
        success: true,
        data: {
          target,
          consumed,
          remaining,
          percentages,
          totalFoodsEaten: eatenFoods.length,
          lastUpdated: new Date()
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get chart data for diet plan
   * GET /diet-plans/:id/stats
   */
  async getDietPlanStats(req, res, next) {
    try {
      const { id: dietPlanId } = req.params;
      const userId = req.user.userId;
      const userRole = req.user.role;

      // Validate access
      let dietPlan;
      if (userRole === 'client') {
        dietPlan = await DietPlan.findOne({ 
          _id: dietPlanId, 
          clientId: userId 
        });
      } else if (userRole === 'doctor') {
        dietPlan = await DietPlan.findOne({ 
          _id: dietPlanId,
          doctorId: userId 
        });
      }

      if (!dietPlan) {
        return res.status(404).json({
          success: false,
          error: 'Diet plan not found or access denied'
        });
      }

      // Get all progress entries grouped by day
      const progressByDay = await DietProgress.aggregate([
        { $match: { dietPlanId: new mongoose.Types.ObjectId(dietPlanId) } },
        { $group: {
          _id: '$dayName',
          calories: { $sum: { $cond: [{ $eq: ['$isEaten', true] }, '$nutrition.calories', 0] } },
          protein: { $sum: { $cond: [{ $eq: ['$isEaten', true] }, '$nutrition.protein', 0] } },
          carbs: { $sum: { $cond: [{ $eq: ['$isEaten', true] }, '$nutrition.carbs', 0] } },
          fat: { $sum: { $cond: [{ $eq: ['$isEaten', true] }, '$nutrition.fat', 0] } },
          totalFoods: { $sum: 1 },
          eatenFoods: { $sum: { $cond: [{ $eq: ['$isEaten', true] }, 1, 0] } }
        }},
        { $sort: { '_id': 1 } }
      ]);

      // Format daily data for charts
      const daily = progressByDay.map(day => ({
        day: day._id,
        calories: day.calories,
        protein: day.protein,
        carbs: day.carbs,
        fat: day.fat,
        completionRate: day.totalFoods > 0 ? Math.round((day.eatenFoods / day.totalFoods) * 100) : 0
      }));

      // Calculate totals
      const totals = {
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0
      };

      daily.forEach(day => {
        totals.calories += day.calories;
        totals.protein += day.protein;
        totals.carbs += day.carbs;
        totals.fat += day.fat;
      });

      // Get target nutrition
      const target = {
        calories: dietPlan.targetCalories || 2000,
        protein: dietPlan.targetMacros?.protein || 150,
        carbs: dietPlan.targetMacros?.carbs || 250,
        fat: dietPlan.targetMacros?.fat || 65
      };

      // Calculate progress
      const progress = {
        consumed: {
          calories: totals.calories,
          protein: totals.protein,
          carbs: totals.carbs,
          fat: totals.fat
        },
        remaining: {
          calories: Math.max(0, target.calories * 7 - totals.calories), // 7 days
          protein: Math.max(0, target.protein * 7 - totals.protein),
          carbs: Math.max(0, target.carbs * 7 - totals.carbs),
          fat: Math.max(0, target.fat * 7 - totals.fat)
        },
        completionRate: daily.length > 0 
          ? Math.round(daily.reduce((sum, day) => sum + day.completionRate, 0) / daily.length)
          : 0
      };

      res.status(200).json({
        success: true,
        data: {
          daily,
          totals,
          progress,
          target,
          period: '7 days',
          generatedAt: new Date()
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Send notification when diet plan is assigned
   */
  async sendDietPlanNotification(clientId, dietPlanId, planName) {
    try {
      await Notification.createDietPlanNotification(clientId, dietPlanId, planName);
      console.log(`📧 Diet plan notification sent to client ${clientId}`);
    } catch (error) {
      console.error('🚨 Failed to send diet plan notification:', error);
    }
  }
}

module.exports = new DietProgressController();
