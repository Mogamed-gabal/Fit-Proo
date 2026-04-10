# 👨‍⚕️ Doctors API Documentation

## 📋 Overview
Doctors API بتتعامل مع إدارة الـ doctors في النظام، بيتيح للـ admin و supervisor يقدروا يعرضوا ويدروا الـ doctors.

---

## 🛣️ Endpoints

---

### **1. Get All Doctors**
**GET** `/api/doctors`

**📝 Description:** بيجيب كل الـ doctors مع filtering, search, و pagination.

**🔐 Permissions:**
- `requirePermission('manage_doctors')`
- Admin و Supervisor (مع permission) يقدروا يستخدموا الـ endpoint

**📊 Query Parameters:**
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `page` | Integer | No | 1 | Page number (min: 1) |
| `limit` | Integer | No | 20 | Items per page (min: 1, max: 100) |
| `status` | String | No | - | Filter by status: approved, pending, rejected, blocked, deleted |
| `specialization` | String | No | - | Filter by doctor specialization |
| `search` | String | No | - | Search by doctor name, email, or bio |

**📥 Request Example:**
```bash
GET /api/doctors?page=1&limit=10&status=pending&specialization=doctor&search=john
Authorization: Bearer <admin_token>
```

**📤 Response Example:**
```json
{
  "success": true,
  "data": {
    "doctors": [
      {
        "_id": "507f1f77bcf86cd799439011",
        "name": "Dr. John Smith",
        "email": "john@doctor.com",
        "role": "doctor",
        "specialization": "doctor",
        "status": "pending",
        "isBlocked": false,
        "isDeleted": false,
        "isActive": true,
        "years_of_experience": 5,
        "short_bio": "Experienced physician...",
        "createdAt": "2024-04-05T09:00:00.000Z",
        "updatedAt": "2024-04-05T09:00:00.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalDoctors": 50,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

---

### **2. Get Doctor by ID**
**GET** `/api/doctors/:doctorId`

**📝 Description:** بيجيب تفاصيل doctor معين بالـ ID بتاعه.

**🔐 Permissions:**
- `requirePermission('manage_doctors')`
- Admin و Supervisor (مع permission) يقدروا يستخدموا الـ endpoint

**📊 Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `doctorId` | String | Yes | Doctor ID (MongoDB ObjectId) |

**📥 Request Example:**
```bash
GET /api/doctors/507f1f77bcf86cd799439011
Authorization: Bearer <admin_token>
```

**📤 Response Example:**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Dr. John Smith",
    "email": "john@doctor.com",
    "phone": "+201234567890",
    "role": "doctor",
    "specialization": "doctor",
    "status": "approved",
    "isBlocked": false,
    "isDeleted": false,
    "isActive": true,
    "years_of_experience": 5,
    "short_bio": "Experienced physician specializing in...",
    "address": "123 Medical St, Cairo, Egypt",
    "region": "Cairo",
    "gender": "male",
    "dateOfBirth": "1980-01-01T00:00:00.000Z",
    "emailVerified": true,
    "certificates": [
      {
        "filename": "medical_license.pdf",
        "originalName": "Medical License.pdf",
        "secure_url": "https://res.cloudinary.com/..."
      }
    ],
    "profilePicture": {
      "filename": "profile.jpg",
      "secure_url": "https://res.cloudinary.com/..."
    },
    "createdAt": "2024-04-05T09:00:00.000Z",
    "updatedAt": "2024-04-05T09:00:00.000Z"
  }
}
```

---

### **3. Get Doctors by Specialization**
**GET** `/api/doctors/specialization/:specialization`

**📝 Description:** بيجيب doctors حسب الـ specialization.

**🔐 Permissions:**
- `requirePermission('manage_doctors')`
- Admin و Supervisor (مع permission) يقدروا يستخدموا الـ endpoint

**📊 Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `specialization` | String | Yes | Doctor specialization |

**📊 Query Parameters:**
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `page` | Integer | No | 1 | Page number (min: 1) |
| `limit` | Integer | No | 20 | Items per page (min: 1, max: 100) |

**📥 Request Example:**
```bash
GET /api/doctors/specialization/doctor?page=1&limit=10
Authorization: Bearer <admin_token>
```

**📤 Response Example:**
```json
{
  "success": true,
  "data": {
    "doctors": [
      {
        "_id": "507f1f77bcf86cd799439011",
        "name": "Dr. John Smith",
        "specialization": "doctor",
        "status": "approved"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 3,
      "totalDoctors": 25,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

---

### **4. Approve Doctor**
**PATCH** `/api/doctors/:doctorId/approve`

**📝 Description:** بيعمل approve لـ doctor.

**🔐 Permissions:**
- `requirePermission('manage_doctors')`
- Admin بس يقدر يستخدم الـ endpoint

**📊 Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `doctorId` | String | Yes | Doctor ID (MongoDB ObjectId) |

**📊 Request Body:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `reason` | String | No | Approval reason (optional) |

**📥 Request Example:**
```bash
PATCH /api/doctors/507f1f77bcf86cd799439011/approve
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "reason": "Doctor meets all requirements and is approved to practice"
}
```

**📤 Response Example:**
```json
{
  "success": true,
  "message": "Doctor approved successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Dr. John Smith",
    "status": "approved",
    "approvedAt": "2024-04-05T10:15:00.000Z",
    "approvedBy": "507f1f77bcf86cd799439999",
    "approvalReason": "Doctor meets all requirements and is approved to practice",
    "updatedAt": "2024-04-05T10:15:00.000Z"
  }
}
```

---

### **5. Reject Doctor**
**PATCH** `/api/doctors/:doctorId/reject`

**📝 Description:** بيعمل reject لـ doctor.

**🔐 Permissions:**
- `requirePermission('manage_doctors')`
- Admin بس يقدر يستخدم الـ endpoint

**📊 Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `doctorId` | String | Yes | Doctor ID (MongoDB ObjectId) |

**📊 Request Body:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `reason` | String | No | Rejection reason (optional) |

**📥 Request Example:**
```bash
PATCH /api/doctors/507f1f77bcf86cd799439011/reject
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "reason": "Insufficient documentation provided"
}
```

**📤 Response Example:**
```json
{
  "success": true,
  "message": "Doctor rejected successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Dr. John Smith",
    "status": "rejected",
    "rejectedAt": "2024-04-05T10:15:00.000Z",
    "rejectedBy": "507f1f77bcf86cd799439999",
    "rejectionReason": "Insufficient documentation provided",
    "updatedAt": "2024-04-05T10:15:00.000Z"
  }
}
```

---

### **6. Get Doctor Statistics**
**GET** `/api/doctors/stats`

**📝 Description:** بيجيب إحصائيات عن الـ doctors في النظام.

**🔐 Permissions:**
- `requirePermission('manage_doctors')`
- Admin و Supervisor (مع permission) يقدروا يستخدموا الـ endpoint

**📥 Request Example:**
```bash
GET /api/doctors/stats
Authorization: Bearer <admin_token>
```

**📤 Response Example:**
```json
{
  "success": true,
  "data": {
    "totalDoctors": 100,
    "approvedDoctors": 75,
    "pendingDoctors": 20,
    "rejectedDoctors": 3,
    "blockedDoctors": 2,
    "recentDoctors": 15
  }
}
```

---

## 🔐 Authentication & Authorization

### **Authentication:**
- All endpoints require `Authorization: Bearer <token>` header
- Token must be valid admin or supervisor access token
- Token is validated using `authenticate` middleware

### **Authorization:**
- **Admin:** Full access (view, approve, reject)
- **Supervisor:** View access only (إذا عنده `manage_doctors` permission)
- **Doctor:** No access to doctor management endpoints
- **Client:** No access to doctor management endpoints

### **Permission Actions:**
- `manage_doctors` - للـ doctor management operations

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

// Status validation
query('status')
  .optional()
  .isIn(['approved', 'pending', 'rejected', 'blocked', 'deleted'])
  .withMessage('Status must be one of: approved, pending, rejected, blocked, deleted')
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
  "error": "Access denied. Only admin can manage doctors."
}
```

#### **404 Not Found:**
```json
{
  "success": false,
  "error": "Doctor not found"
}
```

#### **400 Bad Request:**
```json
{
  "success": false,
  "error": "Invalid doctor ID"
}
```

---

## 🔄 Status Mapping

### **Query to Database Mapping:**
| Status Query | Database Condition | Description |
|-------------|------------------|-------------|
| `approved` | `status: 'approved'` | Approved doctors |
| `pending` | `status: 'pending'` | Pending approval |
| `rejected` | `status: 'rejected'` | Rejected doctors |
| `blocked` | `isBlocked: true` | Blocked doctors |
| `deleted` | `isDeleted: true` | Deleted doctors |

---

## 📝 Usage Examples

### **Get All Pending Doctors:**
```bash
curl -X GET "http://localhost:5000/api/doctors?status=pending&page=1&limit=20" \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json"
```

### **Search Doctors by Name:**
```bash
curl -X GET "http://localhost:5000/api/doctors?search=john" \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json"
```

### **Approve Doctor:**
```bash
curl -X PATCH "http://localhost:5000/api/doctors/507f1f77bcf86cd799439011/approve" \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{"reason": "Doctor approved successfully"}'
```

### **Reject Doctor:**
```bash
curl -X PATCH "http://localhost:5000/api/doctors/507f1f77bcf86cd799439011/reject" \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{"reason": "Insufficient documentation"}'
```

---

## 🎯 Performance Features

### **Database Optimization:**
- Uses `.lean()` for better performance
- Proper indexing on common query fields
- Pagination to limit data transfer
- Selective field exclusion (password, sensitive data)

### **Indexes Used:**
```javascript
// Existing indexes in User model
userSchema.index({ role: 1, specialization: 1, status: 1 });
userSchema.index({ name: 'text', email: 'text' });
userSchema.index({ role: 1, status: 1, isDeleted: 1 });
```

---

## 📈 Rate Limiting

- **GET requests:** 100 requests per minute
- **PATCH requests:** 50 requests per minute
- **Search requests:** 30 requests per minute

---

## 📞 Support

For any issues or questions regarding the Doctors API, please contact the development team.

---

**🎉 Doctors API Documentation Complete!**
