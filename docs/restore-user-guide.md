# Restore Deleted User Guide

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
      "status": "active",
      "isDeleted": false,
      "restoredAt": "2026-05-02T23:10:00Z",
      "restoredBy": {
        "id": "admin_id",
        "name": "Admin Name",
        "email": "admin@example.com",
        "role": "admin"
      }
    },
    "reason": "User requested account restoration"
  }
}
```

## ⚠️ Requirements

- `restore_deleted_users` permission
- User must be admin or supervisor
- User must be soft-deleted (`isDeleted: true`)
- Valid 24-character ObjectId

## 🚨 Error Responses

**404 Not Found:**
```json
{
  "success": false,
  "error": "Deleted user not found or user is not marked as deleted"
}
```

**400 Bad Request:**
```json
{
  "success": false,
  "error": "Invalid user ID format. User ID must be a 24-character hex string"
}
```

## 📋 Usage Steps

1. **Get deleted users:** `GET /api/users/deleted`
2. **Copy user ID** from response
3. **Restore user:** `POST /api/users/USER_ID/restore`
4. **Verify restoration:** User will have `isDeleted: false`

## ✅ Works For

- Clients, doctors, nutritionists, therapists, coaches
- Supervisors
- Any soft-deleted user

## ❌ Limitations

- Cannot restore permanently deleted users
- User must be soft-deleted first
- Requires proper permissions
