# Dynamic Permission Management System Documentation

## Overview
This document describes the **Dynamic Permission Management System** that allows administrators to grant, revoke, and manage fine-grained permissions for supervisors and other roles. This system works alongside the existing role-based access control, providing enhanced flexibility and security.

## Architecture

### System Components
- **Model**: `Permission` - Dynamic permission schema with assignment tracking
- **Service**: `PermissionService` - Centralized permission management service
- **Controller**: `PermissionController` - API endpoints for permission management
- **Middleware**: `DynamicPermissionMiddleware` - Enhanced permission checking middleware
- **Routes**: `/api/permissions/*` - Dedicated API endpoints

### Integration with Existing System
- **Backward Compatible**: Works with existing role-based permissions
- **Enhanced Security**: Adds fine-grained control on top of role system
- **Flexible**: Supports temporary permissions, expiration, and audit trail
- **Non-Breaking**: Existing functionality continues to work

---

## Database Schema

### Permission Model
```javascript
{
  // Permission details
  name: String,           // Unique permission identifier
  description: String,     // Human-readable description
  category: String,        // Permission category (USER_MANAGEMENT, etc.)
  action: String,          // Action type (CREATE, READ, UPDATE, etc.)
  resource: String,         // Resource type (USERS, DOCTORS, etc.)
  level: Number,           // Permission level (1-10, higher = more powerful)
  isSystem: Boolean,       // System-level permission

  // Assignment tracking
  assignedBy: ObjectId,      // Who granted this permission
  assignedTo: ObjectId,      // Who received this permission
  assignedAt: Date,         // When permission was granted
  expiresAt: Date,         // When permission expires (optional)
  isActive: Boolean,        // Whether permission is currently active
  isDeleted: Boolean,       // Soft delete flag

  // Usage tracking
  lastUsed: Date,          // When permission was last used
  usageCount: Number,       // How many times permission was used

  // Audit trail
  deletedAt: Date,         // When permission was deleted
  deletedBy: ObjectId,      // Who deleted this permission
  metadata: Mixed           // Additional permission data
}
```

---

## API Endpoints

### Base URL
```
http://localhost:5000/api/permissions
```

### Authentication
All endpoints require:
- **Authorization Header**: `Bearer <admin_token>`
- **Required Permission**: `manage_permissions` (for most operations)
- **Admin Role**: Required for system initialization and cleanup

### Available Endpoints

#### 1. Grant Permission
**POST** `/permissions/grant`

**Request Body**:
```json
{
  "userId": "507f1f77bcf86cd799439011",
  "permissionName": "block_client",
  "expiresAt": "2024-12-31T23:59:59.000Z",
  "reason": "User needs blocking capability"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Permission 'block_client' granted successfully",
  "data": {
    "assignment": { ... },
    "permission": "block_client",
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "supervisor"
    }
  }
}
```

#### 2. Revoke Permission
**POST** `/permissions/revoke`

**Request Body**:
```json
{
  "userId": "507f1f77bcf86cd799439011",
  "permissionName": "block_client",
  "reason": "User no longer needs blocking capability"
}
```

#### 3. Get User Permissions
**GET** `/permissions/user/:userId?includeInactive=false`

**Response**:
```json
{
  "success": true,
  "data": {
    "userId": "507f1f77bcf86cd799439011",
    "permissions": [...],
    "count": 5
  }
}
```

#### 4. Get Current User Permissions
**GET** `/permissions/my?includeInactive=false`

#### 5. Get All Available Permissions
**GET** `/permissions/all?category=USER_MANAGEMENT&includeInactive=false`

#### 6. Get Permissions by Category
**GET** `/permissions/category/USER_MANAGEMENT?includeInactive=false`

#### 7. Grant Multiple Permissions
**POST** `/permissions/grant-multiple`

**Request Body**:
```json
{
  "userId": "507f1f77bcf86cd799439011",
  "permissionNames": ["block_client", "unblock_client", "view_user_details"],
  "expiresAt": "2024-12-31T23:59:59.000Z",
  "reason": "Grant user management permissions"
}
```

#### 8. Revoke Multiple Permissions
**POST** `/permissions/revoke-multiple`

#### 9. Check User Permission
**GET** `/permissions/check/:userId/:permissionName?resource=USERS`

#### 10. Get Permission Statistics
**GET** `/permissions/stats`

#### 11. Initialize Permission System
**POST** `/permissions/initialize` (Admin only)

#### 12. Cleanup Expired Permissions
**POST** `/permissions/cleanup` (Admin only)

#### 13. Get Effective Permissions
**GET** `/permissions/effective/:userId`

---

## Permission Categories

### USER_MANAGEMENT
- `manage_users` - Full user management access
- `block_client` - Block client accounts
- `unblock_client` - Unblock client accounts
- `view_user_details` - View detailed user information

### DOCTOR_MANAGEMENT
- `manage_doctors` - Full doctor management access
- `approve_doctor` - Approve doctor registrations
- `reject_doctor` - Reject doctor registrations
- `restore_doctor` - Restore soft-deleted doctors
- `view_doctor_profile` - View doctor profile information

### DIET_PLAN_MANAGEMENT
- `manage_diet_plans` - Full diet plan access
- `create_diet_plan` - Create new diet plans
- `update_diet_plan` - Update existing diet plans
- `delete_diet_plan` - Delete diet plans
- `view_diet_plan` - View diet plan details

### SYSTEM_ACCESS
- `access_admin_panel` - Access admin dashboard
- `view_sensitive_data` - View sensitive user data
- `export_user_data` - Export user data
- `view_system_reports` - View system reports

### AUDIT_LOGS
- `read_supervisor_audit` - Read supervisor audit logs
- `export_supervisor_audit` - Export supervisor audit logs
- `manage_supervisor_audit` - Manage supervisor audit logs

---

## Middleware Usage

### Basic Permission Check
```javascript
const { requirePermission } = require('../middlewares/dynamicPermissionMiddleware');

// Single permission
router.post('/some-action', 
  authenticate,
  requirePermission('block_client'),
  controller
);

// Resource-specific
router.get('/users', 
  authenticate,
  requirePermission('view_user_details', { resource: 'USERS' }),
  controller
);
```

### Multiple Permissions
```javascript
// User must have ALL specified permissions
router.post('/critical-action', 
  authenticate,
  requireAllPermissions(['block_client', 'unblock_client']),
  controller
);

// User must have ANY of specified permissions
router.get('/flexible-action', 
  authenticate,
  requireAnyPermission(['view_user_details', 'view_doctor_profile']),
  controller
);
```

### Admin or Permission
```javascript
// Admins always have access, others need specific permission
router.post('/admin-or-permission', 
  authenticate,
  requireAdminOrPermission('manage_users'),
  controller
);
```

### Resource Access
```javascript
// Check resource-level access
router.get('/resource/:resourceId', 
  authenticate,
  requireResourceAccess('USERS', 'READ'),
  controller
);
```

---

## Integration with Existing System

### Backward Compatibility
The dynamic permission system is designed to work alongside the existing role-based system:

1. **Role-Based Permissions**: Continue to work as before
2. **Dynamic Permissions**: Add fine-grained control on top
3. **Effective Permissions**: Combine both for final access decision
4. **Fallback**: If no dynamic permission, check role-based

### Permission Checking Logic
```javascript
// 1. Check dynamic permissions first
const hasDynamicPermission = await PermissionService.checkUserPermission(userId, permissionName);

// 2. If none found, check role-based permissions
if (!hasDynamicPermission) {
  hasPermission = checkRoleBasedPermission(user.role, permissionName);
}

// 3. Grant access if either is true
if (hasDynamicPermission || hasRoleBasedPermission) {
  // Allow access
}
```

### Migration Strategy
1. **Initialize System**: Create default permissions
2. **Grant Permissions**: Assign to existing supervisors
3. **Update Middleware**: Use dynamic permission middleware
4. **Monitor Usage**: Track permission effectiveness
5. **Gradual Rollout**: Phase in dynamic permissions

---

## Security Features

### Access Control
- **Expiration**: Permissions can have expiration dates
- **Revocation**: Immediate permission revocation
- **Audit Trail**: Complete assignment and usage tracking
- **Temporary Access**: Time-limited permissions
- **Fine-Grained**: Resource and action-level control

### Monitoring
- **Usage Tracking**: How often permissions are used
- **Assignment History**: Who granted what to whom
- **Expiration Alerts**: Automatic cleanup of expired permissions
- **Permission Stats**: System-wide usage analytics

### Data Protection
- **Input Validation**: All inputs validated and sanitized
- **Authorization**: Proper token verification required
- **Role Verification**: Admin-only operations protected
- **Audit Logging**: All permission changes logged

---

## Performance Considerations

### Database Optimization
- **Indexes**: Optimized queries for permission lookups
- **Caching**: Effective permissions cached for performance
- **Batch Operations**: Bulk permission operations supported
- **Lean Queries**: Efficient database access patterns

### Scalability
- **Horizontal Scaling**: Permission checks are stateless
- **Database Sharding**: Permission data can be sharded by user
- **Caching Layer**: Redis integration for frequently accessed permissions
- **Load Balancing**: Permission service can be load balanced

---

## Usage Examples

### Granting Supervisor Permissions
```bash
# Grant user management permissions to a supervisor
curl -X POST "http://localhost:5000/api/permissions/grant" \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "507f1f77bcf86cd799439011",
    "permissionName": "block_client",
    "reason": "Grant blocking capability to supervisor"
  }'
```

### Checking Permissions
```bash
# Check if user has specific permission
curl -X GET "http://localhost:5000/api/permissions/check/507f1f77bcf86cd799439011/block_client" \
  -H "Authorization: Bearer <supervisor_token>"
```

### Managing Multiple Permissions
```bash
# Grant multiple permissions at once
curl -X POST "http://localhost:5000/api/permissions/grant-multiple" \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "507f1f77bcf86cd799439011",
    "permissionNames": ["block_client", "unblock_client", "view_user_details"],
    "reason": "Grant user management permissions"
  }'
```

---

## Monitoring and Analytics

### Permission Usage Metrics
- **Most Used Permissions**: Track which permissions are used most
- **User Activity**: Monitor permission usage patterns
- **Expiration Tracking**: Alert before permissions expire
- **Assignment Trends**: Analyze permission granting patterns

### Security Monitoring
- **Unauthorized Attempts**: Track denied permission checks
- **Privilege Escalation**: Monitor for suspicious patterns
- **Permission Abuse**: Detect unusual permission usage
- **Audit Compliance**: Ensure all changes are auditable

---

## Best Practices

### Permission Design
- **Principle of Least Privilege**: Grant minimum necessary permissions
- **Separation of Duties**: Different permissions for different roles
- **Time-Limited Access**: Use expiration for temporary access
- **Regular Audits**: Review permission assignments regularly

### Implementation Guidelines
- **Use Dynamic Middleware**: Prefer over manual permission checks
- **Cache Effective Permissions**: Improve performance for frequent checks
- **Log Permission Usage**: Track and analyze permission usage
- **Regular Cleanup**: Remove expired permissions automatically

### Security Considerations
- **Validate All Inputs**: Never trust user input
- **Use HTTPS**: Protect permission management endpoints
- **Monitor Access**: Track all permission check failures
- **Audit Changes**: Log all permission modifications

---

*Last Updated: April 2024*
