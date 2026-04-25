# Permission System Documentation

## Overview

The Permission System is a dynamic, role-based access control (RBAC) system that provides granular control over user actions in the fitness application. It combines static role-based permissions with dynamically assigned permissions for flexible access management.

## Architecture

The system consists of four main components:

1. **Permission Model** - Data schema for permissions
2. **PermissionService** - Business logic and operations
3. **PermissionController** - HTTP request handlers
4. **DynamicPermissionMiddleware** - Permission checking middleware
5. **Permission Routes** - REST API endpoints

---

## 1. Permission Model (`src/models/Permission.js`)

### Schema Structure

```javascript
{
  name: String,              // Unique permission identifier
  description: String,        // Human-readable description
  category: String,           // Permission category (enum)
  action: String,             // Action type (enum)
  resource: String,           // Resource type (enum)
  level: Number,              // Permission level (1-10)
  isActive: Boolean,           // Permission status
  isSystem: Boolean,           // System vs custom permission
  assignedBy: ObjectId,        // Who assigned this permission
  assignedTo: ObjectId,        // Who received this permission
  assignedAt: Date,           // Assignment timestamp
  expiresAt: Date,            // Optional expiration
  lastUsed: Date,             // Last usage timestamp
  usageCount: Number,          // Usage counter
  metadata: Mixed,             // Additional data
  isDeleted: Boolean,          // Soft delete flag
}
```

### Permission Categories

- `USER_MANAGEMENT` - User account operations
- `DOCTOR_MANAGEMENT` - Doctor-specific operations
- `CLIENT_MANAGEMENT` - Client-specific operations
- `DIET_PLAN_MANAGEMENT` - Diet plan operations
- `DIET_PROGRESS_MANAGEMENT` - Progress tracking
- `SYSTEM_ACCESS` - Admin panel and system access
- `DATA_EXPORT` - Data export operations
- `REPORTS` - Report generation and viewing
- `SETTINGS` - System configuration
- `BILLING` - Payment and billing operations
- `SECURITY` - Security-related operations
- `NOTIFICATIONS` - Notification management
- `WORKOUT_MANAGEMENT` - Workout plan operations
- `EXERCISE_MANAGEMENT` - Exercise library management
- `SUBSCRIPTION_MANAGEMENT` - Subscription handling

### Action Types

- `CREATE` - Create new resources
- `READ` - View/read resources
- `UPDATE` - Modify existing resources
- `DELETE` - Remove resources
- `APPROVE` - Approve requests
- `REJECT` - Reject requests
- `BLOCK` - Block access
- `UNBLOCK` - Unblock access
- `EXPORT` - Export data
- `IMPORT` - Import data
- `MANAGE` - Full management access
- `VIEW` - View specific items
- `ACCESS` - Access system features
- `MODIFY` - Modify configurations

### Resource Types

- `USERS` - User accounts
- `DOCTORS` - Doctor profiles
- `CLIENTS` - Client accounts
- `DIET_PLANS` - Diet plan data
- `DIET_PROGRESS` - Progress data
- `EXERCISES` - Exercise library
- `WORKOUT_PLANS` - Workout plans
- `WORKOUT_TEMPLATES` - Workout templates
- `SUBSCRIPTIONS` - Subscription data
- `NOTIFICATIONS` - Notification system
- `REPORTS` - System reports
- `SETTINGS` - Configuration
- `BILLING` - Payment data
- `SYSTEM` - System-level access
- `AUDIT_LOGS` - Audit trail

### Default Permissions

The system creates these default permissions on initialization:

#### User Management
- `manage_users` - Full user management (Level 5)
- `block_client` - Block client accounts (Level 3)
- `unblock_client` - Unblock client accounts (Level 3)
- `view_user_details` - View detailed user info (Level 2)

#### Doctor Management
- `manage_doctors` - Full doctor management (Level 5)
- `approve_doctor` - Approve doctor registration (Level 3)
- `reject_doctor` - Reject doctor registration (Level 3)
- `restore_doctor` - Restore deleted doctors (Level 4)
- `view_doctor_profile` - View doctor profiles (Level 2)

#### Diet Plan Management
- `manage_diet_plans` - Full diet plan management (Level 5)
- `create_diet_plan` - Create diet plans (Level 3)
- `update_diet_plan` - Update diet plans (Level 3)
- `delete_diet_plan` - Delete diet plans (Level 4)
- `view_diet_plan` - View diet plans (Level 2)

#### System Access
- `access_admin_panel` - Access admin dashboard (Level 2)
- `view_sensitive_data` - View sensitive user data (Level 4)
- `export_user_data` - Export user data (Level 3)
- `view_system_reports` - View system reports (Level 2)
- `read_permissions` - Read permissions (Level 2)
- `manage_permissions` - Manage permissions (Level 4)

#### Audit Log Access
- `read_supervisor_audit` - Read supervisor audit logs (Level 2)
- `export_supervisor_audit` - Export supervisor audit logs (Level 3)
- `manage_supervisor_audit` - Manage supervisor audit logs (Level 4)

---

## 2. Service Layer (`src/services/permissionService.js`)

### Core Methods

#### Permission Management
```javascript
// Initialize default permissions
PermissionService.initializePermissions()

// Grant permission to user
PermissionService.grantPermission(userId, permissionName, assignedBy, expiresAt, reason)

// Revoke permission from user
PermissionService.revokePermission(userId, permissionName, revokedBy, reason)

// Grant multiple permissions
PermissionService.grantMultiplePermissions(userId, permissionNames, assignedBy, expiresAt)

// Revoke multiple permissions
PermissionService.revokeMultiplePermissions(userId, permissionNames, revokedBy)
```

#### Permission Retrieval
```javascript
// Get user's permissions
PermissionService.getUserPermissions(userId, includeInactive)

// Get all available permissions
PermissionService.getAllPermissions(category, includeInactive)

// Get permissions by category
PermissionService.getPermissionsByCategory(category, includeInactive)

// Get permission statistics
PermissionService.getPermissionStats()

// Get user's effective permissions (role + assigned)
PermissionService.getEffectivePermissions(userId)
```

#### Permission Checking
```javascript
// Check if user has specific permission
PermissionService.checkUserPermission(userId, permissionName, resource)

// Check if user can access resource
PermissionService.canAccessResource(userId, resource, action)

// Get role-based permissions (fallback)
PermissionService.getRolePermissions(role)
```

#### Maintenance
```javascript
// Clean up expired permissions
PermissionService.cleanupExpiredPermissions()
```

### Usage Examples

```javascript
// Grant permission
const result = await PermissionService.grantPermission(
  'user123',
  'manage_users',
  'admin456',
  new Date('2024-12-31'),
  'Grant user management access'
);

// Check permission
const hasPermission = await PermissionService.checkUserPermission(
  'user123',
  'manage_users'
);

// Get effective permissions
const permissions = await PermissionService.getEffectivePermissions('user123');
// Returns: ['manage_users', 'access_admin_panel', ...] (role + assigned)
```

---

## 3. API Endpoints (`src/routes/permissions.js`)

### Authentication Requirements
All endpoints require:
- Valid JWT authentication
- Appropriate permissions for the action

### Endpoint Details

#### 1. Grant Permission
```
POST /api/permissions/grant
```

**Purpose:** Grant a specific permission to a user

**Required Permissions:** `manage_permissions` or admin role

**Request Body:**
```json
{
  "userId": "507f1f77bcf86cd799439011",      // User to receive permission
  "permissionName": "manage_users",                // Permission to grant
  "expiresAt": "2024-12-31T23:59:59.000Z",  // Optional expiration
  "reason": "Grant user management access"              // Optional reason
}
```

**Response:**
```json
{
  "success": true,
  "message": "Permission 'manage_users' granted successfully",
  "data": {
    "assignment": {
      "id": "507f1f77bcf86cd799439012",
      "name": "manage_users",
      "assignedAt": "2024-01-15T10:30:00.000Z",
      "expiresAt": "2024-12-31T23:59:59.000Z"
    },
    "permission": "manage_users",
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "supervisor"
    }
  }
}
```

**Validation Rules:**
- `userId` must be valid MongoDB ObjectId
- `permissionName` must be non-empty string
- `expiresAt` must be valid ISO 8601 date if provided
- `reason` must be string if provided

---

#### 2. Revoke Permission
```
POST /api/permissions/revoke
```

**Purpose:** Revoke a specific permission from a user

**Required Permissions:** `manage_permissions` or admin role

**Request Body:**
```json
{
  "userId": "507f1f77bcf86cd799439011",      // User to revoke from
  "permissionName": "manage_users",                // Permission to revoke
  "reason": "No longer needs access"               // Optional reason
}
```

**Response:**
```json
{
  "success": true,
  "message": "Permission 'manage_users' revoked successfully",
  "data": {
    "revocation": {
      "id": "507f1f77bcf86cd799439012",
      "revokedAt": "2024-01-15T10:30:00.000Z",
      "isActive": false
    },
    "permission": "manage_users"
  }
}
```

---

#### 3. Get User Permissions
```
GET /api/permissions/user/:userId
```

**Purpose:** Get all permissions for a specific user

**Required Permissions:** `read_permissions`

**Query Parameters:**
- `includeInactive` (optional): Boolean to include inactive permissions (default: false)

**Response:**
```json
{
  "success": true,
  "data": {
    "userId": "507f1f77bcf86cd799439011",
    "permissions": [
      {
        "id": "507f1f77bcf86cd799439012",
        "name": "manage_users",
        "description": "Full access to user management operations",
        "category": "USER_MANAGEMENT",
        "action": "MANAGE",
        "resource": "USERS",
        "level": 5,
        "isActive": true,
        "assignedAt": "2024-01-15T10:30:00.000Z",
        "expiresAt": "2024-12-31T23:59:59.000Z",
        "usageCount": 15,
        "lastUsed": "2024-01-14T15:45:00.000Z"
      }
    ],
    "count": 1
  }
}
```

---

#### 4. Get Current User Permissions
```
GET /api/permissions/my
```

**Purpose:** Get permissions for the authenticated user

**Required Permissions:** None (authentication only)

**Query Parameters:**
- `includeInactive` (optional): Boolean to include inactive permissions

**Response:**
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

---

#### 5. Get All Available Permissions
```
GET /api/permissions/all
```

**Purpose:** Get all available permission templates (for admin interface)

**Required Permissions:** `read_permissions`

**Query Parameters:**
- `category` (optional): Filter by permission category
- `includeInactive` (optional): Boolean to include inactive permissions

**Response:**
```json
{
  "success": true,
  "data": {
    "permissions": [
      {
        "id": "507f1f77bcf86cd799439012",
        "name": "manage_users",
        "description": "Full access to user management operations",
        "category": "USER_MANAGEMENT",
        "action": "MANAGE",
        "resource": "USERS",
        "level": 5,
        "isActive": true,
        "isSystem": true
      },
      {
        "id": "507f1f77bcf86cd799439013",
        "name": "read_permissions",
        "description": "Ability to read and view permissions",
        "category": "SYSTEM_ACCESS",
        "action": "READ",
        "resource": "SYSTEM",
        "level": 2,
        "isActive": true,
        "isSystem": true
      }
    ],
    "count": 20,
    "filters": {
      "category": null,
      "includeInactive": false
    }
  }
}
```

---

#### 6. Get Permissions by Category
```
GET /api/permissions/category/:category
```

**Purpose:** Get permissions filtered by category

**Required Permissions:** `read_permissions`

**Path Parameters:**
- `category`: Permission category (e.g., USER_MANAGEMENT)

**Query Parameters:**
- `includeInactive` (optional): Boolean to include inactive permissions

**Response:**
```json
{
  "success": true,
  "data": {
    "category": "USER_MANAGEMENT",
    "permissions": [
      {
        "name": "manage_users",
        "description": "Full access to user management operations",
        "level": 5
      },
      {
        "name": "view_user_details",
        "description": "Ability to view detailed user information",
        "level": 2
      }
    ],
    "count": 2
  }
}
```

---

#### 7. Grant Multiple Permissions
```
POST /api/permissions/grant-multiple
```

**Purpose:** Grant multiple permissions to a user in one request

**Required Permissions:** `manage_permissions` or admin role

**Request Body:**
```json
{
  "userId": "507f1f77bcf86cd799439011",
  "permissionNames": [
    "manage_users",
    "view_user_details",
    "block_client",
    "unblock_client"
  ],
  "expiresAt": "2024-12-31T23:59:59.000Z",  // Optional
  "reason": "Grant supervisor access rights"               // Optional
}
```

**Response:**
```json
{
  "success": true,
  "message": "Granted 4 of 4 permissions successfully",
  "data": {
    "results": [
      {
        "success": true,
        "assignment": { ... },
        "permission": "manage_users"
      },
      {
        "success": true,
        "assignment": { ... },
        "permission": "view_user_details"
      }
    ],
    "summary": {
      "total": 4,
      "successful": 4,
      "failed": 0
    }
  }
}
```

---

#### 8. Revoke Multiple Permissions
```
POST /api/permissions/revoke-multiple
```

**Purpose:** Revoke multiple permissions from a user in one request

**Required Permissions:** `manage_permissions` or admin role

**Request Body:**
```json
{
  "userId": "507f1f77bcf86cd799439011",
  "permissionNames": [
    "manage_users",
    "view_user_details"
  ],
  "reason": "Access review complete"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Revoked 2 of 2 permissions successfully",
  "data": {
    "results": [...],
    "summary": {
      "total": 2,
      "successful": 2,
      "failed": 0
    }
  }
}
```

---

#### 9. Check User Permission
```
GET /api/permissions/check/:userId/:permissionName
```

**Purpose:** Check if a specific user has a specific permission

**Required Permissions:** `read_permissions`

**Path Parameters:**
- `userId`: User ID to check
- `permissionName`: Permission name to check

**Query Parameters:**
- `resource` (optional): Specific resource to check

**Response:**
```json
{
  "success": true,
  "data": {
    "userId": "507f1f77bcf86cd799439011",
    "permissionName": "manage_users",
    "resource": "USERS",
    "hasPermission": true,
    "checkedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

---

#### 10. Get Permission Statistics
```
GET /api/permissions/stats
```

**Purpose:** Get system-wide permission statistics

**Required Permissions:** `read_permissions`

**Response:**
```json
{
  "success": true,
  "data": {
    "statistics": [
      {
        "_id": {
          "category": "USER_MANAGEMENT",
          "action": "MANAGE",
          "isActive": true
        },
        "count": 25,
        "avgLevel": 4.2,
        "uniqueUsers": 8
      },
      {
        "_id": {
          "category": "SYSTEM_ACCESS",
          "action": "READ",
          "isActive": true
        },
        "count": 15,
        "avgLevel": 2.5,
        "uniqueUsers": 12
      }
    ],
    "generatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

---

#### 11. Initialize Permission System
```
POST /api/permissions/initialize
```

**Purpose:** Initialize the permission system with default permissions

**Required Permissions:** Admin role only

**Response:**
```json
{
  "success": true,
  "message": "Permission system initialized successfully",
  "data": {
    "initialized": true,
    "permissionsCreated": 20,
    "permissions": [
      {
        "id": "507f1f77bcf86cd799439012",
        "name": "manage_users",
        "description": "Full access to user management operations",
        "category": "USER_MANAGEMENT",
        "action": "MANAGE",
        "resource": "USERS",
        "level": 5,
        "isSystem": true
      }
    ]
  }
}
```

---

#### 12. Cleanup Expired Permissions
```
POST /api/permissions/cleanup
```

**Purpose:** Deactivate all expired permissions

**Required Permissions:** Admin role only

**Response:**
```json
{
  "success": true,
  "message": "Expired permissions cleaned up successfully",
  "data": {
    "cleanedUp": 5,
    "cleanedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

---

#### 13. Get Effective Permissions for User
```
GET /api/permissions/effective/:userId
```

**Purpose:** Get all effective permissions for a user (role-based + assigned)

**Required Permissions:** `read_permissions`

**Path Parameters:**
- `userId`: User ID to get permissions for

**Response:**
```json
{
  "success": true,
  "data": {
    "userId": "507f1f77bcf86cd799439011",
    "effectivePermissions": [
      "manage_users",
      "access_admin_panel",
      "view_sensitive_data",
      "export_user_data",
      "view_system_reports",
      "read_supervisor_audit",
      "export_supervisor_audit",
      "manage_supervisor_audit",
      "read_permissions",
      "manage_permissions",
      "block_client",
      "unblock_client",
      "view_user_details",
      "manage_users_limited",
      "manage_supervisors",
      "read_audit_logs"
    ],
    "count": 18
  }
}
```

---

## 4. Middleware (`src/middleware/dynamicPermissionMiddleware.js`)

### Permission Checking

The middleware automatically checks permissions before allowing access to endpoints.

#### Usage in Routes
```javascript
// Single permission check
router.get('/protected-endpoint',
  authenticate,
  DynamicPermissionMiddleware.requirePermission('read_users'),
  controllerMethod
);

// Multiple permissions (all required)
router.post('/critical-operation',
  authenticate,
  DynamicPermissionMiddleware.requireAllPermissions(['manage_users', 'approve_doctor']),
  controllerMethod
);

// Multiple permissions (any one required)
router.get('/flexible-access',
  authenticate,
  DynamicPermissionMiddleware.requireAnyPermission(['read_users', 'view_user_details']),
  controllerMethod
);

// Admin or specific permission
router.put('/sensitive-data',
  authenticate,
  DynamicPermissionMiddleware.requireAdminOrPermission('view_sensitive_data'),
  controllerMethod
);

// Resource-based access
router.get('/users/:id',
  authenticate,
  DynamicPermissionMiddleware.requireResourceAccess('USERS', 'READ'),
  controllerMethod
);
```

#### Permission Check Flow

1. **Authentication Check**: Verify user is authenticated
2. **Dynamic Permission Check**: Check assigned permissions first
3. **Role-Based Fallback**: Check role permissions if no dynamic permission
4. **Resource Validation**: Validate resource-specific access if needed
5. **Usage Tracking**: Update permission usage statistics

### Middleware Methods

#### `requirePermission(permissionName, options)`
Checks if user has specific permission.

**Parameters:**
- `permissionName`: Name of permission to check
- `options`: Additional options (resource, etc.)

**Response:** 403 Forbidden if permission missing

#### `requireAllPermissions(permissionNames, options)`
Requires all specified permissions.

**Use Case:** Critical operations needing multiple permissions

#### `requireAnyPermission(permissionNames, options)`
Requires any one of specified permissions.

**Use Case:** Flexible access with multiple valid permissions

#### `requireResourceAccess(resource, action)`
Check access to specific resource.

**Parameters:**
- `resource`: Resource type (USERS, DOCTORS, etc.)
- `action`: Action type (READ, WRITE, DELETE, etc.)

#### `requireAdminOrPermission(permissionName, options)`
Admins always pass, others need specific permission.

**Use Case:** Admin-level features with optional supervisor access

---

## 5. Role-Based Permissions

### Static Role Permissions

#### Admin Role
```javascript
[
  'manage_users',
  'manage_doctors',
  'manage_diet_plans',
  'access_admin_panel',
  'view_sensitive_data',
  'export_user_data',
  'view_system_reports',
  'read_supervisor_audit',
  'export_supervisor_audit',
  'manage_supervisor_audit',
  'read_permissions',
  'manage_permissions'
]
```

#### Supervisor Role
```javascript
[
  'read_users',
  'read_dashboard',
  'read_subscriptions',
  'block_client',
  'unblock_client',
  'read_user_details',
  'manage_users_limited',
  'manage_supervisors',
  'read_audit_logs',
  'read_permissions',
  'manage_permissions'
]
```

#### Doctor Role
```javascript
[
  'read_own_profile',
  'manage_own_subscriptions',
  'read_own_subscriptions',
  'manage_own_certificates',
  'manage_own_packages',
  'manage_own_bio',
  'update_own_profile',
  'manage_own_profile_picture',
  'read_own_weight',
  'manage_client_workout_plans',
  'view_client_workout_plans',
  'view_client_progress',
  'manage_workout_templates'
]
```

#### Client Role
```javascript
[
  'read_own_profile',
  'manage_own_subscriptions',
  'read_own_subscriptions',
  'manage_own_certificates',
  'manage_own_packages',
  'manage_own_bio',
  'update_own_profile',
  'manage_own_profile_picture',
  'read_own_weight',
  'manage_own_progress',
  'view_own_progress'
]
```

---

## 6. Implementation Guide

### Step 1: Initialize System
```javascript
// Call initialization endpoint
POST /api/permissions/initialize
```

### Step 2: Grant Permissions to Supervisors
```javascript
// Grant single permission
POST /api/permissions/grant
{
  "userId": "supervisor123",
  "permissionName": "manage_users",
  "reason": "Grant user management access"
}

// Grant multiple permissions
POST /api/permissions/grant-multiple
{
  "userId": "supervisor123",
  "permissionNames": ["manage_users", "block_client", "view_user_details"],
  "reason": "Grant supervisor access rights"
}
```

### Step 3: Use Middleware in Routes
```javascript
// Protect endpoints
router.get('/users',
  authenticate,
  DynamicPermissionMiddleware.requirePermission('read_users'),
  getUserController
);

router.post('/users/:id/block',
  authenticate,
  DynamicPermissionMiddleware.requirePermission('block_client'),
  blockUserController
);
```

### Step 4: Check Permissions in Frontend
```javascript
// Check before showing UI elements
const hasPermission = await permissionService.checkUserPermission(
  userId, 
  'manage_users'
);

if (hasPermission) {
  // Show management UI
} else {
  // Show limited UI
}
```

---

## 7. Best Practices

### Permission Design

1. **Principle of Least Privilege**: Grant minimum necessary permissions
2. **Granular Control**: Use specific permissions over broad ones
3. **Expiration Management**: Set appropriate expiration dates
4. **Regular Auditing**: Review and revoke unnecessary permissions
5. **Documentation**: Document permission purposes and usage

### Security Considerations

1. **Permission Validation**: Always validate on both client and server
2. **Session Security**: Check permissions on each request
3. **Audit Trail**: Log all permission changes
4. **Revocation Process**: Implement immediate permission revocation
5. **Admin Oversight**: Require admin approval for critical permissions

### Performance Optimization

1. **Caching**: Cache permission checks for frequently accessed users
2. **Database Indexing**: Proper indexes on permission fields
3. **Batch Operations**: Use batch grant/revoke for multiple permissions
4. **Lazy Loading**: Load permissions only when needed
5. **Monitoring**: Track permission check performance

---

## 8. Troubleshooting

### Common Issues

#### Permission Not Working
1. Check if user is authenticated
2. Verify permission name spelling
3. Check if permission is assigned and active
4. Verify middleware is applied correctly
5. Check role-based fallback permissions

#### Performance Issues
1. Implement permission caching
2. Add database indexes
3. Use batch operations for multiple permissions
4. Monitor permission check frequency
5. Optimize database queries

#### Access Denied Errors
1. Verify user has required permission
2. Check permission expiration status
3. Review permission assignment logic
4. Check middleware configuration
5. Validate resource-specific permissions

### Debug Mode

```javascript
// Enable debug logging
process.env.NODE_ENV = 'development';

// Check effective permissions
const permissions = await PermissionService.getEffectivePermissions(userId);
console.log('User permissions:', permissions);

// Test permission check
const hasAccess = await PermissionService.checkUserPermission(userId, 'manage_users');
console.log('Permission check result:', hasAccess);
```

---

## 9. API Reference Summary

### Response Formats

#### Success Response
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation completed successfully"
}
```

#### Error Response
```json
{
  "success": false,
  "error": "Error message",
  "details": [...]  // Validation errors
}
```

### HTTP Status Codes

- `200` - Success
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (authentication required)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Internal Server Error

### Error Types

- `Authentication required` - No valid JWT token
- `Insufficient permissions` - User lacks required permission
- `Permission management requires admin privileges` - Only admins can manage permissions
- `Validation failed` - Request validation errors
- `Permission not found` - Requested permission doesn't exist

---

## 10. Migration & Maintenance

### System Initialization

```javascript
// Initialize on application startup
await PermissionService.initializePermissions();

// Check if system is initialized
const hasPermissions = await Permission.countDocuments() > 0;
if (!hasPermissions) {
  console.warn('Permission system not initialized');
}
```

### Data Migration

```javascript
// Migrate from old permission system
const oldPermissions = await OldPermission.find();
for (const oldPerm of oldPermissions) {
  await PermissionService.grantPermission(
    oldPerm.userId,
    oldPerm.permissionName,
    'system_migration',
    oldPerm.expiresAt,
    'Migrated from old system'
  );
}
```

### Regular Maintenance

```javascript
// Daily cleanup of expired permissions
setInterval(async () => {
  await PermissionService.cleanupExpiredPermissions();
}, 24 * 60 * 60 * 1000); // Daily

// Monthly permission audit
setInterval(async () => {
  const stats = await PermissionService.getPermissionStats();
  console.log('Permission system stats:', stats);
}, 30 * 24 * 60 * 60 * 1000); // Monthly
```

---

## 11. Security & Compliance

### Data Protection

1. **Encryption**: Encrypt sensitive permission data
2. **Access Logging**: Log all permission access attempts
3. **Audit Trail**: Maintain complete audit trail
4. **Data Minimization**: Store only necessary permission data
5. **Retention Policies**: Implement appropriate data retention

### Compliance Features

- **GDPR Compliance**: Right to be forgotten, data portability
- **SOX Compliance**: Segregation of duties, audit trails
- **HIPAA Compliance**: Patient data access controls
- **ISO 27001**: Information security management

---

## 12. Support & Monitoring

### Health Checks

```javascript
// System health endpoint
GET /api/permissions/health

// Response
{
  "status": "OK",
  "permissions": {
    "total": 150,
    "active": 142,
    "expired": 8
  },
  "database": "Connected",
  "cache": "Operational"
}
```

### Monitoring Metrics

- Permission check response times
- Cache hit/miss ratios
- Database query performance
- Permission assignment frequency
- Failed permission attempts
- System resource usage

### Alert Configuration

- Expired permission alerts
- Unusual permission assignment patterns
- Performance threshold breaches
- Database connection issues
- Security violation attempts

---

*This documentation provides comprehensive coverage of the Permission System. For specific implementation questions or custom requirements, refer to the source code and contact the development team.*
