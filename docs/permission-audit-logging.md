# Permission Audit Logging Setup

## 📋 Overview

This guide explains how audit logging works for permission management actions and how to verify they're being logged properly.

---

## 🔧 What I've Added

### **✅ Audit Middleware Added to Permission Routes:**

#### **Grant Permission:**
```javascript
router.post('/grant',
  authenticate,
  DynamicPermissionMiddleware.requirePermissionManagement(),
  auditAction('grant_permission', 'User', { 
    action: 'GRANT_PERMISSION',
    description: 'Admin granted permission to user'
  }),
  // ... validation and controller
);
```

#### **Revoke Permission:**
```javascript
router.post('/revoke',
  authenticate,
  DynamicPermissionMiddleware.requirePermissionManagement(),
  auditAction('revoke_permission', 'User', { 
    action: 'REVOKE_PERMISSION',
    description: 'Admin revoked permission from user'
  }),
  // ... validation and controller
);
```

#### **Grant Multiple Permissions:**
```javascript
router.post('/grant-multiple',
  authenticate,
  DynamicPermissionMiddleware.requirePermissionManagement(),
  auditAction('grant_multiple_permissions', 'User', { 
    action: 'GRANT_MULTIPLE_PERMISSIONS',
    description: 'Admin granted multiple permissions to user'
  }),
  // ... validation and controller
);
```

---

## 📊 Audit Log Structure

### **✅ What Gets Logged:**

#### **1. Admin Information:**
- `adminId` - Who performed the action
- `actionType` - Type of action performed
- `targetId` - User who received permission
- `targetType` - "User"

#### **2. Action Details:**
- `details.reason` - Reason for granting/revoking
- `details.changes` - Before/after state changes
- `details.metadata` - Additional context

#### **3. Request Information:**
- `requestInfo.endpoint` - Which endpoint was called
- `requestInfo.method` - HTTP method used
- `requestInfo.ipAddress` - Admin's IP address
- `requestInfo.userAgent` - Browser/client info

#### **4. Response Information:**
- `result` - Success/failure/partial
- `error` - Error details if failed

---

## 🔍 How to Verify Audit Logs

### **✅ Check Database Directly:**
```javascript
// Connect to MongoDB
db.auditLogs.find({
  actionType: { $in: ['GRANT_PERMISSION', 'REVOKE_PERMISSION', 'GRANT_MULTIPLE_PERMISSIONS'] }
}).sort({ createdAt: -1 }).toArray((err, logs) => {
  console.log('Permission audit logs:', logs);
});
```

### **✅ Use Audit API Endpoint:**
```javascript
// Get all permission-related audit logs
const response = await fetch('/api/audit/logs', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${adminToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    actionType: ['GRANT_PERMISSION', 'REVOKE_PERMISSION', 'GRANT_MULTIPLE_PERMISSIONS'],
    startDate: '2026-05-01',
    endDate: '2026-05-05'
  })
});

const logs = await response.json();
console.log('Audit logs:', logs.data.logs);
```

---

## 📋 Expected Audit Log Examples

### **✅ Grant Permission Log:**
```json
{
  "_id": "507f1f77bcf86cd799439020",
  "adminId": "507f1f77bcf86cd799439014",
  "actionType": "GRANT_PERMISSION",
  "targetId": "69ebc138ef02cfe9e6d5175d",
  "targetType": "User",
  "details": {
    "reason": "Supervisor needs bundle management for Q4 project",
    "changes": {
      "oldValues": null,
      "newValues": {
        "permission": "MANAGE_BUNDLES",
        "grantedAt": "2026-05-05T10:00:00.000Z",
        "expiresAt": "2026-12-31T23:59:59.000Z"
      }
    },
    "metadata": {
      "permissionName": "MANAGE_BUNDLES",
      "userId": "69ebc138ef02cfe9e6d5175d",
      "assignedBy": "507f1f77bcf86cd799439014"
    }
  },
  "requestInfo": {
    "endpoint": "/api/permissions/grant",
    "method": "POST",
    "ipAddress": "192.168.1.100",
    "userAgent": "Mozilla/5.0..."
  },
  "result": "success",
  "createdAt": "2026-05-05T10:00:01.000Z",
  "updatedAt": "2026-05-05T10:00:01.000Z"
}
```

### **✅ Revoke Permission Log:**
```json
{
  "_id": "507f1f77bcf86cd799439021",
  "adminId": "507f1f77bcf86cd799439014",
  "actionType": "REVOKE_PERMISSION",
  "targetId": "69ebc138ef02cfe9e6d5175d",
  "targetType": "User",
  "details": {
    "reason": "Project completed - no longer needed",
    "changes": {
      "oldValues": {
        "permission": "MANAGE_BUNDLES",
        "isActive": true
      },
      "newValues": {
        "permission": "MANAGE_BUNDLES",
        "isActive": false,
        "deletedAt": "2026-05-05T11:00:00.000Z"
      }
    }
  },
  "requestInfo": {
    "endpoint": "/api/permissions/revoke",
    "method": "POST",
    "ipAddress": "192.168.1.100"
  },
  "result": "success",
  "createdAt": "2026-05-05T11:00:01.000Z"
}
```

### **✅ Grant Multiple Permissions Log:**
```json
{
  "_id": "507f1f77bcf86cd799439022",
  "adminId": "507f1f77bcf86cd799439014",
  "actionType": "GRANT_MULTIPLE_PERMISSIONS",
  "targetId": "69ebc138ef02cfe9e6d5175d",
  "targetType": "User",
  "details": {
    "reason": "Supervisor permissions for Q4 project",
    "changes": {
      "oldValues": null,
      "newValues": {
        "permissions": [
          "MANAGE_BUNDLES",
          "read_users",
          "read_dashboard",
          "block_client"
        ],
        "grantedAt": "2026-05-05T10:00:00.000Z"
      }
    },
    "metadata": {
      "permissionCount": 4,
      "permissionNames": ["MANAGE_BUNDLES", "read_users", "read_dashboard", "block_client"],
      "userId": "69ebc138ef02cfe9e6d5175d",
      "assignedBy": "507f1f77bcf86cd799439014"
    }
  },
  "requestInfo": {
    "endpoint": "/api/permissions/grant-multiple",
    "method": "POST",
    "ipAddress": "192.168.1.100"
  },
  "result": "success",
  "createdAt": "2026-05-05T10:00:01.000Z"
}
```

---

## 🔍 Troubleshooting

### **❌ If Audit Logs Are Not Appearing:**

#### **1. Check Middleware Order:**
```javascript
// Make sure auditAction comes BEFORE the controller
router.post('/grant',
  authenticate,
  DynamicPermissionMiddleware.requirePermissionManagement(),
  auditAction('grant_permission', 'User', { ... }), // ✅ BEFORE controller
  // validation middleware,
  asyncErrorHandler(PermissionController.grantPermission) // ✅ AFTER audit
);
```

#### **2. Verify Admin User:**
```javascript
// Audit middleware only logs for admin/supervisor roles
if (!req.user || !['admin', 'supervisor'].includes(req.user.role)) {
  return; // No logging for non-admin users
}
```

#### **3. Check Response Format:**
```javascript
// Audit middleware intercepts res.json()
// Make sure your controller calls res.json() not res.status().json()
res.json({ success: true, data: result }); // ✅ Will be logged
res.status(200).json({ success: true, data: result }); // ✅ Will be logged
```

#### **4. Check Database Connection:**
```javascript
// Make sure AuditLog model is properly connected
const AuditLog = require('../models/AuditLog');
console.log('AuditLog model:', AuditLog); // Should show model schema
```

---

## 🎯 Best Practices

### **✅ For Admin Actions:**
1. **Always provide reasons** - Helps with compliance
2. **Use proper endpoints** - Ensures audit logging
3. **Check audit logs regularly** - Monitor for suspicious activity
4. **Document permission changes** - Keep clear records

### **✅ For Development:**
1. **Test audit logging** - Verify logs appear in development
2. **Check database directly** - Confirm logs are stored
3. **Review log format** - Ensure all required fields are present
4. **Monitor performance** - Audit logging shouldn't slow down requests

---

## 📊 Audit Query Examples

### **✅ Get All Permission Actions:**
```javascript
db.auditLogs.find({
  actionType: { 
    $in: ['GRANT_PERMISSION', 'REVOKE_PERMISSION', 'GRANT_MULTIPLE_PERMISSIONS'] 
  }
}).sort({ createdAt: -1 });
```

### **✅ Get Actions by Specific Admin:**
```javascript
db.auditLogs.find({
  adminId: "507f1f77bcf86cd799439014",
  actionType: { $in: ['GRANT_PERMISSION', 'REVOKE_PERMISSION'] }
}).sort({ createdAt: -1 });
```

### **✅ Get Actions for Specific User:**
```javascript
db.auditLogs.find({
  targetId: "69ebc138ef02cfe9e6d5175d",
  targetType: "User"
}).sort({ createdAt: -1 });
```

### **✅ Get Recent Actions (Last 7 Days):**
```javascript
const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

db.auditLogs.find({
  actionType: { $in: ['GRANT_PERMISSION', 'REVOKE_PERMISSION'] },
  createdAt: { $gte: sevenDaysAgo }
}).sort({ createdAt: -1 });
```

---

## 🚀 Testing Audit Logging

### **✅ Test Grant Permission:**
```javascript
// Make a test request
const response = await fetch('/api/permissions/grant', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${adminToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    userId: "69ebc138ef02cfe9e6d5175d",
    permissionName: "MANAGE_BUNDLES",
    reason: "Test audit logging"
  })
});

// Check if audit log was created
setTimeout(async () => {
  const logs = await db.auditLogs.find({
    actionType: "GRANT_PERMISSION"
  }).sort({ createdAt: -1 }).limit(1).toArray();
  
  if (logs.length > 0) {
    console.log('✅ Audit logging working:', logs[0]);
  } else {
    console.log('❌ Audit logging not working');
  }
}, 1000);
```

---

**Now all permission management actions by admins should be properly logged in the audit system!** 🎯

The audit logs will capture:
- ✅ **Who** performed the action
- ✅ **What** action was performed  
- ✅ **When** it was performed
- ✅ **Why** it was performed
- ✅ **Where** it was performed from (IP, endpoint)

This provides complete audit trail for compliance and security monitoring!
