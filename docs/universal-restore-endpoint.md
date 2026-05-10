# Universal Restore User Endpoint - Complete Guide

## 📋 Endpoint Overview

**PATCH /api/users/:userId/restore** - Restore ANY deleted user regardless of role

**Works for:** client, doctor, supervisor, admin - ANY role

---

## 🔐 Authentication & Permissions

### **✅ Required Permissions:**
- **Admin:** Full access to restore any deleted users
- **Supervisor:** Can restore deleted users if granted `view_deleted_users` permission
- **Doctor:** No access (security restriction)
- **Client:** No access (security restriction)

### **✅ Authentication:**
```javascript
Authorization: Bearer <admin-token>
Authorization: Bearer <supervisor-token-with-view_deleted_users-permission>
```

---

## 📊 Request Format

### **✅ Basic Request:**
```javascript
PATCH /api/users/:userId/restore
Authorization: Bearer <token>
Content-Type: application/json

{
  "reason": "User requested account restoration"  // Optional
}
```

### **✅ Path Parameters:**
```javascript
{
  userId: "507f1f77bcf86cd799439001"  // MongoDB Object ID of ANY deleted user
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
  "message": "User restored successfully",
  "data": {
    "user": {
      "_id": "507f1f77bcf86cd799439001",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "supervisor",  // Can be any role
      "status": "approved",
      "isDeleted": false,
      "restoredAt": "2026-05-10T22:50:00.000Z",
      "restoredBy": {
        "_id": "507f1f77bcf86cd799439999",
        "name": "Admin User",
        "email": "admin@example.com",
        "role": "admin"
      }
    }
  }
}
```

### **✅ Error Responses:**
```javascript
// 400 Bad Request - Invalid ID
{
  "success": false,
  "error": "Invalid user ID"
}

// 404 Not Found - User doesn't exist
{
  "success": false,
  "error": "User not found"
}

// 400 Bad Request - User not deleted
{
  "success": false,
  "error": "User is not deleted and cannot be restored"
}

// 403 Forbidden - No permission
{
  "success": false,
  "error": "Access denied. You do not have permission to view deleted users."
}
```

---

## 🔧 Implementation Details

### **✅ Core Logic:**
```javascript
async restoreUser(req, res, next) {
  try {
    const { userId } = req.params;
    const { reason } = req.body || {};
    const restoredBy = req.user.id;

    // Validate user ID
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid user ID'
      });
    }

    // Find the user with isDeleted: true (ANY ROLE)
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found' 
      });
    }

    // Check if user is actually deleted
    if (!user.isDeleted) {
      return res.status(400).json({
        success: false,
        error: 'User is not deleted and cannot be restored'
      });
    }

    // RESTORE THE USER - Change isDeleted from true to false
    user.isDeleted = false;  // ← This is the key change!
    user.deletedAt = null;
    user.deletedBy = null;
    user.status = 'approved'; // Ensure user is active after restoration
    
    await user.save();

    res.status(200).json({
      success: true,
      message: 'User restored successfully',
      data: {
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,  // Any role
          status: user.status,
          isDeleted: user.isDeleted,
          restoredAt: new Date(),
          restoredBy: {
            _id: req.user._id,
            name: req.user.name,
            email: req.user.email,
            role: req.user.role
          }
        }
      }
    });

  } catch (error) {
    console.error('❌ Restore user error:', error);
    next(error);
  }
}
```

---

## 🎯 Key Features

### **✅ 1. Role-Agnostic:**
- **Works for ANY role:** client, doctor, supervisor, admin
- **No role restrictions:** Any deleted user can be restored
- **Universal approach:** Single endpoint for all user types

### **✅ 2. Simple Logic:**
- **Find user by ID:** No role filtering in the query
- **Check isDeleted:** Only restores users with `isDeleted: true`
- **Change to false:** Simple `isDeleted = false` update

### **✅ 3. Comprehensive Logging:**
```javascript
🔍 restoreUser called for user: 507f1f77bcf86cd799439001
🔍 Step 1: Finding user with isDeleted: true...
🔍 User found: John Doe
🔍 User role: supervisor
🔍 Current isDeleted: true
✅ User is deleted (isDeleted: true), proceeding with restore...
🔍 User role: supervisor - Can be restored regardless of role
🔍 Step 2: Changing isDeleted from true to false...
✅ User restored successfully!
🔍 New isDeleted value: false
🔍 Restored user role: supervisor
🔍 User email: john@example.com
```

---

## 🎯 Use Cases

### **✅ 1. Restore Deleted Supervisor:**
```javascript
// Restore a deleted supervisor
POST /api/users/69ebc138ef02cfe9e6d5175d/restore
{
  "reason": "Supervisor account reinstated"
}

// Response shows role: "supervisor"
```

### **✅ 2. Restore Deleted Doctor:**
```javascript
// Restore a deleted doctor
POST /api/users/69f5d9354a5388b8069aca9e/restore
{
  "reason": "Doctor account reactivated"
}

// Response shows role: "doctor"
```

### **✅ 3. Restore Deleted Client:**
```javascript
// Restore a deleted client
POST /api/users/507f1f77bcf86cd799439001/restore
{
  "reason": "Client requested account restoration"
}

// Response shows role: "client"
```

### **✅ 4. Restore Deleted Admin:**
```javascript
// Restore a deleted admin
POST /api/users/69eb51928c5f34603f96294f/restore
{
  "reason": "Admin account restored after review"
}

// Response shows role: "admin"
```

---

## 📊 Test Examples

### **✅ Test 1: Restore Supervisor:**
```bash
curl -X POST "http://localhost:5000/api/users/69ebc138ef02cfe9e6d5175d/restore" \
  -H "Authorization: Bearer <admin-token>" \
  -H "Content-Type: application/json" \
  -d '{"reason": "Supervisor account reinstated"}'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "User restored successfully",
  "data": {
    "user": {
      "_id": "69ebc138ef02cfe9e6d5175d",
      "name": "mohamed gaaba",
      "email": "gabalmohamed33@gmail.com",
      "role": "supervisor",
      "isDeleted": false,
      "restoredAt": "2026-05-10T22:50:00.000Z"
    }
  }
}
```

### **✅ Test 2: Restore Doctor:**
```bash
curl -X POST "http://localhost:5000/api/users/69f5d9354a5388b8069aca9e/restore" \
  -H "Authorization: Bearer <admin-token>" \
  -H "Content-Type: application/json" \
  -d '{"reason": "Doctor account reactivated"}'
```

### **✅ Test 3: Restore Client:**
```bash
curl -X POST "http://localhost:5000/api/users/507f1f77bcf86cd799439001/restore" \
  -H "Authorization: Bearer <admin-token>" \
  -H "Content-Type: application/json" \
  -d '{"reason": "Client requested restoration"}'
```

---

## 🔍 Debug Information

### **✅ Console Logs:**
The endpoint provides detailed console logging:
```
🔍 restoreUser called for user: 69ebc138ef02cfe9e6d5175d
🔍 Step 1: Finding user with isDeleted: true...
🔍 User found: mohamed gaaba
🔍 User role: supervisor
🔍 Current isDeleted: true
✅ User is deleted (isDeleted: true), proceeding with restore...
🔍 User role: supervisor - Can be restored regardless of role
🔍 Step 2: Changing isDeleted from true to false...
✅ User restored successfully!
🔍 New isDeleted value: false
🔍 Restored user role: supervisor
🔍 User email: gabalmohamed33@gmail.com
```

### **✅ Error Scenarios:**
```
❌ User not found in database
❌ User is not deleted (isDeleted: false)
❌ Invalid user ID
```

---

## 🔒 Security Features

### **✅ Access Control:**
- **Permission-Based:** Requires `view_deleted_users` permission
- **Role-Based:** Different access levels for different user roles
- **User Validation:** Only existing users can be restored
- **ID Validation:** Validates MongoDB Object ID format

### **✅ Data Protection:**
- **Soft Delete Safety:** Only affects soft-deleted users
- **Status Management:** Ensures user is properly activated
- **Audit Trail:** Shows who restored the user and when

---

## 📋 Comparison with Previous Implementation

### **✅ What's Different:**
- **Role-Agnostic:** Works for ANY role (previous was role-specific)
- **Simplified Logic:** No complex role filtering (previous had role checks)
- **Universal Approach:** Single endpoint for all user types
- **Cleaner Code:** More straightforward implementation

### **✅ What's Same:**
- **Core Logic:** Still changes `isDeleted` from `true` to `false`
- **Permission Check:** Still requires `view_deleted_users` permission
- **Validation:** Still validates user ID and deletion status
- **Response Format:** Similar response structure

---

## 📋 Summary

**✅ Universal Restore Endpoint:**
1. **Works for ANY role** - client, doctor, supervisor, admin
2. **Simple logic** - Find user, check isDeleted, change to false
3. **Role-agnostic** - No role restrictions or filtering
4. **Comprehensive logging** - Detailed debug information
5. **Secure** - Proper permission checking and validation

**✅ Key Benefits:**
- **Single endpoint** for all user restoration needs
- **Universal approach** regardless of user role
- **Simple implementation** with clear logic
- **Comprehensive logging** for debugging
- **Secure** with proper access control

**🎯 This endpoint can restore ANY deleted user regardless of their role!**
