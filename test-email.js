// 🔧 EMAIL TEST SCRIPT - Run this to test email configuration
const nodemailer = require('nodemailer');
require('dotenv').config();

async function testEmailService() {
  console.log('🔧 Testing email service configuration...');
  console.log('📧 Email Host:', process.env.EMAIL_HOST);
  console.log('📧 Email User:', process.env.EMAIL_USER);
  console.log('📧 Email Port:', process.env.EMAIL_PORT || 587);

  try {
    // Create transporter with same configuration as emailService
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT) || 587,
      secure: process.env.EMAIL_SECURE === 'true',
      requireTLS: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      },
      tls: {
        rejectUnauthorized: false,
        minVersion: 'TLSv1.2' // Only use minVersion, no secureProtocol
      },
      connectionTimeout: 60000,
      greetingTimeout: 30000,
      socketTimeout: 60000,
      debug: true,
      logger: true
    });

    console.log('🔧 Attempting to verify connection...');
    
    // Verify connection
    await transporter.verify();
    console.log('✅ Connection verified successfully!');

    // Send test email
    const testEmail = {
      from: `"Fitness Platform Test" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER, // Send to yourself for testing
      subject: '🧪 Email Service Test - Fitness Platform',
      html: `
        <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
          <h2 style="color: #4CAF50;">✅ Email Service Test Successful!</h2>
          <p>This is a test email to verify that your email service is working correctly.</p>
          <div style="background-color: #f0f0f0; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p><strong>Test Details:</strong></p>
            <ul>
              <li>Host: ${process.env.EMAIL_HOST}</li>
              <li>Port: ${process.env.EMAIL_PORT || 587}</li>
              <li>Secure: ${process.env.EMAIL_SECURE || 'false'}</li>
              <li>Time: ${new Date().toLocaleString()}</li>
            </ul>
          </div>
          <p>If you receive this email, your email service is working correctly!</p>
          <p>Best regards,<br>Fitness Platform System</p>
        </div>
      `
    };

    console.log('📧 Sending test email...');
    const result = await transporter.sendMail(testEmail);
    
    console.log('✅ Test email sent successfully!');
    console.log('📧 Message ID:', result.messageId);
    console.log('📧 Response:', result.response);
    
  } catch (error) {
    console.error('❌ Email test failed:');
    console.error('Error:', error.message);
    console.error('Code:', error.code);
    console.error('Command:', error.command);
    
    // 🔧 Provide specific troubleshooting steps
    console.log('\n🔧 TROUBLESHOOTING STEPS:');
    console.log('1. Check your email password in .env file');
    console.log('2. Make sure you have "Less secure app access" enabled for Gmail');
    console.log('3. Or use an App Password instead of your regular password');
    console.log('4. Check that EMAIL_HOST and EMAIL_PORT are correct');
    console.log('5. Verify your Gmail account is not blocking the connection');
    
    if (error.code === 'EAUTH') {
      console.log('\n🔧 AUTHENTICATION ERROR:');
      console.log('- Try enabling "Less secure app access" in your Google Account');
      console.log('- Or generate an App Password: https://myaccount.google.com/apppasswords');
    } else if (error.code === 'ESOCKET') {
      console.log('\n🔧 CONNECTION ERROR:');
      console.log('- Check your internet connection');
      console.log('- Verify EMAIL_HOST and EMAIL_PORT settings');
      console.log('- Try different port (587 for TLS, 465 for SSL)');
    }
  }
}

// Run the test
testEmailService().then(() => {
  console.log('🎉 Email test completed!');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Email test failed:', error);
  process.exit(1);
});
