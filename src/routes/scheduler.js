/**
 * Workout Plan Scheduler Routes
 * Handles automated workout plan status management
 */

const express = require('express');
const router = express.Router();
const WorkoutPlanScheduler = require('../utils/workoutPlanScheduler');
const { authenticate } = require('../middlewares/auth');
const { requirePermission } = require('../middlewares/permissionMiddleware');

/**
 * Run the workout plan scheduler manually
 * This endpoint can be called by a cron job or manually
 */
router.post('/run', 
  authenticate,
  requirePermission('manage_client_workout_plans'),
  async (req, res) => {
    try {
      const result = await WorkoutPlanScheduler.runScheduler();
      
      res.status(200).json({
        success: true,
        message: 'Workout plan scheduler completed successfully',
        data: {
          deactivatedCount: result.deactivatedCount,
          activatedCount: result.activatedCount,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('🚨 Error in scheduler route:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to run workout plan scheduler'
      });
    }
  }
);

/**
 * Get active plan for a client (with auto-update)
 */
router.get('/active-plan/:clientId',
  authenticate,
  requirePermission('view_client_workout_plans'),
  async (req, res) => {
    try {
      const { clientId } = req.params;
      
      // Only allow doctors to check their own clients, or clients to check themselves
      if (req.user.role === 'client' && req.user.userId !== clientId) {
        return res.status(403).json({
          success: false,
          error: 'Clients can only check their own active plans'
        });
      }
      
      const activePlan = await WorkoutPlanScheduler.getActivePlanForClient(clientId);
      
      if (!activePlan) {
        return res.status(404).json({
          success: false,
          error: 'No active workout plan found for this client'
        });
      }
      
      res.status(200).json({
        success: true,
        data: {
          activePlan,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('🚨 Error getting active plan:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get active workout plan'
      });
    }
  }
);

/**
 * Check if client can have a new workout plan
 */
router.post('/check-availability/:clientId',
  authenticate,
  requirePermission('manage_client_workout_plans'),
  async (req, res) => {
    try {
      const { clientId } = req.params;
      const { startDate, endDate } = req.body;
      
      if (!startDate || !endDate) {
        return res.status(400).json({
          success: false,
          error: 'Start date and end date are required'
        });
      }
      
      const canCreate = await WorkoutPlanScheduler.canCreateNewPlan(
        clientId, 
        startDate, 
        endDate
      );
      
      res.status(200).json({
        success: true,
        data: {
          canCreate,
          message: canCreate 
            ? 'Client can have a new workout plan during this period'
            : 'Client already has a workout plan during the specified period'
        }
      });
    } catch (error) {
      console.error('🚨 Error checking plan availability:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to check plan availability'
      });
    }
  }
);

module.exports = router;
