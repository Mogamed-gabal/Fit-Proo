# 🏋 Workout Template API Documentation

## 🎯 Overview
Complete API documentation for all workout template endpoints with request/response examples.

---

## 🛣️ Endpoints List

### **1. Create Template**
**POST** `/api/workout-templates/templates`

### **2. Get Doctor's Templates**
**GET** `/api/workout-templates/templates`

### **3. Get Template by ID**
**GET** `/api/workout-templates/templates/:templateId`

### **4. Update Template**
**PUT** `/api/workout-templates/templates/:templateId`

### **5. Delete Template**
**DELETE** `/api/workout-templates/templates/:templateId`

### **6. Duplicate Template**
**POST** `/api/workout-templates/templates/duplicate`

### **7. Get Public Templates**
**GET** `/api/workout-templates/templates/public`

### **8. Get Published Templates** ⭐
**GET** `/api/workout-templates/templates/published`

---

## 📋 Detailed Endpoint Documentation

### **1. Create Template**
```http
POST /api/workout-templates/templates
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "Upper Body Strength",
  "description": "Focus on chest, back, and arms",
  "difficulty": "intermediate",
  "weeklyPlan": [
    {
      "dayName": "Monday",
      "exercises": [
        {
          "name": "Bench Press",
          "sets": 4,
          "reps": 12,
          "restTime": 90,
          "gifUrl": "https://example.com/bench-press.gif",
          "equipment": "barbell",
          "instructions": "Lie on bench, lower bar to chest, press up"
        }
      ]
    },
    {
      "dayName": "Tuesday",
      "exercises": [
        {
          "name": "Pull-ups",
          "sets": 3,
          "reps": 10,
          "restTime": 60,
          "gifUrl": "https://example.com/pull-ups.gif",
          "equipment": "pull-up bar",
          "instructions": "Grip bar, pull body up until chin clears bar"
        }
      ]
    }
    // ... Wednesday through Sunday
  ]
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Workout template created successfully",
  "data": {
    "template": {
      "_id": "507f1f77bcf86cd799439011",
      "doctorId": "507f1f77bcf86cd799439012",
      "doctorName": "Dr. John Smith",
      "name": "Upper Body Strength",
      "description": "Focus on chest, back, and arms",
      "difficulty": "intermediate",
      "durationWeeks": 7,
      "weeklyPlan": [...],
      "isPublic": false,
      "usageCount": 0,
      "createdAt": "2024-03-30T10:00:00.000Z",
      "updatedAt": "2024-03-30T10:00:00.000Z"
    }
  }
}
```

---

### **2. Get Doctor's Templates**
```http
GET /api/workout-templates/templates?page=1&limit=10&search=strength
Authorization: Bearer <jwt_token>
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `search` (optional): Search by name or description

**Response (200):**
```json
{
  "success": true,
  "data": {
    "templates": [
      {
        "_id": "507f1f77bcf86cd799439011",
        "doctorId": "507f1f77bcf86cd799439012",
        "doctorName": "Dr. John Smith",
        "name": "Upper Body Strength",
        "description": "Focus on chest, back, and arms",
        "difficulty": "intermediate",
        "durationWeeks": 7,
        "weeklyPlan": [...],
        "isPublic": false,
        "usageCount": 15,
        "createdAt": "2024-03-30T10:00:00.000Z",
        "updatedAt": "2024-03-30T10:00:00.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 3,
      "totalTemplates": 25,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

---

### **3. Get Template by ID**
```http
GET /api/workout-templates/templates/507f1f77bcf86cd799439011
Authorization: Bearer <jwt_token>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "template": {
      "_id": "507f1f77bcf86cd799439011",
      "doctorId": "507f1f77bcf86cd799439012",
      "doctorName": "Dr. John Smith",
      "name": "Upper Body Strength",
      "description": "Focus on chest, back, and arms",
      "difficulty": "intermediate",
      "durationWeeks": 7,
      "weeklyPlan": [...],
      "isPublic": false,
      "usageCount": 15,
      "createdAt": "2024-03-30T10:00:00.000Z",
      "updatedAt": "2024-03-30T10:00:00.000Z"
    }
  }
}
```

---

### **4. Update Template**
```http
PUT /api/workout-templates/templates/507f1f77bcf86cd799439011
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "Updated Upper Body Strength",
  "description": "Enhanced chest, back, and arms workout",
  "difficulty": "advanced",
  "weeklyPlan": [...],
  "isPublic": true
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Workout template updated successfully",
  "data": {
    "template": {
      "_id": "507f1f77bcf86cd799439011",
      "doctorId": "507f1f77bcf86cd799439012",
      "doctorName": "Dr. John Smith",
      "name": "Updated Upper Body Strength",
      "description": "Enhanced chest, back, and arms workout",
      "difficulty": "advanced",
      "durationWeeks": 7,
      "weeklyPlan": [...],
      "isPublic": true,
      "usageCount": 15,
      "createdAt": "2024-03-30T10:00:00.000Z",
      "updatedAt": "2024-03-30T11:00:00.000Z"
    }
  }
}
```

---

### **5. Delete Template**
```http
DELETE /api/workout-templates/templates/507f1f77bcf86cd799439011
Authorization: Bearer <jwt_token>
```

**Response (200):**
```json
{
  "success": true,
  "message": "Workout template deleted successfully"
}
```

---

### **6. Duplicate Template**
```http
POST /api/workout-templates/templates/duplicate
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "templateId": "507f1f77bcf86cd799439011",
  "name": "Upper Body Strength Copy"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Workout template duplicated successfully",
  "data": {
    "template": {
      "_id": "507f1f77bcf86cd799439013",
      "doctorId": "507f1f77bcf86cd799439012",
      "doctorName": "Dr. John Smith",
      "name": "Upper Body Strength Copy",
      "description": "Focus on chest, back, and arms",
      "difficulty": "intermediate",
      "durationWeeks": 7,
      "weeklyPlan": [...],
      "isPublic": false,
      "usageCount": 0,
      "createdAt": "2024-03-30T11:00:00.000Z",
      "updatedAt": "2024-03-30T11:00:00.000Z"
    }
  }
}
```

---

### **7. Get Public Templates**
```http
GET /api/workout-templates/templates/public?page=1&limit=10&search=strength
Authorization: Bearer <jwt_token>
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `search` (optional): Search by name or description

**Response (200):**
```json
{
  "success": true,
  "data": {
    "templates": [
      {
        "_id": "507f1f77bcf86cd799439011",
        "doctorId": "507f1f77bcf86cd799439012",
        "doctorName": "Dr. John Smith",
        "name": "Upper Body Strength",
        "description": "Focus on chest, back, and arms",
        "difficulty": "intermediate",
        "durationWeeks": 7,
        "weeklyPlan": [...],
        "isPublic": true,
        "usageCount": 150,
        "createdAt": "2024-03-30T10:00:00.000Z",
        "updatedAt": "2024-03-30T10:00:00.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalTemplates": 50,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

---

### **8. Get Published Templates** ⭐
```http
GET /api/workout-templates/templates/published?page=1&limit=10&search=strength
Authorization: Bearer <jwt_token>
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `search` (optional): Search by name or description

**Response (200):**
```json
{
  "success": true,
  "data": {
    "templates": [
      {
        "_id": "507f1f77bcf86cd799439011",
        "doctorId": "507f1f77bcf86cd799439012",
        "doctorName": "Dr. John Smith",
        "name": "Upper Body Strength",
        "description": "Focus on chest, back, and arms",
        "difficulty": "intermediate",
        "durationWeeks": 7,
        "weeklyPlan": [...],
        "isPublic": true,
        "usageCount": 15,
        "createdAt": "2024-03-30T10:00:00.000Z",
        "updatedAt": "2024-03-30T10:00:00.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 2,
      "totalTemplates": 15,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

---

## 🔐 Authentication & Authorization

### **Required Headers:**
```http
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

### **Permissions Required:**
- **Create/Update/Delete**: `manage_client_workout_plans`
- **View**: `view_client_workout_plans`

### **Role-Based Access:**
- **👨‍⚕️ Doctor**: Full CRUD access to own templates
- **👤 Client**: Can view public templates only
- **🔒 Ownership**: Doctors can only access their own templates

---

## 📊 Data Models

### **Template Structure:**
```json
{
  "_id": "ObjectId",
  "doctorId": "ObjectId",
  "doctorName": "String",
  "name": "String",
  "description": "String",
  "difficulty": "String", // beginner/intermediate/advanced
  "durationWeeks": 7, // Fixed 7 days
  "weeklyPlan": [
    {
      "dayName": "String", // Monday-Sunday
      "exercises": [
        {
          "name": "String",
          "sets": "Number",
          "reps": "Number",
          "restTime": "Number", // seconds
          "gifUrl": "String",
          "equipment": "String",
          "instructions": "String"
        }
      ]
    }
  ],
  "isPublic": "Boolean",
  "usageCount": "Number",
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

---

## 🔍 Query Parameters

### **Common Parameters:**
- **page**: Page number (default: 1, min: 1)
- **limit**: Items per page (default: 10, min: 1, max: 100)
- **search**: Search term (searches name and description)
- **templateId**: Template ID for specific operations

### **Sorting:**
- **Default**: `usageCount: -1, createdAt: -1`
- **Logic**: Most used first, then newest

---

## 🚨 Error Responses

### **400 Bad Request:**
```json
{
  "success": false,
  "error": "Template name is required"
}
```

### **401 Unauthorized:**
```json
{
  "success": false,
  "error": "Authentication required"
}
```

### **403 Forbidden:**
```json
{
  "success": false,
  "error": "Insufficient permissions"
}
```

### **404 Not Found:**
```json
{
  "success": false,
  "error": "Template not found"
}
```

### **500 Server Error:**
```json
{
  "success": false,
  "error": "Internal server error"
}
```

---

## 📋 Validation Rules

### **Template Creation:**
- **name**: Required, max 100 characters
- **description**: Optional, max 500 characters
- **difficulty**: Optional, beginner/intermediate/advanced
- **weeklyPlan**: Required, exactly 7 days
- **Each day**: Must have exercises array

### **Exercise Validation:**
- **name**: Required, max 100 characters
- **sets**: Required, min 1, max 10
- **reps**: Required, min 1, max 100
- **restTime**: Required, min 0, max 600 seconds
- **equipment**: Optional, max 50 characters
- **instructions**: Optional, max 1000 characters

---

## 🎯 Use Cases

### **✅ Doctor Workflow:**
1. **Create** template with weekly exercises
2. **Publish** template for public use
3. **Duplicate** template for variations
4. **Update** template content
5. **Delete** unused templates
6. **View** published templates list

### **✅ Client Workflow:**
1. **Browse** public templates
2. **View** template details
3. **Request** assignment from doctor

---

## 🚀 Production Features

### **✅ Performance:**
- **📊 Pagination**: Efficient large dataset handling
- **🔍 Search**: Fast text search with indexing
- **📈 Sorting**: Optimized for usage and date
- **⚡ Caching**: Template caching for performance

### **✅ Security:**
- **🔐 JWT Authentication**: Secure token-based auth
- **👤 Role-Based Access**: Proper permission checks
- **🔒 Ownership Validation**: Doctors access own templates
- **🛡️ Input Validation**: Comprehensive validation rules

### **✅ Usability:**
- **📱 RESTful Design**: Standard HTTP methods
- **📋 Consistent Responses**: Uniform response format
- **🔍 Search Functionality**: Find templates quickly
- **📊 Pagination**: Handle large datasets

---

## 📋 Summary

### **✅ Complete API Coverage:**
- **🏋 8 Endpoints**: Full CRUD operations
- **🔐 Security**: Authentication and authorization
- **📊 Pagination**: Efficient data handling
- **🔍 Search**: Template discovery
- **📋 Validation**: Input sanitization
- **📈 Sorting**: Logical ordering
- **🚨 Errors**: Comprehensive error handling

### **✅ Key Features:**
- **👨‍⚕️ Doctor Management**: Full template control
- **👤 Client Access**: Public template browsing
- **🔄 Duplication**: Easy template variations
- **📊 Analytics**: Usage tracking
- **🌐 Public Sharing**: Template marketplace

---

## 🎯 Production Ready

**🏋 Workout Template API is fully documented and production-ready!**

**All endpoints with complete examples:**
- ✅ **Create Template** - Full template creation
- ✅ **Get Templates** - Doctor's own templates
- ✅ **Get Template** - Single template details
- ✅ **Update Template** - Template modification
- ✅ **Delete Template** - Template removal
- ✅ **Duplicate Template** - Template copying
- ✅ **Get Public** - All public templates
- ✅ **Get Published** - Doctor's published templates

**Complete with authentication, validation, pagination, and error handling! 🚀**
