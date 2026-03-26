/**
 * Workout Plan Controller
 * Handles workout plan lifecycle management
 */

const WorkoutPlan = require('../models/WorkoutPlan');
const ClientProgress = require('../models/ClientProgress');
const User = require('../models/User');

class WorkoutPlanController {
  /**
   * Create a new workout plan for a client
   */
  async createWorkoutPlan(req, res, next) {
    try {
      const { clientId, name, description, startDate, endDate, difficulty, durationWeeks, exercises } = req.body;
      const doctorId = req.user.userId;

      // Validate doctor role
      if (req.user.role !== 'doctor') {
        return res.status(403).json({
          success: false,
          error: 'Only doctors can create workout plans'
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

      // Check if client already has an active plan
      const existingActivePlan = await WorkoutPlan.findOne({
        clientId,
        isActive: true,
        endDate: { $gt: new Date() }
      });

      if (existingActivePlan) {
        return res.status(400).json({
          success: false,
          error: 'Client already has an active workout plan'
        });
      }

      // Create new workout plan
      const workoutPlan = new WorkoutPlan({
        clientId,
        doctorId,
        name,
        description,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        difficulty,
        durationWeeks,
        exercises
      });

      await workoutPlan.save();

      res.status(201).json({
        success: true,
        message: 'Workout plan created successfully',
        data: { workoutPlan }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update an existing workout plan
   */
  async updateWorkoutPlan(req, res, next) {
    try {
      const { planId, name, description, startDate, endDate, difficulty, durationWeeks, exercises } = req.body;
      const doctorId = req.user.userId;

      // Find the workout plan
      const workoutPlan = await WorkoutPlan.findOne({ _id: planId, doctorId });
      if (!workoutPlan) {
        return res.status(404).json({
          success: false,
          error: 'Workout plan not found'
        });
      }

      // Update fields
      if (name) workoutPlan.name = name;
      if (description) workoutPlan.description = description;
      if (startDate) workoutPlan.startDate = new Date(startDate);
      if (endDate) workoutPlan.endDate = new Date(endDate);
      if (difficulty) workoutPlan.difficulty = difficulty;
      if (durationWeeks) workoutPlan.durationWeeks = durationWeeks;
      if (exercises) workoutPlan.exercises = exercises;

      workoutPlan.updatedAt = new Date();
      await workoutPlan.save();

      res.status(200).json({
        success: true,
        message: 'Workout plan updated successfully',
        data: { workoutPlan }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get workout plans for a client (doctor's view)
   */
  async getClientWorkoutPlans(req, res, next) {
    try {
      const { clientId } = req.params;
      const doctorId = req.user.userId;

      // Verify doctor owns the client's plans
      const workoutPlans = await WorkoutPlan.find({ clientId, doctorId })
        .sort({ createdAt: -1 })
        .populate('clientId', 'name email')
        .lean();

      res.status(200).json({
        success: true,
        data: { workoutPlans }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get client's active workout plan
   */
  async getActiveWorkoutPlan(req, res, next) {
    try {
      const { clientId } = req.params;
      const userId = req.user.userId;

      let workoutPlan;

      if (req.user.role === 'doctor') {
        // Doctor viewing client's plan
        workoutPlan = await WorkoutPlan.findOne({ 
          clientId, 
          isActive: true,
          endDate: { $gt: new Date() }
        }).populate('clientId', 'name email');
      } else if (req.user.role === 'client') {
        // Client viewing their own plan
        workoutPlan = await WorkoutPlan.findOne({ 
          clientId: userId, 
          isActive: true,
          endDate: { $gt: new Date() }
        });
      }

      if (!workoutPlan) {
        return res.status(404).json({
          success: false,
          error: 'No active workout plan found'
        });
      }

      res.status(200).json({
        success: true,
        data: { workoutPlan }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all workout plans for a client (including inactive ones)
   */
  async getClientWorkoutHistory(req, res, next) {
    try {
      const { clientId } = req.params;
      const userId = req.user.userId;

      let workoutPlans;

      if (req.user.role === 'doctor') {
        // Doctor viewing client's history
        workoutPlans = await WorkoutPlan.find({ clientId, doctorId })
          .sort({ createdAt: -1 })
          .populate('clientId', 'name email')
          .lean();
      } else if (req.user.role === 'client') {
        // Client viewing their own history
        workoutPlans = await WorkoutPlan.find({ clientId: userId })
          .sort({ createdAt: -1 })
          .lean();
      }

      res.status(200).json({
        success: true,
        data: { workoutPlans }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Reuse an existing workout plan
   */
  async reuseWorkoutPlan(req, res, next) {
    try {
      const { clientId, originalPlanId, newStartDate, newEndDate } = req.body;
      const doctorId = req.user.userId;

      // Find original plan
      const originalPlan = await WorkoutPlan.findById(originalPlanId);
      if (!originalPlan) {
        return res.status(404).json({
          success: false,
          error: 'Original workout plan not found'
        });
      }

      // Check if client has an active plan
      const existingActivePlan = await WorkoutPlan.findOne({
        clientId,
        isActive: true,
        endDate: { $gt: new Date() }
      });

      if (existingActivePlan) {
        // Deactivate existing plan
        existingActivePlan.isActive = false;
        existingActivePlan.updatedAt = new Date();
        await existingActivePlan.save();
      }

      // Create new plan by cloning original
      const newPlan = new WorkoutPlan({
        clientId,
        doctorId,
        name: originalPlan.name,
        description: originalPlan.description,
        difficulty: originalPlan.difficulty,
        durationWeeks: originalPlan.durationWeeks,
        exercises: originalPlan.exercises,
        startDate: new Date(newStartDate),
        endDate: new Date(newEndDate),
        isActive: true,
        clonedFrom: originalPlan._id
      });

      await newPlan.save();

      res.status(201).json({
        success: true,
        message: 'Workout plan reused successfully',
        data: { newPlan }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Deactivate a workout plan (when it ends)
   */
  async deactivateWorkoutPlan(req, res, next) {
    try {
      const { planId } = req.params;
      const doctorId = req.user.userId;

      const workoutPlan = await WorkoutPlan.findOne({ _id: planId, doctorId });
      if (!workoutPlan) {
        return res.status(404).json({
          success: false,
          error: 'Workout plan not found'
        });
      }

      workoutPlan.isActive = false;
      workoutPlan.updatedAt = new Date();
      await workoutPlan.save();

      res.status(200).json({
        success: true,
        message: 'Workout plan deactivated successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete a workout plan (doctor only)
   */
  async deleteWorkoutPlan(req, res, next) {
    try {
      const { planId } = req.params;
      const doctorId = req.user.userId;

      const workoutPlan = await WorkoutPlan.findOne({ _id: planId, doctorId });
      if (!workoutPlan) {
        return res.status(404).json({
          success: false,
          error: 'Workout plan not found'
        });
      }

      await WorkoutPlan.findByIdAndDelete(planId);

      res.status(200).json({
        success: true,
        message: 'Workout plan deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new WorkoutPlanController();
