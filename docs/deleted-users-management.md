# Deleted Users Management Documentation

## Overview

These endpoints provide functionality for managing deleted users in the system. Admins and authorized supervisors can view deleted users and permanently remove them from the system. This ensures proper data governance and compliance with data retention policies.

---

## 1. Get Deleted Users

### Endpoint
```
GET /api/users/deleted
```

### Purpose
Retrieve all soft-deleted users with comprehensive filtering, pagination, and statistics. This endpoint allows administrators and authorized supervisors to review deleted users before making decisions about permanent deletion.

### Authentication & Authorization
- **Required**: Valid JWT authentication
- **Permission Required**: `view_deleted_users`
- **Roles**: Admin (automatic), Supervisor (with granted permission)

### Query Parameters

#### Pagination
- `page` (optional): Page number (default: 1, min: 1)
- `limit` (optional): Items per page (default: 20, min: 1, max: 100)

#### Filtering Options
- `search` (optional): Search by name or email (case-insensitive)
- `role` (optional): Filter by user role
  - Values: `client`, `doctor`, `supervisor`, `admin`
- `deletedFrom` (optional): Filter users deleted after this date (ISO 8601)
- `deletedTo` (optional): Filter users deleted before this date (ISO 8601)

### Response Structure

```json
{
  "success": true,
  "data": {
    "users": [
      {
        "_id": "507f1f77bcf86cd799439011",
        "name": "John Doe",
        "email": "john@example.com",
        "role": "client",
        "isDeleted": true,
        "deletedAt": "2024-01-15T10:30:00.000Z",
        "deletedBy": "507f1f77bcf86cd799439015",
        "createdAt": "2023-06-01T14:20:00.000Z",
        "updatedAt": "2024-01-15T10:30:00.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalUsers": 95,
      "hasNext": true,
      "hasPrev": false
    },
    "statistics": {
      "totalDeleted": 95,
      "roleStatistics": [
        {
          "_id": "client",
          "count": 75,
          "oldestDeletion": "2023-01-01T00:00:00.000Z",
          "newestDeletion": "2024-01-15T10:30:00.000Z"
        },
        {
          "_id": "doctor",
          "count": 15,
          "oldestDeletion": "2023-03-15T08:45:00.000Z",
          "newestDeletion": "2024-01-10T16:20:00.000Z"
        },
        {
          "_id": "supervisor",
          "count": 5,
          "oldestDeletion": "2023-07-20T12:00:00.000Z",
          "newestDeletion": "2024-01-05T09:15:00.000Z"
        }
      ],
      "overallStats": {
        "totalDeleted": 95,
        "avgDeletedDuration": 86400000
      }
    },
    "filters": {
      "search": null,
      "role": null,
      "deletedFrom": null,
      "deletedTo": null
    }
  }
}
```

### Statistics Explained

- **totalDeleted**: Total number of deleted users matching filters
- **roleStatistics**: Breakdown by user role with counts and date ranges
- **overallStats**: Aggregate statistics including average deletion duration

### Usage Examples

#### Get all deleted users
```http
GET /api/users/deleted
```

#### Search for specific deleted user
```http
GET /api/users/deleted?search=john
```

#### Filter by role and date range
```http
GET /api/users/deleted?role=client&deletedFrom=2024-01-01&deletedTo=2024-01-31
```

#### Paginated results
```http
GET /api/users/deleted?page=2&limit=50
```

### Error Responses

#### 403 Forbidden
```json
{
  "success": false,
  "error": "Access denied. Missing permission: view_deleted_users"
}
```

#### 400 Bad Request
```json
{
  "success": false,
  "error": "Limit cannot exceed 100"
}
```

```json
{
  "success": false,
  "error": "Role must be one of: client, doctor, supervisor, admin"
}
```

---

## 2. Permanently Delete User

### Endpoint
```
DELETE /api/users/:userId/permanent
```

### Purpose
Permanently remove a soft-deleted user from the database. This is an irreversible action that completely removes the user record and all associated data.

### Authentication & Authorization
- **Required**: Valid JWT authentication
- **Permission Required**: `permanent_delete_users`
- **Roles**: Admin (automatic), Supervisor (with granted permission)

### Path Parameters
- `userId` (required): MongoDB ObjectId of the deleted user

### Request Body

```json
{
  "reason": "User requested permanent deletion of account"
}
```

#### Request Parameters

- **reason** (optional): Reason for permanent deletion (3-500 characters)

### Response Structure

```json
{
  "success": true,
  "message": "User permanently deleted successfully",
  "data": {
    "deletedUser": {
      "id": "507f1f77bcf86cd799439011",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "client",
      "deletedAt": "2024-01-15T10:30:00.000Z",
      "deletedBy": "507f1f77bcf86cd799439015"
    },
    "deletedBy": {
      "id": "507f1f77bcf86cd799439016",
      "name": "Admin User",
      "email": "admin@example.com",
      "role": "admin"
    },
    "deletedAt": "2024-01-20T14:45:00.000Z",
    "reason": "User requested permanent deletion of account"
  }
}
```

### Safety Checks

The endpoint performs several safety checks before permanent deletion:

#### 1. User Status Validation
- User must be already soft-deleted (`isDeleted: true`)
- User must exist in the database

#### 2. Related Data Check
The system checks for related data that would be affected:

```json
{
  "success": false,
  "error": "Cannot permanently delete user. User has related data (subscriptions, diet plans, etc.)",
  "relatedData": {
    "subscriptions": 2,
    "dietPlans": 5,
    "workoutPlans": 3
  }
}
```

Related data checks include:
- **Subscriptions**: Active or historical subscription records
- **Diet Plans**: Diet plans created by or assigned to the user
- **Workout Plans**: Workout plans associated with the user

#### 3. Audit Logging
All permanent deletions are logged with:
- Who performed the deletion
- Which user was deleted
- When the deletion occurred
- Reason for deletion

### Usage Examples

#### Permanent deletion with reason
```http
DELETE /api/users/507f1f77bcf86cd799439011/permanent
Content-Type: application/json

{
  "reason": "Account cleanup after 90 days retention period"
}
```

#### Permanent deletion without reason
```http
DELETE /api/users/507f1f77bcf86cd799439011/permanent
```

### Error Responses

#### 403 Forbidden
```json
{
  "success": false,
  "error": "Access denied. Missing permission: permanent_delete_users"
}
```

#### 404 Not Found
```json
{
  "success": false,
  "error": "Deleted user not found or user is not marked as deleted"
}
```

#### 400 Bad Request
```json
{
  "success": false,
  "error": "Cannot permanently delete user. User has related data (subscriptions, diet plans, etc.)",
  "relatedData": {
    "subscriptions": 2,
    "dietPlans": 0,
    "workoutPlans": 1
  }
}
```

```json
{
  "success": false,
  "error": "Invalid user ID"
}
```

```json
{
  "success": false,
  "error": "Reason must be between 3 and 500 characters"
}
```

---

## 3. Permission System Integration

### Available Permissions

| Permission | Level | Description | Risk Level |
|------------|-------|-------------|------------|
| `view_deleted_users` | 3 | View and search deleted users | Medium |
| `permanent_delete_users` | 5 | Permanently delete users | High |
| `restore_deleted_users` | 4 | Restore soft-deleted users | Medium-High |

### Permission Hierarchy

The permissions follow a risk-based hierarchy:

1. **Level 3** - View Access
   - `view_deleted_users`: Read-only access to deleted users

2. **Level 4** - Restore Access
   - `restore_deleted_users`: Ability to restore deleted users

3. **Level 5** - Permanent Deletion
   - `permanent_delete_users`: Irreversible deletion capability

### Granting Permissions to Supervisors

Admins can grant these permissions to supervisors using the existing permission system:

```http
POST /api/permissions/grant
{
  "userId": "supervisor123",
  "permissionName": "view_deleted_users",
  "reason": "Grant access to review deleted users for audit purposes"
}
```

```http
POST /api/permissions/grant
{
  "userId": "supervisor123",
  "permissionName": "permanent_delete_users",
  "reason": "Grant permanent deletion capability for data cleanup"
}
```

### Role-Based Access

| Role | View Deleted | Permanent Delete | Restore |
|------|--------------|------------------|---------|
| Client | ❌ | ❌ | ❌ |
| Doctor | ❌ | ❌ | ❌ |
| Supervisor | ✅ (with permission) | ✅ (with permission) | ✅ (with permission) |
| Admin | ✅ (automatic) | ✅ (automatic) | ✅ (automatic) |

---

## 4. Best Practices

### Data Retention Policies

1. **Soft Delete First**
   - Always use soft deletion initially
   - Allow grace period for recovery
   - Document deletion reasons

2. **Review Before Permanent Deletion**
   - Use the `/deleted` endpoint to review
   - Check for related data dependencies
   - Verify retention period compliance

3. **Audit Trail**
   - Always provide deletion reasons
   - Maintain complete audit logs
   - Document compliance requirements

### Security Considerations

1. **Permission Management**
   - Grant `permanent_delete_users` sparingly
   - Regularly review permission assignments
   - Implement supervisor approval for critical deletions

2. **Data Integrity**
   - Check for related data before deletion
   - Implement data cleanup procedures
   - Maintain referential integrity

3. **Compliance**
   - Follow data retention regulations
   - Document deletion policies
   - Provide deletion reports

### Operational Guidelines

1. **Before Permanent Deletion**
   ```bash
   # 1. Review deleted users
   GET /api/users/deleted?role=client&deletedFrom=2023-01-01
   
   # 2. Check specific user
   GET /api/users/deleted?search=john@example.com
   
   # 3. Verify no critical related data
   # (System checks automatically)
   ```

2. **Permanent Deletion Process**
   ```bash
   # 1. Confirm user details
   # 2. Verify retention period
   # 3. Document reason
   # 4. Execute permanent deletion
   DELETE /api/users/:userId/permanent
   ```

3. **Post-Deletion**
   - Verify deletion completion
   - Update audit logs
   - Notify stakeholders if required

---

## 5. Monitoring and Reporting

### Key Metrics

1. **Deletion Statistics**
   - Number of users deleted per period
   - Average time between soft and permanent deletion
   - Deletion reasons distribution

2. **Permission Usage**
   - How often permissions are used
   - Which supervisors perform deletions
   - Error rates and patterns

3. **Compliance Metrics**
   - Retention period compliance
   - Audit trail completeness
   - Data cleanup effectiveness

### Recommended Reports

1. **Monthly Deletion Report**
   ```json
   {
     "period": "2024-01",
     "totalDeleted": 45,
     "byRole": {
       "client": 38,
       "doctor": 5,
       "supervisor": 2
     },
     "avgRetentionDays": 92,
     "topDeletionReasons": [
       "User request",
       "Account cleanup",
       "Policy violation"
     ]
   }
   ```

2. **Permission Usage Report**
   ```json
   {
     "period": "2024-01",
     "viewDeletedUsers": {
       "supervisor123": 156,
       "supervisor456": 89
     },
     "permanentDeleteUsers": {
       "admin789": 12
     }
   }
   ```

---

## 6. Troubleshooting

### Common Issues

#### Permission Not Working
1. Verify permission was granted correctly
2. Check if supervisor is active and not blocked
3. Verify permission exists in the system
4. Review permission assignment logs

#### Cannot Delete User
1. Check if user is already soft-deleted
2. Verify user has no related data
3. Check for active subscriptions or plans
4. Review system constraints

#### Performance Issues
1. Optimize database queries with proper indexes
2. Implement pagination for large datasets
3. Cache frequently accessed statistics
4. Monitor database performance

### Debug Tools

```javascript
// Check user permissions
const permissions = await PermissionService.getUserPermissions(supervisorId);
console.log('Supervisor permissions:', permissions);

// Test permission check
const canViewDeleted = await PermissionService.checkUserPermission(
  supervisorId,
  'view_deleted_users'
);
console.log('Can view deleted users:', canViewDeleted);

// Check deleted user statistics
const deletedStats = await User.aggregate([
  { $match: { isDeleted: true } },
  { $group: { _id: '$role', count: { $sum: 1 } } }
]);
console.log('Deleted users by role:', deletedStats);
```

---

## 7. API Reference Summary

### Endpoints Summary

| Method | Endpoint | Purpose | Permission Required |
|--------|----------|---------|---------------------|
| GET | `/api/users/deleted` | Get all deleted users | `view_deleted_users` |
| DELETE | `/api/users/:userId/permanent` | Permanently delete user | `permanent_delete_users` |

### Response Formats

#### Success Response
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": { ... }
}
```

#### Error Response
```json
{
  "success": false,
  "error": "Error description",
  "details": { ... } // Additional error details
}
```

### HTTP Status Codes

- `200` - Success
- `400` - Bad Request (validation errors)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found (resource doesn't exist)
- `500` - Internal Server Error

---

## 8. Integration Examples

### Frontend Integration

```javascript
// Get deleted users with filtering
async function getDeletedUsers(filters = {}) {
  const params = new URLSearchParams(filters);
  const response = await fetch(`/api/users/deleted?${params}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch deleted users');
  }
  
  return response.json();
}

// Permanently delete user
async function permanentDeleteUser(userId, reason) {
  const response = await fetch(`/api/users/${userId}/permanent`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ reason })
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to delete user');
  }
  
  return response.json();
}
```

### Usage Examples

```javascript
// Example: Review and delete old deleted users
async function cleanupOldDeletedUsers() {
  try {
    // Get users deleted more than 90 days ago
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    
    const result = await getDeletedUsers({
      deletedTo: ninetyDaysAgo.toISOString(),
      limit: 100
    });
    
    console.log(`Found ${result.data.pagination.totalUsers} users to review`);
    
    // Process each user (with confirmation)
    for (const user of result.data.users) {
      console.log(`Reviewing user: ${user.name} (${user.email})`);
      console.log(`Deleted on: ${user.deletedAt}`);
      
      // In real application, this would require admin confirmation
      // await permanentDeleteUser(user._id, '90-day retention period expired');
    }
  } catch (error) {
    console.error('Cleanup failed:', error);
  }
}
```

---

*This documentation covers the deleted users management endpoints. Ensure proper training and authorization before using these powerful deletion capabilities.*
