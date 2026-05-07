# Permission System API - Frontend Developer Guide

## 📋 Overview

Complete guide to all permission system endpoints for frontend developers, including request/response formats, error handling, authentication requirements, and implementation examples.

---

## 🔐 Authentication & Authorization

### **✅ Required Headers:**
```http
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

### **✅ Token Format:**
```javascript
const token = localStorage.getItem('token');
// JWT token must be valid and not expired
```

### **✅ Common Error Patterns:**
```javascript
// 401 Unauthorized
{
  "success": false,
  "error": "Authentication required"
}

// 403 Forbidden  
{
  "success": false,
  "error": "Insufficient permissions"
}
```

---

## 🚀 Permission Endpoints

### **✅ 1. Get All Permissions**

#### **Endpoint:** `GET /api/permissions`

#### **Purpose:** Retrieve all available permissions in the system

#### **Authentication:** Required
#### **Permission:** `READ_PERMISSIONS` (optional - some endpoints allow all authenticated users)

#### **✅ Request:**
```javascript
const response = await fetch('/api/permissions', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});
```

#### **✅ Success Response (200):**
```json
{
  "success": true,
  "data": {
    "permissions": [
      {
        "_id": "507f1f77bcf86cd799439011",
        "name": "manage_users",
        "description": "Manage user accounts",
        "category": "USER_MANAGEMENT",
        "action": "MANAGE",
        "resource": "USERS",
        "level": "ADMIN",
        "icon": "users",
        "isActive": true,
        "createdAt": "2026-05-01T10:00:00.000Z",
        "updatedAt": "2026-05-01T10:00:00.000Z"
      },
      {
        "_id": "507f1f77bcf86cd799439012",
        "name": "view_client_workout_plans",
        "description": "View client workout plans",
        "category": "CLIENT_MANAGEMENT",
        "action": "READ",
        "resource": "WORKOUT_PLANS",
        "level": "PERSONAL",
        "icon": "dumbbell",
        "isActive": true,
        "createdAt": "2026-05-01T10:00:00.000Z",
        "updatedAt": "2026-05-01T10:00:00.000Z"
      }
    ],
    "total": 45,
    "categories": [
      "USER_MANAGEMENT",
      "CLIENT_MANAGEMENT", 
      "BUNDLE_MANAGEMENT",
      "SYSTEM_ADMINISTRATION"
    ],
    "levels": ["SYSTEM", "ADMIN", "LIMITED", "PERSONAL"]
  }
}
```

#### **❌ Error Responses:**
```json
// 401 Unauthorized
{
  "success": false,
  "error": "Authentication required"
}

// 403 Forbidden
{
  "success": false,
  "error": "Insufficient permissions to read permissions"
}

// 500 Server Error
{
  "success": false,
  "error": "Internal server error"
}
```

---

### **✅ 2. Get User Permissions**

#### **Endpoint:** `GET /api/permissions/user/:userId`

#### **Purpose:** Get all permissions assigned to a specific user

#### **Authentication:** Required
#### **Permission:** `READ_USER_PERMISSIONS` or own user permissions

#### **✅ Request:**
```javascript
const userId = '507f1f77bcf86cd799439014';
const response = await fetch(`/api/permissions/user/${userId}`, {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});
```

#### **✅ Success Response (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "507f1f77bcf86cd799439014",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "supervisor"
    },
    "permissions": [
      {
        "_id": "507f1f77bcf86cd799439011",
        "name": "manage_users",
        "description": "Manage user accounts",
        "category": "USER_MANAGEMENT",
        "action": "MANAGE",
        "resource": "USERS",
        "level": "ADMIN",
        "assignedAt": "2026-05-01T10:00:00.000Z",
        "assignedBy": {
          "_id": "507f1f77bcf86cd799439013",
          "name": "Admin User"
        }
      }
    ],
    "effectivePermissions": [
      "manage_users",
      "view_client_workout_plans",
      "create_bundles"
    ],
    "permissionSummary": {
      "total": 15,
      "byCategory": {
        "USER_MANAGEMENT": 3,
        "CLIENT_MANAGEMENT": 5,
        "BUNDLE_MANAGEMENT": 2,
        "SYSTEM_ADMINISTRATION": 5
      },
      "byLevel": {
        "SYSTEM": 2,
        "ADMIN": 8,
        "LIMITED": 3,
        "PERSONAL": 2
      }
    }
  }
}
```

#### **❌ Error Responses:**
```json
// 404 User Not Found
{
  "success": false,
  "error": "User not found"
}

// 403 Forbidden
{
  "success": false,
  "error": "Cannot access permissions for this user"
}
```

---

### **✅ 3. Grant Permission to User**

#### **Endpoint:** `POST /api/permissions/grant`

#### **Purpose:** Grant a specific permission to a user

#### **Authentication:** Required
#### **Permission:** `GRANT_PERMISSIONS`

#### **✅ Request Body:**
```json
{
  "userId": "507f1f77bcf86cd799439014",
  "permissionName": "manage_users",
  "reason": "User needs to manage client accounts"
}
```

#### **✅ Request Implementation:**
```javascript
const grantPermission = async (userId, permissionName, reason) => {
  const response = await fetch('/api/permissions/grant', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      userId,
      permissionName,
      reason
    })
  });
  
  return await response.json();
};
```

#### **✅ Success Response (201):**
```json
{
  "success": true,
  "message": "Permission granted successfully",
  "data": {
    "permission": {
      "_id": "507f1f77bcf86cd799439020",
      "name": "manage_users",
      "description": "Manage user accounts",
      "category": "USER_MANAGEMENT",
      "action": "MANAGE",
      "resource": "USERS",
      "level": "ADMIN",
      "assignedTo": "507f1f77bcf86cd799439014",
      "assignedBy": "507f1f77bcf86cd799439013",
      "assignedAt": "2026-05-05T12:00:00.000Z",
      "reason": "User needs to manage client accounts",
      "isActive": true
    },
    "user": {
      "_id": "507f1f77bcf86cd799439014",
      "name": "John Doe",
      "email": "john@example.com"
    }
  }
}
```

#### **❌ Error Responses:**
```json
// 400 Validation Error
{
  "success": false,
  "error": "User ID and permission name are required"
}

// 404 Permission Not Found
{
  "success": false,
  "error": "Permission not found: invalid_permission"
}

// 404 User Not Found
{
  "success": false,
  "error": "User not found"
}

// 409 Already Granted
{
  "success": false,
  "error": "Permission already granted to this user"
}

// 403 Forbidden
{
  "success": false,
  "error": "Insufficient permissions to grant permissions"
}
```

---

### **✅ 4. Grant Multiple Permissions**

#### **Endpoint:** `POST /api/permissions/grant-multiple`

#### **Purpose:** Grant multiple permissions to a user at once

#### **Authentication:** Required
#### **Permission:** `GRANT_PERMISSIONS`

#### **✅ Request Body:**
```json
{
  "userId": "507f1f77bcf86cd799439014",
  "permissions": [
    {
      "name": "manage_users",
      "reason": "User needs to manage client accounts"
    },
    {
      "name": "view_client_workout_plans", 
      "reason": "User needs to access workout plans"
    },
    {
      "name": "create_bundles",
      "reason": "User needs to create service bundles"
    }
  ]
}
```

#### **✅ Request Implementation:**
```javascript
const grantMultiplePermissions = async (userId, permissions) => {
  const response = await fetch('/api/permissions/grant-multiple', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      userId,
      permissions
    })
  });
  
  return await response.json();
};
```

#### **✅ Success Response (201):**
```json
{
  "success": true,
  "message": "Permissions processed successfully",
  "data": {
    "summary": {
      "total": 3,
      "granted": 2,
      "skipped": 1,
      "failed": 0
    },
    "results": [
      {
        "permission": "manage_users",
        "status": "granted",
        "message": "Permission granted successfully",
        "data": {
          "_id": "507f1f77bcf86cd799439020",
          "assignedAt": "2026-05-05T12:00:00.000Z"
        }
      },
      {
        "permission": "view_client_workout_plans",
        "status": "granted", 
        "message": "Permission granted successfully",
        "data": {
          "_id": "507f1f77bcf86cd799439021",
          "assignedAt": "2026-05-05T12:00:00.000Z"
        }
      },
      {
        "permission": "create_bundles",
        "status": "skipped",
        "message": "Permission already granted to this user",
        "data": null
      }
    ],
    "user": {
      "_id": "507f1f77bcf86cd799439014",
      "name": "John Doe",
      "email": "john@example.com"
    }
  }
}
```

#### **❌ Error Responses:**
```json
// 400 Validation Error
{
  "success": false,
  "error": "User ID and permissions array are required"
}

// 400 Invalid Permissions Array
{
  "success": false,
  "error": "Permissions must be a non-empty array"
}

// 400 Invalid Permission Format
{
  "success": false,
  "error": "Each permission must have name and reason"
}
```

---

### **✅ 5. Revoke Permission**

#### **Endpoint:** `DELETE /api/permissions/revoke`

#### **Purpose:** Revoke a specific permission from a user

#### **Authentication:** Required
#### **Permission:** `REVOKE_PERMISSIONS`

#### **✅ Request Body:**
```json
{
  "userId": "507f1f77bcf86cd799439014",
  "permissionName": "manage_users",
  "reason": "User role changed, no longer needs this permission"
}
```

#### **✅ Request Implementation:**
```javascript
const revokePermission = async (userId, permissionName, reason) => {
  const response = await fetch('/api/permissions/revoke', {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      userId,
      permissionName,
      reason
    })
  });
  
  return await response.json();
};
```

#### **✅ Success Response (200):**
```json
{
  "success": true,
  "message": "Permission revoked successfully",
  "data": {
    "revokedPermission": {
      "_id": "507f1f77bcf86cd799439020",
      "name": "manage_users",
      "description": "Manage user accounts",
      "category": "USER_MANAGEMENT",
      "action": "MANAGE",
      "resource": "USERS",
      "level": "ADMIN",
      "assignedTo": "507f1f77bcf86cd799439014",
      "assignedBy": "507f1f77bcf86cd799439013",
      "assignedAt": "2026-05-01T10:00:00.000Z",
      "revokedAt": "2026-05-05T12:00:00.000Z",
      "revokedBy": "507f1f77bcf86cd799439013",
      "revocationReason": "User role changed, no longer needs this permission"
    },
    "user": {
      "_id": "507f1f77bcf86cd799439014",
      "name": "John Doe",
      "email": "john@example.com"
    }
  }
}
```

#### **❌ Error Responses:**
```json
// 400 Validation Error
{
  "success": false,
  "error": "User ID and permission name are required"
}

// 404 Permission Not Found
{
  "success": false,
  "error": "Permission assignment not found"
}

// 404 User Not Found
{
  "success": false,
  "error": "User not found"
}
```

---

### **✅ 6. Check User Permission**

#### **Endpoint:** `POST /api/permissions/check`

#### **Purpose:** Check if a user has a specific permission

#### **Authentication:** Required
#### **Permission:** `CHECK_PERMISSIONS` (or own user permissions)

#### **✅ Request Body:**
```json
{
  "userId": "507f1f77bcf86cd799439014",
  "permissionName": "manage_users"
}
```

#### **✅ Request Implementation:**
```javascript
const checkPermission = async (userId, permissionName) => {
  const response = await fetch('/api/permissions/check', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      userId,
      permissionName
    })
  });
  
  return await response.json();
};
```

#### **✅ Success Response (200):**
```json
{
  "success": true,
  "data": {
    "hasPermission": true,
    "permission": {
      "name": "manage_users",
      "description": "Manage user accounts",
      "category": "USER_MANAGEMENT",
      "action": "MANAGE",
      "resource": "USERS",
      "level": "ADMIN"
    },
    "user": {
      "_id": "507f1f77bcf86cd799439014",
      "name": "John Doe",
      "role": "supervisor"
    },
    "assignment": {
      "assignedAt": "2026-05-01T10:00:00.000Z",
      "assignedBy": {
        "_id": "507f1f77bcf86cd799439013",
        "name": "Admin User"
      },
      "reason": "User needs to manage client accounts"
    }
  }
}
```

#### **✅ No Permission Response (200):**
```json
{
  "success": true,
  "data": {
    "hasPermission": false,
    "permission": {
      "name": "manage_users",
      "description": "Manage user accounts",
      "category": "USER_MANAGEMENT",
      "action": "MANAGE",
      "resource": "USERS",
      "level": "ADMIN"
    },
    "user": {
      "_id": "507f1f77bcf86cd799439014",
      "name": "John Doe",
      "role": "supervisor"
    },
    "assignment": null
  }
}
```

#### **❌ Error Responses:**
```json
// 400 Validation Error
{
  "success": false,
  "error": "User ID and permission name are required"
}

// 404 Permission Not Found
{
  "success": false,
  "error": "Permission not found: invalid_permission"
}

// 404 User Not Found
{
  "success": false,
  "error": "User not found"
}
```

---

### **✅ 7. Get Permissions by Category**

#### **Endpoint:** `GET /api/permissions/category/:category`

#### **Purpose:** Get all permissions in a specific category

#### **Authentication:** Required
#### **Permission:** `READ_PERMISSIONS`

#### **✅ Request:**
```javascript
const category = 'USER_MANAGEMENT';
const response = await fetch(`/api/permissions/category/${category}`, {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});
```

#### **✅ Success Response (200):**
```json
{
  "success": true,
  "data": {
    "category": "USER_MANAGEMENT",
    "permissions": [
      {
        "_id": "507f1f77bcf86cd799439011",
        "name": "manage_users",
        "description": "Manage user accounts",
        "action": "MANAGE",
        "resource": "USERS",
        "level": "ADMIN",
        "icon": "users"
      },
      {
        "_id": "507f1f77bcf86cd799439012",
        "name": "view_user_details",
        "description": "View detailed user information",
        "action": "READ",
        "resource": "USERS",
        "level": "LIMITED",
        "icon": "eye"
      }
    ],
    "total": 8
  }
}
```

#### **❌ Error Responses:**
```json
// 404 Category Not Found
{
  "success": false,
  "error": "Category not found: INVALID_CATEGORY"
}

// 403 Forbidden
{
  "success": false,
  "error": "Insufficient permissions to read permissions"
}
```

---

### **✅ 8. Get Permissions by Level**

#### **Endpoint:** `GET /api/permissions/level/:level`

#### **Purpose:** Get all permissions at a specific level

#### **Authentication:** Required
#### **Permission:** `READ_PERMISSIONS`

#### **✅ Request:**
```javascript
const level = 'ADMIN';
const response = await fetch(`/api/permissions/level/${level}`, {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});
```

#### **✅ Success Response (200):**
```json
{
  "success": true,
  "data": {
    "level": "ADMIN",
    "permissions": [
      {
        "_id": "507f1f77bcf86cd799439011",
        "name": "manage_users",
        "description": "Manage user accounts",
        "category": "USER_MANAGEMENT",
        "action": "MANAGE",
        "resource": "USERS",
        "icon": "users"
      }
    ],
    "total": 12
  }
}
```

#### **❌ Error Responses:**
```json
// 404 Level Not Found
{
  "success": false,
  "error": "Level not found: INVALID_LEVEL"
}

// 403 Forbidden
{
  "success": false,
  "error": "Insufficient permissions to read permissions"
}
```

---

## 🎯 Frontend Implementation Examples

### **✅ React Hook for Permissions:**
```javascript
import { useState, useEffect } from 'react';

export const usePermissions = (userId) => {
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPermissions = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/permissions/user/${userId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        const result = await response.json();

        if (result.success) {
          setPermissions(result.data.permissions);
        } else {
          setError(result.error);
        }
      } catch (err) {
        setError('Failed to fetch permissions');
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchPermissions();
    }
  }, [userId]);

  const hasPermission = (permissionName) => {
    return permissions.some(p => p.name === permissionName);
  };

  return {
    permissions,
    loading,
    error,
    hasPermission
  };
};

// Usage
const UserProfile = ({ userId }) => {
  const { permissions, loading, error, hasPermission } = usePermissions(userId);

  if (loading) return <div>Loading permissions...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h2>User Permissions</h2>
      {hasPermission('manage_users') && (
        <button>Manage Users</button>
      )}
      {hasPermission('view_client_workout_plans') && (
        <button>View Workout Plans</button>
      )}
    </div>
  );
};
```

### **✅ Permission Management Component:**
```javascript
import React, { useState } from 'react';

const PermissionManager = ({ userId }) => {
  const [availablePermissions, setAvailablePermissions] = useState([]);
  const [userPermissions, setUserPermissions] = useState([]);
  const [selectedPermissions, setSelectedPermissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchAvailablePermissions();
    fetchUserPermissions();
  }, [userId]);

  const fetchAvailablePermissions = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/permissions', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const result = await response.json();
      if (result.success) {
        setAvailablePermissions(result.data.permissions);
      }
    } catch (error) {
      setMessage('Failed to fetch permissions');
    }
  };

  const fetchUserPermissions = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/permissions/user/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const result = await response.json();
      if (result.success) {
        setUserPermissions(result.data.permissions);
      }
    } catch (error) {
      setMessage('Failed to fetch user permissions');
    }
  };

  const grantPermissions = async () => {
    if (selectedPermissions.length === 0) {
      setMessage('Please select permissions to grant');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const permissions = selectedPermissions.map(name => ({
        name,
        reason: 'Granted via permission management interface'
      }));

      const response = await fetch('/api/permissions/grant-multiple', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId,
          permissions
        })
      });

      const result = await response.json();

      if (result.success) {
        setMessage(`Successfully granted ${result.data.summary.granted} permissions`);
        setSelectedPermissions([]);
        fetchUserPermissions();
      } else {
        setMessage(result.error);
      }
    } catch (error) {
      setMessage('Failed to grant permissions');
    } finally {
      setLoading(false);
    }
  };

  const revokePermission = async (permissionName) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/permissions/revoke', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId,
          permissionName,
          reason: 'Revoked via permission management interface'
        })
      });

      const result = await response.json();

      if (result.success) {
        setMessage('Permission revoked successfully');
        fetchUserPermissions();
      } else {
        setMessage(result.error);
      }
    } catch (error) {
      setMessage('Failed to revoke permission');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="permission-manager">
      <h3>Permission Management</h3>
      
      {message && <div className="alert">{message}</div>}

      <div className="available-permissions">
        <h4>Available Permissions</h4>
        <div className="permission-list">
          {availablePermissions.map(permission => (
            <label key={permission._id} className="permission-item">
              <input
                type="checkbox"
                checked={selectedPermissions.includes(permission.name)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedPermissions([...selectedPermissions, permission.name]);
                  } else {
                    setSelectedPermissions(selectedPermissions.filter(p => p !== permission.name));
                  }
                }}
                disabled={userPermissions.some(up => up.name === permission.name)}
              />
              <span>{permission.description}</span>
              <small>({permission.category} - {permission.level})</small>
            </label>
          ))}
        </div>
        
        <button 
          onClick={grantPermissions}
          disabled={loading || selectedPermissions.length === 0}
        >
          {loading ? 'Granting...' : 'Grant Selected Permissions'}
        </button>
      </div>

      <div className="user-permissions">
        <h4>Current Permissions</h4>
        <div className="permission-list">
          {userPermissions.map(permission => (
            <div key={permission._id} className="permission-item">
              <span>{permission.description}</span>
              <small>Granted: {new Date(permission.assignedAt).toLocaleDateString()}</small>
              <button 
                onClick={() => revokePermission(permission.name)}
                disabled={loading}
              >
                Revoke
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
```

### **✅ Permission Guard Component:**
```javascript
import React from 'react';

const PermissionGuard = ({ 
  permission, 
  userId, 
  children, 
  fallback = null 
}) => {
  const [hasPermission, setHasPermission] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkPermission();
  }, [permission, userId]);

  const checkPermission = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/permissions/check', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId,
          permissionName: permission
        })
      });

      const result = await response.json();
      setHasPermission(result.data.hasPermission);
    } catch (error) {
      setHasPermission(false);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Checking permissions...</div>;
  }

  if (!hasPermission) {
    return fallback;
  }

  return children;
};

// Usage
const AdminPanel = ({ userId }) => {
  return (
    <div>
      <PermissionGuard 
        permission="manage_users" 
        userId={userId}
        fallback={<div>Access denied</div>}
      >
        <button>Manage Users</button>
      </PermissionGuard>

      <PermissionGuard 
        permission="view_reports" 
        userId={userId}
        fallback={<div>Cannot view reports</div>}
      >
        <ReportsPanel />
      </PermissionGuard>
    </div>
  );
};
```

---

## 🔍 Error Handling Patterns

### **✅ Global Error Handler:**
```javascript
class PermissionAPI {
  static async request(endpoint, options = {}) {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/permissions${endpoint}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          ...options.headers
        },
        ...options
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Request failed');
      }

      return result;
    } catch (error) {
      // Handle network errors
      if (error.message === 'Failed to fetch') {
        throw new Error('Network error. Please check your connection.');
      }
      
      // Handle authentication errors
      if (error.message === 'Authentication required') {
        localStorage.removeItem('token');
        window.location.href = '/login';
        throw new Error('Session expired. Please login again.');
      }
      
      throw error;
    }
  }

  static async getAllPermissions() {
    return this.request('');
  }

  static async getUserPermissions(userId) {
    return this.request(`/user/${userId}`);
  }

  static async grantPermission(userId, permissionName, reason) {
    return this.request('/grant', {
      method: 'POST',
      body: JSON.stringify({ userId, permissionName, reason })
    });
  }

  static async revokePermission(userId, permissionName, reason) {
    return this.request('/revoke', {
      method: 'DELETE',
      body: JSON.stringify({ userId, permissionName, reason })
    });
  }
}
```

### **✅ Error Boundary Component:**
```javascript
import React from 'react';

class PermissionErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Permission Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <h3>Something went wrong with permissions</h3>
          <p>{this.state.error?.message || 'Unknown error occurred'}</p>
          <button onClick={() => this.setState({ hasError: false, error: null })}>
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Usage
const App = () => {
  return (
    <PermissionErrorBoundary>
      <PermissionManager userId="123" />
    </PermissionErrorBoundary>
  );
};
```

---

## 📊 Response Format Summary

### **✅ Success Response Structure:**
```javascript
{
  success: true,
  message?: string,           // Optional success message
  data: {
    // Response data varies by endpoint
  }
}
```

### **❌ Error Response Structure:**
```javascript
{
  success: false,
  error: string,              // Error message
  details?: any,             // Optional error details
  field?: string             // Optional field name for validation errors
}
```

### **✅ HTTP Status Codes:**
- **200:** Success (GET, POST, DELETE operations)
- **201:** Created (permission granted)
- **400:** Bad Request (validation errors)
- **401:** Unauthorized (authentication required)
- **403:** Forbidden (insufficient permissions)
- **404:** Not Found (user/permission not found)
- **409:** Conflict (permission already granted)
- **500:** Internal Server Error

---

## 🎯 Best Practices

### **✅ Frontend Best Practices:**
1. **Always validate tokens** before making requests
2. **Handle loading states** for better UX
3. **Implement error boundaries** for graceful error handling
4. **Cache permission data** to reduce API calls
5. **Use permission guards** to protect UI components
6. **Implement retry logic** for network failures
7. **Log errors** for debugging and monitoring

### **✅ Security Best Practices:**
1. **Never store tokens** in localStorage for production (use httpOnly cookies)
2. **Validate permissions on both frontend and backend**
3. **Implement rate limiting** for permission changes
4. **Log all permission changes** for audit trails
5. **Use HTTPS** in production
6. **Implement session timeout** for inactive users
7. **Sanitize all user inputs** before displaying

---

**🎯 This comprehensive guide provides everything frontend developers need to integrate with the permission system API!**
