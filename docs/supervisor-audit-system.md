# Supervisor Audit System Documentation

## Overview

The Supervisor Audit System is a comprehensive logging and monitoring solution designed to track all actions performed by supervisors in the fitness application. This system provides complete visibility into supervisor activities, ensuring accountability and security compliance.

## Architecture

The system consists of four main components:

1. **SupervisorAuditLog Model** - Data schema for audit logs
2. **SupervisorAuditService** - Business logic and data operations
3. **SupervisorAuditController** - HTTP request handlers
4. **SupervisorAuditMiddleware** - Automatic action logging

---

## 1. Data Model (`src/models/SupervisorAuditLog.js`)

### Schema Structure

```javascript
{
  actor: {
    userId: ObjectId,      // Supervisor's user ID
    name: String,          // Supervisor's name
    email: String,         // Supervisor's email
    role: 'supervisor'     // Fixed role
  },
  action: String,          // Action performed (enum)
  module: String,          // Module affected (enum)
  target: {               // Target entity details
    entityType: String,    // Type of entity
    entityId: ObjectId,    // Entity ID
    entityName: String,    // Entity name
    previousState: Mixed,  // State before action
    newState: Mixed       // State after action
  },
  context: {
    description: String,   // Action description
    reason: String,        // Reason for action
    metadata: Mixed        // Additional metadata
  },
  technical: {
    ipAddress: String,     // IP address
    userAgent: String,      // Browser/client info
    sessionId: String,     // Session ID
    endpoint: String,      // API endpoint
    method: String,        // HTTP method
    duration: Number       // Response time in ms
  },
  outcome: {
    status: String,        // SUCCESS/FAILURE/PARTIAL/PENDING
    message: String,       // Outcome message
    errorCode: String      // Error code if failed
  },
  timestamp: Date,         // Action timestamp
  environment: String,     // dev/staging/prod
  isArchived: Boolean,     // Archive status
  archivedAt: Date,        // Archive timestamp
  archivedBy: ObjectId     // Who archived
}
```

### Action Types

#### User Management
- `APPROVE_DOCTOR` - Approve doctor registration
- `REJECT_DOCTOR` - Reject doctor registration
- `BLOCK_CLIENT` - Block client account
- `UNBLOCK_CLIENT` - Unblock client account
- `VIEW_CLIENT_DATA` - View client information
- `MODIFY_CLIENT_DATA` - Modify client data
- `DELETE_CLIENT_DATA` - Delete client data

#### Doctor Management
- `RESTORE_DOCTOR` - Restore deleted doctor
- `VIEW_DOCTOR_PROFILE` - View doctor profile
- `UPDATE_DOCTOR_STATUS` - Update doctor status
- `VIEW_DOCTOR_CERTIFICATES` - View doctor certificates

#### Diet Plan Management
- `CREATE_DIET_PLAN` - Create new diet plan
- `UPDATE_DIET_PLAN` - Update existing diet plan
- `DELETE_DIET_PLAN` - Delete diet plan
- `APPROVE_DIET_PLAN` - Approve diet plan
- `REJECT_DIET_PLAN` - Reject diet plan
- `VIEW_DIET_PLAN` - View diet plan
- `MODIFY_MEAL_PLANS` - Modify meal plans

#### Progress Tracking
- `VIEW_CLIENT_PROGRESS` - View client progress
- `UPDATE_CLIENT_PROGRESS` - Update client progress
- `DELETE_PROGRESS_DATA` - Delete progress data
- `EXPORT_PROGRESS_REPORT` - Export progress report

#### System Access
- `LOGIN_SUPERVISOR_PANEL` - Login to supervisor panel
- `ACCESS_ADMIN_FEATURES` - Access admin features
- `VIEW_SENSITIVE_DATA` - View sensitive data
- `EXPORT_USER_DATA` - Export user data
- `VIEW_SYSTEM_REPORTS` - View system reports

#### Configuration
- `UPDATE_SETTINGS` - Update system settings
- `MODIFY_PERMISSIONS` - Modify user permissions
- `CHANGE_USER_ROLES` - Change user roles
- `SYSTEM_CONFIGURATION` - System configuration changes

### Module Categories

- `DOCTORS` - Doctor management
- `CLIENTS` - Client management
- `DIET_PLANS` - Diet plan operations
- `DIET_PROGRESS` - Progress tracking
- `USER_MANAGEMENT` - User operations
- `SYSTEM_ACCESS` - System access
- `REPORTS` - Report generation
- `SETTINGS` - Settings management
- `DATA_EXPORT` - Data export operations
- `SECURITY` - Security-related actions

---

## 2. Service Layer (`src/services/supervisorAuditService.js`)

### Core Methods

#### Logging Actions
```javascript
// Log any supervisor action
SupervisorAuditService.logAction(auditData, req)

// Specific action types
SupervisorAuditService.logUserAction(action, supervisorData, targetUser, result, req)
SupervisorAuditService.logDoctorAction(action, supervisorData, targetDoctor, result, req)
SupervisorAuditService.logDietPlanAction(action, supervisorData, dietPlan, result, req)
SupervisorAuditService.logSystemAccess(action, supervisorData, description, result, req)
SupervisorAuditService.logDataAccess(action, supervisorData, dataType, targetId, result, req)
```

#### Query Methods
```javascript
// Get logs for specific supervisor
SupervisorAuditService.getSupervisorLogs(supervisorId, options)

// Get logs by action type
SupervisorAuditService.getLogsByAction(action, options)

// Get activity statistics
SupervisorAuditService.getSupervisorActivity(options)

// Get audit summary
SupervisorAuditService.getAuditSummary(supervisorId, days)

// Archive old logs
SupervisorAuditService.archiveOldLogs(daysOld)

// Get archived logs
SupervisorAuditService.getArchivedLogs(options)
```

### Performance Features

#### Batch Processing
- Automatic batch logging for better performance
- Configurable batch size (default: 10 logs)
- Timeout-based processing (default: 5 seconds)
- Queue management with retry logic

#### Caching
- Query result caching for frequently accessed logs
- Performance-optimized database queries
- Lean queries for faster response times

### Usage Examples

```javascript
// Log a user management action
await SupervisorAuditService.logUserAction(
  'BLOCK_CLIENT',
  {
    userId: req.user.userId,
    name: req.user.name,
    email: req.user.email
  },
  targetClient,
  {
    success: true,
    message: 'Client blocked successfully',
    reason: 'Violation of terms',
    duration: 150
  },
  req
);

// Get supervisor activity
const activity = await SupervisorAuditService.getSupervisorActivity({
  supervisorId: 'supervisor123',
  dateFrom: new Date('2024-01-01'),
  dateTo: new Date('2024-01-31')
});
```

---

## 3. API Endpoints (`src/routes/supervisorAudit.js`)

### Authentication & Authorization
All endpoints require:
- Authentication (valid JWT token)
- `read_supervisor_audit` permission (most endpoints)
- `export_supervisor_audit` permission (export endpoint)
- `manage_supervisor_audit` permission (archive endpoint)

### Endpoints

#### 1. Get All Audit Logs
```
GET /api/supervisor-audit/logs
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (1-100, default: 50)
- `supervisorId` (optional): Filter by supervisor
- `action` (optional): Filter by action type
- `module` (optional): Filter by module
- `status` (optional): Filter by status (SUCCESS/FAILURE/PARTIAL/PENDING)
- `dateFrom` (optional): Start date (ISO 8601)
- `dateTo` (optional): End date (ISO 8601)

**Response:**
```json
{
  "success": true,
  "data": {
    "logs": [...],
    "pagination": {
      "currentPage": 1,
      "totalPages": 10,
      "totalLogs": 500,
      "hasNext": true,
      "hasPrev": false
    },
    "filters": { ... }
  }
}
```

#### 2. Get Supervisor Activity
```
GET /api/supervisor-audit/activity
```

**Query Parameters:**
- `supervisorId` (optional): Filter by supervisor
- `dateFrom` (optional): Start date
- `dateTo` (optional): End date
- `days` (optional): Number of days (1-365, default: 30)

#### 3. Get Audit Summary
```
GET /api/supervisor-audit/summary
```

**Query Parameters:**
- `supervisorId` (optional): Filter by supervisor
- `days` (optional): Number of days (1-365, default: 30)

#### 4. Get Specific Supervisor Logs
```
GET /api/supervisor-audit/supervisor/:supervisorId
```

**Path Parameters:**
- `supervisorId`: Supervisor's user ID

**Query Parameters:** Same as `/logs` endpoint

#### 5. Export Audit Logs
```
GET /api/supervisor-audit/export
```

**Query Parameters:**
- `format` (optional): Export format (json/csv, default: json)
- `supervisorId` (optional): Filter by supervisor
- `action` (optional): Filter by action
- `module` (optional): Filter by module
- `dateFrom` (optional): Start date
- `dateTo` (optional): End date

#### 6. Archive Old Logs
```
POST /api/supervisor-audit/archive
```

**Request Body:**
```json
{
  "days": 90  // Archive logs older than 90 days (30-365)
}
```

#### 7. Get Archived Logs
```
GET /api/supervisor-audit/archived
```

**Query Parameters:**
- `page` (optional): Page number
- `limit` (optional): Items per page
- `supervisorId` (optional): Filter by supervisor
- `dateFrom` (optional): Start date
- `dateTo` (optional): End date

---

## 4. Middleware (`src/middleware/supervisorAuditMiddleware.js`)

### Automatic Logging

The middleware automatically logs supervisor actions without requiring manual intervention.

#### Usage in Routes

```javascript
// Automatic logging for user management
router.post('/block-client',
  authenticate,
  SupervisorAuditMiddleware.logUserManagement('BLOCK_CLIENT', {
    description: 'Block client account',
    includeBody: true
  }),
  blockClientController
);

// Automatic logging for diet plan actions
router.put('/diet-plans/:id',
  authenticate,
  SupervisorAuditMiddleware.logDietPlanAction('UPDATE_DIET_PLAN', {
    description: 'Update diet plan',
    target: { entityType: 'DIET_PLAN', entityId: req.params.id }
  }),
  updateDietPlanController
);

// Manual logging in controllers
await SupervisorAuditMiddleware.logManualAction(
  req,
  'CUSTOM_ACTION',
  'CUSTOM_MODULE',
  {
    description: 'Custom action description',
    status: 'SUCCESS',
    metadata: { customField: 'value' }
  }
);
```

#### Middleware Options

```javascript
{
  description: String,      // Custom description
  reason: String,          // Action reason
  message: String,         // Outcome message
  target: {                // Target entity
    entityType: String,
    entityId: String,
    entityName: String
  },
  includeBody: Boolean,    // Include request body
  includeResponse: Boolean, // Include response data
  metadata: Object         // Additional metadata
}
```

### Specialized Middleware

```javascript
// User management actions
SupervisorAuditMiddleware.logUserManagement(action, options)

// Doctor management actions
SupervisorAuditMiddleware.logDoctorManagement(action, options)

// Diet plan actions
SupervisorAuditMiddleware.logDietPlanAction(action, options)

// System access actions
SupervisorAuditMiddleware.logSystemAccess(action, options)

// Data export actions
SupervisorAuditMiddleware.logDataExport(action, options)
```

---

## 5. Performance & Optimization

### Database Indexes

The system uses optimized indexes for fast queries:

```javascript
// Performance indexes
supervisorAuditLogSchema.index({ 'actor.userId': 1, action: 1, timestamp: -1 });
supervisorAuditLogSchema.index({ module: 1, action: 1, timestamp: -1 });
supervisorAuditLogSchema.index({ 'target.entityType': 1, 'target.entityId': 1, timestamp: -1 });
supervisorAuditLogSchema.index({ 'outcome.status': 1, timestamp: -1 });
supervisorAuditLogSchema.index({ environment: 1, timestamp: -1 });
supervisorAuditLogSchema.index({ 'technical.ipAddress': 1, timestamp: -1 });
```

### Batch Processing

- Logs are queued and processed in batches
- Reduces database load
- Configurable batch size and timeout
- Automatic retry on failures

### Caching Strategy

- Query result caching for frequently accessed data
- Cache invalidation on new log entries
- Performance monitoring and optimization

---

## 6. Security & Compliance

### Data Protection

- Sensitive data masking in logs
- Configurable data retention policies
- Secure archiving and deletion
- GDPR compliance features

### Access Control

- Role-based access to audit logs
- Permission-based endpoint access
- Audit trail for audit log access
- IP address and session tracking

### Privacy Features

- Data anonymization options
- Selective field logging
- User consent tracking
- Data export restrictions

---

## 7. Monitoring & Alerts

### Health Monitoring

```javascript
// Check audit system health
const healthCheck = await SupervisorAuditService.getSystemHealth();

// Monitor log queue status
const queueStatus = SupervisorAuditService.getQueueStatus();

// Performance metrics
const metrics = await SupervisorAuditService.getPerformanceMetrics();
```

### Alert Configuration

- Failed log attempt alerts
- Unusual activity detection
- Performance threshold alerts
- Storage capacity warnings

---

## 8. Implementation Guide

### Step 1: Setup

```javascript
// Import in your main server file
const SupervisorAuditMiddleware = require('./middleware/supervisorAuditMiddleware');

// Apply global middleware for supervisor routes
app.use('/api/supervisor', SupervisorAuditMiddleware.globalAudit());
```

### Step 2: Add to Routes

```javascript
// Add to existing routes
router.post('/users/:id/block',
  authenticate,
  requirePermission('block_client'),
  SupervisorAuditMiddleware.logUserManagement('BLOCK_CLIENT'),
  blockUserController
);
```

### Step 3: Manual Logging

```javascript
// In controllers for complex operations
const result = await complexOperation();
await SupervisorAuditService.logUserAction(
  'COMPLEX_ACTION',
  supervisorData,
  targetUser,
  result,
  req
);
```

### Step 4: Configuration

```javascript
// Configure batch processing
SupervisorAuditService.BATCH_SIZE = 20;
SupervisorAuditService.BATCH_TIMEOUT = 3000;

// Set up automatic archiving
setInterval(async () => {
  await SupervisorAuditService.archiveOldLogs(90);
}, 24 * 60 * 60 * 1000); // Daily
```

---

## 9. Troubleshooting

### Common Issues

#### Logs Not Appearing
1. Check middleware is properly applied
2. Verify user role is 'supervisor'
3. Check database connection
4. Review error logs

#### Performance Issues
1. Increase batch size for high traffic
2. Add database indexes
3. Implement query caching
4. Archive old logs regularly

#### Missing Data
1. Verify required fields in schema
2. Check data validation rules
3. Review middleware configuration
4. Test with sample data

### Debug Mode

```javascript
// Enable debug logging
process.env.NODE_ENV = 'development';

// Check queue status
console.log('Queue status:', SupervisorAuditService.logQueue.length);

// Force process queue
await SupervisorAuditService.flushLogs();
```

---

## 10. Best Practices

### Logging Guidelines

1. **Be Specific**: Use descriptive action names and descriptions
2. **Include Context**: Add relevant metadata for better tracking
3. **Log Failures**: Always log failed attempts with error details
4. **State Changes**: Track before/after states for important operations
5. **Performance**: Monitor duration for optimization

### Security Practices

1. **Sensitive Data**: Avoid logging passwords, tokens, or PII
2. **Access Control**: Restrict audit log access to authorized users
3. **Data Retention**: Implement appropriate retention policies
4. **Integrity**: Ensure logs cannot be tampered with
5. **Backup**: Regular backup of audit data

### Performance Optimization

1. **Batch Processing**: Use batch logging for high-volume operations
2. **Indexing**: Ensure proper database indexes
3. **Archiving**: Regularly archive old logs
4. **Monitoring**: Monitor system performance and storage
5. **Cleanup**: Implement cleanup routines for temporary data

---

## 11. API Reference

### Response Formats

#### Success Response
```json
{
  "success": true,
  "data": { ... },
  "pagination": { ... }, // For paginated endpoints
  "filters": { ... }     // Applied filters
}
```

#### Error Response
```json
{
  "success": false,
  "error": "Error message",
  "details": { ... } // Validation errors
}
```

### Status Codes

- `200` - Success
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (authentication required)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Internal Server Error

---

## 12. Migration & Upgrades

### Version Compatibility

The system maintains backward compatibility with previous versions. When upgrading:

1. **Database Schema**: Automatic migration handled by Mongoose
2. **API Changes**: Versioned endpoints for breaking changes
3. **Configuration**: Update configuration files as needed
4. **Testing**: Run comprehensive tests after upgrade

### Data Migration

```javascript
// Migrate from old audit system
const oldLogs = await OldAuditSystem.find();
for (const log of oldLogs) {
  await SupervisorAuditService.migrateLog(log);
}
```

---

## 13. Support & Maintenance

### Regular Maintenance Tasks

1. **Daily**: Monitor system health and performance
2. **Weekly**: Review log volumes and storage usage
3. **Monthly**: Archive old logs and update indexes
4. **Quarterly**: Review and update retention policies

### Support Contact

For technical support and issues:
- Check the troubleshooting section first
- Review system logs for error details
- Contact the development team with specific error messages
- Include system environment and configuration details

---

*This documentation covers the complete Supervisor Audit System. For specific implementation details or custom requirements, refer to the source code and contact the development team.*
