/**
 * Auto Scheduler - Runs automatically when server starts
 * Also sets up periodic updates
 */

const cron = require('node-cron');
const WorkoutPlanScheduler = require('./workoutPlanScheduler');

class AutoScheduler {
  constructor() {
    this.isRunning = false;
    this.cronJob = null;
  }

  /**
   * Initialize the auto scheduler
   * Call this when server starts
   */
  async initialize() {
    try {
      console.log('🔄 Initializing Auto Scheduler...');
      
      // Run scheduler immediately on server start
      await this.runOnce();
      
      // Set up cron job to run every day at midnight
      this.setupDailyCron();
      
      // Set up cron job to run every hour for extra safety
      this.setupHourlyCron();
      
      console.log('✅ Auto Scheduler initialized successfully');
    } catch (error) {
      console.error('🚨 Failed to initialize Auto Scheduler:', error);
    }
  }

  /**
   * Run scheduler once immediately
   */
  async runOnce() {
    if (this.isRunning) {
      console.log('⏳ Scheduler already running, skipping...');
      return;
    }

    try {
      this.isRunning = true;
      console.log('🔄 Running workout plan scheduler...');
      
      const result = await WorkoutPlanScheduler.runScheduler();
      
      console.log(`✅ Scheduler completed: ${result.deactivatedCount} deactivated, ${result.activatedCount} activated`);
    } catch (error) {
      console.error('🚨 Error running scheduler:', error);
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Set up daily cron job (runs at midnight)
   */
  setupDailyCron() {
    // Run every day at 00:00
    this.cronJob = cron.schedule('0 0 * * *', async () => {
      console.log('🕛 Daily workout plan scheduler starting...');
      await this.runOnce();
    }, {
      scheduled: true,
      timezone: 'UTC'
    });

    console.log('📅 Daily scheduler set up (runs at 00:00 UTC)');
  }

  /**
   * Set up hourly cron job (runs every hour at minute 0)
   * This is for extra safety and real-time updates
   */
  setupHourlyCron() {
    // Run every hour at minute 0
    cron.schedule('0 * * * *', async () => {
      console.log('🕐 Hourly workout plan scheduler check...');
      await this.runOnce();
    }, {
      scheduled: true,
      timezone: 'UTC'
    });

    console.log('⏰ Hourly scheduler set up (runs every hour)');
  }

  /**
   * Stop all cron jobs
   */
  stop() {
    if (this.cronJob) {
      this.cronJob.stop();
      console.log('🛑 Daily scheduler stopped');
    }
    
    // Stop all cron jobs
    cron.getTasks().forEach((task, name) => {
      task.stop();
    });
    
    console.log('🛑 All schedulers stopped');
  }

  /**
   * Get scheduler status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      dailyCronActive: this.cronJob ? this.cronJob.running : false,
      totalTasks: cron.getTasks().size
    };
  }
}

// Create singleton instance
const autoScheduler = new AutoScheduler();

module.exports = autoScheduler;
