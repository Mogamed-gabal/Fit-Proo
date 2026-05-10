// Check all users in database and their deletion status
const mongoose = require('mongoose');
const User = require('./src/models/User');
require('dotenv').config();

async function checkUsersStatus() {
  try {
    console.log('🔍 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Step 1: Get all users with their status
    console.log('\n🔍 Step 1: All users in database:');
    const allUsers = await User.find({}).select('_id name email role isDeleted deletedAt').lean();
    console.log(`Total users: ${allUsers.length}`);
    
    allUsers.forEach((user, index) => {
      console.log(`\n${index + 1}. ${user.name} (${user.email})`);
      console.log(`   ID: ${user._id}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   isDeleted: ${user.isDeleted}`);
      if (user.deletedAt) {
        console.log(`   Deleted At: ${user.deletedAt}`);
      }
    });

    // Step 2: Show only deleted users
    console.log('\n🔍 Step 2: Soft-deleted users (isDeleted: true):');
    const deletedUsers = allUsers.filter(user => user.isDeleted === true);
    console.log(`Soft-deleted users: ${deletedUsers.length}`);
    
    if (deletedUsers.length > 0) {
      console.log('\nAvailable users for restore:');
      deletedUsers.forEach((user, index) => {
        console.log(`\n${index + 1}. ${user.name} (${user.email})`);
        console.log(`   ID: ${user._id}`);
        console.log(`   Role: ${user.role}`);
        console.log(`   Deleted At: ${user.deletedAt}`);
        console.log(`   Restore command:`);
        console.log(`   curl -X POST "http://localhost:5000/api/users/${user._id}/restore" \\`);
        console.log(`     -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \\`);
        console.log(`     -H "Content-Type: application/json" \\`);
        console.log(`     -d '{"reason": "Test restore"}'`);
      });
    } else {
      console.log('❌ No soft-deleted users found!');
      console.log('💡 You need to soft-delete a user first before testing restore.');
      
      // Show active users that can be soft-deleted for testing
      console.log('\n💡 Active users you can soft-delete for testing:');
      const activeUsers = allUsers.filter(user => user.isDeleted === false);
      activeUsers.slice(0, 3).forEach((user, index) => {
        console.log(`\n${index + 1}. ${user.name} (${user.email})`);
        console.log(`   ID: ${user._id}`);
        console.log(`   Role: ${user.role}`);
        console.log(`   Delete command:`);
        console.log(`   curl -X DELETE "http://localhost:5000/api/users/${user._id}" \\`);
        console.log(`     -H "Authorization: Bearer YOUR_ADMIN_TOKEN"`);
      });
    }

    // Step 3: Check the specific ID you're trying to restore
    console.log('\n🔍 Step 3: Checking the ID you\'re trying to restore:');
    const testId = '69f5d9354a5388b8069aca9e';
    const testUser = await User.findById(testId);
    console.log(`User with ID ${testId} exists: ${!!testUser}`);
    
    if (!testUser) {
      console.log('❌ This ID does not exist in the database!');
      console.log('💡 This is why you get "User not found" error');
      console.log('💡 Use one of the existing user IDs shown above');
    } else {
      console.log('✅ User found:');
      console.log(`   Name: ${testUser.name}`);
      console.log(`   Email: ${testUser.email}`);
      console.log(`   Role: ${testUser.role}`);
      console.log(`   isDeleted: ${testUser.isDeleted}`);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔍 Disconnected from MongoDB');
  }
}

checkUsersStatus();
