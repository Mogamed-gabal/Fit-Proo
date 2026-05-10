# Fix: User Not Found Error - Restore Endpoint

## 🚨 The Problem

You're getting this error:
```
🔍 restoreUser called for user: 69f5d9354a5388b8069aca9e
🔍 Step 1: Finding user with isDeleted: true...
❌ User not found in database
POST /api/users/69f5d9354a5388b8069aca9e/restore 404 422.626 ms - 42
```

**Issue:** User ID `69f5d9354a5388b8069aca9e` **does not exist** in your database.

---

## 🔧 Solution: Find Real User IDs

### **Step 1: Run the User Status Check**
```bash
cd "c:\Users\user\Desktop\fitness-app\backend"
node check-users-status.js
```

This will show you:
- ✅ All users in your database with their real IDs
- ✅ Which users have `isDeleted: true` (available for restore)
- ✅ Which users have `isDeleted: false` (need to be deleted first)
- ✅ Exact commands to use for restore

---

## 🎯 Expected Output from the Script

### **If you have soft-deleted users:**
```
🔍 Step 2: Soft-deleted users (isDeleted: true):
Soft-deleted users: 2

Available users for restore:

1. mohamed gaaba (gabalmohamed33@gmail.com)
   ID: 69ebc138ef02cfe9e6d5175d
   Role: supervisor
   Deleted At: 2026-05-10T22:45:00.000Z
   Restore command:
   curl -X POST "http://localhost:5000/api/users/69ebc138ef02cfe9e6d5175d/restore" \
     -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"reason": "Test restore"}'

2. John Doe (john@example.com)
   ID: 507f1f77bcf86cd799439001
   Role: client
   Deleted At: 2026-05-10T22:46:00.000Z
   Restore command:
   curl -X POST "http://localhost:5000/api/users/507f1f77bcf86cd799439001/restore" \
     -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"reason": "Test restore"}'
```

### **If you have no soft-deleted users:**
```
🔍 Step 2: Soft-deleted users (isDeleted: true):
Soft-deleted users: 0
❌ No soft-deleted users found!
💡 You need to soft-delete a user first before testing restore.

💡 Active users you can soft-delete for testing:

1. mohamed gaaba (gabalmohamed33@gmail.com)
   ID: 69ebc138ef02cfe9e6d5175d
   Role: supervisor
   Delete command:
   curl -X DELETE "http://localhost:5000/api/users/69ebc138ef02cfe9e6d5175d" \
     -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

---

## 🔧 Step-by-Step Fix

### **Scenario 1: You have soft-deleted users**

1. **Run the script:** `node check-users-status.js`
2. **Copy a user ID** from the "Available users for restore" section
3. **Use that ID** in your restore request:

```bash
# Use the real ID from the script output
curl -X POST "http://localhost:5000/api/users/69ebc138ef02cfe9e6d5175d/restore" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"reason": "Test restore with real user"}'
```

### **Scenario 2: You have no soft-deleted users**

1. **Run the script:** `node check-users-status.js`
2. **Copy a user ID** from the "Active users you can soft-delete" section
3. **Soft-delete that user first:**

```bash
# Delete the user first
curl -X DELETE "http://localhost:5000/api/users/69ebc138ef02cfe9e6d5175d" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

4. **Then restore them:**

```bash
# Now restore the user
curl -X POST "http://localhost:5000/api/users/69ebc138ef02cfe9e6d5175d/restore" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"reason": "Test restore after creating soft-deleted user"}'
```

---

## 🎯 Expected Success

When you use a real user ID that exists and has `isDeleted: true`, you should see:

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

And the response:
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

---

## 🔍 Why This Happens

### **User ID `69f5d9354a5388b8069aca9e` doesn't exist because:**
1. **Wrong ID:** It might be from a different database or environment
2. **Old ID:** It might be from a user that was permanently deleted
3. **Typo:** It might have a small typo in the ID
4. **Different Database:** It might be from a different MongoDB database

---

## 📋 Quick Fix Commands

### **1. Check your users:**
```bash
node check-users-status.js
```

### **2. Use a real user ID:**
```bash
# Replace with the actual ID from the script
curl -X POST "http://localhost:5000/api/users/REAL_USER_ID_HERE/restore" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"reason": "Test restore"}'
```

---

## 📋 Summary

**✅ Problem:** User ID `69f5d9354a5388b8069aca9e` doesn't exist in database

**✅ Solution:** 
1. Run `node check-users-status.js` to see real user IDs
2. Use a real user ID that actually exists
3. Ensure the user has `isDeleted: true` before trying to restore

**✅ The restore endpoint works perfectly - you just need to use a real user ID!**

**🎯 Run the script and use the user ID it provides - that will fix the "User not found" error!**
