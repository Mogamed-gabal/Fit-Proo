# 🔐 USER BLOCKING FUNCTIONALITY - TECHNICAL REPORT

---

## **📋 OVERVIEW**

This report provides complete technical details about user blocking functionality in the fitness-app backend.

---

## **🔧 1. ENDPOINTS RELATED TO BLOCKING/UNBLOCKING USERS**

### **🟢 AUTH ROUTES (`/api/auth/admin/*`)**

| Endpoint | Method | Full Path | Request Body | Response |
|----------|--------|-----------|--------------|----------|
| Block User | POST | `/api/auth/admin/block/:userId` | `{ "reason": "string" (optional) }` | `{ "success": true, "message": "User blocked successfully" }` |
| Unblock User | POST | `/api/auth/admin/unblock/:userId` | `{ "reason": "string" (optional) }` | `{ "success": true, "message": "User unblocked successfully" }` |

### **🔵 ADMIN ROUTES (`/api/admin/*`)**

| Endpoint | Method | Full Path | Request Body | Response |
|----------|--------|-----------|--------------|----------|
| Block User | POST | `/api/admin/users/:userId/block` | `{ "reason": "string" (optional) }` | `{ "success": true, "message": "User blocked successfully", "data": { "user": {...} } }` |
| Unblock User | POST | `/api/admin/users/:userId/unblock` | `{ "reason": "string" (optional) }` | `{ "success": true, "message": "User unblocked successfully", "data": { "user": {...} } }` |

---

## **🎮 2. CONTROLLER FUNCTIONS**

### **🟢 AUTH CONTROLLER**
**File Location:** `src/controllers/authController.js`

| Function | Lines | Description |
|----------|-------|-------------|
| `blockUser` | 538-566 | Simple blocking logic |
| `unblockUser` | 568-589 | Simple unblocking logic |

### **🔵 ADMIN CONTROLLER**
**File Location:** `src/controllers/adminController.js`

| Function | Lines | Description |
|----------|-------|-------------|
| `blockUser` | 90-122 | Advanced blocking with audit |
| `unblockUser` | 127-172 | Advanced unblocking with audit |

---

## **🗄️ 3. USER MODEL FIELDS**

### **🔍 Blocking Fields in User Model**
**File Location:** `src/models/User.js` (lines 67-75)

```javascript
isBlocked: {
  type: Boolean,
  default: false
},
blockedAt: Date,
blockedBy: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'User'
}
```

### **📊 Field Values**
- **`isBlocked`**: `true` (blocked) / `false` (not blocked)
- **`blockedAt`**: Timestamp when user was blocked (null if not blocked)
- **`blockedBy`**: User ID of admin who blocked the user (null if not blocked)

---

## **🔄 4. DATABASE BEHAVIOR**

### **🔴 BLOCKING A USER**
**Changes made to database:**
- ✅ `isBlocked` → `true`
- ✅ `blockedAt` → `new Date()`
- ✅ `blockedBy` → `req.user.userId`

### **🟢 UNBLOCKING A USER**
**Changes made to database:**
- ✅ `isBlocked` → `false`
- ✅ `blockedAt` → `undefined`
- ✅ `blockedBy` → `undefined`

### **📈 Additional Operations**
- **Auth Controller**: Revokes all user tokens + sends blocked email
- **Admin Controller**: Uses audit middleware + transaction handling

---

## **📋 5. ENDPOINTS FOR RETRIEVING BLOCKED USERS**

### **🔵 Get Blocked Users**
**Endpoint:** `GET /api/admin/blocked-users`

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)

**Response Structure:**
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "_id": "...",
        "name": "...",
        "email": "...",
        "role": "...",
        "isBlocked": true,
        "blockedAt": "2024-03-15T...",
        "blockedBy": "...",
        "createdAt": "...",
        "status": "..."
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 5,
      "pages": 1
    }
  }
}
```

---

## **🔐 6. AUTHENTICATION / PERMISSIONS**

### **🔒 Middleware Stack**

#### **Auth Routes (`/api/auth/admin/*`)**
```javascript
router.post('/admin/block/:userId', 
  authenticate,                    // ✅ JWT Authentication
  requirePermission('block_client'), // ✅ Permission check
  asyncErrorHandler(authController.blockUser)
);
```

#### **Admin Routes (`/api/admin/users/*`)**
```javascript
router.post('/users/:userId/block', 
  authenticate,                    // ✅ JWT Authentication
  requirePermission('block_client'), // ✅ Permission check
  canManageUser('userId'),          // ✅ User management validation
  adminController.blockUser
);
```

### **📋 Required Permissions**
- **`block_client`**: Required to block/unblock users
- **`manage_users_limited`**: Alternative permission (auth routes)
- **`read_users`**: Required to view blocked users

---

## **🚀 7. EXPECTED FRONTEND USAGE**

### **🔴 Block User**
```javascript
// Method: POST
// URL: /api/admin/users/:userId/block
// Headers: Authorization: Bearer <token>

const blockUser = async (userId, reason = '') => {
  try {
    const response = await fetch(`/api/admin/users/${userId}/block`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ reason })
    });

    const result = await response.json();
    
    if (result.success) {
      console.log('User blocked successfully');
      // Refresh user list
    }
  } catch (error) {
    console.error('Error blocking user:', error);
  }
};
```

**Response Example:**
```json
{
  "success": true,
  "message": "User blocked successfully",
  "data": {
    "user": {
      "_id": "507f1f77bcf86cd799439011",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "client",
      "isBlocked": true,
      "blockedAt": "2024-03-15T16:30:00.000Z",
      "status": "approved"
    }
  }
}
```

### **🟢 Unblock User**
```javascript
// Method: POST
// URL: /api/admin/users/:userId/unblock
// Headers: Authorization: Bearer <token>

const unblockUser = async (userId, reason = '') => {
  try {
    const response = await fetch(`/api/admin/users/${userId}/unblock`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ reason })
    });

    const result = await response.json();
    
    if (result.success) {
      console.log('User unblocked successfully');
      // Refresh user list
    }
  } catch (error) {
    console.error('Error unblocking user:', error);
  }
};
```

**Response Example:**
```json
{
  "success": true,
  "message": "User unblocked successfully",
  "data": {
    "user": {
      "_id": "507f1f77bcf86cd799439011",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "client",
      "isBlocked": false,
      "blockedAt": null,
      "status": "approved"
    }
  }
}
```

### **📋 Get Blocked Users**
```javascript
// Method: GET
// URL: /api/admin/blocked-users
// Headers: Authorization: Bearer <token>

const getBlockedUsers = async (page = 1, limit = 10) => {
  try {
    const response = await fetch(`/api/admin/blocked-users?page=${page}&limit=${limit}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const result = await response.json();
    
    if (result.success) {
      return result.data.users;
    }
  } catch (error) {
    console.error('Error fetching blocked users:', error);
  }
};
```

---

## **⚠️ 8. ERROR HANDLING**

### **🔴 Common Error Responses**

**User Already Blocked:**
```json
{
  "success": false,
  "error": "User is already blocked"
}
```

**User Not Blocked:**
```json
{
  "success": false,
  "error": "User is not blocked"
}
```

**User Not Found:**
```json
{
  "success": false,
  "error": "User not found"
}
```

**Permission Denied:**
```json
{
  "success": false,
  "error": "Access denied"
}
```

---

## **🎯 9. SUMMARY**

### **✅ IMPLEMENTATION STATUS**
- ✅ **2 sets of blocking endpoints** (auth + admin)
- ✅ **Complete user model fields** for blocking
- ✅ **Proper database updates** with audit trail
- ✅ **Authentication & authorization** implemented
- ✅ **Blocked users retrieval** endpoint
- ✅ **Error handling** for all scenarios
- ✅ **Frontend-ready** response formats

### **🔧 RECOMMENDATION**
**Use the Admin Routes (`/api/admin/users/*`) for your Angular admin panel:**
- More advanced functionality
- Better audit logging
- Proper transaction handling
- More detailed responses

---

## **📝 NOTES**

- **Both endpoint sets work** - choose based on your needs
- **Admin routes are more robust** with audit and transaction support
- **All operations are logged** for audit purposes
- **Tokens are revoked** when blocking (auth controller)
- **Email notifications** sent when blocking (auth controller)
- **Permission-based access** ensures security

**🎉 Your Angular admin panel can now implement complete user blocking functionality!**
