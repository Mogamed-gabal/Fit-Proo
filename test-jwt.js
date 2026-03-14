// 🔧 JWT TEST SCRIPT - Test JWT generation and verification
const authService = require('./src/services/authService');
require('dotenv').config();

async function testJWT() {
  console.log('🔧 Testing JWT generation and verification...');
  
  try {
    // Test token generation
    const userId = '507f1f77bcf86cd799439011'; // Test user ID
    const userRole = 'client';
    
    console.log('📝 Generating tokens...');
    const { accessToken, refreshToken, jti } = authService.generateTokens(userId, userRole);
    
    console.log('✅ Tokens generated successfully!');
    console.log('🔑 Access Token:', accessToken.substring(0, 50) + '...');
    console.log('🔄 Refresh Token:', refreshToken.substring(0, 50) + '...');
    console.log('🆔 JWT ID:', jti);
    
    // Test token verification
    console.log('\n🔍 Verifying access token...');
    const decoded = await authService.verifyAccessToken(accessToken);
    
    console.log('✅ Token verified successfully!');
    console.log('📋 Decoded payload:', {
      userId: decoded.userId,
      role: decoded.role,
      issuer: decoded.iss,
      audience: decoded.aud,
      sessionId: decoded.sessionId,
      jti: decoded.jti
    });
    
    console.log('\n🎉 JWT test completed successfully!');
    
  } catch (error) {
    console.error('❌ JWT test failed:', error.message);
    console.error('🔍 Stack:', error.stack);
  }
}

// Run test
testJWT().then(() => {
  process.exit(0);
}).catch((error) => {
  console.error('💥 JWT test failed:', error);
  process.exit(1);
});
