# Admin Password Change Endpoints Documentation

## Overview
Two endpoints for admin password management:
1. Change own password (with current password verification)
2. Change other users' passwords (admin privilege)

---

## 🔐 Admin Change Own Password

### Endpoint
```
PUT /api/admin/change-password
```

### Description
Allows an admin to change their own password by verifying the current password first.

### Authentication
- **Required**: Admin authentication
- **Headers**: 
  - `Authorization: Bearer {admin_token}`
  - `Content-Type: application/json`

### Request Body
```json
{
  "currentPassword": "OldPassword123!",
  "newPassword": "NewSecurePass456!",
  "confirmPassword": "NewSecurePass456!"
}
```

### Request Body Fields
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `currentPassword` | String | ✅ Yes | Admin's current password |
| `newPassword` | String | ✅ Yes | New password (min 8 characters) |
| `confirmPassword` | String | ✅ Yes | Must match newPassword |

### Validations
- All fields are required
- `newPassword` must be at least 8 characters
- `newPassword` must match `confirmPassword`
- `currentPassword` must be correct
- Admin must have `manage_profile` permission

### Success Response (200)
```json
{
  "success": true,
  "message": "Password changed successfully",
  "data": {
    "adminId": "507f1f77bcf86cd799439011",
    "changedAt": "2026-05-11T03:30:00.000Z"
  }
}
```

### Error Responses

#### 400 - Missing Fields
```json
{
  "success": false,
  "error": "Current password, new password, and confirmation are required"
}
```

#### 400 - Password Too Short
```json
{
  "success": false,
  "error": "New password must be at least 8 characters"
}
```

#### 400 - Passwords Don't Match
```json
{
  "success": false,
  "error": "New passwords do not match"
}
```

#### 400 - Wrong Current Password
```json
{
  "success": false,
  "error": "Current password is incorrect"
}
```

#### 401 - Unauthorized
```json
{
  "success": false,
  "error": "Authentication required"
}
```

#### 403 - Forbidden
```json
{
  "success": false,
  "error": "Insufficient permissions"
}
```

---

## 🔴 Admin Change User Password

### Endpoint
```
PUT /api/admin/users/{userId}/change-password
```

### Description
Allows an admin to change any user's password (requires higher permissions).

### Authentication
- **Required**: Admin authentication
- **Headers**: 
  - `Authorization: Bearer {admin_token}`
  - `Content-Type: application/json`

### URL Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `userId` | String | ✅ Yes | ID of the user whose password to change |

### Request Body
```json
{
  "newPassword": "NewUserPass789!",
  "confirmPassword": "NewUserPass789!"
}
```

### Request Body Fields
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `newPassword` | String | ✅ Yes | New password (min 8 characters) |
| `confirmPassword` | String | ✅ Yes | Must match newPassword |

### Validations
- All fields are required
- `newPassword` must be at least 8 characters
- `newPassword` must match `confirmPassword`
- User must exist in database
- Admin must have `manage_user` permission
- Admin cannot change passwords of users with higher privileges

### Success Response (200)
```json
{
  "success": true,
  "message": "Password changed successfully",
  "data": {
    "userId": "507f1f77bcf86cd799439011",
    "changedAt": "2026-05-11T03:30:00.000Z"
  }
}
```

### Error Responses

#### 400 - Missing Fields
```json
{
  "success": false,
  "error": "New password and confirmation are required"
}
```

#### 400 - Password Too Short
```json
{
  "success": false,
  "error": "Password must be at least 8 characters"
}
```

#### 400 - Passwords Don't Match
```json
{
  "success": false,
  "error": "Passwords do not match"
}
```

#### 404 - User Not Found
```json
{
  "success": false,
  "error": "User not found"
}
```

#### 403 - Privilege Escalation Prevention
```json
{
  "success": false,
  "error": "Cannot modify user with higher or equal privileges"
}
```

---

## 🛡️ Security Features

### Password Security
- **Hashing**: All passwords are hashed using bcrypt (salt rounds: 10)
- **Validation**: Minimum 8 characters requirement
- **Verification**: Current password verification for self-change

### Access Control
- **Authentication**: JWT token required for all endpoints
- **Authorization**: Role-based permissions checked
- **Privilege Protection**: Cannot modify higher-privileged users
- **Audit Trail**: All password changes are logged

### Rate Limiting
- Standard API rate limiting applies
- Failed attempts are tracked
- Account lockout after multiple failed attempts

---

## 💻 Frontend Implementation Tips

### JavaScript/TypeScript Example

#### Change Own Password
```javascript
const changeOwnPassword = async (currentPassword, newPassword, confirmPassword) => {
  try {
    const response = await fetch('/api/admin/change-password', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        currentPassword,
        newPassword,
        confirmPassword
      })
    });

    const data = await response.json();
    
    if (data.success) {
      console.log('Password changed successfully');
      // Redirect to login or show success message
    } else {
      console.error('Error:', data.error);
      // Show error message to user
    }
  } catch (error) {
    console.error('Network error:', error);
  }
};
```

#### Change User Password
```javascript
const changeUserPassword = async (userId, newPassword, confirmPassword) => {
  try {
    const response = await fetch(`/api/admin/users/${userId}/change-password`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        newPassword,
        confirmPassword
      })
    });

    const data = await response.json();
    
    if (data.success) {
      console.log('User password changed successfully');
      // Show success message
    } else {
      console.error('Error:', data.error);
      // Show error message to user
    }
  } catch (error) {
    console.error('Network error:', error);
  }
};
```

### Form Validation (Frontend)
```javascript
const validatePasswordForm = (formData) => {
  const errors = [];
  
  if (!formData.currentPassword) {
    errors.push('Current password is required');
  }
  
  if (!formData.newPassword || formData.newPassword.length < 8) {
    errors.push('New password must be at least 8 characters');
  }
  
  if (formData.newPassword !== formData.confirmPassword) {
    errors.push('Passwords do not match');
  }
  
  return errors;
};
```

### UI/UX Recommendations
1. **Password Strength Indicator**: Show password strength as user types
2. **Current Password Field**: Use password type input with show/hide toggle
3. **Error Handling**: Display specific error messages from API
4. **Success Feedback**: Clear success message and optionally redirect
5. **Loading States**: Show loading spinner during API call
6. **Form Reset**: Clear form after successful password change

---

## 📋 Testing Checklist

### Functional Testing
- [ ] Admin can change own password with correct current password
- [ ] Admin cannot change own password with wrong current password
- [ ] Admin can change other users' passwords (with proper permissions)
- [ ] Password validation works (8+ characters, matching confirmation)
- [ ] Error messages are displayed correctly

### Security Testing
- [ ] Non-admin users cannot access endpoints
- [ ] Admin without proper permissions cannot access endpoints
- [ ] Privilege escalation prevention works
- [ ] Passwords are properly hashed in database

### Integration Testing
- [ ] Frontend form validation matches backend validation
- [ ] Authentication tokens work correctly
- [ ] Error handling works end-to-end
- [ ] Success flows complete properly

---

## 🚀 Deployment Notes

### Environment Variables
Ensure the following are configured:
- `JWT_SECRET`: For token validation
- `BCRYPT_SALT_ROUNDS`: Password hashing (default: 10)

### Database Updates
- No database migrations required
- Uses existing User model structure
- Password field updated in-place

### Monitoring
- Monitor failed password change attempts
- Track unusual password change patterns
- Log successful password changes for audit

---

**Last Updated**: May 11, 2026  
**Version**: 1.0  
**API Version**: v1
