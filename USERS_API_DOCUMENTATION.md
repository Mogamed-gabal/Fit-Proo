# 👥 Users API Documentation

## 📋 Overview
Users API بتتعامل مع إدارة الـ users اللي دورهم 'user' في النظام، بيتيح للـ admin و doctor يقدروا يعرضوا ويديروا الـ users.

---

## 🛣️ Endpoints

---

### **1. Get All Users**
**GET** `/api/users`

**📝 Description:** بيجيب كل الـ users اللي دورهم 'user' مع pagination و search.

**🔐 Permissions:**
- `requirePermission('view_client_workout_plans')`
- Admin و Doctor يقدروا يستخدموا الـ endpoint

**📊 Query Parameters:**
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `page` | Integer | No | 1 | Page number (min: 1) |
| `limit` | Integer | No | 20 | Items per page (min: 1, max: 100) |
| `search` | String | No | - | Search by name or email |

**📥 Request Example:**
```bash
GET /api/users?page=1&limit=10&search=john
Authorization: Bearer <admin_or_doctor_token>
```

**📤 Response Example:**
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "_id": "507f1f77bcf86cd799439011",
        "name": "John Doe",
        "email": "john@example.com",
        "role": "user",
        "isActive": true,
        "createdAt": "2024-04-05T09:00:00.000Z",
        "updatedAt": "2024-04-05T09:00:00.000Z"
      },
      {
        "_id": "507f1f77bcf86cd799439012",
        "name": "Jane Smith",
        "email": "jane@example.com",
        "role": "user",
        "isActive": true,
        "createdAt": "2024-04-04T14:30:00.000Z",
        "updatedAt": "2024-04-04T14:30:00.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalUsers": 50,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

---

### **2. Get User by ID**
**GET** `/api/users/:id`

**📝 Description:** بيجيب تفاصيل user معين بالـ ID بتاعه.

**🔐 Permissions:**
- `requirePermission('view_client_workout_plans')`
- Admin و Doctor يقدروا يستخدموا الـ endpoint

**📊 Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | String | Yes | User ID (MongoDB ObjectId) |

**📥 Request Example:**
```bash
GET /api/users/507f1f77bcf86cd799439011
Authorization: Bearer <admin_or_doctor_token>
```

**📤 Response Example:**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user",
    "isActive": true,
    "createdAt": "2024-04-05T09:00:00.000Z",
    "updatedAt": "2024-04-05T09:00:00.000Z"
  }
}
```

**❌ Error Response (User Not Found):**
```json
{
  "success": false,
  "error": "User not found"
}
```

---

### **3. Update User Status**
**PATCH** `/api/users/:id/status`

**📝 Description:** بيعمل update لحالة user (activate/deactivate).

**🔐 Permissions:**
- `requirePermission('manage_client_workout_plans')`
- Admin بس يقدر يستخدم الـ endpoint

**📊 Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | String | Yes | User ID (MongoDB ObjectId) |

**📊 Request Body:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `isActive` | Boolean | Yes | User status (true = active, false = inactive) |

**📥 Request Example:**
```bash
PATCH /api/users/507f1f77bcf86cd799439011/status
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "isActive": false
}
```

**📤 Response Example:**
```json
{
  "success": true,
  "message": "User status updated successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user",
    "isActive": false,
    "createdAt": "2024-04-05T09:00:00.000Z",
    "updatedAt": "2024-04-05T10:15:00.000Z"
  }
}
```

**❌ Error Response (User Not Found):**
```json
{
  "success": false,
  "error": "User not found"
}
```

---

### **4. Delete User**
**DELETE** `/api/users/:id`

**📝 Description:** بيمسح user من النظام.

**🔐 Permissions:**
- `requirePermission('manage_client_workout_plans')`
- Admin بس يقدر يستخدم الـ endpoint

**📊 Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | String | Yes | User ID (MongoDB ObjectId) |

**📥 Request Example:**
```bash
DELETE /api/users/507f1f77bcf86cd799439011
Authorization: Bearer <admin_token>
```

**📤 Response Example:**
```json
{
  "success": true,
  "message": "User deleted successfully"
}
```

**❌ Error Response (User Not Found):**
```json
{
  "success": false,
  "error": "User not found"
}
```

---

### **5. Get User Statistics**
**GET** `/api/users/stats`

**📝 Description:** بيجيب إحصائيات عن الـ users في النظام.

**🔐 Permissions:**
- `requirePermission('view_client_workout_plans')`
- Admin و Doctor يقدروا يستخدموا الـ endpoint

**📥 Request Example:**
```bash
GET /api/users/stats
Authorization: Bearer <admin_or_doctor_token>
```

**📤 Response Example:**
```json
{
  "success": true,
  "data": {
    "totalUsers": 150,
    "activeUsers": 120,
    "inactiveUsers": 30,
    "recentUsers": 25
  }
}
```

---

## 🔐 Authentication & Authorization

### **Authentication:**
- All endpoints require `Authorization: Bearer <token>` header
- Token must be valid admin or doctor access token
- Token is validated using `authenticate` middleware

### **Authorization:**
- **Admin:** Full access (view, update status, delete)
- **Doctor:** View access only (get users, get user by ID, get stats)
- **Client:** No access to any user management endpoints

### **Permission Actions:**
- `view_client_workout_plans` - للـ view operations
- `manage_client_workout_plans` - للـ management operations

---

## 📊 Data Validation

### **Input Validation:**
- All requests are validated using `express-validator`
- Required fields are checked for presence and format
- Invalid requests return 400 with detailed error messages

### **Query Parameters Validation:**
```javascript
// Page validation
query('page')
  .optional()
  .isInt({ min: 1 })
  .withMessage('Page must be a positive integer')

// Limit validation
query('limit')
  .optional()
  .isInt({ min: 1, max: 100 })
  .withMessage('Limit must be between 1 and 100')

// Search validation
query('search')
  .optional()
  .trim()
  .isLength({ max: 100 })
  .withMessage('Search term cannot exceed 100 characters')
```

### **Body Validation:**
```javascript
// User ID validation
param('id')
  .isMongoId()
  .withMessage('Invalid user ID')

// Status validation
body('isActive')
  .isBoolean()
  .withMessage('isActive must be a boolean')
```

---

## 🚨 Error Handling

### **Common Error Responses:**

#### **401 Unauthorized:**
```json
{
  "success": false,
  "error": "Authentication required"
}
```

#### **403 Forbidden:**
```json
{
  "success": false,
  "error": "Access denied. You can only view your own data."
}
```

#### **404 Not Found:**
```json
{
  "success": false,
  "error": "User not found"
}
```

#### **400 Bad Request:**
```json
{
  "success": false,
  "error": "Invalid user ID"
}
```

#### **500 Internal Server Error:**
```json
{
  "success": false,
  "error": "Internal server error"
}
```

---

## 📝 Usage Examples

### **Get All Active Users:**
```bash
curl -X GET "http://localhost:5000/api/users?isActive=true&page=1&limit=20" \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json"
```

### **Search Users by Name:**
```bash
curl -X GET "http://localhost:5000/api/users?search=john" \
  -H "Authorization: Bearer <doctor_token>" \
  -H "Content-Type: application/json"
```

### **Deactivate User:**
```bash
curl -X PATCH "http://localhost:5000/api/users/507f1f77bcf86cd799439011/status" \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{"isActive": false}'
```

### **Delete User:**
```bash
curl -X DELETE "http://localhost:5000/api/users/507f1f77bcf86cd799439011" \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json"
```

---

## 🔄 Pagination

### **Pagination Structure:**
```json
{
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalUsers": 50,
    "hasNext": true,
    "hasPrev": false
  }
}
```

### **Pagination Parameters:**
- `currentPage`: Current page number
- `totalPages`: Total number of pages
- `totalUsers`: Total number of users
- `hasNext`: Whether there's a next page
- `hasPrev`: Whether there's a previous page

---

## 🎯 Best Practices

### **Security:**
- Always validate user permissions before operations
- Exclude sensitive data like passwords
- Use proper error messages without exposing system details

### **Performance:**
- Use pagination for large datasets
- Implement proper indexing on database fields
- Cache frequently accessed data

### **Data Integrity:**
- Validate all input data
- Use transactions for critical operations
- Implement proper error handling

---

## 📈 Rate Limiting

- **GET requests:** 100 requests per minute
- **POST/PATCH/DELETE requests:** 50 requests per minute
- **Search requests:** 30 requests per minute

---

## 📞 Support

For any issues or questions regarding the Users API, please contact the development team.

---

**🎉 Users API Documentation Complete!**
