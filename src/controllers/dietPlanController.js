const DietPlan = require('../models/DietPlan');
const User = require('../models/User');
const DietProgressController = require('./dietProgressController');
const { body, param, query } = require('express-validator');

class DietPlanController {
  /**
   * Create a new diet plan for a client
   * POST /api/diet-plans
   */
  async createDietPlan(req, res, next) {
    try {
      const {
        clientId,
        name,
        description,
        startDate,
        endDate,
        weeklyPlan
      } = req.body;

      const doctorId = req.user.userId;

      // Get doctor information
      const doctor = await User.findById(doctorId);
      if (!doctor) {
        return res.status(404).json({
          success: false,
          error: 'Doctor not found'
        });
      }

      // Check if client exists and is approved
      const client = await User.findById(clientId);
      if (!client || client.role !== 'client' || client.status !== 'approved') {
        return res.status(404).json({
          success: false,
          error: 'Client not found or not approved'
        });
      }

      // 🔒 ENFORCE: Diet plans must be exactly 7 days
      const start = new Date(startDate);
      const end = new Date(endDate);
      const diffTime = Math.abs(end - start);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays !== 7) {
        return res.status(400).json({
          success: false,
          error: 'Diet plans must be exactly 7 days duration. Current duration: ' + diffDays + ' days'
        });
      }

      // Validate weekly plan structure (1-7 days with 3 meals each)
      if (!weeklyPlan || !Array.isArray(weeklyPlan) || weeklyPlan.length === 0 || weeklyPlan.length > 7) {
        return res.status(400).json({
          success: false,
          error: 'Weekly plan must contain between 1 and 7 days'
        });
      }

      const requiredDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
      const providedDays = weeklyPlan.map(day => day.dayName);
      
      // Check for duplicate days
      const duplicateDays = providedDays.filter((day, index) => providedDays.indexOf(day) !== index);
      if (duplicateDays.length > 0) {
        return res.status(400).json({
          success: false,
          error: `Duplicate days found: ${duplicateDays.join(', ')}`
        });
      }
      
      // Check if provided days are valid
      for (const day of providedDays) {
        if (!requiredDays.includes(day)) {
          return res.status(400).json({
            success: false,
            error: `Invalid day name: ${day}. Must be one of: ${requiredDays.join(', ')}`
          });
        }
      }

      // Validate each day has 1-3 meals (breakfast, lunch, dinner)
      for (const day of weeklyPlan) {
        if (!day.meals || !Array.isArray(day.meals) || day.meals.length === 0 || day.meals.length > 3) {
          return res.status(400).json({
            success: false,
            error: `Each day must contain between 1 and 3 meals. Day ${day.dayName} has ${day.meals ? day.meals.length : 0} meals.`
          });
        }

        const validMeals = ['breakfast', 'lunch', 'dinner'];
        const providedMeals = day.meals.map(meal => meal.type);
        
        // Check for duplicate meal types (filter out undefined values first)
        const duplicateMeals = providedMeals.filter((meal, index) => 
          meal && providedMeals.indexOf(meal) !== index
        );
        if (duplicateMeals.length > 0) {
          return res.status(400).json({
            success: false,
            error: `Duplicate meal types found for day ${day.dayName}: ${duplicateMeals.join(', ')}`
          });
        }
        
        // Check if provided meal types are valid
        for (const meal of providedMeals) {
          if (meal && !validMeals.includes(meal)) {
            return res.status(400).json({
              success: false,
              error: `Invalid meal type: ${meal}. Must be one of: ${validMeals.join(', ')}`
            });
          }
        }

        // Validate each meal has at least one food item
        for (const meal of day.meals) {
          if (!meal.food || !Array.isArray(meal.food) || meal.food.length === 0) {
            return res.status(400).json({
              success: false,
              error: `Each meal must contain at least one food item. Day ${day.dayName}, ${meal.type || 'unknown meal'} has no foods.`
            });
          }

          // Validate each food item
          for (const food of meal.food) {
            if (!food.name || typeof food.calories !== 'number' || typeof food.protein !== 'number' || typeof food.carbs !== 'number' || typeof food.fat !== 'number') {
              return res.status(400).json({
                success: false,
                error: `Each food must have a name and numeric calories, protein, carbs, and fat. Missing in Day ${day.dayName}, ${meal.type || 'unknown meal'}.`
              });
            }

            // Validate optional fields if provided
            if (food.image && typeof food.image !== 'string') {
              return res.status(400).json({
                success: false,
                error: `Food image must be a string URL. Invalid in Day ${day.dayName}, ${meal.type || 'unknown meal'}, ${food.name}.`
              });
            }

            if (food.recipe && typeof food.recipe !== 'string') {
              return res.status(400).json({
                success: false,
                error: `Food recipe must be a string. Invalid in Day ${day.dayName}, ${meal.type || 'unknown meal'}, ${food.name}.`
              });
            }

            if (food.recipe && food.recipe.length > 1000) {
              return res.status(400).json({
                success: false,
                error: `Food recipe cannot exceed 1000 characters. Too long in Day ${day.dayName}, ${meal.type || 'unknown meal'}, ${food.name}.`
              });
            }
          }
        }
      }

      // Create new diet plan
      const dietPlan = new DietPlan({
        clientId,
        doctorId,
        doctorName: doctor.name,
        name,
        description,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        durationWeeks: 1, // Fixed 1 week = 7 days
        weeklyPlan
      });

      await dietPlan.save();

      // Send notification to client
      await DietProgressController.sendDietPlanNotification(clientId, dietPlan._id, name);

      res.status(201).json({
        success: true,
        message: 'Diet plan created successfully',
        data: { dietPlan }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get diet plans for a client (doctor's view)
   * GET /api/diet-plans/client/:clientId
   */
  async getClientDietPlans(req, res, next) {
    try {
      const { clientId } = req.params;
      const doctorId = req.user.userId;
      const { page = 1, limit = 10 } = req.query;

      // Verify doctor owns the client's diet plans
      const client = await User.findById(clientId);
      if (!client || client.role !== 'client') {
        return res.status(404).json({
          success: false,
          error: 'Client not found'
        });
      }

      // Get diet plans with pagination
      const dietPlans = await DietPlan.find({ clientId, doctorId })
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .populate('clientId', 'name email')
        .lean();

      // Get total count for pagination
      const total = await DietPlan.countDocuments({ clientId, doctorId });

      res.status(200).json({
        success: true,
        data: {
          dietPlans,
          pagination: {
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            totalDietPlans: total,
            hasNext: page * limit < total,
            hasPrev: page > 1
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get active diet plan for a client
   * GET /api/diet-plans/active/:clientId
   */
  async getActiveDietPlan(req, res, next) {
    try {
      const { clientId } = req.params;
      const userId = req.user.userId;

      let dietPlan;

      if (req.user.role === 'doctor') {
        // Doctor viewing client's plan
        dietPlan = await DietPlan.findOne({ 
          clientId, 
          doctorId: userId,
          isActive: true,
          endDate: { $gt: new Date() }
        }).populate('clientId', 'name email');
      } else if (req.user.role === 'client') {
        // Client viewing their own plan
        dietPlan = await DietPlan.findOne({ 
          clientId: userId, 
          isActive: true,
          endDate: { $gt: new Date() }
        });
      }

      if (!dietPlan) {
        return res.status(404).json({
          success: false,
          error: 'No active diet plan found'
        });
      }

      res.status(200).json({
        success: true,
        data: { dietPlan }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update an existing diet plan
   * PUT /api/diet-plans/:id
   */
  async updateDietPlan(req, res, next) {
    try {
      const { id } = req.params;
      const { name, description, startDate, endDate, weeklyPlan } = req.body;
      const doctorId = req.user.userId;

      // Find the diet plan
      const dietPlan = await DietPlan.findOne({ _id: id, doctorId });
      if (!dietPlan) {
        return res.status(404).json({
          success: false,
          error: 'Diet plan not found'
        });
      }

      // 🔒 ENFORCE: If dates are being updated, validate 7-day duration
      if (startDate || endDate) {
        const newStartDate = startDate ? new Date(startDate) : dietPlan.startDate;
        const newEndDate = endDate ? new Date(endDate) : dietPlan.endDate;
        
        const diffTime = Math.abs(newEndDate - newStartDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays !== 7) {
          return res.status(400).json({
            success: false,
            error: 'Diet plans must be exactly 7 days duration. Current duration: ' + diffDays + ' days'
          });
        }
        
        dietPlan.startDate = newStartDate;
        dietPlan.endDate = newEndDate;
      }

      // Validate weekly plan structure if being updated
      if (weeklyPlan) {
        if (!Array.isArray(weeklyPlan) || weeklyPlan.length === 0 || weeklyPlan.length > 7) {
          return res.status(400).json({
            success: false,
            error: 'Weekly plan must contain between 1 and 7 days'
          });
        }

        const requiredDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        const providedDays = weeklyPlan.map(day => day.dayName);
        
        // Check for duplicate days
        const duplicateDays = providedDays.filter((day, index) => providedDays.indexOf(day) !== index);
        if (duplicateDays.length > 0) {
          return res.status(400).json({
            success: false,
            error: `Duplicate days found: ${duplicateDays.join(', ')}`
          });
        }
        
        // Check if provided days are valid
        for (const day of providedDays) {
          if (!requiredDays.includes(day)) {
            return res.status(400).json({
              success: false,
              error: `Invalid day name: ${day}. Must be one of: ${requiredDays.join(', ')}`
            });
          }
        }

        // Validate each day has 1-3 meals (breakfast, lunch, dinner)
        for (const day of weeklyPlan) {
          if (!day.meals || !Array.isArray(day.meals) || day.meals.length === 0 || day.meals.length > 3) {
            return res.status(400).json({
              success: false,
              error: `Each day must contain between 1 and 3 meals. Day ${day.dayName} has ${day.meals ? day.meals.length : 0} meals.`
            });
          }

          const validMeals = ['breakfast', 'lunch', 'dinner'];
          const providedMeals = day.meals.map(meal => meal.mealType);
          
          // Check for duplicate meal types (filter out undefined values first)
          const duplicateMeals = providedMeals.filter((meal, index) => 
            meal && providedMeals.indexOf(meal) !== index
          );
          if (duplicateMeals.length > 0) {
            return res.status(400).json({
              success: false,
              error: `Duplicate meal types found for day ${day.dayName}: ${duplicateMeals.join(', ')}`
            });
          }
          
          // Check if provided meal types are valid
          for (const meal of providedMeals) {
            if (meal && !validMeals.includes(meal)) {
              return res.status(400).json({
                success: false,
                error: `Invalid meal type: ${meal}. Must be one of: ${validMeals.join(', ')}`
              });
            }
          }
        }
      }

      // Update fields
      if (name) dietPlan.name = name;
      if (description) dietPlan.description = description;
      if (weeklyPlan) dietPlan.weeklyPlan = weeklyPlan;

      // Fixed duration: exactly 7 days
      dietPlan.durationWeeks = 1;

      dietPlan.updatedAt = new Date();
      await dietPlan.save();

      res.status(200).json({
        success: true,
        message: 'Diet plan updated successfully',
        data: { dietPlan }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete a diet plan
   * DELETE /api/diet-plans/:id
   */
  async deleteDietPlan(req, res, next) {
    try {
      const { id } = req.params;
      const doctorId = req.user.userId;

      // Find and delete the diet plan
      const dietPlan = await DietPlan.findOneAndDelete({ _id: id, doctorId });
      if (!dietPlan) {
        return res.status(404).json({
          success: false,
          error: 'Diet plan not found'
        });
      }

      res.status(200).json({
        success: true,
        message: 'Diet plan deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get diet plan by ID
   * GET /api/diet-plans/:id
   */
  async getDietPlan(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user.userId;
      const userRole = req.user.role;

      let dietPlan;
      if (userRole === 'doctor') {
        // Doctor can get their own diet plans
        dietPlan = await DietPlan.findOne({ _id: id, doctorId: userId });
      } else if (userRole === 'client') {
        // Client can only get their own diet plans
        dietPlan = await DietPlan.findOne({ _id: id, clientId: userId })
          .populate('doctorId', 'name email');
      }

      if (!dietPlan) {
        return res.status(404).json({
          success: false,
          error: 'Diet plan not found'
        });
      }

      res.status(200).json({
        success: true,
        data: { dietPlan }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all diet plans for the current doctor
   * GET /api/diet-plans
   */
  async getDoctorDietPlans(req, res, next) {
    try {
      const doctorId = req.user.userId;
      const { page = 1, limit = 10, search, clientId } = req.query;

      // Build query
      const query = { doctorId };
      
      if (clientId) {
        query.clientId = clientId;
      }

      // Add search filter
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } }
        ];
      }

      // Get diet plans with pagination
      const dietPlans = await DietPlan.find(query)
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .populate('clientId', 'name email')
        .lean();

      // Get total count for pagination
      const total = await DietPlan.countDocuments(query);

      res.status(200).json({
        success: true,
        data: {
          dietPlans,
          pagination: {
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            totalDietPlans: total,
            hasNext: page * limit < total,
            hasPrev: page > 1
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new DietPlanController();
