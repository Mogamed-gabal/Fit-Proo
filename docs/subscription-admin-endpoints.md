# Subscription Admin Endpoints Documentation

## Overview

These endpoints provide administrative functionality for managing subscriptions and granting subscription-related permissions to supervisors. These endpoints are restricted to admin users only.

---

## 1. Get All Subscriptions (Admin Only)

### Endpoint
```
GET /api/subscription/admin/all
```

### Purpose
Retrieve all subscriptions in the system with comprehensive filtering, pagination, and statistics. This endpoint provides a complete overview of the subscription ecosystem for administrative monitoring and analysis.

### Authentication & Authorization
- **Required**: Valid JWT authentication
- **Role Required**: `admin` only
- **Permission Required**: None (admin role check only)

### Query Parameters

#### Pagination
- `page` (optional): Page number (default: 1, min: 1)
- `limit` (optional): Items per page (default: 10, min: 1, max: 100)

#### Filtering Options
- `paymentStatus` (optional): Filter by payment status
  - Values: `pending`, `paid`, `failed`
- `isActive` (optional): Filter by active status
  - Values: `true`, `false`
- `duration` (optional): Filter by subscription duration in months
  - Values: `1`, `3`, `6`
- `clientId` (optional): Filter by specific client ID
- `doctorId` (optional): Filter by specific doctor ID

#### Date Range Filters
- `dateFrom` (optional): Filter subscriptions created after this date (ISO 8601)
- `dateTo` (optional): Filter subscriptions created before this date (ISO 8601)
- `endDateFrom` (optional): Filter subscriptions ending after this date (ISO 8601)
- `endDateTo` (optional): Filter subscriptions ending before this date (ISO 8601)

### Response Structure

```json
{
  "success": true,
  "data": {
    "subscriptions": [
      {
        "_id": "507f1f77bcf86cd799439011",
        "clientId": {
          "_id": "507f1f77bcf86cd799439012",
          "name": "John Doe",
          "email": "john@example.com",
          "role": "client",
          "isBlocked": false
        },
        "doctorId": {
          "_id": "507f1f77bcf86cd799439013",
          "name": "Dr. Jane Smith",
          "email": "jane@example.com",
          "role": "doctor",
          "status": "approved",
          "isBlocked": false
        },
        "duration": 3,
        "monthlyPrice": 99.99,
        "totalPrice": 299.97,
        "paymentStatus": "paid",
        "startDate": "2024-01-15T10:30:00.000Z",
        "endDate": "2024-04-15T10:30:00.000Z",
        "isActive": true,
        "isExpired": false,
        "createdAt": "2024-01-15T10:30:00.000Z",
        "updatedAt": "2024-01-15T10:35:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 150,
      "pages": 15,
      "hasNext": true,
      "hasPrev": false
    },
    "statistics": {
      "totalSubscriptions": 150,
      "activeSubscriptions": 125,
      "paidSubscriptions": 130,
      "pendingSubscriptions": 15,
      "failedSubscriptions": 5,
      "totalRevenue": 45678.90,
      "avgDuration": 3.2
    },
    "filters": {
      "paymentStatus": null,
      "isActive": null,
      "duration": null,
      "clientId": null,
      "doctorId": null,
      "dateFrom": null,
      "dateTo": null,
      "endDateFrom": null,
      "endDateTo": null
    }
  }
}
```

### Statistics Explained

- **totalSubscriptions**: Total number of subscriptions matching filters
- **activeSubscriptions**: Currently active subscriptions
- **paidSubscriptions**: Subscriptions with paid status
- **pendingSubscriptions**: Subscriptions awaiting payment
- **failedSubscriptions**: Subscriptions with failed payments
- **totalRevenue**: Total revenue from paid subscriptions
- **avgDuration**: Average subscription duration in months

### Usage Examples

#### Get all active subscriptions
```http
GET /api/subscription/admin/all?isActive=true
```

#### Get paid subscriptions from January 2024
```http
GET /api/subscription/admin/all?paymentStatus=paid&dateFrom=2024-01-01&dateTo=2024-01-31
```

#### Get subscriptions expiring in next 30 days
```http
GET /api/subscription/admin/all?endDateFrom=2024-04-15&endDateTo=2024-05-15
```

#### Get subscriptions for specific doctor
```http
GET /api/subscription/admin/all?doctorId=507f1f77bcf86cd799439013
```

#### Paginated results
```http
GET /api/subscription/admin/all?page=2&limit=20
```

### Error Responses

#### 403 Forbidden
```json
{
  "success": false,
  "error": "Access denied. Admin privileges required."
}
```

#### 400 Bad Request
```json
{
  "success": false,
  "error": "Limit cannot exceed 100"
}
```

#### 500 Internal Server Error
```json
{
  "success": false,
  "error": "Database connection error"
}
```

---

## 2. Grant Subscription Permission to Supervisor

### Endpoint
```
POST /api/subscription/admin/grant-permission
```

### Purpose
Grant subscription-related permissions to supervisors, allowing them to access and manage subscription data according to their assigned permission level.

### Authentication & Authorization
- **Required**: Valid JWT authentication
- **Role Required**: `admin` only
- **Permission Required**: None (admin role check only)

### Request Body

```json
{
  "supervisorId": "507f1f77bcf86cd799439014",
  "permissionType": "read_subscriptions",
  "reason": "Grant access to monitor subscription metrics"
}
```

#### Request Parameters

- **supervisorId** (required): MongoDB ObjectId of the supervisor
- **permissionType** (required): Permission type to grant
- **reason** (optional): Reason for granting the permission

### Available Permission Types

| Permission | Level | Description |
|------------|-------|-------------|
| `read_subscriptions` | 2 | Read and view subscription information |
| `manage_subscriptions` | 4 | Full management of subscriptions |
| `export_subscriptions` | 3 | Export subscription data |
| `approve_subscriptions` | 3 | Approve subscription requests |
| `cancel_subscriptions` | 3 | Cancel subscriptions |
| `view_subscription_details` | 2 | View detailed subscription information |
| `modify_subscription_status` | 3 | Modify subscription status |
| `access_subscription_reports` | 3 | Access subscription reports and analytics |

### Response Structure

```json
{
  "success": true,
  "message": "Permission 'read_subscriptions' granted to supervisor successfully",
  "data": {
    "supervisor": {
      "id": "507f1f77bcf86cd799439014",
      "name": "Admin Supervisor",
      "email": "supervisor@example.com",
      "role": "supervisor"
    },
    "permission": "read_subscriptions",
    "grantedBy": {
      "id": "507f1f77bcf86cd799439015",
      "name": "System Admin",
      "email": "admin@example.com"
    },
    "grantedAt": "2024-01-15T10:30:00.000Z",
    "reason": "Grant access to monitor subscription metrics",
    "assignment": {
      "_id": "507f1f77bcf86cd799439016",
      "name": "read_subscriptions",
      "assignedAt": "2024-01-15T10:30:00.000Z",
      "isActive": true
    }
  }
}
```

### Validation Rules

#### Supervisor Validation
- Supervisor must exist in the database
- User must have `supervisor` role
- Supervisor account must not be blocked

#### Permission Validation
- Permission type must be from the allowed list
- Permission must exist in the system

### Usage Examples

#### Grant read access
```json
{
  "supervisorId": "507f1f77bcf86cd799439014",
  "permissionType": "read_subscriptions",
  "reason": "Access to view subscription dashboard"
}
```

#### Grant full management access
```json
{
  "supervisorId": "507f1f77bcf86cd799439014",
  "permissionType": "manage_subscriptions",
  "reason": "Full subscription management responsibilities"
}
```

#### Grant export capability
```json
{
  "supervisorId": "507f1f77bcf86cd799439014",
  "permissionType": "export_subscriptions",
  "reason": "Generate monthly subscription reports"
}
```

### Error Responses

#### 403 Forbidden
```json
{
  "success": false,
  "error": "Access denied. Admin privileges required."
}
```

#### 404 Not Found
```json
{
  "success": false,
  "error": "Supervisor not found"
}
```

#### 400 Bad Request
```json
{
  "success": false,
  "error": "User is not a supervisor"
}
```

```json
{
  "success": false,
  "error": "Invalid permission type",
  "validPermissions": [
    "read_subscriptions",
    "manage_subscriptions",
    "export_subscriptions",
    "approve_subscriptions",
    "cancel_subscriptions",
    "view_subscription_details",
    "modify_subscription_status",
    "access_subscription_reports"
  ]
}
```

```json
{
  "success": false,
  "error": "Supervisor account is blocked"
}
```

#### 500 Internal Server Error
```json
{
  "success": false,
  "error": "Failed to grant permission"
}
```

---

## 3. Permission Levels and Access Control

### Permission Hierarchy

The subscription permissions follow a hierarchical structure:

1. **Level 1** - Basic Access
   - `manage_own_subscriptions`: Users can manage their own subscriptions

2. **Level 2** - Read Access
   - `read_subscriptions`: Read all subscriptions
   - `view_subscription_details`: View detailed information

3. **Level 3** - Operational Access
   - `export_subscriptions`: Export data
   - `approve_subscriptions`: Approve requests
   - `cancel_subscriptions`: Cancel subscriptions
   - `modify_subscription_status`: Change status
   - `access_subscription_reports`: View reports

4. **Level 4** - Full Management
   - `manage_subscriptions`: Complete control over subscriptions

### Access Matrix

| Role | Read | Export | Approve | Cancel | Manage |
|------|------|--------|---------|--------|--------|
| Client | Own Only | No | No | Own Only | Own Only |
| Doctor | Own Only | No | No | No | No |
| Supervisor | Granted | Granted | Granted | Granted | Granted |
| Admin | Full | Full | Full | Full | Full |

---

## 4. Integration with Permission System

### Permission Storage

The granted permissions are stored in the same permission system used throughout the application, ensuring:

- **Consistency**: Same permission checking logic
- **Audit Trail**: Complete history of permission grants
- **Flexibility**: Easy to modify or revoke permissions
- **Scalability**: Handles multiple permission types efficiently

### Permission Checking

Once granted, supervisors can use their permissions immediately:

```javascript
// In middleware or controllers
const hasPermission = await PermissionService.checkUserPermission(
  supervisorId,
  'read_subscriptions'
);

if (hasPermission) {
  // Allow access to subscription data
} else {
  // Deny access
}
```

### Permission Revocation

Permissions can be revoked using the standard permission revocation endpoint:

```http
POST /api/permissions/revoke
{
  "userId": "507f1f77bcf86cd799439014",
  "permissionName": "read_subscriptions",
  "reason": "Access review - responsibilities changed"
}
```

---

## 5. Best Practices

### Permission Management

1. **Principle of Least Privilege**
   - Grant only necessary permissions
   - Start with read-only access when possible
   - Review permissions regularly

2. **Documentation**
   - Always provide clear reasons for permission grants
   - Document supervisor responsibilities
   - Maintain audit trail for compliance

3. **Regular Reviews**
   - Periodically review supervisor permissions
   - Remove unnecessary permissions
   - Update permissions when roles change

### Security Considerations

1. **Validation**
   - Always validate supervisor existence and status
   - Check for blocked or inactive accounts
   - Validate permission types against allowed list

2. **Audit Trail**
   - All permission grants are logged
   - Include who granted the permission and why
   - Maintain complete history of changes

3. **Access Control**
   - Only admins can grant subscription permissions
   - Implement proper role checking
   - Use middleware for consistent validation

### Performance Optimization

1. **Database Queries**
   - Use indexes for efficient filtering
   - Implement pagination for large datasets
   - Cache frequently accessed statistics

2. **Response Optimization**
   - Limit data returned in API responses
   - Use lean queries where possible
   - Implement response compression

---

## 6. Monitoring and Analytics

### Key Metrics to Monitor

1. **Subscription Statistics**
   - Total subscriptions over time
   - Active vs inactive ratios
   - Payment success rates
   - Revenue trends

2. **Permission Usage**
   - How often supervisors use granted permissions
   - Most accessed subscription features
   - Permission request patterns

3. **System Health**
   - API response times
   - Database query performance
   - Error rates and types

### Recommended Dashboards

1. **Admin Dashboard**
   - Overall subscription metrics
   - Recent permission grants
   - System alerts

2. **Supervisor Dashboard**
   - Subscription overview (if permitted)
   - Performance metrics
   - Activity reports

---

## 7. Troubleshooting

### Common Issues

#### Permission Not Working
1. Check if permission was granted successfully
2. Verify supervisor is not blocked
3. Check permission expiration (if set)
4. Review permission checking logic

#### Performance Issues
1. Optimize database queries with proper indexes
2. Implement pagination for large datasets
3. Cache frequently accessed data
4. Monitor database performance

#### Access Denied Errors
1. Verify user has admin role
2. Check if supervisor exists and is active
3. Validate permission type
4. Review request format

### Debug Tools

```javascript
// Check supervisor permissions
const permissions = await PermissionService.getUserPermissions(supervisorId);
console.log('Supervisor permissions:', permissions);

// Test permission check
const hasAccess = await PermissionService.checkUserPermission(
  supervisorId,
  'read_subscriptions'
);
console.log('Has subscription access:', hasAccess);

// Get subscription statistics
const stats = await Subscription.aggregate([
  { $group: { _id: '$paymentStatus', count: { $sum: 1 } } }
]);
console.log('Payment status distribution:', stats);
```

---

## 8. API Reference Summary

### Endpoints Summary

| Method | Endpoint | Purpose | Admin Only |
|--------|----------|---------|------------|
| GET | `/api/subscription/admin/all` | Get all subscriptions with filtering | ✅ |
| POST | `/api/subscription/admin/grant-permission` | Grant permission to supervisor | ✅ |

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
- `403` - Forbidden (insufficient privileges)
- `404` - Not Found (resource doesn't exist)
- `500` - Internal Server Error

---

*This documentation covers the admin subscription endpoints. For general subscription operations, refer to the main subscription API documentation.*
