# Enhanced Supervisor Audit System Documentation

## Overview
This document describes the **Enhanced Supervisor Audit Logging System** designed to automatically track all actions performed by users with "supervisor" role across the fitness platform. This system is completely separate from the existing admin audit logging system and features advanced automatic detection, performance optimization, and comprehensive monitoring.

## Architecture

### System Components
- **Model**: `SupervisorAuditLog` - Dedicated schema for supervisor actions
- **Service**: `SupervisorAuditService` - Enhanced centralized logging service with batch processing
- **Controller**: `SupervisorAuditController` - API endpoints for audit management
- **Middleware**: `SupervisorAuditMiddleware` - Manual action logging
- **Global Middleware**: `GlobalSupervisorAudit` - Automatic action detection and logging
- **Routes**: `/api/supervisor-audit/*` - Dedicated API endpoints

### Enhanced Features
- **Automatic Detection**: Global middleware captures ALL supervisor actions automatically
- **Batch Processing**: Logs are processed in batches for better performance
- **Smart Action Parsing**: Intelligent action and module detection from requests
- **State Change Tracking**: Automatic extraction of before/after states
- **Performance Optimization**: Lean queries, efficient indexing, batch operations
- **Graceful Shutdown**: Automatic log flushing on server shutdown

### Separation from Admin System
- **Separate Database Collection**: `supervisor_audit_logs`
- **Distinct Naming**: All components prefixed with "Supervisor"
- **Independent Permissions**: `read_supervisor_audit`, `export_supervisor_audit`, `manage_supervisor_audit`
- **Isolated Functionality**: No interference with existing admin audit system
- **Enhanced Architecture**: Global middleware for automatic detection

---

## Database Schema

### SupervisorAuditLog Model
```javascript
{
  // Actor Information
  actor: {
    userId: ObjectId,
    name: String,
    email: String,
    role: 'supervisor'
  },

  // Action Information
  action: String, // APPROVE_DOCTOR, BLOCK_CLIENT, etc.
  module: String, // DOCTORS, CLIENTS, DIET_PLANS, etc.

  // Target Entity
  target: {
    entityType: String, // USER, DOCTOR, CLIENT, DIET_PLAN
    entityId: ObjectId,
    entityName: String,
    previousState: Mixed,
    newState: Mixed
  },

  // Context
  context: {
    description: String,
    reason: String,
    metadata: Mixed
  },

  // Technical Details
  technical: {
    ipAddress: String,
    userAgent: String,
    sessionId: String,
    endpoint: String,
    method: String,
    duration: Number
  },

  // Outcome
  outcome: {
    status: String, // SUCCESS, FAILURE, PARTIAL, PENDING
    message: String,
    errorCode: String
  },

  // Timestamps
  timestamp: Date,
  environment: String,
  isArchived: Boolean,
  archivedAt: Date
}
```

---

## API Endpoints

### Base URL
```
http://localhost:5000/api/supervisor-audit
```

### Authentication
All endpoints require:
- **Authorization Header**: `Bearer <admin_token>`
- **Required Permission**: `read_supervisor_audit` (or specific permissions)

### Available Endpoints

#### 1. Get All Supervisor Audit Logs
**GET** `/supervisor-audit/logs`

**Query Parameters**:
- `page` (optional): Page number for pagination
- `limit` (optional): Number of logs per page (max 100)
- `supervisorId` (optional): Filter by specific supervisor
- `action` (optional): Filter by action type
- `module` (optional): Filter by module
- `status` (optional): Filter by outcome status
- `dateFrom` (optional): Filter logs from date
- `dateTo` (optional): Filter logs to date

**Response**:
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
    }
  }
}
```

#### 2. Get Supervisor Activity Statistics
**GET** `/supervisor-audit/activity`

**Query Parameters**:
- `supervisorId` (optional): Filter by specific supervisor
- `dateFrom` (optional): Filter from date
- `dateTo` (optional): Filter to date
- `days` (optional): Number of days for statistics (default 30)

#### 3. Get Audit Summary
**GET** `/supervisor-audit/summary`

**Query Parameters**:
- `supervisorId` (optional): Filter by specific supervisor
- `days` (optional): Number of days for summary (default 30)

#### 4. Get Specific Supervisor Logs
**GET** `/supervisor-audit/supervisor/:supervisorId`

**Path Parameters**:
- `supervisorId`: ID of the supervisor

**Query Parameters**: Same as `/logs` endpoint

#### 5. Export Audit Logs
**GET** `/supervisor-audit/export`

**Query Parameters**:
- `format` (optional): Export format (`json` or `csv`, default `json`)
- `supervisorId` (optional): Filter by supervisor
- `action` (optional): Filter by action
- `module` (optional): Filter by module
- `dateFrom` (optional): Filter from date
- `dateTo` (optional): Filter to date

#### 6. Archive Old Logs
**POST** `/supervisor-audit/archive`

**Request Body**:
```json
{
  "days": 90
}
```

#### 7. Get Archived Logs
**GET** `/supervisor-audit/archived`

**Query Parameters**:
- `page`, `limit`, `supervisorId`, `dateFrom`, `dateTo`

---

## Action Types

### User Management Actions
- `APPROVE_DOCTOR`
- `REJECT_DOCTOR`
- `BLOCK_CLIENT`
- `UNBLOCK_CLIENT`
- `VIEW_CLIENT_DATA`
- `MODIFY_CLIENT_DATA`
- `DELETE_CLIENT_DATA`

### Doctor Management Actions
- `RESTORE_DOCTOR`
- `VIEW_DOCTOR_PROFILE`
- `UPDATE_DOCTOR_STATUS`
- `VIEW_DOCTOR_CERTIFICATES`

### Diet Plan Actions
- `CREATE_DIET_PLAN`
- `UPDATE_DIET_PLAN`
- `DELETE_DIET_PLAN`
- `APPROVE_DIET_PLAN`
- `REJECT_DIET_PLAN`
- `VIEW_DIET_PLAN`
- `MODIFY_MEAL_PLANS`

### Progress Tracking Actions
- `VIEW_CLIENT_PROGRESS`
- `UPDATE_CLIENT_PROGRESS`
- `DELETE_PROGRESS_DATA`
- `EXPORT_PROGRESS_REPORT`

### System Access Actions
- `LOGIN_SUPERVISOR_PANEL`
- `ACCESS_ADMIN_FEATURES`
- `VIEW_SENSITIVE_DATA`
- `EXPORT_USER_DATA`
- `VIEW_SYSTEM_REPORTS`

### Configuration Actions
- `UPDATE_SETTINGS`
- `MODIFY_PERMISSIONS`
- `CHANGE_USER_ROLES`
- `SYSTEM_CONFIGURATION`

---

## Modules

### DOCTORS
All actions related to doctor management and approval.

### CLIENTS
All actions related to client data management and access.

### DIET_PLANS
All actions related to diet plan creation, modification, and access.

### DIET_PROGRESS
All actions related to client progress tracking.

### USER_MANAGEMENT
General user management actions.

### SYSTEM_ACCESS
System access and administrative feature usage.

### REPORTS
Report generation and viewing actions.

### SETTINGS
System configuration and settings modifications.

### DATA_EXPORT
Data export and download actions.

### SECURITY
Security-related actions and access attempts.

---

## Integration Guide

### Using the Middleware

#### Automatic Logging
```javascript
const SupervisorAuditMiddleware = require('../middleware/supervisorAuditMiddleware');

// Apply to routes
router.post('/approve-doctor',
  authenticate,
  SupervisorAuditMiddleware.logDoctorManagement('APPROVE_DOCTOR', {
    description: 'Doctor approval action',
    includeBody: true
  }),
  approveDoctorController
);
```

#### Manual Logging
```javascript
const SupervisorAuditMiddleware = require('../middleware/supervisorAuditMiddleware');

// In controller
async function approveDoctor(req, res, next) {
  try {
    // ... business logic ...
    
    // Manual logging
    await SupervisorAuditMiddleware.logManualAction(req, 'APPROVE_DOCTOR', 'DOCTORS', {
      description: `Approved doctor: ${doctor.name}`,
      target: {
        entityType: 'DOCTOR',
        entityId: doctor._id,
        entityName: doctor.name
      },
      status: 'SUCCESS'
    });
    
    res.json({ success: true });
  } catch (error) {
    await SupervisorAuditMiddleware.logManualAction(req, 'APPROVE_DOCTOR', 'DOCTORS', {
      description: `Failed to approve doctor: ${doctor.name}`,
      status: 'FAILURE',
      message: error.message
    });
    next(error);
  }
}
```

### Using the Service

```javascript
const SupervisorAuditService = require('../services/supervisorAuditService');

// Log user management action
await SupervisorAuditService.logUserAction(
  'BLOCK_CLIENT',
  { userId: req.user.userId, name: req.user.name, email: req.user.email },
  targetUser,
  { success: true, reason: 'Violation of terms' },
  req
);

// Log system access
await SupervisorAuditService.logSystemAccess(
  'LOGIN_SUPERVISOR_PANEL',
  { userId: req.user.userId, name: req.user.name, email: req.user.email },
  'Supervisor logged into admin panel',
  { success: true },
  req
);
```

---

## Permissions

### Required Permissions
- `read_supervisor_audit`: View audit logs and statistics
- `export_supervisor_audit`: Export audit logs
- `manage_supervisor_audit`: Archive and manage audit logs

### Permission Assignment
Add these permissions to admin roles in your permission system to control access to supervisor audit features.

---

## Performance Considerations

### Database Indexes
The system includes optimized indexes for:
- Actor and action queries
- Module and action combinations
- Target entity lookups
- Status and timestamp filtering
- Environment-based queries

### Archiving Strategy
- Automatic archiving of logs older than 90 days
- Archived logs are marked but not deleted
- Separate endpoint for accessing archived logs

### Export Limitations
- Export limited to 10,000 records per request
- CSV format for spreadsheet compatibility
- JSON format for programmatic access

---

## Security Features

### Data Protection
- No sensitive data in logs (passwords, tokens)
- IP address tracking for security
- Session tracking for audit trail
- User agent logging for forensic analysis

### Access Control
- Role-based permission system
- Admin-only access to audit logs
- Separate permissions for different operations
- No supervisor access to their own audit logs

### Integrity
- Immutable log entries
- Comprehensive error handling
- Non-blocking logging (doesn't affect main functionality)
- Development console logging for debugging

---

## Monitoring and Maintenance

### Log Rotation
- Automatic archiving of old logs
- Configurable retention period
- Manual cleanup endpoints available

### Performance Monitoring
- Log duration tracking
- Error rate monitoring
- Database query optimization
- Memory usage considerations

### Alerts
- Failed action logging
- High-frequency action detection
- Unusual pattern identification
- System error notifications

---

## Troubleshooting

### Common Issues
1. **Missing Logs**: Check middleware application order
2. **Permission Errors**: Verify admin permissions
3. **Performance Issues**: Check database indexes
4. **Large Exports**: Use date range filters

### Debug Mode
Enable development mode for detailed console logging:
```javascript
process.env.NODE_ENV = 'development'
```

### Log Verification
Check log entries in MongoDB:
```javascript
db.supervisor_audit_logs.find().sort({timestamp: -1}).limit(10)
```

---

*Last Updated: April 2024*
