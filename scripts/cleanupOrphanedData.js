/**
 * Orphaned Data Cleanup Script
 * Cleans up orphaned records and maintains data integrity
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const cleanupOrphanedData = async (dryRun = true) => {
  try {
    // Connect to MongoDB
    const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/fitness-platform';
    await mongoose.connect(mongoURI);
    
    console.log('✅ Connected to MongoDB');
    console.log(`🧹 Starting ${dryRun ? 'DRY RUN' : 'ACTUAL'} cleanup...\n`);

    const db = mongoose.connection.db;

    // 1. Clean up orphaned subscriptions
    console.log('📊 Cleaning up orphaned subscriptions...');
    
    const orphanedSubscriptions = await db.collection('subscriptions').aggregate([
      {
        $lookup: {
          from: 'users',
          localField: 'clientId',
          foreignField: '_id',
          as: 'client'
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'doctorId',
          foreignField: '_id',
          as: 'doctor'
        }
      },
      {
        $match: {
          $or: [
            { client: { $size: 0 } },
            { doctor: { $size: 0 } }
          ]
        }
      }
    ]).toArray();

    if (orphanedSubscriptions.length > 0) {
      console.log(`Found ${orphanedSubscriptions.length} orphaned subscriptions:`);
      
      if (!dryRun) {
        const subscriptionIds = orphanedSubscriptions.map(sub => sub._id);
        const result = await db.collection('subscriptions').deleteMany({
          _id: { $in: subscriptionIds }
        });
        console.log(`✅ Deleted ${result.deletedCount} orphaned subscriptions`);
      } else {
        orphanedSubscriptions.forEach(sub => {
          console.log(`  - Would delete subscription ${sub._id} (Client: ${sub.clientId}, Doctor: ${sub.doctorId})`);
        });
        console.log(`🔍 DRY RUN: Would delete ${orphanedSubscriptions.length} orphaned subscriptions`);
      }
    } else {
      console.log('✅ No orphaned subscriptions to clean up');
    }

    // 2. Clean up orphaned refresh tokens
    console.log('\n📊 Cleaning up orphaned refresh tokens...');
    
    const orphanedTokens = await db.collection('refreshtokens').aggregate([
      {
        $lookup: {
          from: 'users',
          localField: 'user',
          foreignField: '_id',
          as: 'userRef'
        }
      },
      {
        $match: {
          userRef: { $size: 0 }
        }
      }
    ]).toArray();

    if (orphanedTokens.length > 0) {
      console.log(`Found ${orphanedTokens.length} orphaned refresh tokens:`);
      
      if (!dryRun) {
        const tokenIds = orphanedTokens.map(token => token._id);
        const result = await db.collection('refreshtokens').deleteMany({
          _id: { $in: tokenIds }
        });
        console.log(`✅ Deleted ${result.deletedCount} orphaned refresh tokens`);
      } else {
        orphanedTokens.forEach(token => {
          console.log(`  - Would delete token ${token.token.substring(0, 10)}... for user ${token.user}`);
        });
        console.log(`🔍 DRY RUN: Would delete ${orphanedTokens.length} orphaned refresh tokens`);
      }
    } else {
      console.log('✅ No orphaned refresh tokens to clean up');
    }

    // 3. Handle deleted users with active subscriptions
    console.log('\n📊 Handling deleted users with active subscriptions...');
    
    const deletedUsersWithActiveSubscriptions = await db.collection('users').aggregate([
      {
        $match: {
          isDeleted: true
        }
      },
      {
        $lookup: {
          from: 'subscriptions',
          localField: '_id',
          foreignField: 'clientId',
          as: 'subscriptions'
        }
      },
      {
        $match: {
          'subscriptions.isActive': true
        }
      }
    ]).toArray();

    if (deletedUsersWithActiveSubscriptions.length > 0) {
      console.log(`Found ${deletedUsersWithActiveSubscriptions.length} deleted users with active subscriptions:`);
      
      if (!dryRun) {
        const userIds = deletedUsersWithActiveSubscriptions.map(user => user._id);
        const result = await db.collection('subscriptions').updateMany(
          { clientId: { $in: userIds }, isActive: true },
          { 
            isActive: false,
            status: 'cancelled',
            deactivationReason: 'User deleted'
          }
        );
        console.log(`✅ Deactivated ${result.modifiedCount} subscriptions for deleted users`);
      } else {
        deletedUsersWithActiveSubscriptions.forEach(user => {
          console.log(`  - Would deactivate subscriptions for deleted user ${user.email}`);
        });
        console.log(`🔍 DRY RUN: Would deactivate subscriptions for ${deletedUsersWithActiveSubscriptions.length} deleted users`);
      }
    } else {
      console.log('✅ No deleted users with active subscriptions to handle');
    }

    // 4. Handle blocked users with active subscriptions
    console.log('\n📊 Handling blocked users with active subscriptions...');
    
    const blockedUsersWithActiveSubscriptions = await db.collection('users').aggregate([
      {
        $match: {
          isBlocked: true
        }
      },
      {
        $lookup: {
          from: 'subscriptions',
          localField: '_id',
          foreignField: 'clientId',
          as: 'subscriptions'
        }
      },
      {
        $match: {
          'subscriptions.isActive': true
        }
      }
    ]).toArray();

    if (blockedUsersWithActiveSubscriptions.length > 0) {
      console.log(`Found ${blockedUsersWithActiveSubscriptions.length} blocked users with active subscriptions:`);
      
      if (!dryRun) {
        const userIds = blockedUsersWithActiveSubscriptions.map(user => user._id);
        const result = await db.collection('subscriptions').updateMany(
          { clientId: { $in: userIds }, isActive: true },
          { 
            isActive: false,
            status: 'suspended',
            deactivationReason: 'User blocked'
          }
        );
        console.log(`✅ Suspended ${result.modifiedCount} subscriptions for blocked users`);
      } else {
        blockedUsersWithActiveSubscriptions.forEach(user => {
          console.log(`  - Would suspend subscriptions for blocked user ${user.email}`);
        });
        console.log(`🔍 DRY RUN: Would suspend subscriptions for ${blockedUsersWithActiveSubscriptions.length} blocked users`);
      }
    } else {
      console.log('✅ No blocked users with active subscriptions to handle');
    }

    // 5. Handle expired active subscriptions
    console.log('\n📊 Handling expired active subscriptions...');
    
    const expiredActiveSubscriptions = await db.collection('subscriptions').find({
      isActive: true,
      endDate: { $lt: new Date() }
    }).toArray();

    if (expiredActiveSubscriptions.length > 0) {
      console.log(`Found ${expiredActiveSubscriptions.length} expired subscriptions still marked as active:`);
      
      if (!dryRun) {
        const subscriptionIds = expiredActiveSubscriptions.map(sub => sub._id);
        const result = await db.collection('subscriptions').updateMany(
          { _id: { $in: subscriptionIds } },
          { 
            isActive: false,
            status: 'expired',
            deactivationReason: 'Subscription expired'
          }
        );
        console.log(`✅ Marked ${result.modifiedCount} expired subscriptions as inactive`);
      } else {
        expiredActiveSubscriptions.forEach(sub => {
          console.log(`  - Would mark subscription ${sub._id} as expired (ended: ${sub.endDate.toISOString()})`);
        });
        console.log(`🔍 DRY RUN: Would mark ${expiredActiveSubscriptions.length} expired subscriptions as inactive`);
      }
    } else {
      console.log('✅ No expired active subscriptions to handle');
    }

    // 6. Clean up expired refresh tokens
    console.log('\n📊 Cleaning up expired refresh tokens...');
    
    const expiredTokens = await db.collection('refreshtokens').find({
      expiresAt: { $lt: new Date() }
    }).toArray();

    if (expiredTokens.length > 0) {
      console.log(`Found ${expiredTokens.length} expired refresh tokens:`);
      
      if (!dryRun) {
        const tokenIds = expiredTokens.map(token => token._id);
        const result = await db.collection('refreshtokens').deleteMany({
          _id: { $in: tokenIds }
        });
        console.log(`✅ Deleted ${result.deletedCount} expired refresh tokens`);
      } else {
        console.log(`🔍 DRY RUN: Would delete ${expiredTokens.length} expired refresh tokens`);
      }
    } else {
      console.log('✅ No expired refresh tokens to clean up');
    }

    console.log('\n✅ Cleanup completed successfully');
    
    if (dryRun) {
      console.log('\n🔧 To perform actual cleanup, run:');
      console.log('   node scripts/cleanupOrphanedData.js false');
    }

    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    process.exit(1);
  }
};

// Run the cleanup
if (require.main === module) {
  const isDryRun = process.argv[2] !== 'false';
  cleanupOrphanedData(isDryRun);
}

module.exports = cleanupOrphanedData;
