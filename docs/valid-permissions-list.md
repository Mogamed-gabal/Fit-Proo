# Valid Permission Names

## 📋 Complete List of All Available Permissions

This document contains ALL valid permission names that can be used with the permission system. Use these exact names when making API calls.

---

## 🔐 SYSTEM_ADMINISTRATION (6 permissions)

| Permission Name | Description | Level | Assignable |
|----------------|-------------|-------|------------|
| `manage_users` | Full user management access | SYSTEM | ✅ |
| `manage_doctors` | Manage doctor accounts and profiles | SYSTEM | ✅ |
| `access_admin_panel` | Access admin dashboard and panels | SYSTEM | ✅ |
| `view_sensitive_data` | View sensitive user and system data | SYSTEM | ✅ |
| `export_user_data` | Export user data and reports | SYSTEM | ✅ |
| `view_system_reports` | View system analytics and reports | SYSTEM | ✅ |

---

## 📦 BUNDLE_MANAGEMENT (1 permission)

| Permission Name | Description | Level | Assignable |
|----------------|-------------|-------|------------|
| `MANAGE_BUNDLES` | Allow user to manage doctor bundles | SYSTEM | ✅ |

---

## 🥗 DIET_MANAGEMENT (1 permission)

| Permission Name | Description | Level | Assignable |
|----------------|-------------|-------|------------|
| `manage_diet_plans` | Create and manage diet plans | SYSTEM | ✅ |

---

## 💪 WORKOUT_MANAGEMENT (4 permissions)

| Permission Name | Description | Level | Assignable |
|----------------|-------------|-------|------------|
| `manage_client_workout_plans` | Manage client workout plans | SYSTEM | ✅ |
| `view_client_workout_plans` | View client workout plans | SYSTEM | ✅ |
| `view_client_progress` | View client progress and analytics | SYSTEM | ✅ |
| `manage_workout_templates` | Create and manage workout templates | SYSTEM | ✅ |

---

## 👥 USER_MANAGEMENT (9 permissions)

| Permission Name | Description | Level | Assignable |
|----------------|-------------|-------|------------|
| `read_users` | Read user information and profiles | LIMITED | ✅ |
| `read_dashboard` | Access main dashboard | LIMITED | ✅ |
| `read_subscriptions` | Read subscription information | LIMITED | ✅ |
| `block_client` | Block client accounts | LIMITED | ✅ |
| `unblock_client` | Unblock client accounts | LIMITED | ✅ |
| `read_user_details` | Read detailed user information | LIMITED | ✅ |
| `manage_users_limited` | Limited user management capabilities | LIMITED | ✅ |
| `manage_supervisors` | Manage supervisor accounts | LIMITED | ✅ |
| `read_audit_logs` | Read system audit logs | LIMITED | ✅ |

---

## 📊 AUDIT_MANAGEMENT (3 permissions)

| Permission Name | Description | Level | Assignable |
|----------------|-------------|-------|------------|
| `read_supervisor_audit` | Read supervisor audit logs | SYSTEM | ✅ |
| `export_supervisor_audit` | Export supervisor audit data | SYSTEM | ✅ |
| `manage_supervisor_audit` | Manage supervisor audit system | SYSTEM | ✅ |

---

## 🔐 PERMISSION_MANAGEMENT (2 permissions)

| Permission Name | Description | Level | Assignable |
|----------------|-------------|-------|------------|
| `read_permissions` | Read permission assignments | SYSTEM | ✅ |
| `manage_permissions` | Manage system permissions | SYSTEM | ✅ |

---

## 👤 SELF_MANAGEMENT (13 permissions)

| Permission Name | Description | Level | Assignable |
|----------------|-------------|-------|------------|
| `read_own_profile` | Read own profile information | PERSONAL | ❌ |
| `manage_own_subscriptions` | Manage own subscriptions | PERSONAL | ❌ |
| `read_own_subscriptions` | Read own subscription information | PERSONAL | ❌ |
| `manage_own_certificates` | Manage own certificates | PERSONAL | ❌ |
| `manage_own_packages` | Manage own service packages | PERSONAL | ❌ |
| `manage_own_bio` | Manage own biography information | PERSONAL | ❌ |
| `update_own_profile` | Update own profile information | PERSONAL | ❌ |
| `manage_own_profile_picture` | Manage own profile picture | PERSONAL | ❌ |
| `read_own_weight` | Read own weight tracking | PERSONAL | ❌ |
| `manage_own_weight` | Manage own weight tracking | PERSONAL | ❌ |
| `manage_own_progress` | Manage own progress tracking | PERSONAL | ❌ |
| `view_own_progress` | View own progress tracking | PERSONAL | ❌ |

---

## 🎯 Usage Examples

### **✅ Valid API Calls:**

#### **Grant Permission:**
```javascript
// ✅ CORRECT - Use exact permission name
const response = await fetch('/api/permissions/grant', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${adminToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    userId: "69ebc138ef02cfe9e6d5175d",
    permissionName: "MANAGE_BUNDLES", // ✅ Exact match
    expiresAt: "2026-12-31T23:59:59.000Z",
    reason: "Supervisor needs bundle management for Q4 project"
  })
});
```

#### **Common Supervisor Permissions:**
```javascript
// ✅ Bundle Management
"MANAGE_BUNDLES"

// ✅ User Management (Limited)
"read_users"
"read_dashboard"
"block_client"
"unblock_client"
"read_audit_logs"

// ✅ Subscription Access
"read_subscriptions"

// ✅ User Details
"read_user_details"
"manage_users_limited"
```

---

### **❌ Invalid API Calls:**

#### **❌ Wrong Permission Names:**
```javascript
// ❌ INCORRECT - These will fail
"manage_bundles"           // Wrong case
"MANAGE_BUNDLE"            // Missing 'S'
"manage_bundle"            // Wrong case and missing 'S'
"readUser"                 // Wrong format
"VIEW_AUDIT_LOGS"          // Wrong case
```

#### **❌ Non-assignable Permissions:**
```javascript
// ❌ These CANNOT be assigned (isAssignable: false)
"read_own_profile"
"manage_own_subscriptions"
"update_own_profile"
// ... all PERSONAL level permissions
```

---

## 📊 Permission Levels Explained

### **✅ SYSTEM (26 permissions):**
- **Full system access**
- **Admin approval required**
- **All are assignable**

### **✅ LIMITED (9 permissions):**
- **Restricted access**
- **Safe for supervisors**
- **All are assignable**

### **❌ PERSONAL (13 permissions):**
- **Self-management only**
- **Auto-assigned by role**
- **NOT assignable manually**

---

## 🔍 Quick Reference for Frontend

### **Most Common Supervisor Permissions:**
```javascript
const SUPERVISOR_PERMISSIONS = [
  "MANAGE_BUNDLES",           // Bundle management
  "read_users",               // View users
  "read_dashboard",           // Dashboard access
  "read_subscriptions",       // View subscriptions
  "block_client",             // Block clients
  "unblock_client",           // Unblock clients
  "read_audit_logs",          // View audit logs
  "read_user_details",        // View user details
  "manage_users_limited"      // Limited user management
];
```

### **Admin-Only Permissions:**
```javascript
const ADMIN_ONLY_PERMISSIONS = [
  "manage_users",
  "manage_doctors", 
  "access_admin_panel",
  "view_sensitive_data",
  "export_user_data",
  "view_system_reports",
  "manage_diet_plans",
  "manage_client_workout_plans",
  "view_client_workout_plans",
  "view_client_progress",
  "manage_workout_templates",
  "read_supervisor_audit",
  "export_supervisor_audit",
  "manage_supervisor_audit",
  "read_permissions",
  "manage_permissions"
];
```

---

## ⚠️ Important Notes

1. **Use exact names** - Case-sensitive, no spaces
2. **Check assignability** - PERSONAL permissions cannot be granted
3. **Validate before sending** - Use `/api/permissions/all` to get current list
4. **Role-appropriate** - Don't grant SYSTEM permissions to supervisors unless needed

---

**Total: 42 permissions (29 assignable, 13 auto-assigned)**
**Use these exact names to avoid "Permission not found" errors!** 🎯
