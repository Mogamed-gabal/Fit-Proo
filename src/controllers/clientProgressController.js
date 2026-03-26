/**
 * Client Progress Controller
 * Handles client progress tracking and exercise completion
 */

const ClientProgress = require('../models/ClientProgress');
const WorkoutPlan = require('../models/WorkoutPlan');
const User = require('../models/User');

class ClientProgressController {
  /**
   * Mark an exercise as completed
   */
  async completeExercise(req, res, next) {
    try {
      const { workoutPlanId, exerciseId, exerciseName, notes } = req.body;
      const clientId = req.user.userId;

      // Verify client owns the workout plan
      const workoutPlan = await WorkoutPlan.findOne({ 
        _id: workoutPlanId, 
        clientId,
        isActive: true 
      });

      if (!workoutPlan) {
        return res.status(404).json({
          success: false,
          error: 'Active workout plan not found'
        });
      }

      // Find or create progress record
      let progress = await ClientProgress.findOne({ 
        clientId, 
        workoutPlanId,
        status: 'in_progress'
      });

      if (!progress) {
        progress = new ClientProgress({
          clientId,
          workoutPlanId,
          status: 'in_progress',
          completionPercentage: 0
        });
      }

      // Add exercise to completed exercises
      progress.completedExercises.push({
        exerciseId,
        exerciseName,
        completedAt: new Date(),
        notes
      });

      // Update completion percentage
      const totalExercises = workoutPlan.exercises.length;
      const completedCount = progress.completedExercises.length;
      progress.completionPercentage = Math.round((completedCount / totalExercises) * 100);

      // Check if all exercises completed
      if (completedCount >= totalExercises) {
        progress.status = 'completed';
      }

      progress.updatedAt = new Date();
      await progress.save();

      res.status(200).json({
        success: true,
        message: 'Exercise marked as completed',
        data: { 
          progress,
          completionPercentage: progress.completionPercentage
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Mark a day as completed
   */
  async completeDay(req, res, next) {
    try {
      const { workoutPlanId, date, notes } = req.body;
      const clientId = req.user.userId;

      // Verify client owns the workout plan
      const workoutPlan = await WorkoutPlan.findOne({ 
        _id: workoutPlanId, 
        clientId,
        isActive: true 
      });

      if (!workoutPlan) {
        return res.status(404).json({
          success: false,
          error: 'Active workout plan not found'
        });
      }

      // Find or create progress record
      let progress = await ClientProgress.findOne({ 
        clientId, 
        workoutPlanId,
        status: 'in_progress'
      });

      if (!progress) {
        progress = new ClientProgress({
          clientId,
          workoutPlanId,
          status: 'in_progress',
          completionPercentage: 0
        });
      }

      // Add day to completed days
      progress.completedDays.push({
        date: new Date(date),
        completedAt: new Date(),
        notes
      });

      // Update completion percentage based on plan duration
      const startDate = new Date(workoutPlan.startDate);
      const endDate = new Date(workoutPlan.endDate);
      const totalDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
      const completedDays = progress.completedDays.length;
      progress.completionPercentage = Math.round((completedDays / totalDays) * 100);

      // Check if all days completed
      if (completedDays >= totalDays) {
        progress.status = 'completed';
      }

      progress.updatedAt = new Date();
      await progress.save();

      res.status(200).json({
        success: true,
        message: 'Day marked as completed',
        data: { 
          progress,
          completionPercentage: progress.completionPercentage
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get client progress for a workout plan
   */
  async getProgress(req, res, next) {
    try {
      const { workoutPlanId } = req.params;
      const userId = req.user.userId;

      let progress;

      if (req.user.role === 'doctor') {
        // Doctor viewing client's progress
        const { clientId } = req.query;
        progress = await ClientProgress.findOne({ 
          clientId, 
          workoutPlanId 
        }).populate('clientId', 'name email');
      } else if (req.user.role === 'client') {
        // Client viewing their own progress
        progress = await ClientProgress.findOne({ 
          clientId: userId, 
          workoutPlanId 
        });
      }

      if (!progress) {
        return res.status(404).json({
          success: false,
          error: 'Progress not found for this workout plan'
        });
      }

      res.status(200).json({
        success: true,
        data: { progress }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all progress for a client
   */
  async getClientProgress(req, res, next) {
    try {
      const { clientId } = req.params;
      const userId = req.user.userId;

      let progressHistory;

      if (req.user.role === 'doctor') {
        // Doctor viewing client's progress
        progressHistory = await ClientProgress.find({ clientId })
          .sort({ createdAt: -1 })
          .populate('workoutPlanId', 'name')
          .populate('clientId', 'name email');
      } else if (req.user.role === 'client') {
        // Client viewing their own progress
        progressHistory = await ClientProgress.find({ clientId: userId })
          .sort({ createdAt: -1 })
          .populate('workoutPlanId', 'name');
      }

      res.status(200).json({
        success: true,
        data: { progressHistory }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update progress status (pause/resume)
   */
  async updateProgressStatus(req, res, next) {
    try {
      const { workoutPlanId, status } = req.body;
      const clientId = req.user.userId;

      const progress = await ClientProgress.findOne({ 
        clientId, 
        workoutPlanId 
      });

      if (!progress) {
        return res.status(404).json({
          success: false,
          error: 'Progress not found'
        });
      }

      if (!['in_progress', 'completed', 'paused'].includes(status)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid status'
        });
      }

      progress.status = status;
      progress.updatedAt = new Date();
      await progress.save();

      res.status(200).json({
        success: true,
        message: 'Progress status updated successfully',
        data: { progress }
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ClientProgressController();
