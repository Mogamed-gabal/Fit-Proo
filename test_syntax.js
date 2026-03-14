// Test syntax of auditController
try {
  require('./src/controllers/auditController.js');
  console.log('✅ auditController syntax is valid');
} catch (error) {
  console.error('❌ Syntax error in auditController:', error.message);
}
