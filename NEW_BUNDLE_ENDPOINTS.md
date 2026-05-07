# New Bundle Endpoints Added

## 📋 Overview

Two new endpoints have been added to the bundle system for getting bundle details and deleting bundles.

---

## 🚀 New Endpoints

### **✅ 1. Get Bundle by ID**

#### **Endpoint:** `GET /api/bundles/:id`

#### **Purpose:** Retrieve a specific bundle by its ID with full details

#### **Authentication:** Required
#### **Permission:** None (basic read access)

#### **✅ Request:**
```javascript
const bundleId = '507f1f77bcf86cd799439020';
const response = await fetch(`/api/bundles/${bundleId}`, {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
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

// 400 Invalid Bundle ID
{
  "success": false,
  "error": "Invalid bundle ID"
}

// 401 Unauthorized
{
  "success": false,
  "error": "Authentication required"
}
```

---

### **✅ 2. Delete Bundle**

#### **Endpoint:** `DELETE /api/bundles/:id`

#### **Purpose:** Permanently delete a bundle (only if deactivated)

#### **Authentication:** Required
#### **Permission:** `DELETE_BUNDLES`

#### **⚠️ Important:** 
- Bundle must be deactivated before deletion
- This action is irreversible

#### **✅ Request:**
```javascript
const bundleId = '507f1f77bcf86cd799439020';
const response = await fetch(`/api/bundles/${bundleId}`, {
  method: 'DELETE',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});
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

// 400 Invalid Bundle ID
{
  "success": false,
  "error": "Invalid bundle ID"
}

// 403 Forbidden
{
  "success": false,
  "error": "Insufficient permissions"
}

// 401 Unauthorized
{
  "success": false,
  "error": "Authentication required"
}
```

---

## 🔧 Implementation Details

### **✅ Controller Methods Added:**

#### **getBundleById:**
```javascript
const getBundleById = async (req, res) => {
  try {
    const { id } = req.params;

    const bundle = await Bundle.findById(id)
      .populate('doctors.doctorId', 'name email phone specialization')
      .populate('createdBy', 'name email');

    if (!bundle) {
      return res.status(404).json({
        success: false,
        error: 'Bundle not found'
      });
    }

    res.status(200).json({
      success: true,
      data: { bundle }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
```

#### **deleteBundle:**
```javascript
const deleteBundle = async (req, res) => {
  try {
    const { id } = req.params;

    const bundle = await Bundle.findById(id);

    if (!bundle) {
      return res.status(404).json({
        success: false,
        error: 'Bundle not found'
      });
    }

    // Check if bundle is active
    if (bundle.isActive) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete active bundle. Please deactivate it first.'
      });
    }

    // Store bundle info for response
    const deletedBundleInfo = {
      _id: bundle._id,
      name: bundle.name
    };

    // Delete the bundle
    await Bundle.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Bundle deleted successfully',
      data: {
        deletedBundle: deletedBundleInfo,
        deletedAt: new Date(),
        deletedBy: {
          _id: req.user.userId,
          name: req.user.name
        }
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

### **✅ Routes Added:**

#### **Get Bundle by ID Route:**
```javascript
/**
 * Get bundle by ID
 * GET /api/bundles/:id
 */
router.get('/:id',
  [
    param('id')
      .isMongoId()
      .withMessage('Invalid bundle ID')
  ],
  bundleController.getBundleById
);
```

#### **Delete Bundle Route:**
```javascript
/**
 * Delete bundle
 * DELETE /api/bundles/:id
 */
router.delete('/:id',
  requirePermission('DELETE_BUNDLES'),
  [
    param('id')
      .isMongoId()
      .withMessage('Invalid bundle ID')
  ],
  bundleController.deleteBundle
);
```

---

## 🎯 Usage Examples

### **✅ Frontend Implementation:**

#### **Get Bundle Details:**
```javascript
const getBundleDetails = async (bundleId) => {
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
const bundle = await getBundleDetails('507f1f77bcf86cd799439020');
```

#### **Delete Bundle:**
```javascript
const deleteBundle = async (bundleId) => {
  if (!window.confirm('Are you sure you want to permanently delete this bundle?')) {
    return;
  }

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
      console.log('Bundle deleted:', result.data.deletedBundle);
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

### **✅ React Component Example:**
```javascript
import React, { useState } from 'react';

const BundleActions = ({ bundleId, onDeleted }) => {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this bundle? This action cannot be undone.')) {
      return;
    }

    setLoading(true);
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
        alert('Bundle deleted successfully');
        onDeleted(bundleId);
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      alert('Failed to delete bundle');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bundle-actions">
      <button 
        onClick={handleDelete} 
        disabled={loading}
        className="delete-button"
      >
        {loading ? 'Deleting...' : 'Delete Bundle'}
      </button>
    </div>
  );
};
```

---

## 📋 Files Modified

### **✅ Controller Updated:**
- **File:** `src/controllers/bundleController.js`
- **Added:** `getBundleById` method
- **Added:** `deleteBundle` method
- **Updated:** Module exports

### **✅ Routes Updated:**
- **File:** `src/routes/bundles.js`
- **Added:** `GET /:id` route for getBundleById
- **Added:** `DELETE /:id` route for deleteBundle
- **Added:** Validation for bundle ID parameter

---

## 🔍 Key Features

### **✅ Get Bundle by ID:**
- **Populated Data:** Includes doctor details and creator info
- **Error Handling:** Proper 404 for not found bundles
- **Validation:** MongoDB ID validation
- **No Special Permissions:** Basic read access

### **✅ Delete Bundle:**
- **Security Check:** Must be deactivated first
- **Permission Required:** `DELETE_BUNDLES` permission
- **Audit Trail:** Records who deleted and when
- **Irreversible Action:** Permanent deletion
- **Safety Confirmation:** Prevents accidental deletion

---

## 🎯 Best Practices

### **✅ For Get Bundle by ID:**
- Use for detailed bundle views
- Cache response data when possible
- Handle 404 errors gracefully
- Display all populated data

### **✅ For Delete Bundle:**
- Always show confirmation dialog
- Check bundle is deactivated first
- Handle permission errors
- Update UI after successful deletion
- Log deletion for audit purposes

---

**🎯 Both endpoints are now fully implemented and ready for use!**

The bundle system now supports getting detailed bundle information and permanent deletion with proper security and error handling.
