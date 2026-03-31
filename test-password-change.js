// Test Password Change Issue
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

async function testPasswordChange() {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/fitness-platform');
    console.log('✅ Connected to database');

    const User = mongoose.model('User');

    // Test 1: Find a user and check current password
    const testEmail = 'test@example.com'; // Change this to a real user email
    const user = await User.findOne({ email: testEmail }).select('+password');
    
    if (!user) {
      console.log('❌ User not found. Please update testEmail to a real user.');
      return;
    }

    console.log('✅ User found:', user.email);
    console.log('🔍 Current password hash:', user.password.substring(0, 50) + '...');

    // Test 2: Check password comparison with current password
    const testPassword = 'test123'; // Change this to the actual current password
    const isCurrentPasswordValid = await user.comparePassword(testPassword);
    console.log('✅ Current password validation:', isCurrentPasswordValid);

    // Test 3: Simulate password change
    const newPassword = 'newTest123';
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
    
    console.log('🔍 New password hash:', hashedPassword.substring(0, 50) + '...');
    
    // Update user password
    user.password = hashedPassword;
    await user.save();
    
    console.log('✅ Password updated in database');

    // Test 4: Verify new password works
    const isNewPasswordValid = await user.comparePassword(newPassword);
    console.log('✅ New password validation:', isNewPasswordValid);

    // Test 5: Verify old password no longer works
    const isOldPasswordStillValid = await user.comparePassword(testPassword);
    console.log('❌ Old password should be invalid:', isOldPasswordStillValid);

    // Test 6: Simulate login process
    const authService = require('./src/services/authService');
    try {
      const loginResult = await authService.login(testEmail, newPassword, 'test-agent', '127.0.0.1');
      console.log('✅ Login with new password successful:', !!loginResult.accessToken);
    } catch (error) {
      console.log('❌ Login with new password failed:', error.message);
    }

  } catch (error) {
    console.error('🚨 Test failed:', error);
  } finally {
    await mongoose.disconnect();
  }
}

// Run the test
testPasswordChange();
