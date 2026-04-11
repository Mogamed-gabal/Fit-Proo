# Admin API Documentation

## Overview
This API provides comprehensive admin management functionality for the fitness platform. All endpoints require authentication and appropriate permissions.

## Base URL
```
http://localhost:5000/api/admin
```

## Authentication
All endpoints require:
- **Authorization Header**: `Bearer <admin_token>`
- **Required Role**: `admin` or `supervisor` with appropriate permissions

---

## Endpoints

### 1. Dashboard Access
**GET** `/api/admin/dashboard`

**Description**: Access admin dashboard

**Permissions Required**: `read_dashboard`

**Request**:
```http
GET /api/admin/dashboard
Authorization: Bearer <admin_token>
```

**Response**:
```json
{
  "success": true,
  "message": "Dashboard access granted",
  "data": {
    "userRole": "admin",
    "permissions": "dashboard_access"
  }
}
```

---

### 2. Get All Users
**GET** `/api/admin/users`

**Description**: Get all users in the system

**Permissions Required**: `read_users`

**Query Parameters** (Optional):
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 10)
- `search` (string): Search by name or email
- `role` (string): Filter by role (client, doctor, supervisor)

**Request**:
```http
GET /api/admin/users?page=1&limit=10&search=john&role=client
Authorization: Bearer <admin_token>
```

**Response**:
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
        "isBlocked": false,
        "isDeleted": false,
        "createdAt": "2024-04-01T00:00:00.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalUsers": 50,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

---

### 3. Get User by ID
**GET** `/api/admin/users/:userId`

**Description**: Get specific user details

**Permissions Required**: `read_user_details`

**Request**:
```http
GET /api/admin/users/507f1f77bcf86cd799439011
Authorization: Bearer <admin_token>
```

**Response**:
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "client",
    "phone": "+1234567890",
    "isBlocked": false,
    "isDeleted": false,
    "createdAt": "2024-04-01T00:00:00.000Z",
    "updatedAt": "2024-04-01T00:00:00.000Z"
  }
}
```

---

### 4. Block User
**POST** `/api/admin/users/:userId/block`

**Description**: Block a user from accessing the system

**Permissions Required**: `block_client`

**Request**:
```http
POST /api/admin/users/507f1f77bcf86cd799439011/block
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "reason": "Violation of terms of service"
}
```

**Response**:
```json
{
  "success": true,
  "message": "User blocked successfully",
  "data": {
    "user": {
      "_id": "507f1f77bcf86cd799439011",
      "name": "John Doe",
      "isBlocked": true,
      "blockedAt": "2024-04-09T13:00:00.000Z",
      "blockedBy": "507f1f77bcf86cd799439999",
      "blockReason": "Violation of terms of service"
    },
    "blockReason": "Violation of terms of service"
  }
}
```

---

### 5. Unblock User
**POST** `/api/admin/users/:userId/unblock`

**Description**: Unblock a previously blocked user

**Permissions Required**: `unblock_client`

**Request**:
```http
POST /api/admin/users/507f1f77bcf86cd799439011/unblock
Authorization: Bearer <admin_token>
```

**Response**:
```json
{
  "success": true,
  "message": "User unblocked successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "isBlocked": false,
    "blockedAt": null,
    "blockedBy": null
  }
}
```

---

### 6. Soft Delete User
**DELETE** `/api/admin/users/:userId`

**Description**: Soft delete a user (mark as deleted without removing data)

**Permissions Required**: `delete_user`

**Request**:
```http
DELETE /api/admin/users/507f1f77bcf86cd799439011
Authorization: Bearer <admin_token>
```

**Response**:
```json
{
  "success": true,
  "message": "User deleted successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "isDeleted": true,
    "deletedAt": "2024-04-09T13:00:00.000Z",
    "deletedBy": "507f1f77bcf86cd799439999"
  }
}
```

---

### 7. Create Supervisor
**POST** `/api/admin/supervisors`

**Description**: Create a new supervisor account

**Permissions Required**: `manage_supervisors`

**Request Body**:
```json
{
  "name": "Jane Smith",
  "email": "jane@supervisor.com",
  "password": "Supervisor123!@#",
  "phone": "+1234567891",
  "address": "Supervisor Office"
}
```

**Request**:
```http
POST /api/admin/supervisors
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "name": "Jane Smith",
  "email": "jane@supervisor.com",
  "password": "Supervisor123!@#",
  "phone": "+1234567891",
  "address": "Supervisor Office"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Supervisor created successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439022",
    "name": "Jane Smith",
    "email": "jane@supervisor.com",
    "role": "supervisor",
    "isBlocked": false,
    "isDeleted": false,
    "createdAt": "2024-04-09T13:00:00.000Z"
  }
}
```

---

### 8. Delete Supervisor
**DELETE** `/api/admin/supervisors/:userId`

**Description**: Delete a supervisor account

**Permissions Required**: `manage_supervisors`

**Request**:
```http
DELETE /api/admin/supervisors/507f1f77bcf86cd799439022
Authorization: Bearer <admin_token>
```

**Response**:
```json
{
  "success": true,
  "message": "Supervisor deleted successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439022",
    "name": "Jane Smith",
    "isDeleted": true,
    "deletedAt": "2024-04-09T13:00:00.000Z",
    "deletedBy": "507f1f77bcf86cd799439999"
  }
}
```

---

### 9. Get All Supervisors
**GET** `/api/admin/supervisors`

**Description**: Get all supervisors in the system

**Permissions Required**: `read_supervisors`

**Query Parameters** (Optional):
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 10)
- `search` (string): Search by name or email

**Request**:
```http
GET /api/admin/supervisors?page=1&limit=10
Authorization: Bearer <admin_token>
```

**Response**:
```json
{
  "success": true,
  "data": {
    "supervisors": [
      {
        "_id": "507f1f77bcf86cd799439022",
        "name": "Jane Smith",
        "email": "jane@supervisor.com",
        "role": "supervisor",
        "isBlocked": false,
        "isDeleted": false,
        "createdAt": "2024-04-09T13:00:00.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 1,
      "totalSupervisors": 1,
      "hasNext": false,
      "hasPrev": false
    }
  }
}
```

---

### 10. Get Blocked Users
**GET** `/api/admin/blocked-users`

**Description**: Get all blocked users in the system

**Permissions Required**: `read_users`

**Query Parameters** (Optional):
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 10)
- `search` (string): Search by name or email
- `role` (string): Filter by role

**Request**:
```http
GET /api/admin/blocked-users?page=1&limit=10
Authorization: Bearer <admin_token>
```

**Response**:
```json
{
  "success": true,
  "data": {
    "blockedUsers": [
      {
        "_id": "507f1f77bcf86cd799439033",
        "name": "Bad User",
        "email": "bad@example.com",
        "role": "client",
        "isBlocked": true,
        "blockedAt": "2024-04-08T10:00:00.000Z",
        "blockedBy": "507f1f77bcf86cd799439999",
        "blockReason": "Violation of terms of service"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 1,
      "totalBlockedUsers": 1,
      "hasNext": false,
      "hasPrev": false
    }
  }
}
```

---

## Error Responses

### 401 Unauthorized
```json
{
  "success": false,
  "error": "Authentication required"
}
```

### 403 Forbidden
```json
{
  "success": false,
  "error": "Access denied. Insufficient permissions."
}
```

### 404 Not Found
```json
{
  "success": false,
  "error": "User not found"
}
```

### 400 Bad Request
```json
{
  "success": false,
  "error": "Validation error",
  "details": [
    {
      "field": "email",
      "message": "Email is required"
    }
  ]
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "error": "Internal server error"
}
```

---

## Permissions Guide

### Admin Permissions
- `read_dashboard` - Access admin dashboard
- `read_users` - View all users
- `read_user_details` - View specific user details
- `block_client` - Block/unblock users
- `delete_user` - Soft delete users
- `manage_supervisors` - Create/delete supervisors
- `read_supervisors` - View all supervisors

### Supervisor Permissions
- Limited subset of admin permissions
- Cannot manage other supervisors
- Cannot delete admin users

---

## Security Notes

1. **Privilege Escalation Prevention**: Admins cannot delete other admins
2. **Self-Management Prevention**: Users cannot block/delete themselves
3. **Soft Delete**: Users are soft deleted, not permanently removed
4. **Audit Trail**: All actions track who performed them (blockedBy, deletedBy)
5. **Token Validation**: All requests require valid JWT tokens

---

## Rate Limiting

- **Standard Endpoints**: 100 requests per hour
- **Sensitive Operations**: 50 requests per hour (block, delete, create supervisor)

---

## Usage Examples

### Complete User Management Flow

1. **List all users**:
```bash
curl -X GET "http://localhost:5000/api/admin/users" \
  -H "Authorization: Bearer <admin_token>"
```

2. **Block a user**:
```bash
curl -X POST "http://localhost:5000/api/admin/users/507f1f77bcf86cd799439011/block" \
  -H "Authorization: Bearer <admin_token>"
```

3. **View blocked users**:
```bash
curl -X GET "http://localhost:5000/api/admin/blocked-users" \
  -H "Authorization: Bearer <admin_token>"
```

4. **Unblock the user**:
```bash
curl -X POST "http://localhost:5000/api/admin/users/507f1f77bcf86cd799439011/unblock" \
  -H "Authorization: Bearer <admin_token>"
```

---

## Testing

Use the following admin credentials for testing:
```json
{
  "email": "admin@fitness.com",
  "password": "Admin123!@#"
}
```

Login endpoint: `POST /api/auth/login`

---

*Last Updated: April 2024*
