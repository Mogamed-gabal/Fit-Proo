# Get Supervisor Details by ID

## 🎯 Endpoint Information

The endpoint to get supervisor details by ID is already implemented in your system.

---

## 📍 Primary Endpoint

### **GET /api/admin/users/:userId**

#### **✅ Route Definition:**
```javascript
// src/routes/admin.js
router.get('/users/:userId', 
  requirePermission('read_user_details'),
  canManageUser('userId'),
  adminController.getUserById
);
```

#### **✅ Controller Method:**
```javascript
// src/controllers/adminController.js
const getUserById = async (req, res) => {
  try {
    // Target user is provided by middleware
    const targetUser = req.targetUser;

    res.status(200).json({
      success: true,
      data: {
        user: targetUser.toJSON()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
```

---

## 🔐 Authentication & Authorization

### **✅ Required:**
1. **Authentication:** `authenticate` middleware
2. **Permission:** `read_user_details` permission
3. **Access Control:** `canManageUser('userId')` middleware

### **✅ Middleware Stack:**
1. `requirePermission('read_user_details')` - Checks if user has permission to read user details
2. `canManageUser('userId')` - Prevents privilege escalation, ensures user can manage target
3. `adminController.getUserById` - Controller method

---

## 📋 Request Format

### **✅ HTTP Method:**
```http
GET /api/admin/users/:userId
```

### **✅ Headers:**
```http
Authorization: Bearer <admin_token>
Content-Type: application/json
```

### **✅ URL Parameters:**
```
:userId (string, required) - MongoDB ObjectId of the supervisor
```

### **✅ Example Request:**
```javascript
const response = await fetch('/api/admin/users/507f1f77bcf86cd799439021', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${adminToken}`,
    'Content-Type': 'application/json'
  }
});
```

---

## 📊 Response Format

### **✅ Success Response (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "507f1f77bcf86cd799439021",
      "name": "John Supervisor",
      "email": "john@company.com",
      "role": "supervisor",
      "status": "approved",
      "emailVerified": true,
      "phone": "+1234567890",
      "address": "123 Main St, City, State",
      "createdAt": "2026-05-01T10:00:00.000Z",
      "updatedAt": "2026-05-05T15:30:00.000Z",
      "lastLogin": "2026-05-05T14:20:00.000Z",
      "isActive": true,
      "isDeleted": false
    }
  }
}
```

### **✅ Error Responses:**

#### **❌ User Not Found (404):**
```json
{
  "success": false,
  "error": "User not found"
}
```

#### **❌ Permission Denied (403):**
```json
{
  "success": false,
  "error": "Insufficient permissions"
}
```

#### **❌ Invalid User ID (400):**
```json
{
  "success": false,
  "error": "Invalid user ID"
}
```

#### **❌ Server Error (500):**
```json
{
  "success": false,
  "error": "Internal server error"
}
```

---

## 🎯 Usage Examples

### **✅ Get Supervisor Details:**
```javascript
// Get supervisor by ID
async function getSupervisorDetails(supervisorId) {
  try {
    const response = await fetch(`/api/admin/users/${supervisorId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      }
    });

    const result = await response.json();

    if (result.success) {
      console.log('Supervisor details:', result.data.user);
      return result.data.user;
    } else {
      console.error('Error:', result.error);
      return null;
    }
  } catch (error) {
    console.error('Fetch error:', error);
    return null;
  }
}

// Usage
const supervisor = await getSupervisorDetails('507f1f77bcf86cd799439021');
```

### **✅ React Component Example:**
```jsx
import React, { useState, useEffect } from 'react';

const SupervisorDetails = ({ supervisorId }) => {
  const [supervisor, setSupervisor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSupervisor = async () => {
      try {
        const response = await fetch(`/api/admin/users/${supervisorId}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        const result = await response.json();

        if (result.success) {
          setSupervisor(result.data.user);
        } else {
          setError(result.error);
        }
      } catch (err) {
        setError('Failed to fetch supervisor details');
      } finally {
        setLoading(false);
      }
    };

    fetchSupervisor();
  }, [supervisorId]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!supervisor) return <div>Supervisor not found</div>;

  return (
    <div className="supervisor-details">
      <h2>{supervisor.name}</h2>
      <p>Email: {supervisor.email}</p>
      <p>Role: {supervisor.role}</p>
      <p>Status: {supervisor.status}</p>
      <p>Phone: {supervisor.phone}</p>
      <p>Address: {supervisor.address}</p>
      <p>Created: {new Date(supervisor.createdAt).toLocaleDateString()}</p>
      <p>Last Login: {supervisor.lastLogin ? new Date(supervisor.lastLogin).toLocaleDateString() : 'Never'}</p>
    </div>
  );
};
```

---

## 🔍 Additional Features

### **✅ Security Features:**
- **Privilege Escalation Prevention:** `canManageUser` middleware
- **Permission-Based Access:** `read_user_details` requirement
- **User Validation:** MongoDB ObjectId validation
- **Soft Delete Handling:** Excludes deleted users

### **✅ Data Filtering:**
- **Password Excluded:** Never returns password hash
- **Sensitive Fields:** Only returns necessary user information
- **Status Checking:** Returns user status and activity

### **✅ Error Handling:**
- **Comprehensive Error Messages:** Clear error descriptions
- **HTTP Status Codes:** Proper status codes for different scenarios
- **Validation:** Input validation for user ID

---

## 🎯 Alternative Endpoints

### **✅ Other User-Related Endpoints:**

#### **Get All Users:**
```http
GET /api/admin/users?role=supervisor&page=1&limit=10
```

#### **Get All Supervisors:**
```http
GET /api/admin/users?role=supervisor
```

#### **Get Supervisor Audit Logs:**
```http
GET /api/admin/supervisor-audit/supervisor/:supervisorId
```

---

## 🚀 Testing the Endpoint

### **✅ Test with Postman:**
1. **Method:** GET
2. **URL:** `http://localhost:5000/api/admin/users/YOUR_SUPERVISOR_ID`
3. **Headers:**
   - `Authorization: Bearer YOUR_ADMIN_TOKEN`
   - `Content-Type: application/json`

### **✅ Test with cURL:**
```bash
curl -X GET \
  http://localhost:5000/api/admin/users/507f1f77bcf86cd799439021 \
  -H 'Authorization: Bearer YOUR_ADMIN_TOKEN' \
  -H 'Content-Type: application/json'
```

### **✅ Test with JavaScript:**
```javascript
// Test the endpoint
const testSupervisorId = '507f1f77bcf86cd799439021';

fetch(`/api/admin/users/${testSupervisorId}`, {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${adminToken}`
  }
})
.then(response => response.json())
.then(data => {
  console.log('Response:', data);
})
.catch(error => {
  console.error('Error:', error);
});
```

---

## 📋 Summary

### **✅ Endpoint Location:**
- **Route:** `GET /api/admin/users/:userId`
- **Controller:** `adminController.getUserById`
- **File:** `src/controllers/adminController.js` (lines 68-85)

### **✅ Requirements:**
- **Authentication:** Valid admin token
- **Permission:** `read_user_details`
- **Access:** Must be able to manage target user

### **✅ Returns:**
- **Success:** Complete supervisor user object
- **Error:** Clear error message with appropriate HTTP status

---

**🎯 The endpoint is fully implemented and ready to use!** 

You can get supervisor details by making a GET request to `/api/admin/users/:supervisorId` with proper authentication and permissions.
