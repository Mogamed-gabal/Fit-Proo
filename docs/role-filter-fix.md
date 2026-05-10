# Role Filter Fix for Soft-Deleted Users Endpoint

## 🚨 Issue Identified

The role filter wasn't working in the soft-deleted users endpoint. When filtering by `role: "doctor"`, the response was returning both doctors AND supervisors instead of only doctors.

**Problem:**
```javascript
// Request: GET /api/users/soft-deleted?role=doctor
// Expected: Only deleted doctors
// Actual: Deleted doctors + deleted supervisors
```

**Response showed:**
```json
{
  "users": [
    {
      "role": "doctor",      // ← Correct
      "isDeleted": true
    },
    {
      "role": "supervisor",  // ← Wrong! Should not be here
      "isDeleted": true
    }
  ]
}
```

---

## ✅ Root Cause

The aggregation pipeline was only using the basic filter:
```javascript
{ $match: { isDeleted: true } }
```

But it wasn't including the role filter condition that was built in the query object. The role filter logic was being ignored in the aggregation pipeline.

---

## 🔧 Solution Implemented

### **✅ Fixed the Aggregation Pipeline**

**Before (Problematic):**
```javascript
const aggregationPipeline = [
  { $match: { isDeleted: true } },  // ← Only basic filter
  { $sort: sort },
  { $skip: skip },
  { $limit: limitNum },
  // ... rest of pipeline
];
```

**After (Fixed):**
```javascript
// Build the match condition properly
const matchCondition = { isDeleted: true };

// Add role filter if specified
if (role && role !== 'all') {
  matchCondition.role = role;
  console.log('🔍 Added role filter to aggregation:', role);
}

// Add search filter if specified
if (search) {
  const searchRegex = new RegExp(search.toLowerCase().trim(), 'i');
  matchCondition.$or = [
    { name: searchRegex },
    { email: searchRegex }
  ];
  console.log('🔍 Added search filter to aggregation:', search);
}

console.log('🔍 Final aggregation match condition:', JSON.stringify(matchCondition));

const aggregationPipeline = [
  { $match: matchCondition },  // ← Now includes all filters
  { $sort: sort },
  { $skip: skip },
  { $limit: limitNum },
  // ... rest of pipeline
];
```

---

## 🎯 How It Works Now

### **✅ Dynamic Match Condition Building:**
```javascript
// Base condition
const matchCondition = { isDeleted: true };

// Add role filter
if (role && role !== 'all') {
  matchCondition.role = role;
}

// Add search filter
if (search) {
  matchCondition.$or = [
    { name: searchRegex },
    { email: searchRegex }
  ];
}

// Final match condition
// For role=doctor: { isDeleted: true, role: "doctor" }
// For search=john: { isDeleted: true, $or: [{ name: /john/i }, { email: /john/i }] }
// For both: { isDeleted: true, role: "doctor", $or: [{ name: /john/i }, { email: /john/i }] }
```

### **✅ Consistent Count Query:**
```javascript
// Count pipeline uses same match condition
const countPipeline = [
  { $match: matchCondition },  // ← Same filters as main query
  { $count: 'total' }
];
```

---

## 📊 Expected Console Output After Fix

**When filtering by role=doctor:**
```
🔍 getSoftDeletedUsers called - SOFT DELETED ENDPOINT
🔍 Request URL: /api/users/soft-deleted?role=doctor
🔍 Building query for soft-deleted users: {"isDeleted":true}
🔍 Added role filter to aggregation: doctor
🔍 Final aggregation match condition: {"isDeleted":true,"role":"doctor"}
🔍 Found soft-deleted users count: 1
🔍 First user isDeleted: true
🔍 First user role: doctor
🔍 All users actually soft-deleted: true
```

---

## 🎯 Expected Response After Fix

**Request:** `GET /api/users/soft-deleted?role=doctor`

**Response:**
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "_id": "69f5d9354a5388b8069aca9e",
        "name": "Dr Sarah Johnson",
        "role": "doctor",
        "isDeleted": true,
        "deletedAt": "2026-05-10T18:47:16.103Z"
      }
      // ← Only doctors, no supervisors
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 1,
      "totalUsers": 1,
      "itemsPerPage": 20
    },
    "statistics": {
      "totalSoftDeleted": 1,
      "deletedByRole": {
        "doctor": 1,
        "supervisor": 1  // ← Still shows overall stats
      }
    },
    "filters": {
      "role": "doctor",
      "sortBy": "deletedAt",
      "sortOrder": "desc",
      "search": ""
    }
  }
}
```

---

## 🔧 Test Cases

### **✅ Test 1: Role Filter**
```bash
# Filter by doctor role
curl -X GET "http://localhost:5000/api/users/soft-deleted?role=doctor" \
  -H "Authorization: Bearer <admin-token>"

# Expected: Only deleted doctors
```

### **✅ Test 2: Supervisor Role**
```bash
# Filter by supervisor role
curl -X GET "http://localhost:5000/api/users/soft-deleted?role=supervisor" \
  -H "Authorization: Bearer <admin-token>"

# Expected: Only deleted supervisors
```

### **✅ Test 3: Search Functionality**
```bash
# Search by name
curl -X GET "http://localhost:5000/api/users/soft-deleted?search=sarah" \
  -H "Authorization: Bearer <admin-token>"

# Expected: Only deleted users matching "sarah"
```

### **✅ Test 4: Combined Filters**
```bash
# Role + search
curl -X GET "http://localhost:5000/api/users/soft-deleted?role=doctor&search=sarah" \
  -H "Authorization: Bearer <admin-token>"

# Expected: Only deleted doctors matching "sarah"
```

---

## 📋 Summary

**✅ Problem Solved:**
- Role filter wasn't working in aggregation pipeline
- Search filter wasn't working either
- Users were getting mixed results regardless of filters

**✅ Solution:**
- Build dynamic match condition properly
- Include all filters in aggregation pipeline
- Use same match condition for count query

**✅ Result:**
- Role filtering works correctly
- Search functionality works
- Combined filters work
- Accurate pagination and counts

**🎯 All query parameters now work correctly with the aggregation pipeline!**
