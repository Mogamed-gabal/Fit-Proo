// Test script to verify which endpoint is being called
const mongoose = require('mongoose');
const User = require('./src/models/User');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('🔍 Connected to MongoDB');
    
    // Test the query directly
    console.log('🔍 Testing query: { isDeleted: true }');
    const deletedUsers = await User.find({ isDeleted: true }).limit(5).lean();
    console.log('🔍 Direct query results count:', deletedUsers.length);
    
    if (deletedUsers.length > 0) {
      console.log('🔍 Sample deleted user:');
      console.log('  - isDeleted:', deletedUsers[0].isDeleted);
      console.log('  - deletedAt:', deletedUsers[0].deletedAt);
      console.log('  - name:', deletedUsers[0].name);
      console.log('  - role:', deletedUsers[0].role);
    }
    
    // Test the opposite query
    console.log('\n🔍 Testing query: { isDeleted: false }');
    const activeUsers = await User.find({ isDeleted: false }).limit(5).lean();
    console.log('🔍 Active query results count:', activeUsers.length);
    
    if (activeUsers.length > 0) {
      console.log('🔍 Sample active user:');
      console.log('  - isDeleted:', activeUsers[0].isDeleted);
      console.log('  - deletedAt:', activeUsers[0].deletedAt);
      console.log('  - name:', activeUsers[0].name);
      console.log('  - role:', activeUsers[0].role);
    }
    
    // Check for users with deletedAt but isDeleted: false
    console.log('\n🔍 Testing query: { isDeleted: false, deletedAt: { $exists: true } }');
    const restoredUsers = await User.find({ 
      isDeleted: false, 
      deletedAt: { $exists: true } 
    }).limit(5).lean();
    console.log('🔍 Restored users count:', restoredUsers.length);
    
    if (restoredUsers.length > 0) {
      console.log('🔍 Sample restored user:');
      console.log('  - isDeleted:', restoredUsers[0].isDeleted);
      console.log('  - deletedAt:', restoredUsers[0].deletedAt);
      console.log('  - name:', restoredUsers[0].name);
      console.log('  - role:', restoredUsers[0].role);
    }
    
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Connection error:', err);
    process.exit(1);
  });
