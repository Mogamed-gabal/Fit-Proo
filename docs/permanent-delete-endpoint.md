# Permanent Delete User Endpoint - Complete Guide

## 📋 Endpoint Overview

**DELETE /api/users/:userId/permanent** - Permanently delete ANY user regardless of role

**Works for:** client, doctor, supervisor, admin - ANY role

---

## 🔐 Authentication & Permissions

### **✅ Required Permissions:**
- **Admin:** Full access to permanently delete any users
- **Supervisor:** Can permanently delete users if granted `permanent_delete_users` permission
- **Doctor:** No access (security restriction)
- **Client:** No access (security restriction)

### **✅ Authentication:**
```javascript
Authorization: Bearer <admin-token>
Authorization: Bearer <supervisor-token-with-permanent_delete_users-permission>
```

---

## 📊 Request Format

### **✅ Basic Request:**
```javascript
DELETE /api/users/:userId/permanent
Authorization: Bearer <token>
Content-Type: application/json

{
  "reason": "User violated terms of service"  // Optional, 3-500 characters
}
```

### **✅ Path Parameters:**
```javascript
{
  userId: "69fa42f6596fa8c27f4e4836"  // MongoDB Object ID of any user
}
```

### **✅ Request Body:**
```javascript
{
  "reason": "string (optional, 3-500 characters)"
}
```

---

## 📊 Response Format

### **✅ Success Response (200):**
```json
{
  "success": true,
  "message": "User permanently deleted successfully",
  "data": {
    "deletedUser": {
      "_id": "69fa42f6596fa8c27f4e4836",
      "name": "mohamed gaaba",
      "email": "gabalmohamed35@gmail.com",
      "role": "supervisor",
      "status": "approved",
      "isDeleted": true,
      "deletedAt": "2026-05-05T19:23:34.381Z"
    },
    "deletedBy": {
      "_id": "69eb51928c5f34603f96294f",
      "name": "System Administrator",
      "email": "admin@fitness.com",
      "role": "admin"
    },
    "deletedAt": "2026-05-10T23:45:00.000Z",
    "reason": "User violated terms of service"
  }
}
```

### **✅ Response Fields Explanation:**
```javascript
{
  "success": true,              // Operation successful
  "message": "User permanently deleted successfully",
  "data": {
    "deletedUser": {             // User info before deletion
      "_id": "string",           // User's MongoDB ID
      "name": "string",          // User's full name
      "email": "string",         // User's email address
      "role": "string",          // User's role (client, doctor, supervisor, admin)
      "status": "string",        // User's status before deletion
      "isDeleted": "boolean",     // User's deletion status before deletion
      "deletedAt": "string"       // When user was soft-deleted (if applicable)
    },
    "deletedBy": {              // Who performed the permanent deletion
      "_id": "string",
      "name": "string",
      "email": "string",
      "role": "string"
    },
    "deletedAt": "string",       // When permanent deletion occurred
    "reason": "string"           // Reason for permanent deletion
  }
}
```

---

## ❌ Error Responses

### **✅ 400 Bad Request - Invalid User ID:**
```json
{
  "success": false,
  "error": "Invalid user ID"
}
```

### **✅ 404 Not Found - User Not Found:**
```json
{
  "success": false,
  "error": "User not found in database"
}
```

### **✅ 403 Forbidden - No Permission:**
```json
{
  "success": false,
  "error": "Access denied. You do not have permission to permanently delete users."
}
```

### **✅ 401 Unauthorized - Invalid Token:**
```json
{
  "success": false,
  "error": "Access token is required"
}
```

---

## 🎯 Usage Examples

### **✅ JavaScript/Fetch Example:**
```javascript
const permanentDeleteUser = async (userId, reason = '') => {
  try {
    const response = await fetch(`/api/users/${userId}/permanent`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        reason: reason || 'Administrative deletion'
      })
    });

    const result = await response.json();

    if (result.success) {
      console.log('User permanently deleted:', result.data.deletedUser);
      return result.data;
    } else {
      console.error('Permanent delete failed:', result.error);
      throw new Error(result.error);
    }
  } catch (error) {
    console.error('Network error:', error);
    throw error;
  }
};

// Usage
permanentDeleteUser('69fa42f6596fa8c27f4e4836', 'User violated terms of service')
  .then(result => {
    // Handle success - update UI, show notification, etc.
    showSuccessNotification(`${result.deletedUser.name} has been permanently deleted`);
    // Remove user from all lists
    removeUserFromAllLists(result.deletedUser._id);
  })
  .catch(error => {
    // Handle error - show error message
    showErrorNotification(error.message);
  });
```

### **✅ Axios Example:**
```javascript
import axios from 'axios';

const permanentDeleteUser = async (userId, reason) => {
  try {
    const response = await axios.delete(`/api/users/${userId}/permanent`, {
      data: {
        reason: reason
      },
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    });

    return response.data.data;
  } catch (error) {
    if (error.response) {
      throw new Error(error.response.data.error);
    }
    throw error;
  }
};
```

---

## 🔍 Frontend Implementation Guide

### **✅ Step 1: Get Users List**
```javascript
const getAllUsers = async () => {
  const response = await fetch('/api/users', {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    }
  });
  
  const result = await response.json();
  return result.data.users;
};
```

### **✅ Step 2: Implement Permanent Delete Function**
```javascript
const handlePermanentDelete = async (userId, userName, userRole) => {
  // Show confirmation dialog
  const confirmed = window.confirm(
    `⚠️ WARNING: This will permanently delete ${userName} (${userRole}).\n\n` +
    `This action cannot be undone. Are you absolutely sure?`
  );
  
  if (!confirmed) return;

  // Second confirmation
  const reason = prompt('Please provide a reason for permanent deletion:');
  if (!reason || reason.trim().length < 3) {
    showErrorNotification('Reason must be at least 3 characters');
    return;
  }

  try {
    const result = await permanentDeleteUser(userId, reason);
    
    // Show success notification
    showSuccessNotification(`${result.deletedUser.name} has been permanently deleted`);
    
    // Refresh users list
    await loadUsers();
    
    // Show audit notification
    showAuditNotification(`Audit log created for permanent deletion`);
    
  } catch (error) {
    // Handle error
    showErrorNotification(`Failed to delete user: ${error.message}`);
  }
};
```

### **✅ Step 3: UI Component Example**
```javascript
const UsersList = ({ users, onPermanentDelete }) => {
  return (
    <div className="users-list">
      {users.map(user => (
        <div key={user._id} className="user-item">
          <div className="user-info">
            <h4>{user.name}</h4>
            <p>{user.email}</p>
            <span className="role">{user.role}</span>
            <span className={`status ${user.isDeleted ? 'deleted' : 'active'}`}>
              {user.isDeleted ? 'Deleted' : 'Active'}
            </span>
          </div>
          <div className="actions">
            {user.isDeleted && (
              <button 
                onClick={() => onPermanentDelete(user._id, user.name, user.role)}
                className="permanent-delete-btn"
                title="Permanently delete this user (cannot be undone)"
              >
                🗑️ Permanent Delete
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
```

---

## 🔧 Integration Tips

### **✅ Error Handling:**
```javascript
const permanentDeleteWithHandling = async (userId, reason) => {
  try {
    const result = await permanentDeleteUser(userId, reason);
    
    // Show success notification
    toast.success(`${result.deletedUser.name} has been permanently deleted`);
    
    // Update local state
    setUsers(prev => prev.filter(u => u._id !== userId));
    
    // Show warning about audit
    toast.warning('Audit log has been created for this action');
    
  } catch (error) {
    // Show appropriate error message
    if (error.message.includes('permission')) {
      toast.error('You don\'t have permission to permanently delete users');
    } else if (error.message.includes('not found')) {
      toast.error('User not found');
    } else {
      toast.error(`Failed to delete user: ${error.message}`);
    }
  }
};
```

### **✅ Loading States:**
```javascript
const [deleting, setDeleting] = useState({});

const handlePermanentDelete = async (userId, userName, userRole) => {
  setDeleting(prev => ({ ...prev, [userId]: true }));
  
  try {
    await permanentDeleteUser(userId, 'Administrative deletion');
    // Handle success
  } catch (error) {
    // Handle error
  } finally {
    setDeleting(prev => ({ ...prev, [userId]: false }));
  }
};

// In UI:
<button 
  onClick={() => handlePermanentDelete(user._id, user.name, user.role)}
  disabled={deleting[user._id]}
  className="permanent-delete-btn"
>
  {deleting[user._id] ? 'Deleting...' : '🗑️ Permanent Delete'}
</button>
```

---

## 🔍 Console Output Examples

### **✅ Success Case:**
```
🔍 permanentDeleteUser called for user: 69fa42f6596fa8c27f4e4836
🔍 Step 1: Finding user for permanent deletion...
🔍 Using direct MongoDB query for permanent deletion
🔍 ✅ User found in database!
🔍 User name: mohamed gaaba
🔍 User email: gabalmohamed35@gmail.com
🔍 User role: supervisor
🔍 User isDeleted status: true
✅ Proceeding with permanent deletion for user: mohamed gaaba with role: supervisor
🔍 Step 2: Permanently deleting user from database...
✅ User permanently deleted from database!
🔍 Delete result: { acknowledged: true, deletedCount: 1 }
🗑️ User permanently deleted: {
  deletedBy: 69eb51928c5f34603f96294f,
  deletedUser: { name: 'mohamed gaaba', email: 'gabalmohamed35@gmail.com', role: 'supervisor' },
  reason: 'User violated terms of service'
}
```

---

## 📋 Testing Checklist

### **✅ Frontend Tests:**
- [ ] Test with valid user ID
- [ ] Test with invalid user ID
- [ ] Test without authentication token
- [ ] Test with insufficient permissions
- [ ] Test with empty reason
- [ ] Test with short reason (<3 chars)
- [ ] Test with long reason (>500 chars)
- [ ] Test network error handling
- [ ] Test loading states
- [ ] Test UI updates after deletion

### **✅ Integration Tests:**
- [ ] Verify user disappears from all lists after deletion
- [ ] Verify audit log is created
- [ ] Verify error messages are user-friendly
- [ ] Verify confirmation dialogs work properly

---

## 🔍 Important Notes

### **⚠️ Permanent Deletion:**
- **Cannot be undone** - User is completely removed from database
- **Audit trail created** - All actions are logged
- **Requires confirmation** - Multiple confirmation steps recommended
- **High-level permission** - Only admins and authorized supervisors

### **✅ Best Practices:**
- **Double confirmation** - Always ask user to confirm twice
- **Reason required** - Always capture why user is being deleted
- **Audit logging** - All deletions are automatically logged
- **Error handling** - Graceful error messages for users

---

## 📋 Summary

**✅ Endpoint Details:**
- **Method:** DELETE
- **URL:** `/api/users/:userId/permanent`
- **Authentication:** Required (Bearer token)
- **Permissions:** `permanent_delete_users` required
- **Body:** Optional `reason` field

**✅ Key Features:**
- **Role-agnostic:** Works for any user role
- **Direct database access:** Uses MongoDB directly for reliability
- **Comprehensive logging:** Detailed operation tracking
- **Audit trail:** Automatic audit log creation
- **Error handling:** Clear error messages and status codes

**✅ Frontend Integration:**
- **Simple REST API:** Standard HTTP methods and responses
- **Clear success/error responses:** Easy to handle in UI
- **Real-time updates:** User status changes immediately
- **Permission-based:** Respects user access levels

**⚠️ Warning:** This endpoint permanently removes users from the database. Use with extreme caution and ensure proper authorization and confirmation steps.

**🎯 This endpoint is ready for frontend integration and provides all necessary data for a complete permanent user deletion feature!**
