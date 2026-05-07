# Bundle System API - Frontend Developer Complete Guide

## 📋 Overview

Complete guide to bundle system endpoints for frontend developers. This document contains everything you need to integrate with the bundle system without needing additional backend support.

---

## 🔐 Authentication & Authorization

### **✅ Required Headers:**
```http
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

### **✅ Token Management:**
```javascript
const token = localStorage.getItem('token');
// Must be valid and not expired
// Admin permissions required for most operations
```

### **✅ Common Error Patterns:**
```javascript
// 401 Unauthorized
{
  "success": false,
  "error": "Authentication required"
}

// 403 Forbidden  
{
  "success": false,
  "error": "Insufficient permissions"
}
```

---

## 🚀 Bundle Endpoints

### **✅ 1. Create New Bundle**

#### **Endpoint:** `POST /api/bundles`

#### **Purpose:** Create a new service bundle with 2-3 doctors

#### **Authentication:** Required
#### **Permission:** `MANAGE_BUNDLES`

#### **✅ Request Body:**
```json
{
  "name": "Premium Health Bundle",
  "doctors": [
    "507f1f77bcf86cd799439011",
    "507f1f77bcf86cd799439012",
    "507f1f77bcf86cd799439013"
  ],
  "pricing": {
    "oneMonth": 200,
    "threeMonths": 500,
    "sixMonths": 800
  }
}
```

#### **✅ Field Requirements:**

#### **name:**
- **Type:** String
- **Required:** Yes
- **Min Length:** 1 character
- **Max Length:** 100 characters
- **Description:** Bundle display name

#### **doctors:**
- **Type:** Array of MongoDB ObjectIds
- **Required:** Yes
- **Min Items:** 2
- **Max Items:** 3
- **Description:** Array of doctor user IDs
- **Validation:** All doctors must exist and have role 'doctor'

#### **pricing:**
- **Type:** Object
- **Required:** Yes
- **Description:** Pricing for different subscription periods

#### **pricing.oneMonth:**
- **Type:** Number
- **Required:** Yes
- **Min:** 0.01
- **Description:** Price for 1-month subscription

#### **pricing.threeMonths:**
- **Type:** Number
- **Required:** Yes
- **Min:** 0.01
- **Description:** Price for 3-month subscription

#### **pricing.sixMonths:**
- **Type:** Number
- **Required:** Yes
- **Min:** 0.01
- **Description:** Price for 6-month subscription

#### **✅ Request Implementation:**
```javascript
const createBundle = async (bundleData) => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch('/api/bundles', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(bundleData)
    });

    const result = await response.json();

    if (result.success) {
      console.log('Bundle created:', result.data);
      return result.data;
    } else {
      console.error('Error:', result.error);
      throw new Error(result.error);
    }
  } catch (error) {
    console.error('Network error:', error);
    throw error;
  }
};

// Usage
const newBundle = await createBundle({
  name: 'Premium Health Bundle',
  doctors: [
    '507f1f77bcf86cd799439011',
    '507f1f77bcf86cd799439012',
    '507f1f77bcf86cd799439013'
  ],
  pricing: {
    oneMonth: 200,
    threeMonths: 500,
    sixMonths: 800
  }
});
```

#### **✅ Success Response (201):**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439020",
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
      },
      {
        "doctorId": {
          "_id": "507f1f77bcf86cd799439013",
          "name": "Dr. Emily Davis",
          "email": "emily@example.com"
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
    "createdAt": "2026-05-05T12:00:00.000Z",
    "updatedAt": "2026-05-05T12:00:00.000Z"
  }
}
```

#### **❌ Error Responses:**
```javascript
// 400 Validation Error - Missing Fields
{
  "success": false,
  "error": "Bundle name is required"
}

// 400 Validation Error - Invalid Doctors Count
{
  "success": false,
  "error": "Bundle must contain between 2 and 3 doctors"
}

// 400 Validation Error - Invalid Pricing
{
  "success": false,
  "error": "All pricing tiers (oneMonth, threeMonths, sixMonths) are required"
}

// 400 Validation Error - Invalid Doctor IDs
{
  "success": false,
  "error": "All specified users must be doctors"
}

// 400 Validation Error - Duplicate Doctors
{
  "success": false,
  "error": "Duplicate doctor IDs are not allowed"
}

// 401 Unauthorized
{
  "success": false,
  "error": "Authentication required"
}

// 403 Forbidden
{
  "success": false,
  "error": "Insufficient permissions"
}

// 500 Server Error
{
  "success": false,
  "error": "Internal server error"
}
```

---

### **✅ 2. Get All Bundles**

#### **Endpoint:** `GET /api/bundles`

#### **Purpose:** Retrieve all bundles with pagination and filtering

#### **Authentication:** Required
#### **Permission:** `READ_BUNDLES` (or admin access)

#### **✅ Query Parameters:**
```javascript
// Optional parameters
?page=1              // Page number (default: 1)
&limit=10            // Items per page (default: 10, max: 100)
&status=active       // Filter by status: active, inactive, all (default: active)
&search=premium       // Search by bundle name
&sortBy=createdAt     // Sort field: name, createdAt, pricing.oneMonth (default: createdAt)
&sortOrder=desc       // Sort order: asc, desc (default: desc)
```

#### **✅ Request Implementation:**
```javascript
const getAllBundles = async (options = {}) => {
  try {
    const token = localStorage.getItem('token');
    const params = new URLSearchParams({
      page: options.page || 1,
      limit: options.limit || 10,
      status: options.status || 'active',
      ...(options.search && { search: options.search }),
      ...(options.sortBy && { sortBy: options.sortBy }),
      ...(options.sortOrder && { sortOrder: options.sortOrder })
    });

    const response = await fetch(`/api/bundles?${params}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const result = await response.json();

    if (result.success) {
      return result.data;
    } else {
      throw new Error(result.error);
    }
  } catch (error) {
    console.error('Error fetching bundles:', error);
    throw error;
  }
};

// Usage examples
const allBundles = await getAllBundles();
const searchResults = await getAllBundles({ 
  search: 'premium', 
  limit: 5, 
  sortBy: 'name' 
});
```

#### **✅ Success Response (200):**
```json
{
  "success": true,
  "data": {
    "bundles": [
      {
        "_id": "507f1f77bcf86cd799439020",
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
          "name": "Admin User"
        },
        "createdAt": "2026-05-05T12:00:00.000Z",
        "updatedAt": "2026-05-05T12:00:00.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 3,
      "totalItems": 25,
      "itemsPerPage": 10,
      "hasNext": true,
      "hasPrev": false
    },
    "filters": {
      "status": "active",
      "search": null,
      "sortBy": "createdAt",
      "sortOrder": "desc"
    }
  }
}
```

#### **❌ Error Responses:**
```javascript
// 401 Unauthorized
{
  "success": false,
  "error": "Authentication required"
}

// 403 Forbidden
{
  "success": false,
  "error": "Insufficient permissions"
}

// 400 Invalid Query Parameters
{
  "success": false,
  "error": "Invalid page number"
}
```

---

### **✅ 3. Get Bundle by ID**

#### **Endpoint:** `GET /api/bundles/:id`

#### **Purpose:** Retrieve a specific bundle by its ID

#### **Authentication:** Required
#### **Permission:** `READ_BUNDLES` (or admin access)

#### **✅ Request Implementation:**
```javascript
const getBundleById = async (bundleId) => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`/api/bundles/${bundleId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const result = await response.json();

    if (result.success) {
      return result.data.bundle;
    } else {
      throw new Error(result.error);
    }
  } catch (error) {
    console.error('Error fetching bundle:', error);
    throw error;
  }
};

// Usage
const bundle = await getBundleById('507f1f77bcf86cd799439020');
```

#### **✅ Success Response (200):**
```json
{
  "success": true,
  "data": {
    "bundle": {
      "_id": "507f1f77bcf86cd799439020",
      "name": "Premium Health Bundle",
      "doctors": [
        {
          "doctorId": {
            "_id": "507f1f77bcf86cd799439011",
            "name": "Dr. Sarah Smith",
            "email": "sarah@example.com",
            "phone": "+1234567890",
            "specialization": "Cardiology"
          }
        },
        {
          "doctorId": {
            "_id": "507f1f77bcf86cd799439012",
            "name": "Dr. Mike Johnson",
            "email": "mike@example.com",
            "phone": "+1234567891",
            "specialization": "Nutrition"
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
      "createdAt": "2026-05-05T12:00:00.000Z",
      "updatedAt": "2026-05-05T12:00:00.000Z"
    }
  }
}
```

#### **❌ Error Responses:**
```javascript
// 404 Bundle Not Found
{
  "success": false,
  "error": "Bundle not found"
}

// 401 Unauthorized
{
  "success": false,
  "error": "Authentication required"
}

// 403 Forbidden
{
  "success": false,
  "error": "Insufficient permissions"
}
```

---

### **✅ 4. Update Bundle**

#### **Endpoint:** `PUT /api/bundles/:id`

#### **Purpose:** Update an existing bundle

#### **Authentication:** Required
#### **Permission:** `MANAGE_BUNDLES`

#### **✅ Request Body (Partial Update Supported):**
```json
{
  "name": "Updated Premium Bundle",
  "doctors": [
    "507f1f77bcf86cd799439011",
    "507f1f77bcf86cd799439014"
  ],
  "pricing": {
    "oneMonth": 250,
    "threeMonths": 600,
    "sixMonths": 900
  }
}
```

#### **✅ Request Implementation:**
```javascript
const updateBundle = async (bundleId, updateData) => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`/api/bundles/${bundleId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updateData)
    });

    const result = await response.json();

    if (result.success) {
      return result.data.bundle;
    } else {
      throw new Error(result.error);
    }
  } catch (error) {
    console.error('Error updating bundle:', error);
    throw error;
  }
};

// Usage
const updatedBundle = await updateBundle('507f1f77bcf86cd799439020', {
  name: 'Updated Premium Bundle',
  pricing: {
    oneMonth: 250,
    threeMonths: 600,
    sixMonths: 900
  }
});
```

#### **✅ Success Response (200):**
```json
{
  "success": true,
  "message": "Bundle updated successfully",
  "data": {
    "bundle": {
      "_id": "507f1f77bcf86cd799439020",
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
            "_id": "507f1f77bcf86cd799439014",
            "name": "Dr. Alex Wilson",
            "email": "alex@example.com"
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
      "createdAt": "2026-05-05T12:00:00.000Z",
      "updatedAt": "2026-05-05T13:00:00.000Z"
    }
  }
}
```

#### **❌ Error Responses:**
```javascript
// 404 Bundle Not Found
{
  "success": false,
  "error": "Bundle not found"
}

// 400 Validation Error
{
  "success": false,
  "error": "Bundle must contain between 2 and 3 doctors"
}

// 400 Invalid Pricing
{
  "success": false,
  "error": "All pricing tiers must be greater than 0"
}

// 403 Forbidden
{
  "success": false,
  "error": "Insufficient permissions"
}
```

---

### **✅ 5. Deactivate Bundle**

#### **Endpoint:** `PATCH /api/bundles/:id/deactivate`

#### **Purpose:** Deactivate a bundle (soft delete)

#### **Authentication:** Required
#### **Permission:** `MANAGE_BUNDLES`

#### **✅ Request Implementation:**
```javascript
const deactivateBundle = async (bundleId) => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`/api/bundles/${bundleId}/deactivate`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const result = await response.json();

    if (result.success) {
      return result.data.bundle;
    } else {
      throw new Error(result.error);
    }
  } catch (error) {
    console.error('Error deactivating bundle:', error);
    throw error;
  }
};

// Usage
const deactivatedBundle = await deactivateBundle('507f1f77bcf86cd799439020');
```

#### **✅ Success Response (200):**
```json
{
  "success": true,
  "message": "Bundle deactivated successfully",
  "data": {
    "bundle": {
      "_id": "507f1f77bcf86cd799439020",
      "name": "Premium Health Bundle",
      "isActive": false,
      "deactivatedAt": "2026-05-05T14:00:00.000Z",
      "deactivatedBy": {
        "_id": "507f1f77bcf86cd799439014",
        "name": "Admin User"
      }
    }
  }
}
```

#### **❌ Error Responses:**
```javascript
// 404 Bundle Not Found
{
  "success": false,
  "error": "Bundle not found"
}

// 400 Already Deactivated
{
  "success": false,
  "error": "Bundle is already deactivated"
}

// 403 Forbidden
{
  "success": false,
  "error": "Insufficient permissions"
}
```

---

### **✅ 6. Activate Bundle**

#### **Endpoint:** `PATCH /api/bundles/:id/activate`

#### **Purpose:** Reactivate a deactivated bundle

#### **Authentication:** Required
#### **Permission:** `MANAGE_BUNDLES`

#### **✅ Request Implementation:**
```javascript
const activateBundle = async (bundleId) => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`/api/bundles/${bundleId}/activate`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const result = await response.json();

    if (result.success) {
      return result.data.bundle;
    } else {
      throw new Error(result.error);
    }
  } catch (error) {
    console.error('Error activating bundle:', error);
    throw error;
  }
};

// Usage
const activatedBundle = await activateBundle('507f1f77bcf86cd799439020');
```

#### **✅ Success Response (200):**
```json
{
  "success": true,
  "message": "Bundle activated successfully",
  "data": {
    "bundle": {
      "_id": "507f1f77bcf86cd799439020",
      "name": "Premium Health Bundle",
      "isActive": true,
      "activatedAt": "2026-05-05T15:00:00.000Z",
      "activatedBy": {
        "_id": "507f1f77bcf86cd799439014",
        "name": "Admin User"
      }
    }
  }
}
```

---

### **✅ 7. Delete Bundle**

#### **Endpoint:** `DELETE /api/bundles/:id`

#### **Purpose:** Permanently delete a bundle

#### **Authentication:** Required
#### **Permission:** `DELETE_BUNDLES`

#### **⚠️ Warning:** This action is irreversible

#### **✅ Request Implementation:**
```javascript
const deleteBundle = async (bundleId) => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`/api/bundles/${bundleId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const result = await response.json();

    if (result.success) {
      return result.data;
    } else {
      throw new Error(result.error);
    }
  } catch (error) {
    console.error('Error deleting bundle:', error);
    throw error;
  }
};

// Usage
const result = await deleteBundle('507f1f77bcf86cd799439020');
```

#### **✅ Success Response (200):**
```json
{
  "success": true,
  "message": "Bundle deleted successfully",
  "data": {
    "deletedBundle": {
      "_id": "507f1f77bcf86cd799439020",
      "name": "Premium Health Bundle"
    },
    "deletedAt": "2026-05-05T16:00:00.000Z",
    "deletedBy": {
      "_id": "507f1f77bcf86cd799439014",
      "name": "Admin User"
    }
  }
}
```

#### **❌ Error Responses:**
```javascript
// 404 Bundle Not Found
{
  "success": false,
  "error": "Bundle not found"
}

// 400 Cannot Delete Active Bundle
{
  "success": false,
  "error": "Cannot delete active bundle. Please deactivate it first."
}

// 403 Forbidden
{
  "success": false,
  "error": "Insufficient permissions"
}
```

---

### **✅ 8. Get Available Doctors**

#### **Endpoint:** `GET /api/bundles/doctors/available`

#### **Purpose:** Get list of doctors available for bundle creation

#### **Authentication:** Required
#### **Permission:** `READ_BUNDLES` or admin access

#### **✅ Query Parameters:**
```javascript
?search=john           // Search by name or email
&specialization=cardio  // Filter by specialization
&limit=20             // Limit results (default: 50)
&active=true          // Filter by active status (default: true)
```

#### **✅ Request Implementation:**
```javascript
const getAvailableDoctors = async (options = {}) => {
  try {
    const token = localStorage.getItem('token');
    const params = new URLSearchParams({
      ...(options.search && { search: options.search }),
      ...(options.specialization && { specialization: options.specialization }),
      ...(options.limit && { limit: options.limit }),
      ...(options.active !== undefined && { active: options.active })
    });

    const response = await fetch(`/api/bundles/doctors/available?${params}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const result = await response.json();

    if (result.success) {
      return result.data;
    } else {
      throw new Error(result.error);
    }
  } catch (error) {
    console.error('Error fetching doctors:', error);
    throw error;
  }
};

// Usage
const doctors = await getAvailableDoctors({ search: 'sarah' });
```

#### **✅ Success Response (200):**
```json
{
  "success": true,
  "data": {
    "doctors": [
      {
        "_id": "507f1f77bcf86cd799439011",
        "name": "Dr. Sarah Smith",
        "email": "sarah@example.com",
        "phone": "+1234567890",
        "specialization": "Cardiology",
        "isActive": true,
        "createdAt": "2026-05-01T10:00:00.000Z"
      },
      {
        "_id": "507f1f77bcf86cd799439012",
        "name": "Dr. Mike Johnson",
        "email": "mike@example.com",
        "phone": "+1234567891",
        "specialization": "Nutrition",
        "isActive": true,
        "createdAt": "2026-05-01T11:00:00.000Z"
      }
    ],
    "total": 15,
    "filters": {
      "search": "sarah",
      "specialization": null,
      "active": true
    }
  }
}
```

---

## 🎯 Frontend Implementation Examples

### **✅ Bundle Management Component:**
```javascript
import React, { useState, useEffect } from 'react';

const BundleManager = () => {
  const [bundles, setBundles] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingBundle, setEditingBundle] = useState(null);

  useEffect(() => {
    fetchBundles();
    fetchDoctors();
  }, []);

  const fetchBundles = async (options = {}) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({
        page: options.page || 1,
        limit: options.limit || 10,
        status: options.status || 'active'
      });

      const response = await fetch(`/api/bundles?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const result = await response.json();

      if (result.success) {
        setBundles(result.data.bundles);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('Failed to fetch bundles');
    } finally {
      setLoading(false);
    }
  };

  const fetchDoctors = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/bundles/doctors/available', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const result = await response.json();

      if (result.success) {
        setDoctors(result.data.doctors);
      }
    } catch (err) {
      console.error('Failed to fetch doctors:', err);
    }
  };

  const createBundle = async (bundleData) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/bundles', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(bundleData)
      });

      const result = await response.json();

      if (result.success) {
        setShowCreateForm(false);
        fetchBundles();
        return result.data;
      } else {
        throw new Error(result.error);
      }
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateBundle = async (bundleId, updateData) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/bundles/${bundleId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      });

      const result = await response.json();

      if (result.success) {
        setEditingBundle(null);
        fetchBundles();
        return result.data;
      } else {
        throw new Error(result.error);
      }
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deactivateBundle = async (bundleId) => {
    if (!window.confirm('Are you sure you want to deactivate this bundle?')) {
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/bundles/${bundleId}/deactivate`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();

      if (result.success) {
        fetchBundles();
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('Failed to deactivate bundle');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bundle-manager">
      <div className="header">
        <h2>Bundle Management</h2>
        <button onClick={() => setShowCreateForm(true)}>
          Create New Bundle
        </button>
      </div>

      {error && <div className="error">{error}</div>}

      {showCreateForm && (
        <BundleForm
          doctors={doctors}
          onSubmit={createBundle}
          onCancel={() => setShowCreateForm(false)}
          loading={loading}
        />
      )}

      {editingBundle && (
        <BundleForm
          doctors={doctors}
          bundle={editingBundle}
          onSubmit={(data) => updateBundle(editingBundle._id, data)}
          onCancel={() => setEditingBundle(null)}
          loading={loading}
        />
      )}

      <div className="bundles-list">
        {loading ? (
          <div>Loading bundles...</div>
        ) : (
          bundles.map(bundle => (
            <BundleCard
              key={bundle._id}
              bundle={bundle}
              onEdit={() => setEditingBundle(bundle)}
              onDeactivate={() => deactivateBundle(bundle._id)}
              loading={loading}
            />
          ))
        )}
      </div>
    </div>
  );
};
```

### **✅ Bundle Form Component:**
```javascript
import React, { useState, useEffect } from 'react';

const BundleForm = ({ bundle, doctors, onSubmit, onCancel, loading }) => {
  const [formData, setFormData] = useState({
    name: '',
    doctors: [],
    pricing: {
      oneMonth: '',
      threeMonths: '',
      sixMonths: ''
    }
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (bundle) {
      setFormData({
        name: bundle.name,
        doctors: bundle.doctors.map(d => d.doctorId._id),
        pricing: bundle.pricing
      });
    }
  }, [bundle]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Bundle name is required';
    }

    if (formData.doctors.length < 2 || formData.doctors.length > 3) {
      newErrors.doctors = 'Bundle must contain between 2 and 3 doctors';
    }

    if (!formData.pricing.oneMonth || formData.pricing.oneMonth <= 0) {
      newErrors.pricing = 'All prices must be greater than 0';
    }

    if (!formData.pricing.threeMonths || formData.pricing.threeMonths <= 0) {
      newErrors.pricing = 'All prices must be greater than 0';
    }

    if (!formData.pricing.sixMonths || formData.pricing.sixMonths <= 0) {
      newErrors.pricing = 'All prices must be greater than 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      await onSubmit(formData);
    } catch (error) {
      // Error is handled by parent component
    }
  };

  const handleDoctorChange = (doctorId, checked) => {
    if (checked) {
      if (formData.doctors.length < 3) {
        setFormData({
          ...formData,
          doctors: [...formData.doctors, doctorId]
        });
      }
    } else {
      setFormData({
        ...formData,
        doctors: formData.doctors.filter(id => id !== doctorId)
      });
    }
  };

  return (
    <form className="bundle-form" onSubmit={handleSubmit}>
      <h3>{bundle ? 'Edit Bundle' : 'Create New Bundle'}</h3>

      <div className="form-group">
        <label>Bundle Name *</label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          maxLength={100}
          disabled={loading}
        />
        {errors.name && <span className="error">{errors.name}</span>}
      </div>

      <div className="form-group">
        <label>Doctors * (2-3 required)</label>
        <div className="doctors-list">
          {doctors.map(doctor => (
            <label key={doctor._id} className="doctor-item">
              <input
                type="checkbox"
                checked={formData.doctors.includes(doctor._id)}
                onChange={(e) => handleDoctorChange(doctor._id, e.target.checked)}
                disabled={loading}
              />
              <div className="doctor-info">
                <strong>{doctor.name}</strong>
                <small>{doctor.email}</small>
                <small>{doctor.specialization}</small>
              </div>
            </label>
          ))}
        </div>
        {errors.doctors && <span className="error">{errors.doctors}</span>}
      </div>

      <div className="form-group">
        <label>Pricing *</label>
        <div className="pricing-inputs">
          <div>
            <label>1 Month</label>
            <input
              type="number"
              value={formData.pricing.oneMonth}
              onChange={(e) => setFormData({
                ...formData,
                pricing: { ...formData.pricing, oneMonth: parseFloat(e.target.value) }
              })}
              min="0.01"
              step="0.01"
              disabled={loading}
            />
          </div>
          <div>
            <label>3 Months</label>
            <input
              type="number"
              value={formData.pricing.threeMonths}
              onChange={(e) => setFormData({
                ...formData,
                pricing: { ...formData.pricing, threeMonths: parseFloat(e.target.value) }
              })}
              min="0.01"
              step="0.01"
              disabled={loading}
            />
          </div>
          <div>
            <label>6 Months</label>
            <input
              type="number"
              value={formData.pricing.sixMonths}
              onChange={(e) => setFormData({
                ...formData,
                pricing: { ...formData.pricing, sixMonths: parseFloat(e.target.value) }
              })}
              min="0.01"
              step="0.01"
              disabled={loading}
            />
          </div>
        </div>
        {errors.pricing && <span className="error">{errors.pricing}</span>}
      </div>

      <div className="form-actions">
        <button type="submit" disabled={loading}>
          {loading ? 'Saving...' : (bundle ? 'Update Bundle' : 'Create Bundle')}
        </button>
        <button type="button" onClick={onCancel} disabled={loading}>
          Cancel
        </button>
      </div>
    </form>
  );
};
```

### **✅ Bundle Card Component:**
```javascript
import React from 'react';

const BundleCard = ({ bundle, onEdit, onDeactivate, loading }) => {
  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  return (
    <div className={`bundle-card ${!bundle.isActive ? 'inactive' : ''}`}>
      <div className="bundle-header">
        <h3>{bundle.name}</h3>
        <span className={`status ${bundle.isActive ? 'active' : 'inactive'}`}>
          {bundle.isActive ? 'Active' : 'Inactive'}
        </span>
      </div>

      <div className="bundle-doctors">
        <h4>Doctors ({bundle.doctors.length})</h4>
        <div className="doctors">
          {bundle.doctors.map(doctor => (
            <div key={doctor.doctorId._id} className="doctor">
              <strong>{doctor.doctorId.name}</strong>
              <small>{doctor.doctorId.email}</small>
            </div>
          ))}
        </div>
      </div>

      <div className="bundle-pricing">
        <h4>Pricing</h4>
        <div className="pricing-grid">
          <div>
            <span>1 Month:</span>
            <strong>{formatPrice(bundle.pricing.oneMonth)}</strong>
          </div>
          <div>
            <span>3 Months:</span>
            <strong>{formatPrice(bundle.pricing.threeMonths)}</strong>
          </div>
          <div>
            <span>6 Months:</span>
            <strong>{formatPrice(bundle.pricing.sixMonths)}</strong>
          </div>
        </div>
      </div>

      <div className="bundle-meta">
        <small>Created: {new Date(bundle.createdAt).toLocaleDateString()}</small>
        <small>By: {bundle.createdBy.name}</small>
      </div>

      <div className="bundle-actions">
        <button onClick={onEdit} disabled={loading}>
          Edit
        </button>
        {bundle.isActive ? (
          <button onClick={onDeactivate} disabled={loading}>
            Deactivate
          </button>
        ) : (
          <button onClick={() => {/* Activate logic */}} disabled={loading}>
            Activate
          </button>
        )}
      </div>
    </div>
  );
};
```

### **✅ Custom Hook for Bundle Management:**
```javascript
import { useState, useEffect } from 'react';

export const useBundles = (options = {}) => {
  const [bundles, setBundles] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState(null);

  const fetchBundles = async (fetchOptions = {}) => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({
        page: fetchOptions.page || options.page || 1,
        limit: fetchOptions.limit || options.limit || 10,
        status: fetchOptions.status || options.status || 'active',
        ...(fetchOptions.search && { search: fetchOptions.search }),
        ...(fetchOptions.sortBy && { sortBy: fetchOptions.sortBy }),
        ...(fetchOptions.sortOrder && { sortOrder: fetchOptions.sortOrder })
      });

      const response = await fetch(`/api/bundles?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const result = await response.json();

      if (result.success) {
        setBundles(result.data.bundles);
        setPagination(result.data.pagination);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('Failed to fetch bundles');
    } finally {
      setLoading(false);
    }
  };

  const createBundle = async (bundleData) => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/bundles', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(bundleData)
      });

      const result = await response.json();

      if (result.success) {
        await fetchBundles(); // Refresh list
        return result.data;
      } else {
        setError(result.error);
        throw new Error(result.error);
      }
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateBundle = async (bundleId, updateData) => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/bundles/${bundleId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      });

      const result = await response.json();

      if (result.success) {
        await fetchBundles(); // Refresh list
        return result.data;
      } else {
        setError(result.error);
        throw new Error(result.error);
      }
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deactivateBundle = async (bundleId) => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/bundles/${bundleId}/deactivate`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();

      if (result.success) {
        await fetchBundles(); // Refresh list
        return result.data;
      } else {
        setError(result.error);
        throw new Error(result.error);
      }
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const fetchDoctors = async (doctorOptions = {}) => {
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({
        ...(doctorOptions.search && { search: doctorOptions.search }),
        ...(doctorOptions.specialization && { specialization: doctorOptions.specialization }),
        ...(doctorOptions.limit && { limit: doctorOptions.limit })
      });

      const response = await fetch(`/api/bundles/doctors/available?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const result = await response.json();

      if (result.success) {
        setDoctors(result.data.doctors);
      }
    } catch (err) {
      console.error('Failed to fetch doctors:', err);
    }
  };

  useEffect(() => {
    fetchBundles();
    fetchDoctors();
  }, []);

  return {
    bundles,
    doctors,
    loading,
    error,
    pagination,
    fetchBundles,
    createBundle,
    updateBundle,
    deactivateBundle,
    fetchDoctors
  };
};

// Usage
const BundleManagement = () => {
  const {
    bundles,
    doctors,
    loading,
    error,
    pagination,
    createBundle,
    updateBundle,
    deactivateBundle
  } = useBundles({ limit: 10, status: 'active' });

  // Component implementation...
};
```

---

## 🔍 Error Handling Patterns

### **✅ Global Error Handler:**
```javascript
class BundleAPI {
  static async request(endpoint, options = {}) {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/bundles${endpoint}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          ...options.headers
        },
        ...options
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Request failed');
      }

      return result;
    } catch (error) {
      // Handle network errors
      if (error.message === 'Failed to fetch') {
        throw new Error('Network error. Please check your connection.');
      }
      
      // Handle authentication errors
      if (error.message === 'Authentication required') {
        localStorage.removeItem('token');
        window.location.href = '/login';
        throw new Error('Session expired. Please login again.');
      }
      
      throw error;
    }
  }

  static async getAllBundles(options = {}) {
    const params = new URLSearchParams(options);
    return this.request(`?${params}`);
  }

  static async getBundleById(id) {
    return this.request(`/${id}`);
  }

  static async createBundle(data) {
    return this.request('', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  static async updateBundle(id, data) {
    return this.request(`/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  static async deactivateBundle(id) {
    return this.request(`/${id}/deactivate`, {
      method: 'PATCH'
    });
  }

  static async getAvailableDoctors(options = {}) {
    const params = new URLSearchParams(options);
    return this.request(`/doctors/available?${params}`);
  }
}
```

### **✅ Error Boundary Component:**
```javascript
import React from 'react';

class BundleErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Bundle Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <h3>Something went wrong with bundle management</h3>
          <p>{this.state.error?.message || 'Unknown error occurred'}</p>
          <button onClick={() => this.setState({ hasError: false, error: null })}>
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Usage
const App = () => {
  return (
    <BundleErrorBoundary>
      <BundleManager />
    </BundleErrorBoundary>
  );
};
```

---

## 📊 Response Format Summary

### **✅ Success Response Structure:**
```javascript
{
  success: true,
  message?: string,           // Optional success message
  data: {
    // Response data varies by endpoint
    bundle?: Object,          // Single bundle object
    bundles?: Array,          // Array of bundle objects
    doctors?: Array,          // Array of doctor objects
    pagination?: Object,      // Pagination info
    total?: Number           // Total count
  }
}
```

### **❌ Error Response Structure:**
```javascript
{
  success: false,
  error: string,              // Error message
  details?: any,             // Optional error details
  field?: string             // Optional field name for validation errors
}
```

### **✅ HTTP Status Codes:**
- **200:** Success (GET, PUT, PATCH, DELETE operations)
- **201:** Created (bundle created)
- **400:** Bad Request (validation errors)
- **401:** Unauthorized (authentication required)
- **403:** Forbidden (insufficient permissions)
- **404:** Not Found (bundle/doctor not found)
- **500:** Internal Server Error

---

## 🎯 Validation Rules Summary

### **✅ Bundle Creation/Update Rules:**
- **Name:** Required, 1-100 characters
- **Doctors:** Required, 2-3 doctors, must exist and have role 'doctor'
- **Pricing:** All three tiers required, must be > 0
- **Duplicate Doctors:** Not allowed
- **Bundle Name:** Must be unique (optional validation)

### **✅ Common Validation Errors:**
```javascript
// Name validation
{
  "success": false,
  "error": "Bundle name is required"
}

// Doctor count validation
{
  "success": false,
  "error": "Bundle must contain between 2 and 3 doctors"
}

// Pricing validation
{
  "success": false,
  "error": "All pricing tiers must be greater than 0"
}

// Doctor role validation
{
  "success": false,
  "error": "All specified users must be doctors"
}
```

---

## 🎯 Best Practices

### **✅ Frontend Best Practices:**
1. **Always validate forms** before sending to backend
2. **Handle loading states** for better UX
3. **Implement error boundaries** for graceful error handling
4. **Use optimistic updates** for better perceived performance
5. **Implement search/filter** with debouncing
6. **Cache doctor data** to reduce API calls
7. **Use pagination** for large datasets
8. **Implement confirmation dialogs** for destructive actions

### **✅ Security Best Practices:**
1. **Never expose tokens** in frontend logs
2. **Validate user permissions** before showing UI elements
3. **Sanitize all inputs** before displaying
4. **Use HTTPS** in production
5. **Implement rate limiting** considerations
6. **Log user actions** for audit trails
7. **Handle token expiration** gracefully

### **✅ UX Best Practices:**
1. **Show loading indicators** during API calls
2. **Provide clear error messages** with actionable steps
3. **Use confirmation dialogs** for destructive actions
4. **Implement auto-save** for forms
5. **Provide search/filter** functionality
6. **Use consistent UI patterns**
7. **Show success feedback** for completed actions

---

**🎯 This comprehensive guide provides everything frontend developers need to build complete bundle management functionality!**

All endpoints, validation rules, error handling, and implementation examples are included. No additional backend support should be needed.
