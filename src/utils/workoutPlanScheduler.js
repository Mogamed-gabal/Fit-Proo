/**
 * Workout Plan Scheduler
 * Automatically manages workout plan activation/deactivation based on dates
 */

const WorkoutPlan = require('../models/WorkoutPlan');

class WorkoutPlanScheduler {
  /**
   * Run the scheduler to update plan statuses
   * This should be called periodically (e.g., daily via cron job)
   */
  static async runScheduler() {
    try {
      console.log('🔄 Running workout plan scheduler...');
      
      // Deactivate expired plans
      const deactivatedResult = await WorkoutPlan.deactivateExpiredPlans();
      console.log(`📅 Deactivated ${deactivatedResult.modifiedCount} expired plans`);
      
      // Activate future plans
      const activatedResult = await WorkoutPlan.activateFuturePlans();
      console.log(`📅 Activated ${activatedResult.modifiedCount} future plans`);
      
      console.log('✅ Workout plan scheduler completed successfully');
      
      return {
        deactivatedCount: deactivatedResult.modifiedCount,
        activatedCount: activatedResult.modifiedCount
      };
    } catch (error) {
      console.error('🚨 Error in workout plan scheduler:', error);
      throw error;
    }
  }
  
  /**
   * Get active plan for a client (with auto-update)
   */
  static async getActivePlanForClient(clientId) {
    try {
      // First run scheduler to ensure statuses are up to date
      await this.runScheduler();
      
      // Then get active plan
      return await WorkoutPlan.getActivePlanForClient(clientId);
    } catch (error) {
      console.error('🚨 Error getting active plan for client:', error);
      throw error;
    }
  }
  
  /**
   * Check if client can have a new workout plan
   */
  static async canCreateNewPlan(clientId, newStartDate, newEndDate) {
    try {
      // Run scheduler first
      await this.runScheduler();
      
      // Check for overlapping plans
      const overlappingPlans = await WorkoutPlan.find({
        clientId,
        $or: [
          {
            startDate: { $lte: new Date(newEndDate) },
            endDate: { $gte: new Date(newStartDate) }
          }
        ]
      });
      
      return overlappingPlans.length === 0;
    } catch (error) {
      console.error('🚨 Error checking plan availability:', error);
      throw error;
    }
  }
}

module.exports = WorkoutPlanScheduler;
