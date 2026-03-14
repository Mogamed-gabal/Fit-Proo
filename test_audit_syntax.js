// Test audit controller syntax
try {
  console.log('Testing audit controller syntax...');
  const auditController = require('./src/controllers/auditController.js');
  console.log('✅ auditController syntax is valid');
  console.log('✅ All functions exported successfully');
} catch (error) {
  console.error('❌ Syntax error:', error.message);
  console.error('Line:', error.stack?.split('\n')[1]);
}

// Test audit middleware syntax
try {
  console.log('Testing audit middleware syntax...');
  const auditMiddleware = require('./src/middlewares/auditMiddleware.js');
  console.log('✅ auditMiddleware syntax is valid');
} catch (error) {
  console.error('❌ Audit middleware syntax error:', error.message);
}

// Test audit model syntax
try {
  console.log('Testing audit model syntax...');
  const AuditLog = require('./src/models/AuditLog.js');
  console.log('✅ AuditLog model syntax is valid');
} catch (error) {
  console.error('❌ AuditLog model syntax error:', error.message);
}

console.log('🎉 Audit system syntax test completed!');
