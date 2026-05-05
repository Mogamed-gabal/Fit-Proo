# Admin-Supervisor Permission System Guide

## 📋 Overview

This guide explains the complete permission system for Admin and Supervisor roles, including all endpoints, request/response formats, and workflows for managing supervisor permissions.

---

## 🎯 System Architecture

### **Permission Flow:**
```
Admin (Full Access) → Grant/Revoke Permissions → Supervisor (Limited Access)
```

### **Permission Levels:**
- **SYSTEM:** Full system access (Admin only)
- **LIMITED:** Restricted access (Supervisor assignable)
- **PERSONAL:** Self-management (Auto-assigned)

---

## 🔐 Admin Permission Management

### **1. View All Available Permissions**
```http
GET /api/permissions/all
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
        "isActive": true,
        "isAssignable": true
      },
      {
        "name": "read_users",
        "description": "Read user information and profiles",
        "category": "USER_MANAGEMENT",
        "action": "READ",
        "resource": "USERS",
        "level": "LIMITED",
        "isActive": true,
        "isAssignable": true
      }
      // ... 40 more permissions
    ],
    "count": 42,
    "filters": {
      "includeInactive": false
    }
  }
}
```

---

### **2. Grant Permission to Supervisor**
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
  "expiresAt": "2026-12-31T23:59:59.000Z",
  "reason": "Supervisor needs bundle management for Q4 project"
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
      "userId": "507f1f77bcf86cd799439011",
      "assignedBy": "507f1f77bcf86cd799439014",
      "assignedAt": "2026-05-05T10:00:00.000Z",
      "expiresAt": "2026-12-31T23:59:59.000Z",
      "isActive": true,
      "reason": "Supervisor needs bundle management for Q4 project"
    },
    "user": {
      "_id": "507f1f77bcf86cd799439011",
      "name": "John Supervisor",
      "email": "john@example.com",
      "role": "supervisor"
    }
  }
}
```

---

### **3. Revoke Permission from Supervisor**
```http
POST /api/permissions/revoke
Authorization: Bearer <admin_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "userId": "507f1f77bcf86cd799439011",
  "permissionName": "MANAGE_BUNDLES",
  "reason": "Project completed, no longer needed"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Permission MANAGE_BUNDLES revoked from user John Supervisor",
    "revokedAt": "2026-05-05T11:00:00.000Z",
    "revokedBy": {
      "_id": "507f1f77bcf86cd799439014",
      "name": "Admin User"
    }
  }
}
```

---

### **4. View Supervisor's Current Permissions**
```http
GET /api/permissions/user/507f1f77bcf86cd799439011
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
        "assignedAt": "2026-05-05T10:00:00.000Z",
        "expiresAt": "2026-12-31T23:59:59.000Z",
        "isActive": true,
        "assignedBy": {
          "_id": "507f1f77bcf86cd799439014",
          "name": "Admin User"
        }
      },
      {
        "_id": "507f1f77bcf86cd799439014",
        "name": "read_users",
        "assignedAt": "2026-05-04T15:00:00.000Z",
        "expiresAt": null,
        "isActive": true,
        "assignedBy": {
          "_id": "507f1f77bcf86cd799439014",
          "name": "Admin User"
        }
      }
    ],
    "totalPermissions": 2,
    "activePermissions": 2,
    "expiredPermissions": 0
  }
}
```

---

### **5. Get All Supervisors with Specific Permission**
```http
GET /api/permissions/users/MANAGE_BUNDLES
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
        "expiresAt": "2026-12-31T23:59:59.000Z",
        "isActive": true
      },
      {
        "_id": "507f1f77bcf86cd799439012",
        "name": "Jane Manager",
        "email": "jane@example.com",
        "role": "supervisor",
        "grantedAt": "2026-05-04T14:00:00.000Z",
        "grantedBy": "Admin User",
        "expiresAt": null,
        "isActive": true
      }
    ],
    "totalUsers": 2,
    "activeUsers": 2
  }
}
```

---

### **6. Check if Supervisor Has Permission**
```http
GET /api/permissions/check/507f1f77bcf86cd799011/MANAGE_BUNDLES
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
      "expiresAt": "2026-12-31T23:59:59.000Z",
      "isActive": true,
      "reason": "Supervisor needs bundle management for Q4 project"
    }
  }
}
```

---

### **7. Get Permission History**
```http
GET /api/permissions/history/507f1f77bcf86cd799439011?page=1&limit=20
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
        "reason": "Supervisor needs bundle management for Q4 project"
      },
      {
        "_id": "507f1f77bcf86cd799439014",
        "permissionName": "read_users",
        "action": "REVOKED",
        "performedBy": {
          "_id": "507f1f77bcf86cd799439014",
          "name": "Admin User"
        },
        "performedAt": "2026-05-04T16:00:00.000Z",
        "reason": "Role change - no longer needed"
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

## 👨‍💼 Available Permissions for Supervisors

### **📦 Bundle Management**
```json
{
  "name": "MANAGE_BUNDLES",
  "description": "Allow user to manage doctor bundles",
  "category": "BUNDLE_MANAGEMENT",
  "level": "SYSTEM",
  "isAssignable": true,
  "endpoints": [
    "POST /api/bundles",
    "PUT /api/bundles/:id",
    "PATCH /api/bundles/:id/deactivate"
  ]
}
```

### **👥 User Management (Limited)**
```json
{
  "name": "read_users",
  "description": "Read user information and profiles",
  "category": "USER_MANAGEMENT",
  "level": "LIMITED",
  "isAssignable": true
},
{
  "name": "read_dashboard",
  "description": "Access main dashboard",
  "category": "USER_MANAGEMENT",
  "level": "LIMITED",
  "isAssignable": true
},
{
  "name": "block_client",
  "description": "Block client accounts",
  "category": "USER_MANAGEMENT",
  "level": "LIMITED",
  "isAssignable": true
},
{
  "name": "unblock_client",
  "description": "Unblock client accounts",
  "category": "USER_MANAGEMENT",
  "level": "LIMITED",
  "isAssignable": true
}
```

### **📊 Audit Management**
```json
{
  "name": "read_audit_logs",
  "description": "Read system audit logs",
  "category": "USER_MANAGEMENT",
  "level": "LIMITED",
  "isAssignable": true
}
```

---

## 🔄 Complete Workflow Example

### **Step 1: Admin Views Available Permissions**
```javascript
// Frontend call
const response = await fetch('/api/permissions/all', {
  headers: { 'Authorization': `Bearer ${adminToken}` }
});

const permissions = response.data.permissions;
// Filter for assignable permissions
const assignablePerms = permissions.filter(p => p.isAssignable && p.level !== 'PERSONAL');
```

### **Step 2: Admin Grants Permission to Supervisor**
```javascript
const grantPermission = async (supervisorId, permissionName) => {
  const response = await fetch('/api/permissions/grant', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${adminToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      userId: supervisorId,
      permissionName,
      reason: 'Project requirement'
    })
  });
  
  return response.json();
};

// Grant bundle management
await grantPermission('supervisor_123', 'MANAGE_BUNDLES');
```

### **Step 3: Supervisor Uses Permission**
```javascript
// Supervisor can now access bundle endpoints
const bundles = await fetch('/api/bundles', {
  headers: { 'Authorization': `Bearer ${supervisorToken}` }
});
```

### **Step 4: Admin Checks Supervisor's Permissions**
```javascript
const checkPermissions = async (supervisorId) => {
  const response = await fetch(`/api/permissions/user/${supervisorId}`, {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  
  return response.json();
};

const supervisorPerms = await checkPermissions('supervisor_123');
console.log(supervisorPerms.data.permissions);
```

### **Step 5: Admin Revokes Permission**
```javascript
const revokePermission = async (supervisorId, permissionName) => {
  const response = await fetch('/api/permissions/revoke', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${adminToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      userId: supervisorId,
      permissionName,
      reason: 'Project completed'
    })
  });
  
  return response.json();
};

await revokePermission('supervisor_123', 'MANAGE_BUNDLES');
```

---

## 🎯 Frontend Implementation Guide

### **React Component Example:**
```jsx
import React, { useState, useEffect } from 'react';

const SupervisorPermissionManager = () => {
  const [supervisors, setSupervisors] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [selectedSupervisor, setSelectedSupervisor] = useState(null);

  useEffect(() => {
    loadPermissions();
    loadSupervisors();
  }, []);

  const loadPermissions = async () => {
    const response = await fetch('/api/permissions/all', {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const data = await response.json();
    setPermissions(data.data.permissions.filter(p => p.isAssignable));
  };

  const grantPermission = async (permissionName) => {
    const response = await fetch('/api/permissions/grant', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userId: selectedSupervisor._id,
        permissionName,
        reason: 'Granted via admin panel'
      })
    });

    if (response.data.success) {
      loadSupervisorPermissions();
    }
  };

  const revokePermission = async (permissionName) => {
    const response = await fetch('/api/permissions/revoke', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userId: selectedSupervisor._id,
        permissionName,
        reason: 'Revoked via admin panel'
      })
    });

    if (response.data.success) {
      loadSupervisorPermissions();
    }
  };

  return (
    <div className="permission-manager">
      <h2>Supervisor Permission Management</h2>
      
      {/* Supervisor Selection */}
      <select onChange={(e) => setSelectedSupervisor(e.target.value)}>
        <option value="">Select Supervisor</option>
        {supervisors.map(supervisor => (
          <option key={supervisor._id} value={supervisor._id}>
            {supervisor.name}
          </option>
        ))}
      </select>

      {/* Available Permissions */}
      <div className="permissions-grid">
        {permissions.map(permission => (
          <div key={permission.name} className="permission-card">
            <h4>{permission.name}</h4>
            <p>{permission.description}</p>
            <span className="category">{permission.category}</span>
            <span className="level">{permission.level}</span>
            
            <div className="actions">
              <button onClick={() => grantPermission(permission.name)}>
                Grant
              </button>
              <button onClick={() => revokePermission(permission.name)}>
                Revoke
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
```

---

## ⚠️ Error Handling

### **Common Error Responses:**

#### **Unauthorized:**
```json
{
  "success": false,
  "error": "Unauthorized: Admin access required",
  "timestamp": "2026-05-05T10:00:00.000Z"
}
```

#### **Permission Not Found:**
```json
{
  "success": false,
  "error": "Permission not found: INVALID_PERMISSION",
  "timestamp": "2026-05-05T10:00:00.000Z"
}
```

#### **User Not Found:**
```json
{
  "success": false,
  "error": "User not found",
  "timestamp": "2026-05-05T10:00:00.000Z"
}
```

#### **Already Granted:**
```json
{
  "success": false,
  "error": "Permission already granted to user",
  "timestamp": "2026-05-05T10:00:00.000Z"
}
```

---

## 📋 Quick Reference

| Action | Endpoint | Method | Required | Admin Only |
|--------|----------|--------|----------|-----------|
| View All Permissions | `/api/permissions/all` | GET | - | ✅ |
| Grant Permission | `/api/permissions/grant` | POST | userId, permissionName | ✅ |
| Revoke Permission | `/api/permissions/revoke` | POST | userId, permissionName | ✅ |
| View User Permissions | `/api/permissions/user/:userId` | GET | userId | ✅ |
| Check Permission | `/api/permissions/check/:userId/:permissionName` | GET | userId, permissionName | ✅ |
| Get Permission History | `/api/permissions/history/:userId` | GET | userId | ✅ |
| Get Users with Permission | `/api/permissions/users/:permissionName` | GET | permissionName | ✅ |

---

## 🎯 Best Practices

### **✅ Admin Side:**
1. **Review before granting** - Check supervisor's role and responsibilities
2. **Set expiration dates** - For temporary permissions
3. **Document reasons** - Always provide clear reasons for grants/revokes
4. **Regular audits** - Review permission assignments monthly

### **✅ Supervisor Side:**
1. **Request permissions** - Clearly explain need and duration
2. **Use permissions responsibly** - Only access what's necessary
3. **Report issues** - Notify admin of permission problems

### **✅ Security:**
1. **Principle of least privilege** - Grant minimum necessary permissions
2. **Time-limited access** - Set expiration dates for temporary needs
3. **Regular cleanup** - Revoke unused permissions
4. **Audit trails** - Monitor permission usage

---

**This system provides secure, auditable, and flexible permission management for admin-supervisor workflows!** 🎯
