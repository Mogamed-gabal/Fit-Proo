// 🔧 LOGIN TEST SCRIPT - Test authentication service
const mongoose = require('mongoose');
const User = require('./src/models/User');
const authService = require('./src/services/authService');
require('dotenv').config();

async function testLogin() {
  console.log('🔧 Testing login functionality...');
  
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Database connected');

    // Find a test user
    const testUser = await User.findOne({ email: 'rania415849@gmail.com' });
    
    if (!testUser) {
      console.log('❌ Test user not found. Please register first.');
      return;
    }

    console.log('📧 Found test user:', {
      email: testUser.email,
      role: testUser.role,
      emailVerified: testUser.emailVerified,
      status: testUser.status,
      isBlocked: testUser.isBlocked
    });

    // Test login with different scenarios
    const testCases = [
      {
        name: 'Valid Login Test',
        email: testUser.email,
        password: 'TestPassword123!' // Replace with actual password
      },
      {
        name: 'Invalid Password Test',
        email: testUser.email,
        password: 'WrongPassword123!'
      }
    ];

    for (const testCase of testCases) {
      console.log(`\n🧪 ${testCase.name}:`);
      
      try {
        const result = await authService.login(
          testCase.email, 
          testCase.password, 
          'Test-Agent', 
          '127.0.0.1'
        );
        
        console.log('✅ Login successful!');
        console.log('📋 User:', result.user.email);
        console.log('🔑 Access Token:', result.accessToken.substring(0, 50) + '...');
        console.log('🔄 Refresh Token:', result.refreshToken.substring(0, 50) + '...');
        
      } catch (error) {
        console.log('❌ Login failed:', error.message);
        console.log('🔍 Error Code:', error.code || 'N/A');
      }
    }

  } catch (error) {
    console.error('💥 Test failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Database disconnected');
  }
}

// Run test
testLogin().then(() => {
  console.log('🎉 Login test completed!');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Login test failed:', error);
  process.exit(1);
});
