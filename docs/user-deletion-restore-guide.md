# User Deletion & Restore Guide

## 🗑️ Permanently Delete User or Supervisor

**Endpoint:** `DELETE /api/users/:userId/permanent`

**Purpose:** Completely remove a user or supervisor from the database (irreversible)
**For:** All users (clients, doctors, nutritionists, therapists, coaches, supervisors)
**Note:** User/supervisor must be soft-deleted first

**Request:**
```bash
DELETE /api/users/507f1f77bcf86cd799439011/permanent
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "reason": "Account cleanup - user request"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User permanently deleted successfully",
  "data": {
    "deletedUser": {
      "_id": "507f1f77bcf86cd799439011",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "client"
    },
    "deletedBy": "admin_id",
    "deletedAt": "2024-05-02T15:30:00Z",
    "reason": "Account cleanup - user request"
  }
}
```

**Requirements:**
- `permanent_delete_users` permission
- User must be admin or supervisor
- User must be soft-deleted first
- Provide deletion reason (optional but recommended)

---

## 👨‍💼 Soft Delete Supervisor

**Endpoint:** `DELETE /api/admin/supervisors/:userId`

**Purpose:** Soft delete a supervisor (marks as deleted, reversible)
**For:** Supervisors only
**Note:** This is soft delete, not permanent deletion

**Request:**
```bash
DELETE /api/admin/supervisors/507f1f77bcf86cd799439011
Authorization: Bearer <admin_token>
```

**Response:**
```json
{
  "success": true,
  "message": "Supervisor deleted successfully",
  "data": {
    "user": {
      "_id": "507f1f77bcf86cd799439011",
      "name": "John Supervisor",
      "email": "supervisor@company.com",
      "role": "supervisor",
      "isDeleted": true,
      "deletedAt": "2026-05-02T15:30:00Z",
      "deletedBy": "admin_id"
    }
  }
}
```

**Requirements:**
- `manage_supervisors` permission
- User must be admin
- Target user must be a supervisor

---

## 🔄 Restore Deleted User

**Endpoint:** `POST /api/users/:userId/restore`

**Purpose:** Restore a soft-deleted user back to active status

**Request:**
```bash
POST /api/users/507f1f77bcf86cd799439011/restore
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "reason": "User requested account restoration"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User restored successfully",
  "data": {
    "user": {
      "_id": "507f1f77bcf86cd799439011",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "client",
      "isDeleted": false,
      "status": "active",
      "restoredAt": "2024-05-02T16:00:00Z",
      "restoredBy": "admin_id"
    },
    "reason": "User requested account restoration"
  }
}
```

**Requirements:**
- `restore_deleted_users` permission
- User must be admin or supervisor
- User must be soft-deleted (`isDeleted: true`)

---

## ⚠️ Key Differences

| Feature | Permanent Delete (All Users) | Soft Delete (Supervisors) | Restore |
|---------|-----------------------------|----------------------------|---------|
| **Action** | Irreversible removal | Marks as deleted | Reversible recovery |
| **Data Loss** | Complete data loss | No data loss | No data loss |
| **User Status** | Gone from system | Deleted but recoverable | Back to active |
| **Endpoint** | `/api/users/:id/permanent` | `/api/admin/supervisors/:id` | `/api/users/:id/restore` |
| **Target** | All users (including supervisors) | Supervisors only | Any deleted user |
| **Use Case** | Legal/compliance removal | Temporary suspension | Mistaken deletion |

---

## 🚨 Important Notes

### **Permanent Delete:**
- ❌ **Cannot be undone**
- ❌ **All data lost forever**
- ❌ **User must re-register**
- ✅ **Required for GDPR requests**
- ✅ **Use for legal compliance**

### **Restore:**
- ✅ **Reversible action**
- ✅ **All data preserved**
- ✅ **User can login immediately**
- ✅ **No data loss**
- ✅ **Use for accidental deletions**

---

## 📋 Common Use Cases

### **Use Permanent Delete When:**
- User requests data removal (GDPR)
- Legal requirement to delete data
- Fake/spam account cleanup
- Security breach response

### **Use Restore When:**
- Accidental user deletion
- User wants account back
- System error during deletion
- Temporary suspension ended

---

## 🔍 Check User Status

**Before restore, check if user is deleted:**
```bash
GET /api/users/507f1f77bcf86cd799439011
```

**Look for:**
```json
{
  "isDeleted": true,
  "deletedAt": "2024-05-02T12:00:00Z"
}
```

---

## 🚨 Error Handling

### **Common Errors:**
- `404 Not Found` - User doesn't exist
- `403 Forbidden` - Missing permissions
- `400 Bad Request` - User not deleted (for restore)
- `500 Internal Error` - System issue

### **Error Response:**
```json
{
  "success": false,
  "error": "User not found or not deleted",
  "code": "USER_NOT_DELETED"
}
```

---

## 📊 Audit Trail

Both actions create audit logs:
- **Who performed the action**
- **When it was performed**
- **Reason provided**
- **User affected**

**View audit logs:**
```bash
GET /api/audit/logs?actionType=permanent_delete_user
GET /api/audit/logs?actionType=restore_user
```

---

**⚠️ Remember: Permanent delete is forever. Always double-check before using it!**
