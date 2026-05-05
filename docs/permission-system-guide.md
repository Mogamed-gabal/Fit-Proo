# Permission System Guide

## 📋 Overview

The permission system allows admins to grant specific permissions to users (supervisors) to perform special actions that are normally restricted to admin roles.

---

## 🔐 Permission Management Endpoints

### **1. Grant Permission to User**
```http
POST /api/permissions/grant
Authorization: Bearer <admin_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "userId": "507f1f77bcf86cd799439011",
  "permissionName": "MANAGE_BUNDLES",
  "description": "Allow user to manage doctor bundles"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "permission": {
      "_id": "507f1f77bcf86cd799439013",
      "name": "MANAGE_BUNDLES",
      "description": "Allow user to manage doctor bundles",
      "category": "BUNDLE_MANAGEMENT",
      "action": "MANAGE",
      "resource": "BUNDLES",
      "level": "SYSTEM",
      "isActive": true,
      "grantedTo": {
        "_id": "507f1f77bcf86cd799439011",
        "name": "John Supervisor",
        "email": "john@example.com",
        "role": "supervisor"
      },
      "grantedBy": {
        "_id": "507f1f77bcf86cd799439014",
        "name": "Admin User",
        "email": "admin@example.com"
      },
      "grantedAt": "2026-05-05T10:00:00.000Z",
      "expiresAt": null
    }
  }
}
```

---

### **2. Revoke Permission from User**
```http
DELETE /api/permissions/revoke/:userId/:permissionName
Authorization: Bearer <admin_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Permission MANAGE_BUNDLES revoked from user John Supervisor",
    "revokedAt": "2026-05-05T10:30:00.000Z"
  }
}
```

---

### **3. Get User Permissions**
```http
GET /api/permissions/user/:userId
Authorization: Bearer <admin_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "507f1f77bcf86cd799439011",
      "name": "John Supervisor",
      "email": "john@example.com",
      "role": "supervisor"
    },
    "permissions": [
      {
        "_id": "507f1f77bcf86cd799439013",
        "name": "MANAGE_BUNDLES",
        "description": "Allow user to manage doctor bundles",
        "category": "BUNDLE_MANAGEMENT",
        "action": "MANAGE",
        "resource": "BUNDLES",
        "level": "SYSTEM",
        "isActive": true,
        "grantedAt": "2026-05-05T10:00:00.000Z",
        "expiresAt": null
      },
      {
        "_id": "507f1f77bcf86cd799439014",
        "name": "MANAGE_DIET_PLANS",
        "description": "Allow user to manage diet plans",
        "category": "DIET_MANAGEMENT",
        "action": "MANAGE",
        "resource": "DIET_PLANS",
        "level": "SYSTEM",
        "isActive": true,
        "grantedAt": "2026-05-04T15:00:00.000Z",
        "expiresAt": null
      }
    ],
    "totalPermissions": 2,
    "activePermissions": 2
  }
}
```

---

### **4. Get All Available Permissions**
```http
GET /api/permissions/available
Authorization: Bearer <admin_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "permissions": [
      {
        "name": "MANAGE_BUNDLES",
        "description": "Allow user to manage doctor bundles",
        "category": "BUNDLE_MANAGEMENT",
        "action": "MANAGE",
        "resource": "BUNDLES",
        "level": "SYSTEM",
        "isAssignable": true
      },
      {
        "name": "MANAGE_DIET_PLANS",
        "description": "Allow user to manage diet plans",
        "category": "DIET_MANAGEMENT",
        "action": "MANAGE",
        "resource": "DIET_PLANS",
        "level": "SYSTEM",
        "isAssignable": true
      },
      {
        "name": "MANAGE_WORKOUT_PLANS",
        "description": "Allow user to manage workout plans",
        "category": "WORKOUT_MANAGEMENT",
        "action": "MANAGE",
        "resource": "WORKOUT_PLANS",
        "level": "SYSTEM",
        "isAssignable": true
      },
      {
        "name": "VIEW_AUDIT_LOGS",
        "description": "Allow user to view audit logs",
        "category": "AUDIT_MANAGEMENT",
        "action": "VIEW",
        "resource": "AUDIT_LOGS",
        "level": "SYSTEM",
        "isAssignable": true
      },
      {
        "name": "MANAGE_USERS_LIMITED",
        "description": "Allow user to manage users with limited access",
        "category": "USER_MANAGEMENT",
        "action": "MANAGE",
        "resource": "USERS",
        "level": "LIMITED",
        "isAssignable": true
      }
    ],
    "totalPermissions": 5,
    "categories": [
      "BUNDLE_MANAGEMENT",
      "DIET_MANAGEMENT", 
      "WORKOUT_MANAGEMENT",
      "AUDIT_MANAGEMENT",
      "USER_MANAGEMENT"
    ]
  }
}
```

---

### **5. Get Users with Specific Permission**
```http
GET /api/permissions/users/:permissionName
Authorization: Bearer <admin_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "permission": "MANAGE_BUNDLES",
    "users": [
      {
        "_id": "507f1f77bcf86cd799439011",
        "name": "John Supervisor",
        "email": "john@example.com",
        "role": "supervisor",
        "grantedAt": "2026-05-05T10:00:00.000Z",
        "grantedBy": "Admin User",
        "isActive": true
      },
      {
        "_id": "507f1f77bcf86cd799439012",
        "name": "Jane Manager",
        "email": "jane@example.com",
        "role": "supervisor",
        "grantedAt": "2026-05-04T14:00:00.000Z",
        "grantedBy": "Admin User",
        "isActive": true
      }
    ],
    "totalUsers": 2,
    "activeUsers": 2
  }
}
```

---

### **6. Check User Permission**
```http
GET /api/permissions/check/:userId/:permissionName
Authorization: Bearer <admin_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "userId": "507f1f77bcf86cd799439011",
    "permissionName": "MANAGE_BUNDLES",
    "hasPermission": true,
    "permissionDetails": {
      "_id": "507f1f77bcf86cd799439013",
      "grantedAt": "2026-05-05T10:00:00.000Z",
      "grantedBy": "Admin User",
      "expiresAt": null,
      "isActive": true
    }
  }
}
```

---

### **7. Get Permission History**
```http
GET /api/permissions/history/:userId
Authorization: Bearer <admin_token>
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Records per page (default: 20)
- `action` (optional): Filter by action (GRANTED, REVOKED)

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "507f1f77bcf86cd799439011",
      "name": "John Supervisor",
      "email": "john@example.com"
    },
    "history": [
      {
        "_id": "507f1f77bcf86cd799439013",
        "permissionName": "MANAGE_BUNDLES",
        "action": "GRANTED",
        "performedBy": {
          "_id": "507f1f77bcf86cd799439014",
          "name": "Admin User"
        },
        "performedAt": "2026-05-05T10:00:00.000Z",
        "description": "Permission granted via admin panel"
      },
      {
        "_id": "507f1f77bcf86cd799439014",
        "permissionName": "MANAGE_DIET_PLANS",
        "action": "REVOKED",
        "performedBy": {
          "_id": "507f1f77bcf86cd799439014",
          "name": "Admin User"
        },
        "performedAt": "2026-05-04T16:00:00.000Z",
        "description": "Permission revoked due to role change"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 15,
      "pages": 1
    },
    "summary": {
      "totalActions": 15,
      "grantedCount": 8,
      "revokedCount": 7
    }
  }
}
```

---

## 🎯 Available Permissions List

### **📦 Bundle Management**
- **MANAGE_BUNDLES** - Create, update, deactivate bundles

### **🥗 Diet Management**
- **MANAGE_DIET_PLANS** - Create, update, delete diet plans

### **💪 Workout Management**
- **MANAGE_WORKOUT_PLANS** - Create, update, delete workout plans
- **MANAGE_WORKOUT_TEMPLATES** - Manage workout templates

### **👥 User Management**
- **MANAGE_USERS_LIMITED** - Limited user management
- **BLOCK_CLIENT** - Block/unblock clients
- **VIEW_DELETED_USERS** - View deleted users

### **📊 Audit & Monitoring**
- **VIEW_AUDIT_LOGS** - View system audit logs
- **READ_SUPERVISOR_AUDIT** - Read supervisor audit logs
- **EXPORT_SUPERVISOR_AUDIT** - Export audit data

### **💳 Subscription Management**
- **READ_SUBSCRIPTIONS** - View subscription information
- **MANAGE_SUBSCRIPTIONS** - Manage user subscriptions

### **🔐 System Administration**
- **MANAGE_PERMISSIONS** - Grant/revoke permissions
- **READ_PERMISSIONS** - View permission assignments
- **RESTORE_DELETED_USERS** - Restore deleted users

---

## 🔐 Permission Levels

### **SYSTEM Level**
- Full system access for specific resource
- Can affect all users and data
- Requires admin approval

### **LIMITED Level**
- Restricted access within scope
- Cannot affect system-wide settings
- Safer for supervisor roles

---

## ⚠️ Error Responses

### **Unauthorized**
```json
{
  "success": false,
  "error": "Unauthorized: Admin access required",
  "timestamp": "2026-05-05T10:00:00.000Z"
}
```

### **Permission Not Found**
```json
{
  "success": false,
  "error": "Permission not found: INVALID_PERMISSION",
  "timestamp": "2026-05-05T10:00:00.000Z"
}
```

### **User Not Found**
```json
{
  "success": false,
  "error": "User not found",
  "timestamp": "2026-05-05T10:00:00.000Z"
}
```

### **Permission Already Granted**
```json
{
  "success": false,
  "error": "Permission already granted to user",
  "timestamp": "2026-05-05T10:00:00.000Z"
}
```

---

## 🚀 Usage Examples

### **Grant Bundle Management Permission**
```javascript
const grantPermission = async (userId, permissionName) => {
  const response = await fetch('/api/permissions/grant', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${adminToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      userId,
      permissionName,
      description: `Grant ${permissionName} permission`
    })
  });
  
  return response.json();
};

// Usage
const result = await grantPermission(
  '507f1f77bcf86cd799439011',
  'MANAGE_BUNDLES'
);
```

### **Check User Permissions**
```javascript
const checkPermission = async (userId, permissionName) => {
  const response = await fetch(`/api/permissions/check/${userId}/${permissionName}`, {
    headers: {
      'Authorization': `Bearer ${adminToken}`
    }
  });
  
  return response.json();
};

// Usage
const canManageBundles = await checkPermission(
  '507f1f77bcf86cd799439011',
  'MANAGE_BUNDLES'
);

if (canManageBundles.data.hasPermission) {
  console.log('User can manage bundles');
}
```

---

## 📋 Quick Reference

| Endpoint | Method | Purpose | Admin Only |
|----------|--------|---------|------------|
| `/api/permissions/grant` | POST | Grant permission | ✅ |
| `/api/permissions/revoke/:userId/:permissionName` | DELETE | Revoke permission | ✅ |
| `/api/permissions/user/:userId` | GET | Get user permissions | ✅ |
| `/api/permissions/available` | GET | List available permissions | ✅ |
| `/api/permissions/users/:permissionName` | GET | Get users with permission | ✅ |
| `/api/permissions/check/:userId/:permissionName` | GET | Check specific permission | ✅ |
| `/api/permissions/history/:userId` | GET | Get permission history | ✅ |

---

## 🎯 Key Features

- **Granular Control** - Grant specific permissions to specific users
- **Audit Trail** - Complete history of permission changes
- **Expiration Support** - Permissions can have expiration dates
- **Category Organization** - Permissions grouped by functional areas
- **Permission Levels** - SYSTEM and LIMITED access levels
- **User-Friendly** - Clear descriptions and names

---

**This permission system gives admins fine-grained control over what supervisors and other users can do in the system.**
