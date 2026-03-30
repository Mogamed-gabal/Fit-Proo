/**
 * Workout Plan Controller
 * Handles workout plan lifecycle management
 */

const WorkoutPlan = require('../models/WorkoutPlan');
const ClientProgress = require('../models/ClientProgress');
const User = require('../models/User');
const Notification = require('../models/Notification');
const WorkoutPlanScheduler = require('../utils/workoutPlanScheduler');

class WorkoutPlanController {
  /**
   * Create a new workout plan for a client
   */
  async createWorkoutPlan(req, res, next) {
    try {
      // ✅ Debug logging
      console.log('🔍 Request body:', JSON.stringify(req.body, null, 2));

      const { 
        clientId, 
        name, 
        description, 
        notes,
        startDate, 
        endDate, 
        difficulty, 
        weeklyPlan 
      } = req.body;
      const doctorId = req.user.userId;

      // Validate doctor role
      if (req.user.role !== 'doctor') {
        return res.status(403).json({
          success: false,
          error: 'Only doctors can create workout plans'
        });
      }

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

      // Run scheduler to ensure all plan statuses are up to date
      await WorkoutPlanScheduler.runScheduler();
      
      // Check if client can have a new workout plan (no overlapping dates)
      const canCreate = await WorkoutPlanScheduler.canCreateNewPlan(
        clientId, 
        startDate, 
        endDate
      );
      
      if (!canCreate) {
        return res.status(400).json({
          success: false,
          error: 'Client already has a workout plan during the specified period'
        });
      }

      // Calculate duration (fixed 7 days per week)
      const durationWeeks = 7; // Fixed 7 days per week
      const totalDays = durationWeeks * 7;

      // ✅ Debug weekly plan
      console.log('🔍 Weekly plan structure:', JSON.stringify(weeklyPlan, null, 2));

      // Create new workout plan with doctor name and fixed duration
      const workoutPlan = new WorkoutPlan({
        clientId,
        doctorId,
        doctorName: doctor.name,
        name,
        description,
        notes,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        difficulty,
        durationWeeks,
        weeklyPlan
      });

      await workoutPlan.save();

      // Create notification for client
      try {
        await Notification.createWorkoutPlanNotification(clientId, workoutPlan._id, name);
        console.log(`Notification created for client ${clientId}`);
      } catch (notificationError) {
        console.error('Failed to create notification:', notificationError);
        // Don't fail the request if notification fails
      }

      res.status(201).json({
        success: true,
        message: 'Workout plan created successfully',
        data: { workoutPlan }
      });
    } catch (error) {
      console.error('🚨 Error in createWorkoutPlan:', error);
      next(error);
    }
  }

  /**
   * Update an existing workout plan
   */
  async updateWorkoutPlan(req, res, next) {
    try {
      const { planId, name, description, notes, startDate, endDate, difficulty, weeklyPlan } = req.body;
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
      if (notes !== undefined) workoutPlan.notes = notes;
      if (startDate) workoutPlan.startDate = new Date(startDate);
      if (endDate) workoutPlan.endDate = new Date(endDate);
      if (difficulty) workoutPlan.difficulty = difficulty;
      if (weeklyPlan) workoutPlan.weeklyPlan = weeklyPlan;
      
      // Duration is fixed to 7 days per week, don't update it
      // workoutPlan.durationWeeks stays as default (7)

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
      const doctorId = req.user.userId;

      let workoutPlans;

      if (req.user.role === 'doctor') {
        // Doctor viewing client's history
        workoutPlans = await WorkoutPlan.find({ clientId, doctorId })
          .sort({ createdAt: -1 })
          .populate('clientId', 'name email')
          .lean();
      } else if (req.user.role === 'client') {
        // Client viewing their own history
        workoutPlans = await WorkoutPlan.find({ clientId })
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

      // Get doctor information
      const doctor = await User.findById(doctorId);
      if (!doctor) {
        return res.status(404).json({
          success: false,
          error: 'Doctor not found'
        });
      }

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

      // Create new plan by cloning original with doctor name and fixed duration
      const newPlan = new WorkoutPlan({
        clientId,
        doctorId,
        doctorName: doctor.name,
        name: originalPlan.name,
        description: originalPlan.description,
        notes: originalPlan.notes,
        difficulty: originalPlan.difficulty,
        durationWeeks: 7, // Fixed 7 days per week
        weeklyPlan: originalPlan.weeklyPlan,
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
   * Get workout plan by ID (for viewing details)
   */
  async getWorkoutPlanById(req, res, next) {
    try {
      const { planId } = req.params;
      const userId = req.user.userId;

      let workoutPlan;

      if (req.user.role === 'doctor') {
        // Doctor can view any plan they created
        workoutPlan = await WorkoutPlan.findOne({ 
          _id: planId, 
          doctorId: userId 
        }).populate('clientId', 'name email');
      } else if (req.user.role === 'client') {
        // Client can only view their own plans
        workoutPlan = await WorkoutPlan.findOne({ 
          _id: planId, 
          clientId: userId 
        });
      }

      if (!workoutPlan) {
        return res.status(404).json({
          success: false,
          error: 'Workout plan not found'
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
