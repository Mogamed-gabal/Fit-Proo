# Multiple Permissions Grant Guide

## 📋 Overview

This guide explains how to grant multiple permissions to a supervisor in a single API call, avoiding the "User already has permission" error when trying to grant permissions one by one.

---

## 🎯 The Problem

### **❌ When Using Single Permission Endpoint:**
```javascript
// First permission - SUCCESS
await fetch('/api/permissions/grant', {
  body: JSON.stringify({
    userId: "69ebc138ef02cfe9e6d5175d",
    permissionName: "MANAGE_BUNDLES"
  })
});

// Second permission - ERROR if user already has it
await fetch('/api/permissions/grant', {
  body: JSON.stringify({
    userId: "69ebc138ef02cfe9e6d5175d", 
    permissionName: "read_users"  // ❌ Error: User already has permission
  })
});
```

### **✅ Solution: Use Multiple Permissions Endpoint**
```javascript
// All permissions in one call - SUCCESS
await fetch('/api/permissions/grant-multiple', {
  body: JSON.stringify({
    userId: "69ebc138ef02cfe9e6d5175d",
    permissionNames: ["MANAGE_BUNDLES", "read_users", "read_dashboard"]
  })
});
```

---

## 🚀 Multiple Permissions Endpoint

### **Endpoint:**
```http
POST /api/permissions/grant-multiple
Authorization: Bearer <admin_token>
Content-Type: application/json
```

### **Request Body:**
```json
{
  "userId": "69ebc138ef02cfe9e6d5175d",
  "permissionNames": [
    "MANAGE_BUNDLES",
    "read_users", 
    "read_dashboard",
    "block_client",
    "read_audit_logs"
  ],
  "expiresAt": "2026-12-31T23:59:59.000Z",
  "reason": "Supervisor permissions for Q4 project management"
}
```

---

## 📊 Response Format

### **✅ Success Response:**
```json
{
  "success": true,
  "message": "Processed 5 permissions: 3 granted, 2 skipped, 0 failed",
  "data": {
    "results": [
      {
        "success": true,
        "permission": "MANAGE_BUNDLES",
        "data": {
          "permission": {
            "_id": "507f1f77bcf86cd799439013",
            "name": "MANAGE_BUNDLES",
            "assignedTo": "69ebc138ef02cfe9e6d5175d",
            "assignedAt": "2026-05-05T10:00:00.000Z"
          },
          "user": {
            "_id": "69ebc138ef02cfe9e6d5175d",
            "name": "John Supervisor",
            "email": "john@example.com",
            "role": "supervisor"
          }
        },
        "granted": true
      },
      {
        "success": true,
        "permission": "read_users",
        "message": "User already has permission 'read_users'",
        "skipped": true,
        "existing": true
      },
      {
        "success": true,
        "permission": "read_dashboard",
        "data": {
          "permission": {
            "_id": "507f1f77bcf86cd799439014",
            "name": "read_dashboard",
            "assignedTo": "69ebc138ef02cfe9e6d5175d",
            "assignedAt": "2026-05-05T10:00:00.000Z"
          }
        },
        "granted": true
      },
      {
        "success": true,
        "permission": "block_client",
        "message": "User already has permission 'block_client'",
        "skipped": true,
        "existing": true
      },
      {
        "success": true,
        "permission": "read_audit_logs",
        "data": {
          "permission": {
            "_id": "507f1f77bcf86cd799439015",
            "name": "read_audit_logs",
            "assignedTo": "69ebc138ef02cfe9e6d5175d",
            "assignedAt": "2026-05-05T10:00:00.000Z"
          }
        },
        "granted": true
      }
    ],
    "summary": {
      "total": 5,
      "successful": 5,
      "granted": 3,
      "skipped": 2,
      "failed": 0
    }
  }
}
```

---

## 🎯 Response States Explained

### **✅ Permission States:**

#### **1. Granted (New Permission):**
```json
{
  "success": true,
  "permission": "MANAGE_BUNDLES",
  "data": { /* permission details */ },
  "granted": true
}
```

#### **2. Skipped (Already Exists):**
```json
{
  "success": true,
  "permission": "read_users",
  "message": "User already has permission 'read_users'",
  "skipped": true,
  "existing": true
}
```

#### **3. Failed (Invalid Permission):**
```json
{
  "success": false,
  "permission": "INVALID_PERMISSION",
  "error": "Permission 'INVALID_PERMISSION' not found",
  "skipped": true
}
```

---

## 📋 Common Supervisor Permission Sets

### **✅ Basic Supervisor Access:**
```javascript
{
  "userId": "69ebc138ef02cfe9e6d5175d",
  "permissionNames": [
    "read_users",
    "read_dashboard",
    "read_subscriptions"
  ],
  "reason": "Basic supervisor access"
}
```

### **✅ Full Supervisor Management:**
```javascript
{
  "userId": "69ebc138ef02cfe9e6d5175d",
  "permissionNames": [
    "read_users",
    "read_dashboard",
    "read_subscriptions",
    "block_client",
    "unblock_client",
    "read_user_details",
    "manage_users_limited",
    "read_audit_logs"
  ],
  "reason": "Full supervisor management permissions"
}
```

### **✅ Bundle Management Supervisor:**
```javascript
{
  "userId": "69ebc138ef02cfe9e6d5175d",
  "permissionNames": [
    "MANAGE_BUNDLES",
    "read_users",
    "read_dashboard",
    "read_subscriptions"
  ],
  "expiresAt": "2026-12-31T23:59:59.000Z",
  "reason": "Bundle management supervisor with temporary access"
}
```

---

## 🔄 Frontend Implementation

### **✅ React Component Example:**
```jsx
import React, { useState } from 'react';

const MultiplePermissionManager = () => {
  const [selectedPermissions, setSelectedPermissions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const handlePermissionToggle = (permissionName) => {
    setSelectedPermissions(prev => 
      prev.includes(permissionName)
        ? prev.filter(p => p !== permissionName)
        : [...prev, permissionName]
    );
  };

  const grantMultiplePermissions = async (userId) => {
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/permissions/grant-multiple', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId,
          permissionNames: selectedPermissions,
          reason: 'Granted via admin panel'
        })
      });

      const result = await response.json();
      
      if (result.success) {
        console.log(`Granted ${result.data.summary.granted} permissions`);
        console.log(`Skipped ${result.data.summary.skipped} existing permissions`);
        
        // Show success message
        alert(result.message);
        
        // Refresh user permissions
        await loadUserPermissions(userId);
      } else {
        console.error('Failed to grant permissions:', result);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="multiple-permission-manager">
      <h3>Grant Multiple Permissions</h3>
      
      {/* Permission Checkboxes */}
      <div className="permission-list">
        {SUPERVISOR_PERMISSIONS.map(permission => (
          <label key={permission.name}>
            <input
              type="checkbox"
              checked={selectedPermissions.includes(permission.name)}
              onChange={() => handlePermissionToggle(permission.name)}
            />
            {permission.name} - {permission.description}
          </label>
        ))}
      </div>

      {/* Grant Button */}
      <button
        onClick={() => grantMultiplePermissions(selectedUserId)}
        disabled={selectedPermissions.length === 0 || isLoading}
      >
        {isLoading ? 'Granting...' : `Grant ${selectedPermissions.length} Permissions`}
      </button>
    </div>
  );
};
```

---

## 🎯 Best Practices

### **✅ Do's:**
1. **Use the multiple endpoint** for batch operations
2. **Check the response** to see which permissions were granted vs skipped
3. **Provide clear reasons** for audit purposes
4. **Set expiration dates** for temporary access
5. **Validate permission names** before sending

### **❌ Don'ts:**
1. **Don't use single endpoint** for multiple permissions (causes errors)
2. **Don't ignore skipped permissions** (they're already assigned)
3. **Don't send invalid permission names** (will be skipped)
4. **Don't send empty permission arrays** (validation error)

---

## 📊 Error Handling

### **✅ Common Errors and Solutions:**

#### **❌ Validation Error:**
```json
{
  "success": false,
  "error": "User ID and permission names array are required"
}
```
**Solution:** Ensure `userId` and `permissionNames` array are provided.

#### **❌ Invalid Permission:**
```json
{
  "success": true,
  "results": [
    {
      "success": false,
      "permission": "INVALID_PERM",
      "error": "Permission 'INVALID_PERM' not found",
      "skipped": true
    }
  ]
}
```
**Solution:** Check valid permission names in the documentation.

#### **❌ Empty Array:**
```json
{
  "success": false,
  "error": "User ID and permission names array are required"
}
```
**Solution:** Ensure `permissionNames` is not an empty array.

---

## 🎯 Quick Reference

| Action | Endpoint | Body Field | Type |
|--------|----------|------------|------|
| Grant Multiple | `POST /api/permissions/grant-multiple` | `userId` | MongoId |
| Grant Multiple | `POST /api/permissions/grant-multiple` | `permissionNames` | Array |
| Grant Multiple | `POST /api/permissions/grant-multiple` | `expiresAt` | ISO Date (Optional) |
| Grant Multiple | `POST /api/permissions/grant-multiple` | `reason` | String (Optional) |

---

## 🚀 Usage Examples

### **✅ Real-world Scenario:**
```javascript
// New supervisor needs full access
const newSupervisorPermissions = [
  "read_users",
  "read_dashboard", 
  "read_subscriptions",
  "block_client",
  "unblock_client",
  "read_user_details",
  "manage_users_limited",
  "read_audit_logs"
];

await fetch('/api/permissions/grant-multiple', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${adminToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    userId: "69ebc138ef02cfe9e6d5175d",
    permissionNames: newSupervisorPermissions,
    reason: "New supervisor onboarding - full access granted"
  })
});
```

**Result:** All 8 permissions granted successfully, even if some were already assigned (they'll be marked as skipped).**

---

**Use the multiple permissions endpoint to avoid conflicts and handle batch operations efficiently!** 🎯
