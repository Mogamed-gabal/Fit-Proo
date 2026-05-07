# Admin Password Change Endpoint

## 📋 Overview

Dedicated endpoint for admin password changes with enhanced security, comprehensive validation, and detailed audit logging.

---

## 🚀 Endpoints Available

### **✅ 1. General Password Change (All Users)**
- **Endpoint:** `PUT /api/auth/change-password`
- **For:** All authenticated users
- **Security:** Standard validation

### **✅ 2. Admin Password Change (Admin Only)**
- **Endpoint:** `PUT /api/auth/admin/change-password`
- **For:** Admin users only
- **Security:** Enhanced validation and audit logging

---

## 🎯 Admin Password Change Endpoint

### **✅ Endpoint Details:**

#### **HTTP Method:**
```http
PUT /api/auth/admin/change-password
```

#### **Authentication:**
```http
Authorization: Bearer <admin_token>
```

#### **Permissions:**
- `manage_admin_settings` permission required
- User role must be 'admin'

---

## 📋 Request Format

### **✅ Headers:**
```http
Authorization: Bearer <admin_token>
Content-Type: application/json
```

### **✅ Request Body:**
```json
{
  "currentPassword": "CurrentAdminPassword123!",
  "newPassword": "NewSecureAdminPassword@2026",
  "confirmPassword": "NewSecureAdminPassword@2026"
}
```

### **✅ Field Requirements:**

#### **currentPassword:**
- **Type:** String
- **Required:** Yes
- **Description:** Current admin password
- **Validation:** Must not be empty

#### **newPassword:**
- **Type:** String
- **Required:** Yes
- **Min Length:** 10 characters
- **Requirements:**
  - At least one uppercase letter (A-Z)
  - At least one lowercase letter (a-z)
  - At least one number (0-9)
  - At least one special character (@$!%*?&)
  - Must be different from current password

#### **confirmPassword:**
- **Type:** String
- **Required:** Yes
- **Description:** Must match newPassword exactly

---

## 📊 Response Format

### **✅ Success Response (200):**
```json
{
  "success": true,
  "message": "Admin password changed successfully. For security reasons, you will need to login again on all devices.",
  "details": {
    "changedAt": "2026-05-05T12:00:00.000Z",
    "allSessionsRevoked": true,
    "securityLevel": "admin_enhanced"
  }
}
```

### **❌ Error Responses:**

#### **❌ Access Denied (403):**
```json
{
  "success": false,
  "error": "Access denied. Admin privileges required."
}
```

#### **❌ Validation Errors (400):**
```json
{
  "success": false,
  "error": "Validation failed",
  "details": [
    {
      "field": "newPassword",
      "message": "Admin password must be at least 10 characters long"
    },
    {
      "field": "newPassword", 
      "message": "Admin password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
    }
  ]
}
```

#### **❌ Password Not Strong Enough (400):**
```json
{
  "success": false,
  "error": "Admin password is not strong enough. Please include uppercase, lowercase, numbers, and special characters.",
  "details": {
    "score": 2,
    "feedback": [
      "Password should be at least 10 characters long",
      "Include special characters (@$!%*?&)"
    ]
  }
}
```

#### **❌ Current Password Incorrect (400):**
```json
{
  "success": false,
  "error": "Current password is incorrect"
}
```

#### **❌ Passwords Don't Match (400):**
```json
{
  "success": false,
  "error": "Password confirmation does not match new password"
}
```

#### **❌ Same Password (400):**
```json
{
  "success": false,
  "error": "New password must be different from current password"
}
```

---

## 🔍 Security Features

### **✅ Enhanced Validation:**
- **Minimum 10 characters** (vs 8 for regular users)
- **Special character requirement** (@$!%*?&)
- **Password strength scoring** (minimum score: 4/5)
- **Real-time feedback** on password weakness

### **✅ Access Control:**
- **Admin role verification**
- **Permission check** (`manage_admin_settings`)
- **Session validation** (must be authenticated)

### **✅ Audit Logging:**
- **Successful changes** logged with full context
- **Failed attempts** logged for security monitoring
- **IP address and user agent** tracking
- **Password strength score** recorded

### **✅ Session Management:**
- **All sessions revoked** after password change
- **Forced re-login** on all devices
- **Refresh token cleanup**

---

## 📊 Audit Log Entries

### **✅ Successful Password Change:**
```json
{
  "_id": "507f1f77bcf86cd799439020",
  "adminId": "507f1f77bcf86cd799439014",
  "actionType": "admin_password_change",
  "targetId": "507f1f77bcf86cd799439014",
  "targetType": "Admin",
  "details": {
    "reason": "Admin self-service password change",
    "changes": {
      "oldValues": { "password": "[MASKED]" },
      "newValues": { "password": "[MASKED]" }
    },
    "metadata": {
      "adminName": "Admin User",
      "adminEmail": "admin@company.com",
      "passwordStrength": 5,
      "ipAddress": "192.168.1.100",
      "userAgent": "Mozilla/5.0...",
      "timestamp": "2026-05-05T12:00:00.000Z"
    }
  },
  "result": "success",
  "ipAddress": "192.168.1.100",
  "userAgent": "Mozilla/5.0...",
  "createdAt": "2026-05-05T12:00:01.000Z"
}
```

### **❌ Failed Password Change:**
```json
{
  "_id": "507f1f77bcf86cd799439021",
  "adminId": "507f1f77bcf86cd799439014",
  "actionType": "admin_password_change_failed",
  "targetId": "507f1f77bcf86cd799439014",
  "targetType": "Admin",
  "details": {
    "reason": "Incorrect current password",
    "metadata": {
      "adminName": "Admin User",
      "adminEmail": "admin@company.com",
      "ipAddress": "192.168.1.100",
      "userAgent": "Mozilla/5.0...",
      "timestamp": "2026-05-05T12:00:00.000Z"
    }
  },
  "result": "failure",
  "error": "Current password is incorrect",
  "ipAddress": "192.168.1.100",
  "userAgent": "Mozilla/5.0...",
  "createdAt": "2026-05-05T12:00:01.000Z"
}
```

---

## 🎯 Password Strength Scoring

### **✅ Scoring System (0-5):**

#### **1 Point Each For:**
- ✅ **Length ≥ 10 characters**
- ✅ **Contains uppercase letter** (A-Z)
- ✅ **Contains lowercase letter** (a-z)
- ✅ **Contains number** (0-9)
- ✅ **Contains special character** (@$!%*?&)

#### **✅ Minimum Required Score:** 4/5

### **✅ Example Scoring:**

#### **❌ Weak Password (Score: 2):**
```javascript
"Password123" // 10 chars + uppercase + lowercase + number = 4 points
"admin123"    // 8 chars + lowercase + number = 2 points (fails length)
```

#### **✅ Strong Password (Score: 5):**
```javascript
"AdminPass@2026!" // 14 chars + uppercase + lowercase + number + special = 5 points
```

---

## 🚀 Usage Examples

### **✅ JavaScript/React Example:**
```javascript
const changeAdminPassword = async (currentPassword, newPassword, confirmPassword) => {
  try {
    const response = await fetch('/api/auth/admin/change-password', {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        currentPassword,
        newPassword,
        confirmPassword
      })
    });

    const result = await response.json();

    if (result.success) {
      console.log('Password changed successfully');
      // Redirect to login page since sessions are revoked
      window.location.href = '/login';
    } else {
      console.error('Error:', result.error);
      // Show error message to user
      alert(result.error);
    }
  } catch (error) {
    console.error('Network error:', error);
  }
};

// Usage
changeAdminPassword(
  'CurrentPass123!',
  'NewSecureAdmin@2026',
  'NewSecureAdmin@2026'
);
```

### **✅ cURL Example:**
```bash
curl -X PUT \
  http://localhost:5000/api/auth/admin/change-password \
  -H 'Authorization: Bearer YOUR_ADMIN_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "currentPassword": "CurrentAdminPassword123!",
    "newPassword": "NewSecureAdminPassword@2026",
    "confirmPassword": "NewSecureAdminPassword@2026"
  }'
```

### **✅ React Component Example:**
```jsx
import React, { useState } from 'react';

const AdminPasswordChange = () => {
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/auth/admin/change-password', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const result = await response.json();

      if (result.success) {
        setSuccess(result.message);
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-group">
        <label>Current Password</label>
        <input
          type="password"
          name="currentPassword"
          value={formData.currentPassword}
          onChange={handleChange}
          required
        />
      </div>

      <div className="form-group">
        <label>New Password</label>
        <input
          type="password"
          name="newPassword"
          value={formData.newPassword}
          onChange={handleChange}
          required
        />
        <small>
          Must be at least 10 characters with uppercase, lowercase, number, and special character
        </small>
      </div>

      <div className="form-group">
        <label>Confirm New Password</label>
        <input
          type="password"
          name="confirmPassword"
          value={formData.confirmPassword}
          onChange={handleChange}
          required
        />
      </div>

      {error && <div className="error">{error}</div>}
      {success && <div className="success">{success}</div>}

      <button type="submit" disabled={loading}>
        {loading ? 'Changing...' : 'Change Password'}
      </button>
    </form>
  );
};
```

---

## 🔍 Testing the Endpoint

### **✅ Test Valid Password Change:**
```javascript
const testValidChange = async () => {
  const response = await fetch('/api/auth/admin/change-password', {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${adminToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      currentPassword: 'CurrentPass123!',
      newPassword: 'NewSecureAdmin@2026',
      confirmPassword: 'NewSecureAdmin@2026'
    })
  });
  
  console.log('Response:', await response.json());
};
```

### **✅ Test Weak Password:**
```javascript
const testWeakPassword = async () => {
  const response = await fetch('/api/auth/admin/change-password', {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${adminToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      currentPassword: 'CurrentPass123!',
      newPassword: 'weak',
      confirmPassword: 'weak'
    })
  });
  
  const result = await response.json();
  console.log('Expected error:', result.error);
  // Should return password strength error
};
```

### **✅ Test Wrong Current Password:**
```javascript
const testWrongPassword = async () => {
  const response = await fetch('/api/auth/admin/change-password', {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${adminToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      currentPassword: 'WrongPassword123!',
      newPassword: 'NewSecureAdmin@2026',
      confirmPassword: 'NewSecureAdmin@2026'
    })
  });
  
  const result = await response.json();
  console.log('Expected error:', result.error);
  // Should return "Current password is incorrect"
};
```

---

## 📋 Security Best Practices

### **✅ For Admins:**
- **Use unique passwords** not used elsewhere
- **Change passwords regularly** (every 90 days)
- **Use password managers** for secure storage
- **Enable 2FA** if available
- **Monitor audit logs** for suspicious activity

### **✅ For Developers:**
- **Always use HTTPS** in production
- **Implement rate limiting** for password changes
- **Log all attempts** (success and failure)
- **Monitor for brute force attacks**
- **Secure password storage** (bcrypt with proper salt rounds)

### **✅ For System Admins:**
- **Review audit logs** regularly
- **Set up alerts** for failed password attempts
- **Monitor IP addresses** for unusual patterns
- **Implement account lockout** after multiple failed attempts
- **Regular security audits** of password policies

---

## 🚨 Troubleshooting

### **✅ Common Issues:**

#### **❌ "Access Denied" Error:**
- **Cause:** User is not admin or lacks permission
- **Solution:** Verify user role and permissions

#### **❌ "Password Not Strong Enough" Error:**
- **Cause:** Password doesn't meet strength requirements
- **Solution:** Use password with uppercase, lowercase, numbers, special chars, min 10 chars

#### **❌ "Current Password Incorrect" Error:**
- **Cause:** Wrong current password provided
- **Solution:** Verify current password or reset if forgotten

#### **❌ "Validation Failed" Error:**
- **Cause:** Request body missing required fields
- **Solution:** Ensure all required fields are present and valid

---

## 📊 Comparison: Regular vs Admin Password Change

| Feature | Regular Change | Admin Change |
|---------|----------------|--------------|
| **Min Length** | 8 characters | 10 characters |
| **Special Chars** | Optional | Required |
| **Permission** | None | `manage_admin_settings` |
| **Audit Level** | Standard | Enhanced |
| **Password Strength** | Basic check | Score-based (4/5 min) |
| **Session Revocation** | All sessions | All sessions |
| **Failed Attempt Logging** | Basic | Detailed |

---

**🎯 The admin password change endpoint provides enhanced security with comprehensive validation, audit logging, and session management!**
