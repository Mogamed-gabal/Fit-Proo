/**
 * 🔒 ERROR HANDLING TEST
 * Test script to verify user-friendly error handling
 */

require('dotenv').config();
const request = require('supertest');
const app = require('./server');

async function testErrorHandling() {
  try {
    console.log('🔍 Testing user-friendly error handling...\n');

    // Test 1: 404 for undefined route
    console.log('📋 Test 1: Undefined route (404)');
    try {
      const response = await request(app)
        .get('/api/undefined-route')
        .expect(404);
      
      console.log('✅ Response:', response.body);
      console.log('✅ Expected: success: false, error: "Route not found"');
      console.log('✅ Test 1 PASSED\n');
    } catch (error) {
      console.log('❌ Test 1 FAILED:', error.message);
    }

    // Test 2: Validation error
    console.log('📋 Test 2: Validation error');
    try {
      const response = await request(app)
        .post('/api/auth/register/client')
        .send({
          name: '', // Invalid - empty name
          email: 'invalid-email', // Invalid email format
          password: '123' // Too short
        })
        .expect(400);
      
      console.log('✅ Response:', response.body);
      console.log('✅ Expected: success: false, error: user-friendly validation message');
      console.log('✅ Test 2 PASSED\n');
    } catch (error) {
      console.log('❌ Test 2 FAILED:', error.message);
    }

    // Test 3: Duplicate email error
    console.log('📋 Test 3: Duplicate email error');
    try {
      // First, create a user
      await request(app)
        .post('/api/auth/register/client')
        .send({
          name: 'Test User',
          email: 'test@example.com',
          password: 'Password123!',
          phone: '+1234567890',
          address: 'Test Address',
          age: 25,
          height: 170,
          goal: 'weight_loss'
        });

      // Try to create the same user again
      const response = await request(app)
        .post('/api/auth/register/client')
        .send({
          name: 'Test User 2',
          email: 'test@example.com', // Same email
          password: 'Password123!',
          phone: '+1234567891',
          address: 'Test Address 2',
          age: 26,
          height: 175,
          goal: 'muscle_gain'
        })
        .expect(400);
      
      console.log('✅ Response:', response.body);
      console.log('✅ Expected: success: false, error: "Email already registered"');
      console.log('✅ Test 3 PASSED\n');
    } catch (error) {
      console.log('❌ Test 3 FAILED:', error.message);
    }

    console.log('🎉 Error handling tests completed!');
    console.log('📊 All errors should return user-friendly messages in the format:');
    console.log('   { "success": false, "error": "User-friendly message" }');
    
  } catch (error) {
    console.error('❌ Test runner failed:', error.message);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  testErrorHandling();
}

module.exports = { testErrorHandling };
