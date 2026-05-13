# Client Home Endpoints Documentation

## 📋 Overview

The client-home endpoints provide public-facing data for clients to browse doctors, specializations, and related information. All endpoints require authentication and include caching for performance.

**Base URL:** `/api/client-home`

---

## 🔐 Authentication

**All endpoints require authentication:**
```javascript
Authorization: Bearer <token>
```

**Cache Control:** All responses include `Cache-Control: public, max-age=300` (5 minutes)

---

## 📊 Available Endpoints

### **1. Get All Doctors**
**GET /api/client-home/doctors**

**Query Parameters:**
- `page` (optional, default: 1) - Page number
- `limit` (optional, default: 10, max: 100) - Items per page
- `specialization` (optional) - Filter by specialization (doctor, nutritionist, therapist, coach)
- `search` (optional, 1-100 chars) - Search by name or specialization
- `sortBy` (optional, default: name) - Sort by (name, specialization, createdAt)

**Response:**
```json
{
  "success": true,
  "data": {
    "doctors": [
      {
        "_id": "doctor_id",
        "name": "Dr. Sarah Johnson",
        "specialization": "nutritionist",
        "years_of_experience": 12,
        "short_bio": "Professional bio...",
        "profilePicture": {
          "secure_url": "https://res.cloudinary.com/..."
        },
        "packages": [...],
        "certificates": [...]
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

### **2. Get All Specializations**
**GET /api/client-home/specializations**

**Response:**
```json
{
  "success": true,
  "data": {
    "specializations": [
      "doctor",
      "nutritionist",
      "therapist",
      "coach"
    ]
  }
}
```

**Note:** This endpoint uses in-memory caching (5 minutes TTL) for performance.

---

### **3. Get Doctor by ID**
**GET /api/client-home/doctors/:id`

**Path Parameters:**
- `id` - MongoDB Object ID of doctor

**Response:**
```json
{
  "success": true,
  "data": {
    "doctor": {
      "_id": "doctor_id",
      "name": "Dr. Sarah Johnson",
      "email": "doctor@example.com",
      "phone": "+1234567890",
      "specialization": "nutritionist",
      "years_of_experience": 12,
      "short_bio": "Professional bio...",
      "profilePicture": {
        "secure_url": "https://res.cloudinary.com/..."
      },
      "packages": [
        {
          "duration": 1,
          "price": 150
        }
      ],
      "certificates": [...]
    }
  }
}
```

---

### **4. Get Specialization Details**
**GET /api/client-home/specializations/:specialization**

**Path Parameters:**
- `specialization` - Specialization type (doctor, nutritionist, therapist, coach)

**Query Parameters:**
- `page` (optional, default: 1) - Page number
- `limit` (optional, default: 10, max: 100) - Items per page
- `sortBy` (optional, default: name) - Sort by (name, experience, createdAt)

**Response:**
```json
{
  "success": true,
  "data": {
    "specialization": "nutritionist",
    "doctors": [
      {
        "_id": "doctor_id",
        "name": "Dr. Sarah Johnson",
        "years_of_experience": 12,
        "short_bio": "Professional bio...",
        "profilePicture": {
          "secure_url": "https://res.cloudinary.com/..."
        }
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

### **5. Get Doctors by Specializations (Filter)**
**GET /api/client-home/doctors/by-specializations`

**Query Parameters:**
- `specializations` (required) - Comma-separated list or array of specializations
- `page` (optional, default: 1) - Page number
- `limit` (optional, default: 10, max: 100) - Items per page
- `sortBy` (optional, default: name) - Sort by (name, specialization, experience, createdAt)

**Example Request:**
```
GET /api/client-home/doctors/by-specializations?specializations=nutritionist,therapist
```

**Response:**
```json
{
  "success": true,
  "data": {
    "specializations": ["nutritionist", "therapist"],
    "doctors": [
      {
        "_id": "doctor_id",
        "name": "Dr. Sarah Johnson",
        "specialization": "nutritionist",
        "years_of_experience": 12,
        "short_bio": "Professional bio...",
        "profilePicture": {
          "secure_url": "https://res.cloudinary.com/..."
        }
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 2,
      "totalDoctors": 15,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

**Validation:**
- Maximum 10 specializations per request
- All specializations must be valid (doctor, nutritionist, therapist, coach)
- Case-insensitive (automatically converted to lowercase)

---

## 🎯 Key Features

### **✅ Performance Optimizations:**
- **5-minute cache** on all responses
- **In-memory caching** for specializations endpoint
- **Pagination** on all list endpoints
- **Efficient queries** with proper indexing

### **✅ Security:**
- **Authentication required** for all endpoints
- **Input validation** on all parameters
- **Rate limiting** support
- **Production-safe error handling**

### **✅ Data Filtering:**
- **Active doctors only** (isActive: true)
- **Approved doctors only** (status: approved)
- **No deleted doctors** (isDeleted: false)
- **No blocked doctors** (isBlocked: false)

---

## 📋 Usage Examples

### **✅ Get All Doctors with Pagination:**
```javascript
GET /api/client-home/doctors?page=1&limit=10
Authorization: Bearer <token>
```

### **✅ Filter by Specialization:**
```javascript
GET /api/client-home/doctors?specialization=nutritionist
Authorization: Bearer <token>
```

### **✅ Search Doctors:**
```javascript
GET /api/client-home/doctors?search=Sarah
Authorization: Bearer <token>
```

### **✅ Get Doctors by Multiple Specializations:**
```javascript
GET /api/client-home/doctors/by-specializations?specializations=nutritionist,therapist
Authorization: Bearer <token>
```

### **✅ Get Specific Doctor:**
```javascript
GET /api/client-home/doctors/69f5d9354a5388b8069aca9e
Authorization: Bearer <token>
```

---

## 🔍 Controller Logic

### **✅ Filter Conditions:**
All doctor queries include these filters:
```javascript
{
  role: 'doctor',
  isActive: true,
  isDeleted: { $ne: true },
  isBlocked: false,
  status: 'approved'
}
```

### **✅ Cache Strategy:**
- **Specializations endpoint:** In-memory cache (5 minutes TTL)
- **All endpoints:** HTTP cache headers (5 minutes)
- **Pagination:** Efficient skip/limit queries

### **✅ Error Handling:**
- **Production-safe:** Generic error messages in production
- **Development mode:** Detailed error information
- **Validation errors:** Clear field-specific messages

---

## 📋 Summary

**✅ Endpoints:**
1. `GET /api/client-home/doctors` - List all doctors
2. `GET /api/client-home/specializations` - Get available specializations
3. `GET /api/client-home/doctors/:id` - Get specific doctor
4. `GET /api/client-home/specializations/:specialization` - Get doctors by specialization
5. `GET /api/client-home/doctors/by-specializations` - Filter by multiple specializations

**✅ Features:**
- Authentication required
- 5-minute caching
- Pagination support
- Search and filtering
- Performance optimized
- Production-ready

**🎯 These endpoints are designed for client-facing applications to browse and discover doctors efficiently!**
