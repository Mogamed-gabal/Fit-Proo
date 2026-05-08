# Supervisor Audit Logging Guide

## 📋 Overview

Complete audit logging for supervisor actions to track all operations performed by supervisors with proper permissions for security, compliance, and accountability.

---

## 🔐 Supervisor Audit Coverage

### **✅ All Supervisor Actions Logged:**
1. **User Management** - Approve, Reject, Block, Unblock users
2. **Supervisor Creation** - Create new supervisors
3. **Bundle Management** - Create, Update, Deactivate, Activate bundles
4. **Permission Management** - Grant, Revoke permissions
5. **System Actions** - Any system-level operations

---

## 🚀 Supervisor Audit Implementation

### **✅ Audit Middleware for Supervisors:**

#### **User Management Actions:**
```javascript
// src/middlewares/auditMiddleware.js
const auditApproveUser = auditAction('approve_user', 'User', { includeChanges: true });
const auditRejectUser = auditAction('reject_user', 'User', { includeChanges: true });
const auditBlockUser = auditAction('block_user', 'User', { includeChanges: true });
const auditUnblockUser = auditAction('unblock_user', 'User', { includeChanges: true });
const auditSoftDeleteUser = auditAction('soft_delete_user', 'User', { includeChanges: true });
```

#### **Supervisor Management Actions:**
```javascript
const auditCreateSupervisor = auditAction('create_supervisor', 'User', { includeChanges: true });
const auditDeleteSupervisor = auditAction('delete_supervisor', 'User', { includeChanges: true });
```

#### **Bundle Management Actions:**
```javascript
const auditCreateBundle = auditAction('create_bundle', 'Bundle', { includeChanges: true });
const auditUpdateBundle = auditAction('update_bundle', 'Bundle', { includeChanges: true });
const auditDeactivateBundle = auditAction('deactivate_bundle', 'Bundle', { includeChanges: true });
const auditActivateBundle = auditAction('activate_bundle', 'Bundle', { includeChanges: true });
const auditDeleteBundle = auditAction('delete_bundle', 'Bundle', { includeChanges: true });
```

---

## 📊 Supervisor Audit Log Structure

### **✅ Complete Supervisor Action Log:**

#### **1. User Approval Audit Log:**
```json
{
  "_id": "507f1f77bcf86cd799439050",
  "adminId": "507f1f77bcf86cd799439015",
  "actionType": "approve_user",
  "targetId": "507f1f77bcf86cd799439020",
  "targetType": "User",
  "details": {
    "reason": "User approved after verification",
    "changes": {
      "oldValues": { "status": "pending" },
      "newValues": { "status": "approved" }
    },
    "metadata": {
      "approvedUser": {
        "id": "507f1f77bcf86cd799439020",
        "name": "John Doe",
        "email": "john@example.com",
        "role": "user"
      },
      "performedBy": {
        "id": "507f1f77bcf86cd799439015",
        "name": "Supervisor Jane",
        "email": "jane@company.com",
        "role": "supervisor"
      }
    }
  },
  "requestInfo": {
    "endpoint": "/api/admin/users/approve",
    "method": "PATCH",
    "ipAddress": "192.168.1.100",
    "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
  },
  "result": "success",
  "createdAt": "2026-05-05T12:00:00.000Z",
  "updatedAt": "2026-05-05T12:00:00.000Z"
}
```

#### **2. Bundle Creation Audit Log:**
```json
{
  "_id": "507f1f77bcf86cd799439051",
  "adminId": "507f1f77bcf86cd799439015",
  "actionType": "create_bundle",
  "targetId": "507f1f77bcf86cd799439025",
  "targetType": "Bundle",
  "details": {
    "reason": "Created new client bundle",
    "changes": {
      "oldValues": null,
      "newValues": {
        "name": "Client Premium Package",
        "doctors": ["507f1f77bcf86cd799439011", "507f1f77bcf86cd799439012"],
        "pricing": { "oneMonth": 300, "threeMonths": 800, "sixMonths": 1400 }
      }
    },
    "metadata": {
      "bundleName": "Client Premium Package",
      "doctorCount": 2,
      "pricingTotal": 2500,
      "performedBy": {
        "id": "507f1f77bcf86cd799439015",
        "name": "Supervisor Jane",
        "email": "jane@company.com",
        "role": "supervisor"
      }
    }
  },
  "requestInfo": {
    "endpoint": "/api/bundles",
    "method": "POST",
    "ipAddress": "192.168.1.100",
    "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
  },
  "result": "success",
  "createdAt": "2026-05-05T13:00:00.000Z",
  "updatedAt": "2026-05-05T13:00:00.000Z"
}
```

#### **3. Permission Grant Audit Log:**
```json
{
  "_id": "507f1f77bcf86cd799439052",
  "adminId": "507f1f77bcf86cd799439015",
  "actionType": "grant_permission",
  "targetId": "507f1f77bcf86cd799439020",
  "targetType": "User",
  "details": {
    "reason": "Granting bundle management access",
    "changes": {
      "oldValues": { "permissions": ["READ_USERS"] },
      "newValues": { "permissions": ["READ_USERS", "MANAGE_BUNDLES"] }
    },
    "metadata": {
      "grantedPermission": {
        "name": "MANAGE_BUNDLES",
        "description": "Can create and manage bundles",
        "category": "bundle_management"
      },
      "targetUser": {
        "id": "507f1f77bcf86cd799439020",
        "name": "John Doe",
        "email": "john@example.com",
        "role": "user"
      },
      "performedBy": {
        "id": "507f1f77bcf86cd799439015",
        "name": "Supervisor Jane",
        "email": "jane@company.com",
        "role": "supervisor"
      }
    }
  },
  "requestInfo": {
    "endpoint": "/api/permissions/grant",
    "method": "POST",
    "ipAddress": "192.168.1.100",
    "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
  },
  "result": "success",
  "createdAt": "2026-05-05T14:00:00.000Z",
  "updatedAt": "2026-05-05T14:00:00.000Z"
}
```

---

## 🔍 Supervisor Audit Fields Explained

### **✅ Core Identification:**

#### **adminId:**
- **Description:** ID of supervisor who performed action
- **Source:** `req.user.userId`
- **Purpose:** Tracks which supervisor made the change

#### **actionType:**
- **Description:** Type of action performed by supervisor
- **Values:** `approve_user`, `create_bundle`, `grant_permission`, etc.
- **Purpose:** Categorizes supervisor action

#### **targetId:**
- **Description:** ID of entity that was affected
- **Source:** Target entity ID from request
- **Purpose:** Identifies what was changed

#### **targetType:**
- **Description:** Type of entity affected
- **Values:** `User`, `Bundle`, `Permission`
- **Purpose:** Entity categorization

### **✅ Supervisor Context:**

#### **performedBy metadata:**
```json
{
  "performedBy": {
    "id": "507f1f77bcf86cd799439015",
    "name": "Supervisor Jane",
    "email": "jane@company.com",
    "role": "supervisor",
    "department": "Client Management"
  }
}
```

#### **actionContext metadata:**
```json
{
  "actionContext": {
    "supervisorLevel": "Senior",
    "permissions": ["MANAGE_USERS", "MANAGE_BUNDLES", "GRANT_PERMISSIONS"],
    "delegationScope": "department",
    "reportingTo": "admin_id_here"
  }
}
```

---

## 🎯 Supervisor Monitoring Queries

### **✅ Get All Supervisor Actions:**
```javascript
const supervisorActions = await AuditLog.find({
  "details.metadata.performedBy.role": "supervisor"
}).sort({ createdAt: -1 });
```

### **✅ Get Specific Supervisor Actions:**
```javascript
const specificSupervisorActions = await AuditLog.find({
  adminId: "507f1f77bcf86cd799439015",
  "details.metadata.performedBy.role": "supervisor"
}).sort({ createdAt: -1 });
```

### **✅ Get Supervisor Actions by Type:**
```javascript
const supervisorUserActions = await AuditLog.find({
  "details.metadata.performedBy.role": "supervisor",
  actionType: { $in: ['approve_user', 'reject_user', 'block_user'] }
}).sort({ createdAt: -1 });
```

### **✅ Get Supervisor Bundle Actions:**
```javascript
const supervisorBundleActions = await AuditLog.find({
  "details.metadata.performedBy.role": "supervisor",
  targetType: "Bundle"
}).sort({ createdAt: -1 });
```

### **✅ Get Supervisor Actions by Date Range:**
```javascript
const supervisorRecentActions = await AuditLog.find({
  "details.metadata.performedBy.role": "supervisor",
  createdAt: {
    $gte: new Date('2026-05-01'),
    $lt: new Date('2026-05-31')
  }
}).sort({ createdAt: -1 });
```

---

## 📊 Supervisor Activity Analytics

### **✅ Supervisor Performance Metrics:**
```javascript
const supervisorMetrics = await AuditLog.aggregate([
  { $match: { "details.metadata.performedBy.role": "supervisor" } },
  { $group: {
    _id: "$adminId",
    supervisorName: { $first: "$details.metadata.performedBy.name" },
    supervisorEmail: { $first: "$details.metadata.performedBy.email" },
    totalActions: { $sum: 1 },
    userActions: {
      $sum: { $cond: [{ $eq: ["$targetType", "User"] }, 1, 0] }
    },
    bundleActions: {
      $sum: { $cond: [{ $eq: ["$targetType", "Bundle"] }, 1, 0] }
    },
    lastAction: { $max: "$createdAt" },
    firstAction: { $min: "$createdAt" }
  }},
  { $sort: { totalActions: -1 } }
]);
```

### **✅ Supervisor Action Types:**
```javascript
const supervisorActionTypes = await AuditLog.aggregate([
  { $match: { "details.metadata.performedBy.role": "supervisor" } },
  { $group: {
    _id: "$actionType",
    count: { $sum: 1 },
    supervisors: { $addToSet: "$details.metadata.performedBy.name" }
  }},
  { $sort: { count: -1 } }
]);
```

### **✅ Daily Supervisor Activity:**
```javascript
const dailySupervisorActivity = await AuditLog.aggregate([
  { $match: { "details.metadata.performedBy.role": "supervisor" } },
  { $group: {
    _id: { 
      $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
    },
    actionCount: { $sum: 1 },
    uniqueSupervisors: { $addToSet: "$adminId" }
  }},
  { $sort: { _id: -1 } }
]);
```

---

## 🔒 Supervisor Security Monitoring

### **✅ Suspicious Activity Detection:**
```javascript
// Supervisor actions outside business hours
const suspiciousActivity = await AuditLog.find({
  "details.metadata.performedBy.role": "supervisor",
  createdAt: {
    $gte: new Date().setHours(22, 0, 0, 0),
    $lt: new Date().setHours(6, 0, 0, 0)
  }
}).sort({ createdAt: -1 });

// Supervisor with unusual action frequency
const highFrequencyActions = await AuditLog.aggregate([
  { $match: { "details.metadata.performedBy.role": "supervisor" } },
  { $group: {
    _id: {
      supervisorId: "$adminId",
      date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
    },
    actionCount: { $sum: 1 }
  }},
  { $match: { actionCount: { $gt: 100 } } }, // More than 100 actions per day
  { $sort: { actionCount: -1 } }
]);
```

### **✅ Supervisor Compliance Monitoring:**
```javascript
// Supervisor actions requiring approval
const restrictedActions = await AuditLog.find({
  "details.metadata.performedBy.role": "supervisor",
  actionType: { $in: ['delete_bundle', 'delete_supervisor', 'block_user'] }
}).sort({ createdAt: -1 });

// Supervisor permission changes
const permissionChanges = await AuditLog.find({
  "details.metadata.performedBy.role": "supervisor",
  actionType: { $in: ['grant_permission', 'revoke_permission'] }
}).sort({ createdAt: -1 });
```

---

## 🚀 Frontend Supervisor Audit Dashboard

### **✅ React Component for Supervisor Audit:**
```javascript
import React, { useState, useEffect } from 'react';

const SupervisorAuditDashboard = () => {
  const [supervisorActions, setSupervisorActions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    supervisorId: '',
    actionType: '',
    dateRange: { start: '', end: '' }
  });

  const fetchSupervisorActions = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const queryParams = new URLSearchParams({
        ...(filters.supervisorId && { supervisorId: filters.supervisorId }),
        ...(filters.actionType && { actionType: filters.actionType }),
        ...(filters.dateRange.start && { startDate: filters.dateRange.start }),
        ...(filters.dateRange.end && { endDate: filters.dateRange.end })
      });

      const response = await fetch(`/api/audit/supervisor?${queryParams}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const result = await response.json();
      if (result.success) {
        setSupervisorActions(result.data.actions);
      }
    } catch (error) {
      console.error('Error fetching supervisor actions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSupervisorActions();
  }, [filters]);

  return (
    <div className="supervisor-audit-dashboard">
      <h2>Supervisor Activity Monitor</h2>
      
      <div className="filters">
        <select 
          value={filters.actionType} 
          onChange={(e) => setFilters({...filters, actionType: e.target.value})}
        >
          <option value="">All Actions</option>
          <option value="approve_user">Approve User</option>
          <option value="create_bundle">Create Bundle</option>
          <option value="grant_permission">Grant Permission</option>
        </select>
        
        <input 
          type="date" 
          value={filters.dateRange.start}
          onChange={(e) => setFilters({
            ...filters, 
            dateRange: { ...filters.dateRange, start: e.target.value }
          })}
        />
        <input 
          type="date" 
          value={filters.dateRange.end}
          onChange={(e) => setFilters({
            ...filters, 
            dateRange: { ...filters.dateRange, end: e.target.value }
          })}
        />
      </div>

      {loading ? (
        <div>Loading supervisor actions...</div>
      ) : (
        <div className="actions-list">
          {supervisorActions.map(action => (
            <div key={action._id} className="action-item">
              <div className="action-header">
                <span className="action-type">{action.actionType.replace('_', ' ')}</span>
                <span className="timestamp">
                  {new Date(action.createdAt).toLocaleString()}
                </span>
              </div>
              
              <div className="supervisor-info">
                <strong>Supervisor:</strong> {action.details.metadata.performedBy.name}
                <span className="email">{action.details.metadata.performedBy.email}</span>
              </div>
              
              <div className="action-details">
                <strong>Target:</strong> {action.targetType} - {action.targetId}
                <strong>Reason:</strong> {action.details.reason}
              </div>
              
              <div className="request-info">
                <span>IP: {action.requestInfo.ipAddress}</span>
                <span>Result: {action.result}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
```

### **✅ Supervisor Performance Report:**
```javascript
const SupervisorPerformanceReport = () => {
  const [metrics, setMetrics] = useState(null);

  useEffect(() => {
    const fetchMetrics = async () => {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/audit/supervisor/metrics', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const result = await response.json();
      if (result.success) {
        setMetrics(result.data);
      }
    };
    
    fetchMetrics();
  }, []);

  return (
    <div className="supervisor-performance">
      <h3>Supervisor Performance Metrics</h3>
      
      {metrics && (
        <div className="metrics-grid">
          <div className="metric-card">
            <h4>Total Supervisors Active</h4>
            <span className="metric-value">{metrics.totalSupervisors}</span>
          </div>
          
          <div className="metric-card">
            <h4>Actions This Week</h4>
            <span className="metric-value">{metrics.weeklyActions}</span>
          </div>
          
          <div className="metric-card">
            <h4>Avg Actions/Supervisor</h4>
            <span className="metric-value">{metrics.avgActionsPerSupervisor}</span>
          </div>
          
          <div className="metric-card">
            <h4>Top Performer</h4>
            <span className="metric-value">{metrics.topPerformer.name}</span>
            <small>{metrics.topPerformer.actionCount} actions</small>
          </div>
        </div>
      )}
    </div>
  );
};
```

---

## 📋 Supervisor Audit Best Practices

### **✅ Monitoring Guidelines:**

#### **1. Regular Review:**
- Review supervisor actions weekly
- Look for unusual patterns
- Verify permission usage

#### **2. Alert Thresholds:**
- More than 50 actions per day
- Actions outside business hours
- Multiple failed attempts

#### **3. Compliance Checks:**
- Verify proper authorization
- Check for policy violations
- Audit permission changes

### **✅ Security Recommendations:**

#### **1. Access Control:**
- Limit supervisor permissions
- Regular permission reviews
- Principle of least privilege

#### **2. Monitoring:**
- Real-time alerts for suspicious activity
- Monthly audit reports
- Anomaly detection

#### **3. Documentation:**
- Clear action policies
- Supervisor training
- Incident response procedures

---

## 🎯 Summary

### **✅ Supervisor Audit Features:**

#### **Complete Tracking:**
- All supervisor actions logged
- Before/after states captured
- Full context and metadata

#### **Security Monitoring:**
- Real-time activity tracking
- Suspicious pattern detection
- Compliance verification

#### **Performance Analytics:**
- Activity metrics
- Performance comparisons
- Trend analysis

#### **Accountability:**
- Clear supervisor identification
- Action attribution
- Audit trail preservation

**🎯 The supervisor audit system provides comprehensive tracking, monitoring, and analysis of all supervisor actions for security, compliance, and performance management!**
