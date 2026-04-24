# Admin Doctor Management API Documentation

## Overview
This API provides admin functionality for approving and rejecting doctor registrations in the fitness platform. All endpoints require authentication and appropriate permissions.

## Base URL
```
http://localhost:5000/api/auth
```

## Authentication
All endpoints require:
- **Authorization Header**: `Bearer <admin_token>`
- **Required Role**: `admin` or `supervisor` with `manage_users_limited` permission

---

## Endpoints

### 1. Approve Doctor
**POST** `/api/auth/admin/approve/:userId`

**Description**: Approve a doctor's registration and grant them access to the platform

**Permissions Required**: `manage_users_limited`

**Request**:
```http
POST /api/auth/admin/approve/507f1f77bcf86cd799439011
Authorization: Bearer <admin_token>
```

**Response**:
```json
{
  "success": true,
  "message": "Doctor approved successfully",
  "data": {
    "user": {
      "_id": "507f1f77bcf86cd799439011",
      "name": "Dr. John Smith",
      "email": "doctor@example.com",
      "role": "doctor",
      "status": "approved",
      "emailVerified": true,
      "approvedAt": "2024-04-12T10:00:00.000Z",
      "approvedBy": "507f1f77bcf86cd799439999"
    }
  }
}
```

---

### 2. Reject Doctor
**POST** `/api/auth/admin/reject/:userId`

**Description**: Reject a doctor's registration and deny them access to the platform

**Permissions Required**: `manage_users_limited`

**Request**:
```http
POST /api/auth/admin/reject/507f1f77bcf86cd799439011
Authorization: Bearer <admin_token>
```

**Response**:
```json
{
  "success": true,
  "message": "Doctor rejected successfully",
  "data": {
    "user": {
      "_id": "507f1f77bcf86cd799439011",
      "name": "Dr. Jane Smith",
      "email": "doctor@example.com",
      "role": "doctor",
      "status": "rejected",
      "emailVerified": true,
      "rejectedAt": "2024-04-12T10:00:00.000Z",
      "rejectedBy": "507f1f77bcf86cd799439999",
      "rejectionReason": "Documentation incomplete"
    }
  }
}
```

---

## Error Responses

### 401 Unauthorized
```json
{
  "success": false,
  "error": "Authentication required"
}
```

### 403 Forbidden
```json
{
  "success": false,
  "error": "Access denied. Insufficient permissions."
}
```

### 404 Not Found
```json
{
  "success": false,
  "error": "Doctor not found"
}
```

### 400 Bad Request
```json
{
  "success": false,
  "error": "Doctor is already approved"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "error": "Internal server error"
}
```

---

## Business Logic

### Approval Process
1. **Validation**: Check if user exists and has role 'doctor'
2. **Status Check**: Ensure doctor is not already approved
3. **Permission Check**: Verify admin has `manage_users_limited` permission
4. **Update Status**: Change doctor status to 'approved'
5. **Audit Trail**: Record who approved and when
6. **Notification**: Send approval email to doctor

### Rejection Process
1. **Validation**: Check if user exists and has role 'doctor'
2. **Status Check**: Ensure doctor is not already rejected
3. **Permission Check**: Verify admin has `manage_users_limited` permission
4. **Update Status**: Change doctor status to 'rejected'
5. **Audit Trail**: Record who rejected and when
6. **Notification**: Send rejection email to doctor

---

## Security Notes

1. **Privilege Escalation Prevention**: Admins cannot approve themselves
2. **Permission Validation**: Only users with `manage_users_limited` can approve/reject
3. **Audit Trail**: All actions track who performed them
4. **Status Validation**: Prevent duplicate approvals/rejections
5. **Role Verification**: Only users with 'doctor' role can be processed

---

## Rate Limiting

- **Approval/Rejection**: 50 requests per hour per admin

---

## Usage Examples

### Approve a Doctor
```bash
curl -X POST "http://localhost:5000/api/auth/admin/approve/507f1f77bcf86cd799439011" \
  -H "Authorization: Bearer <admin_token>"
```

### Reject a Doctor
```bash
curl -X POST "http://localhost:5000/api/auth/admin/reject/507f1f77bcf86cd799439011" \
  -H "Authorization: Bearer <admin_token>"
```

---

## Database Schema Impact

### User Model Updates
```javascript
// When doctor is approved
{
  status: 'approved',
  approvedAt: new Date(),
  approvedBy: adminId
}

// When doctor is rejected
{
  status: 'rejected',
  rejectedAt: new Date(),
  rejectedBy: adminId,
  rejectionReason: 'Specific reason'
}
```

---

## Testing

Use the following admin credentials for testing:
```json
{
  "email": "admin@fitness.com",
  "password": "Admin123!@#"
}
```

Login endpoint: `POST /api/auth/login`

---

## Monitoring

### Key Metrics
- **Approval Rate**: Number of doctors approved per day
- **Rejection Rate**: Number of doctors rejected per day
- **Processing Time**: Average time for approval/rejection
- **Audit Logs**: Complete audit trail of all actions

---

*Last Updated: April 2024*
