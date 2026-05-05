# Bundle System Guide

## 📋 Overview

Bundle system allows admins to create doctor bundles (2 doctors) with pricing, and clients to view available bundles for subscription.

---

## 👨‍💼 Admin Bundle Management

### **1. Create Bundle**
```http
POST /api/bundles
Authorization: Bearer <admin_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "Premium Health Bundle",
  "doctors": [
    "507f1f77bcf86cd799439011",
    "507f1f77bcf86cd799439012"
  ],
  "pricing": {
    "oneMonth": 200,
    "threeMonths": 500,
    "sixMonths": 800
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439013",
    "name": "Premium Health Bundle",
    "doctors": [
      {
        "doctorId": {
          "_id": "507f1f77bcf86cd799439011",
          "name": "Dr. Sarah Smith",
          "email": "sarah@example.com"
        }
      },
      {
        "doctorId": {
          "_id": "507f1f77bcf86cd799439012",
          "name": "Dr. Mike Johnson",
          "email": "mike@example.com"
        }
      }
    ],
    "pricing": {
      "oneMonth": 200,
      "threeMonths": 500,
      "sixMonths": 800
    },
    "isActive": true,
    "createdBy": {
      "_id": "507f1f77bcf86cd799439014",
      "name": "Admin User",
      "email": "admin@example.com"
    },
    "createdAt": "2026-05-05T10:00:00.000Z",
    "updatedAt": "2026-05-05T10:00:00.000Z"
  }
}
```

---

### **2. Get All Bundles (Admin)**
```http
GET /api/bundles
Authorization: Bearer <admin_token>
```

**Response (Admin sees ALL bundles):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439013",
      "name": "Premium Health Bundle",
      "doctors": [
        {
          "doctorId": {
            "_id": "507f1f77bcf86cd799439011",
            "name": "Dr. Sarah Smith",
            "email": "sarah@example.com"
          }
        }
      ],
      "pricing": {
        "oneMonth": 200,
        "threeMonths": 500,
        "sixMonths": 800
      },
      "isActive": true,
      "createdBy": {
        "_id": "507f1f77bcf86cd799439014",
        "name": "Admin User"
      },
      "createdAt": "2026-05-05T10:00:00.000Z"
    },
    {
      "_id": "507f1f77bcf86cd799439014",
      "name": "Basic Fitness Bundle",
      "doctors": [
        {
          "doctorId": {
            "_id": "507f1f77bcf86cd799439013",
            "name": "Dr. Lisa Brown",
            "email": "lisa@example.com"
          }
        }
      ],
      "pricing": {
        "oneMonth": 150,
        "threeMonths": 350,
        "sixMonths": 550
      },
      "isActive": false,
      "createdBy": {
        "_id": "507f1f77bcf86cd799439014",
        "name": "Admin User"
      },
      "createdAt": "2026-05-04T15:30:00.000Z"
    }
  ]
}
```

---

### **3. Update Bundle**
```http
PUT /api/bundles/507f1f77bcf86cd799439013
Authorization: Bearer <admin_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "Updated Premium Bundle",
  "pricing": {
    "oneMonth": 250,
    "threeMonths": 600,
    "sixMonths": 900
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439013",
    "name": "Updated Premium Bundle",
    "doctors": [
      {
        "doctorId": {
          "_id": "507f1f77bcf86cd799439011",
          "name": "Dr. Sarah Smith",
          "email": "sarah@example.com"
        }
      }
    ],
    "pricing": {
      "oneMonth": 250,
      "threeMonths": 600,
      "sixMonths": 900
    },
    "isActive": true,
    "createdBy": {
      "_id": "507f1f77bcf86cd799439014",
      "name": "Admin User"
    },
    "createdAt": "2026-05-05T10:00:00.000Z",
    "updatedAt": "2026-05-05T11:00:00.000Z"
  }
}
```

---

### **4. Deactivate Bundle**
```http
PATCH /api/bundles/507f1f77bcf86cd799439013/deactivate
Authorization: Bearer <admin_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439013",
    "name": "Updated Premium Bundle",
    "doctors": [
      {
        "doctorId": {
          "_id": "507f1f77bcf86cd799439011",
          "name": "Dr. Sarah Smith",
          "email": "sarah@example.com"
        }
      }
    ],
    "pricing": {
      "oneMonth": 250,
      "threeMonths": 600,
      "sixMonths": 900
    },
    "isActive": false,
    "createdBy": {
      "_id": "507f1f77bcf86cd799439014",
      "name": "Admin User"
    },
    "createdAt": "2026-05-05T10:00:00.000Z",
    "updatedAt": "2026-05-05T11:30:00.000Z"
  }
}
```

---

## 👤 Client Bundle Viewing

### **1. Get Available Bundles**
```http
GET /api/bundles
Authorization: Bearer <client_token>
```

**Response (Client sees ONLY ACTIVE bundles):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439013",
      "name": "Updated Premium Bundle",
      "doctors": [
        {
          "doctorId": {
            "_id": "507f1f77bcf86cd799439011",
            "name": "Dr. Sarah Smith",
            "email": "sarah@example.com"
          }
        },
        {
          "doctorId": {
            "_id": "507f1f77bcf86cd799439012",
            "name": "Dr. Mike Johnson",
            "email": "mike@example.com"
          }
        }
      ],
      "pricing": {
        "oneMonth": 250,
        "threeMonths": 600,
        "sixMonths": 900
      },
      "isActive": true,
      "createdAt": "2026-05-05T10:00:00.000Z"
    }
  ]
}
```

---

## 🔐 Permission System

### **Admin Permissions**
- ✅ Create bundles
- ✅ View all bundles (active + inactive)
- ✅ Update bundles
- ✅ Deactivate bundles

### **Supervisor Permissions**
- ✅ Create bundles (if has `MANAGE_BUNDLES` permission)
- ✅ View all bundles (if has `MANAGE_BUNDLES` permission)
- ✅ Update bundles (if has `MANAGE_BUNDLES` permission)
- ✅ Deactivate bundles (if has `MANAGE_BUNDLES` permission)

### **Client Permissions**
- ✅ View active bundles only
- ❌ Cannot create bundles
- ❌ Cannot update bundles
- ❌ Cannot deactivate bundles

---

## 📊 Bundle Data Structure

### **Bundle Model**
```javascript
{
  _id: ObjectId,              // Bundle ID
  name: String,               // Bundle name (max 100 chars)
  doctors: [{                 // Exactly 2 doctors required
    doctorId: ObjectId        // Reference to User model
  }],
  pricing: {                  // 3-tier pricing
    oneMonth: Number,         // 1 month price > 0
    threeMonths: Number,      // 3 months price > 0
    sixMonths: Number         // 6 months price > 0
  },
  isActive: Boolean,          // true/false (default: true)
  createdBy: ObjectId,        // Admin who created it
  createdAt: Date,
  updatedAt: Date
}
```

---

## ⚠️ Validation Rules

### **Bundle Creation Rules**
- ✅ **Exactly 2 doctors** required
- ✅ **No duplicate doctor IDs**
- ✅ **All pricing tiers required** (oneMonth, threeMonths, sixMonths)
- ✅ **All prices must be > 0**
- ✅ **Name required** (max 100 characters)
- ✅ **Doctors must exist** and have role 'doctor'

### **Error Examples**
```json
// Wrong number of doctors
{
  "success": false,
  "error": "Bundle must contain exactly 2 doctors"
}

// Duplicate doctors
{
  "success": false,
  "error": "Duplicate doctor IDs are not allowed"
}

// Invalid price
{
  "success": false,
  "error": "One month price must be greater than 0"
}

// Missing pricing tiers
{
  "success": false,
  "error": "All pricing tiers (oneMonth, threeMonths, sixMonths) are required"
}

// Doctor not found
{
  "success": false,
  "error": "All specified users must be doctors"
}
```

---

## 🎯 Use Cases

### **Admin Workflow**
1. **Create bundle** with 2 doctors and price
2. **Monitor bundle performance** via admin dashboard
3. **Update pricing** based on market conditions
4. **Deactivate bundles** that are no longer relevant

### **Client Workflow**
1. **Browse available bundles** (active only)
2. **Compare doctor expertise** in each bundle
3. **Select bundle** for subscription
4. **Subscribe to bundle** (future feature)

---

## 🚀 Implementation Notes

### **Security**
- **Permission-based access** for all operations
- **Role validation** for doctor assignments
- **Input validation** for all fields

### **Business Logic**
- **Soft delete** - deactivation instead of hard delete
- **Price validation** - prevents negative prices
- **Doctor validation** - ensures only doctors can be assigned

### **Performance**
- **Populated doctor data** in responses
- **Filtered queries** for client vs admin access
- **Indexing** on bundle fields for fast queries

---

## 📱 Frontend Integration

### **Admin Panel Example**
```javascript
// Create bundle
const createBundle = async (bundleData) => {
  const response = await fetch('/api/bundles', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${adminToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: "Premium Health Bundle",
      doctors: ["doctorId1", "doctorId2"],
      pricing: {
        oneMonth: 200,
        threeMonths: 500,
        sixMonths: 800
      }
    })
  });
  return response.json();
};

// Get all bundles
const getBundles = async () => {
  const response = await fetch('/api/bundles', {
    headers: {
      'Authorization': `Bearer ${adminToken}`
    }
  });
  return response.json();
};
```

### **Client App Example**
```javascript
// Get available bundles
const getAvailableBundles = async () => {
  const response = await fetch('/api/bundles', {
    headers: {
      'Authorization': `Bearer ${clientToken}`
    }
  });
  return response.json();
};
```

---

## 📋 Quick Reference

| Role | Create | View All | View Active | Update | Deactivate |
|------|--------|----------|-------------|--------|------------|
| Admin | ✅ | ✅ | ✅ | ✅ | ✅ |
| Supervisor | ✅* | ✅* | ✅* | ✅* | ✅* |
| Client | ❌ | ❌ | ✅ | ❌ | ❌ |

*Supervisor needs `MANAGE_BUNDLES` permission

---

**This bundle system provides a simple yet powerful way for admins to create doctor bundles and for clients to browse available options.**
