/**
 * 🔒 CLOUDINARY INTEGRATION TEST
 * Test script to verify Cloudinary integration
 */

require('dotenv').config();

async function testCloudinaryIntegration() {
  try {
    console.log('🔍 Testing Cloudinary integration...');
    
    // Test Cloudinary import
    const cloudinary = require('./src/config/cloudinary');
    console.log('✅ Cloudinary configuration imported successfully');
    
    // Test Cloudinary service import
    const { uploadImage } = require('./src/services/cloudinaryService');
    console.log('✅ Cloudinary service imported successfully');
    
    // Test configuration
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      console.error('❌ Missing Cloudinary environment variables');
      return false;
    }
    
    console.log('✅ Cloudinary environment variables found');
    console.log(`📊 Cloud Name: ${process.env.CLOUDINARY_CLOUD_NAME}`);
    
    // Test connection (simple API call)
    try {
      const result = await cloudinary.api.resources({ max_results: 1 });
      console.log('✅ Cloudinary connection successful');
      console.log(`📊 Found ${result.resources.length} resources in account`);
    } catch (error) {
      console.error('❌ Cloudinary connection failed:', error.message);
      return false;
    }
    
    console.log('\n🎉 Cloudinary integration test PASSED');
    return true;
    
  } catch (error) {
    console.error('❌ Integration test failed:', error.message);
    return false;
  }
}

// Run test
testCloudinaryIntegration().then(success => {
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('❌ Test runner failed:', error);
  process.exit(1);
});
