# User Table Restore Endpoint - Updated Logic

## 🔍 How It Works Now

The restore endpoint now **searches directly in the User table** for the given ID and checks if `isDeleted=true`.

---

## 📋 Updated Logic Flow

### **Step 1: Search User Table**
```javascript
console.log('🔍 Step 1: Searching User table for ID:', userId);

// Search directly in User table for the given ID
const user = await User.findById(userId);
```

### **Step 2: Check if User Exists in User Table**
```javascript
if (!user) {
  console.log('❌ User with ID', userId, 'not found in User table');
  return res.status(404).json({
    success: false,
    error: 'User not found in User table'
  });
}
```

### **Step 3: Check isDeleted Status in User Table**
```javascript
console.log('🔍 User isDeleted status:', user.isDeleted);

// Check if user has isDeleted=true in the User table
if (user.isDeleted !== true) {
  console.log('❌ User isDeleted is not true (value:', user.isDeleted, ')');
  return res.status(400).json({
    success: false,
    error: 'User isDeleted is not true - cannot restore'
  });
}
```

### **Step 4: Update User Table**
```javascript
console.log('🔍 Step 2: Updating User table - changing isDeleted from true to false...');

user.isDeleted = false;  // ← This is the key change in User table!
user.deletedAt = null;
user.deletedBy = null;
user.status = 'approved';

await user.save();

console.log('✅ User updated successfully in User table!');
```

---

## 🔍 Console Output Examples

### **✅ Success Case:**
```
🔍 restoreUser called for user: 69ebc138ef02cfe9e6d5175d
🔍 Step 1: Searching User table for ID: 69ebc138ef02cfe9e6d5175d
🔍 User found in User table: mohamed gaaba
🔍 User role: supervisor
🔍 User isDeleted status: true
✅ User found with isDeleted=true in User table
✅ Proceeding with restore for user: mohamed gaaba with role: supervisor
🔍 Step 2: Updating User table - changing isDeleted from true to false...
✅ User updated successfully in User table!
🔍 New isDeleted value in User table: false
🔍 Restored user role: supervisor
🔍 User email: gabalmohamed33@gmail.com
```

### **❌ User Not Found in User Table:**
```
🔍 restoreUser called for user: 69f5d9354a5388b8069aca9e
🔍 Step 1: Searching User table for ID: 69f5d9354a5388b8069aca9e
❌ User with ID 69f5d9354a5388b8069aca9e not found in User table
```

### **❌ User isDeleted is Not True:**
```
🔍 Step 1: Searching User table for ID: 69ebc138ef02cfe9e6d5175d
🔍 User found in User table: mohamed gaaba
🔍 User role: supervisor
🔍 User isDeleted status: false
❌ User isDeleted is not true (value: false)
```

---

## 🎯 Key Changes Made

### **✅ 1. Direct User Table Search**
- **Before:** General search for deleted users
- **Now:** Direct search in User table for specific ID

### **✅ 2. Explicit isDeleted Check**
- **Before:** General check if user is deleted
- **Now:** Explicit check if `user.isDeleted === true`

### **✅ 3. Clear Error Messages**
- **Before:** "User not found"
- **Now:** "User not found in User table"

### **✅ 4. Detailed Logging**
- **Before:** Basic logging
- **Now:** Detailed User table operation logging

---

## 📊 Response Examples

### **✅ Success Response:**
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
      "status": "approved",
      "isDeleted": false,
      "restoredAt": "2026-05-10T23:10:00.000Z"
    }
  }
}
```

### **❌ Error Responses:**
```json
// User not found in User table
{
  "success": false,
  "error": "User not found in User table"
}

// User isDeleted is not true
{
  "success": false,
  "error": "User isDeleted is not true - cannot restore"
}
```

---

## 🔧 How to Test

### **Step 1: Find a User in User Table**
```bash
# Check all users in User table
curl -X GET "http://localhost:5000/api/users" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### **Step 2: Soft-Delete a User (if needed)**
```bash
# Soft-delete to set isDeleted=true in User table
curl -X DELETE "http://localhost:5000/api/users/USER_ID_HERE" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### **Step 3: Restore the User**
```bash
# Restore - will search User table for ID and check isDeleted=true
curl -X POST "http://localhost:5000/api/users/USER_ID_HERE/restore" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"reason": "Test restore from User table"}'
```

---

## 🎯 What This Fixes

### **✅ Direct Database Search:**
- Searches directly in User table for the given ID
- No reliance on soft-deleted users endpoint
- Direct database lookup

### **✅ Explicit Status Check:**
- Checks `user.isDeleted === true` explicitly
- Clear validation of deletion status
- Precise error messages

### **✅ Clear Logging:**
- Shows exactly what's happening in User table
- Clear indication of search results
- Detailed status reporting

---

## 📋 Summary

**✅ Updated Logic:**
1. **Search User table** for the given ID
2. **Check if user exists** in User table
3. **Verify isDeleted=true** in User table
4. **Update User table** to set isDeleted=false

**✅ Key Benefits:**
- **Direct database search** - No intermediate steps
- **Explicit validation** - Clear isDeleted checking
- **Detailed logging** - Complete visibility
- **Clear error messages** - Precise feedback

**🎯 The endpoint now searches directly in the User table and works exactly as requested!**
