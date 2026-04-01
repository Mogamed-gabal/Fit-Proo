# 📋 Published Templates API - Doctor's Own Published Templates

## 🎯 Purpose
Get all published templates created by the current doctor (both active and inactive).

---

## 🛣️ Endpoint

### **GET** `/api/workout-templates/templates/published`

**Purpose**: Get doctor's own published templates (both active and inactive)

**Permission**: `manage_client_workout_plans`

**Authentication**: Required (Doctor only)

---

## 📋 Request Parameters

### **Query Parameters:**
```json
{
  "page": 1,           // Optional: Page number (default: 1)
  "limit": 10,         // Optional: Items per page (default: 10)
  "search": "chest"    // Optional: Search by name or description
}
```

### **Headers:**
```json
{
  "Authorization": "Bearer <jwt_token>",
  "Content-Type": "application/json"
}
```

---

## 📊 Response Format

### **✅ Success Response (200):**
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
        "durationWeeks": 1,
        "weeklyPlan": [...],
        "usageCount": 15,
        "isPublic": true,
        "tags": ["strength", "upper body"],
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

### **❌ Error Response (400):**
```json
{
  "success": false,
  "error": "Invalid page number"
}
```

### **❌ Error Response (401):**
```json
{
  "success": false,
  "error": "Authentication required"
}
```

### **❌ Error Response (403):**
```json
{
  "success": false,
  "error": "Insufficient permissions"
}
```

---

## 🔍 Query Logic

### **✅ What Gets Returned:**
- **Doctor's own templates** - Only templates created by the current doctor
- **Published templates** - Only templates with `isPublic: true`
- **All statuses** - Both active and inactive published templates
- **Search functionality** - Search by name or description
- **Pagination** - Proper pagination with complete info

### **✅ Database Query:**
```javascript
const query = { 
  doctorId: req.user.userId,  // Current doctor's ID
  isPublic: true             // Only published templates
};

// Search filter (if provided)
if (search) {
  query.$or = [
    { name: { $regex: search, $options: 'i' } },
    { description: { $regex: search, $options: 'i' } }
  ];
}
```

### **✅ Sorting:**
```javascript
.sort({ usageCount: -1, createdAt: -1 })
// Most used templates first, then newest
```

---

## 📋 Use Cases

### **✅ Doctor Dashboard:**
```bash
GET /api/workout-templates/templates/published
# Get all doctor's published templates for dashboard
```

### **✅ Search Functionality:**
```bash
GET /api/workout-templates/templates/published?search=chest
# Search doctor's published templates containing "chest"
```

### **✅ Pagination:**
```bash
GET /api/workout-templates/templates/published?page=2&limit=5
# Get page 2 with 5 templates per page
```

---

## 🔍 Differences from Public Templates

### **❌ Old `/templates/public` (All Doctors):**
```javascript
// Returned templates from ALL doctors
const query = { isPublic: true };
// No doctorId filter
// Populated doctor information
```

### **✅ New `/templates/published` (Current Doctor Only):**
```javascript
// Returns ONLY current doctor's templates
const query = { 
  doctorId: req.user.userId,  // Current doctor only
  isPublic: true             // Published only
};
// No need to populate doctor info (already known)
```

---

## 🎯 Business Logic

### **✅ Why This Change:**
1. **Privacy** - Doctors see only their own published templates
2. **Relevance** - More relevant to the doctor's work
3. **Performance** - Faster query (no populate needed)
4. **Control** - Doctors manage their own published content

### **✅ What's Included:**
- **All published templates** by the current doctor
- **Both active and inactive** published templates
- **Usage statistics** for each template
- **Complete pagination** with navigation info
- **Search functionality** within doctor's templates

---

## 🚀 Examples

### **✅ Example 1: Get All Published Templates**
```bash
curl -X GET "http://localhost:5000/api/workout-templates/templates/published" \
  -H "Authorization: Bearer <doctor_token>" \
  -H "Content-Type: application/json"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "templates": [
      {
        "_id": "507f1f77bcf86cd799439011",
        "name": "Full Body Workout",
        "description": "Complete body workout routine",
        "isPublic": true,
        "usageCount": 23,
        "createdAt": "2024-03-30T10:00:00.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 1,
      "totalTemplates": 1,
      "hasNext": false,
      "hasPrev": false
    }
  }
}
```

### **✅ Example 2: Search Published Templates**
```bash
curl -X GET "http://localhost:5000/api/workout-templates/templates/published?search=full" \
  -H "Authorization: Bearer <doctor_token>"
```

### **✅ Example 3: Paginated Results**
```bash
curl -X GET "http://localhost:5000/api/workout-templates/templates/published?page=2&limit=5" \
  -H "Authorization: Bearer <doctor_token>"
```

---

## 🎯 Summary

### **✅ What Changed:**
- **Endpoint**: `/templates/public` → `/templates/published`
- **Scope**: All doctors' templates → Current doctor's templates only
- **Permission**: `view_client_workout_plans` → `manage_client_workout_plans`
- **Controller**: `getPublicTemplates` → `getPublishedTemplates`

### **✅ What's Better:**
- **Privacy** - Doctors see only their own content
- **Relevance** - More focused and useful
- **Performance** - Faster queries
- **Control** - Better content management

### **✅ What's Included:**
- **All published templates** by current doctor
- **Both active and inactive** templates
- **Complete pagination** with navigation
- **Search functionality** within doctor's templates
- **Usage statistics** for tracking

---

## 🚀 Ready for Use

**The new `/templates/published` endpoint is ready for production use!**

**Key features:**
- ✅ **Doctor-specific** content only
- ✅ **Published templates** (active/inactive)
- ✅ **Search functionality**
- ✅ **Complete pagination**
- ✅ **Usage statistics**
- ✅ **Error handling**

**Perfect for doctor dashboards and template management! 🎯**
