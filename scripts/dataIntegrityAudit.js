/**
 * Data Integrity Audit Script
 * Checks for orphaned records and data consistency issues
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const auditDataIntegrity = async () => {
  try {
    // Connect to MongoDB
    const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/fitness-platform';
    await mongoose.connect(mongoURI);
    
    console.log('✅ Connected to MongoDB');
    console.log('🔍 Starting Data Integrity Audit...\n');

    const db = mongoose.connection.db;

    // 1. Check for orphaned subscriptions
    console.log('📊 Checking orphaned subscriptions...');
    
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
      },
      {
        $project: {
          _id: 1,
          clientId: 1,
          doctorId: 1,
          status: 1,
          isActive: 1,
          clientExists: { $gt: [{ $size: '$client' }, 0] },
          doctorExists: { $gt: [{ $size: '$doctor' }, 0] }
        }
      }
    ]).toArray();

    if (orphanedSubscriptions.length > 0) {
      console.log(`❌ Found ${orphanedSubscriptions.length} orphaned subscriptions:`);
      orphanedSubscriptions.forEach(sub => {
        console.log(`  - Subscription ${sub._id}: Client exists: ${sub.clientExists}, Doctor exists: ${sub.doctorExists}`);
      });
    } else {
      console.log('✅ No orphaned subscriptions found');
    }

    // 2. Check for orphaned refresh tokens
    console.log('\n📊 Checking orphaned refresh tokens...');
    
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
      },
      {
        $project: {
          _id: 1,
          token: 1,
          user: 1,
          expiresAt: 1,
          isRevoked: 1
        }
      }
    ]).toArray();

    if (orphanedTokens.length > 0) {
      console.log(`❌ Found ${orphanedTokens.length} orphaned refresh tokens`);
      orphanedTokens.forEach(token => {
        console.log(`  - Token ${token.token.substring(0, 10)}... for user ${token.user}`);
      });
    } else {
      console.log('✅ No orphaned refresh tokens found');
    }

    // 3. Check for users with active subscriptions but deleted status
    console.log('\n📊 Checking deleted users with active subscriptions...');
    
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
      },
      {
        $project: {
          _id: 1,
          email: 1,
          role: 1,
          isDeleted: 1,
          activeSubscriptionCount: { $size: '$subscriptions' }
        }
      }
    ]).toArray();

    if (deletedUsersWithActiveSubscriptions.length > 0) {
      console.log(`❌ Found ${deletedUsersWithActiveSubscriptions.length} deleted users with active subscriptions:`);
      deletedUsersWithActiveSubscriptions.forEach(user => {
        console.log(`  - User ${user.email} (${user.role}): ${user.activeSubscriptionCount} active subscriptions`);
      });
    } else {
      console.log('✅ No deleted users with active subscriptions found');
    }

    // 4. Check for blocked users with active subscriptions
    console.log('\n📊 Checking blocked users with active subscriptions...');
    
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
      },
      {
        $project: {
          _id: 1,
          email: 1,
          role: 1,
          isBlocked: 1,
          activeSubscriptionCount: { $size: '$subscriptions' }
        }
      }
    ]).toArray();

    if (blockedUsersWithActiveSubscriptions.length > 0) {
      console.log(`❌ Found ${blockedUsersWithActiveSubscriptions.length} blocked users with active subscriptions:`);
      blockedUsersWithActiveSubscriptions.forEach(user => {
        console.log(`  - User ${user.email} (${user.role}): ${user.activeSubscriptionCount} active subscriptions`);
      });
    } else {
      console.log('✅ No blocked users with active subscriptions found');
    }

    // 5. Check for expired active subscriptions
    console.log('\n📊 Checking expired active subscriptions...');
    
    const expiredActiveSubscriptions = await db.collection('subscriptions').find({
      isActive: true,
      endDate: { $lt: new Date() }
    }).project({
      _id: 1,
      clientId: 1,
      doctorId: 1,
      endDate: 1,
      status: 1
    }).toArray();

    if (expiredActiveSubscriptions.length > 0) {
      console.log(`❌ Found ${expiredActiveSubscriptions.length} expired subscriptions still marked as active:`);
      expiredActiveSubscriptions.forEach(sub => {
        console.log(`  - Subscription ${sub._id}: Ended on ${sub.endDate.toISOString()}`);
      });
    } else {
      console.log('✅ No expired active subscriptions found');
    }

    // 6. Check data consistency summary
    console.log('\n📈 Data Integrity Summary:');
    const totalUsers = await db.collection('users').countDocuments();
    const totalSubscriptions = await db.collection('subscriptions').countDocuments();
    const totalTokens = await db.collection('refreshtokens').countDocuments();
    const deletedUsers = await db.collection('users').countDocuments({ isDeleted: true });
    const blockedUsers = await db.collection('users').countDocuments({ isBlocked: true });
    const activeSubscriptions = await db.collection('subscriptions').countDocuments({ isActive: true });

    console.log(`  - Total Users: ${totalUsers}`);
    console.log(`  - Deleted Users: ${deletedUsers}`);
    console.log(`  - Blocked Users: ${blockedUsers}`);
    console.log(`  - Total Subscriptions: ${totalSubscriptions}`);
    console.log(`  - Active Subscriptions: ${activeSubscriptions}`);
    console.log(`  - Total Refresh Tokens: ${totalTokens}`);

    // Calculate risk score
    let riskScore = 0;
    let issues = [];

    if (orphanedSubscriptions.length > 0) {
      riskScore += 3;
      issues.push(`${orphanedSubscriptions.length} orphaned subscriptions`);
    }

    if (orphanedTokens.length > 0) {
      riskScore += 2;
      issues.push(`${orphanedTokens.length} orphaned tokens`);
    }

    if (deletedUsersWithActiveSubscriptions.length > 0) {
      riskScore += 2;
      issues.push(`${deletedUsersWithActiveSubscriptions.length} deleted users with active subscriptions`);
    }

    if (blockedUsersWithActiveSubscriptions.length > 0) {
      riskScore += 1;
      issues.push(`${blockedUsersWithActiveSubscriptions.length} blocked users with active subscriptions`);
    }

    if (expiredActiveSubscriptions.length > 0) {
      riskScore += 1;
      issues.push(`${expiredActiveSubscriptions.length} expired active subscriptions`);
    }

    console.log(`\n🎯 Risk Score: ${riskScore}/9`);
    
    if (riskScore === 0) {
      console.log('✅ Data Integrity: EXCELLENT');
    } else if (riskScore <= 2) {
      console.log('⚠️  Data Integrity: GOOD');
    } else if (riskScore <= 5) {
      console.log('🟡 Data Integrity: NEEDS ATTENTION');
    } else {
      console.log('🔴 Data Integrity: CRITICAL ISSUES');
    }

    if (issues.length > 0) {
      console.log('\n🔧 Issues to address:');
      issues.forEach(issue => console.log(`  - ${issue}`));
    }

    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
    
  } catch (error) {
    console.error('❌ Error during audit:', error);
    process.exit(1);
  }
};

// Run the audit
if (require.main === module) {
  auditDataIntegrity();
}

module.exports = auditDataIntegrity;
