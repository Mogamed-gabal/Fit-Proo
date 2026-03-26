/**
 * Workout Plan Cleanup Script
 * Automatically deactivates expired workout plans
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const WorkoutPlan = require('../src/models/WorkoutPlan');

// Load environment variables
dotenv.config();

const cleanupExpiredPlans = async (dryRun = true) => {
  try {
    // Connect to MongoDB
    const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/fitness-platform';
    await mongoose.connect(mongoURI);
    
    console.log('✅ Connected to MongoDB');
    console.log(`🧹 Starting ${dryRun ? 'DRY RUN' : 'ACTUAL'} workout plan cleanup...\n`);

    // Find all active plans that have expired
    const expiredPlans = await WorkoutPlan.find({
      isActive: true,
      endDate: { $lt: new Date() }
    });

    if (expiredPlans.length > 0) {
      console.log(`Found ${expiredPlans.length} expired workout plans:`);
      
      if (!dryRun) {
        // Deactivate expired plans
        const result = await WorkoutPlan.updateMany(
          { _id: { $in: expiredPlans.map(plan => plan._id) } },
          { 
            isActive: false,
            updatedAt: new Date()
          }
        );
        
        console.log(`✅ Deactivated ${result.modifiedCount} expired workout plans`);
        
        // Log deactivated plans
        expiredPlans.forEach(plan => {
          console.log(`  - Deactivated plan: ${plan.name} (Client: ${plan.clientId})`);
        });
      } else {
        // Dry run - just show what would be done
        expiredPlans.forEach(plan => {
          console.log(`  - Would deactivate plan: ${plan.name} (Client: ${plan.clientId})`);
        });
        console.log(`🔍 DRY RUN: Would deactivate ${expiredPlans.length} expired workout plans`);
      }
    } else {
      console.log('✅ No expired workout plans found');
    }

    console.log('\n✅ Workout plan cleanup completed successfully');
    
    if (dryRun) {
      console.log('\n🔧 To perform actual cleanup, run:');
      console.log('   node scripts/workoutPlanCleanup.js false');
    }

    await mongoose.disconnect();
    
  } catch (error) {
    console.error('❌ Error during workout plan cleanup:', error);
    process.exit(1);
  }
};

// Run the cleanup
if (require.main === module) {
  const isDryRun = process.argv[2] !== 'false';
  cleanupExpiredPlans(isDryRun);
}

module.exports = cleanupExpiredPlans;
