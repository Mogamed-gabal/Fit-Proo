# Edit Bundle Endpoint Documentation

## 📋 Overview

Complete documentation for updating existing bundles with comprehensive validation and audit logging.

---

## 🚀 Endpoint Details

### **✅ Edit Bundle**

#### **Endpoint:** `PUT /api/bundles/:id`

#### **Purpose:** Update an existing bundle's information including name, description, pricing, and doctors

#### **Authentication:** Required (Admin or authorized user)

#### **🔒 Permissions:**
- **Admin:** Can edit any bundle
- **Supervisor:** Can edit bundles with granted permissions
- **Doctor:** Can edit bundles they're assigned to (if permissions granted)

---

## 📝 Request Format

### **✅ Request Body:**
```javascript
{
  "name": "Premium Health Package",                    // Optional: Bundle name
  "description": "Comprehensive health monitoring",     // Optional: Bundle description
  "pricing": {                                         // Optional: Pricing object
    "oneMonth": 300,                                   // Required if pricing provided
    "threeMonths": 800,                                // Required if pricing provided
    "sixMonths": 1400                                  // Required if pricing provided
  },
  "doctors": [                                         // Optional: Array of doctor IDs
    "507f1f77bcf86cd799439011",
    "507f1f77bcf86cd799439012",
    "507f1f77bcf86cd799439013"                        // 2-3 doctors required
  ],
  "isActive": true                                     // Optional: Bundle status
}
```

### **✅ Headers:**
```http
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

---

## 🎯 Request Implementation

### **✅ Basic Update:**
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
  name: 'Updated Premium Package',
  pricing: {
    oneMonth: 350,
    threeMonths: 900,
    sixMonths: 1500
  }
});
```

### **✅ Complete Update:**
```javascript
const completeBundleUpdate = async (bundleId) => {
  const updateData = {
    name: 'Advanced Health Monitoring',
    description: 'Complete health tracking with expert consultation',
    pricing: {
      oneMonth: 400,
      threeMonths: 1000,
      sixMonths: 1800
    },
    doctors: [
      '507f1f77bcf86cd799439011',
      '507f1f77bcf86cd799439012',
      '507f1f77bcf86cd799439013'
    ],
    isActive: true
  };

  return await updateBundle(bundleId, updateData);
};
```

---

## ✅ Success Response (200)

```json
{
  "success": true,
  "data": {
    "bundle": {
      "_id": "507f1f77bcf86cd799439020",
      "name": "Updated Premium Package",
      "description": "Comprehensive health monitoring with expert care",
      "pricing": {
        "oneMonth": 350,
        "threeMonths": 900,
        "sixMonths": 1500
      },
      "doctors": [
        {
          "_id": "507f1f77bcf86cd799439011",
          "name": "Dr. Sarah Smith",
          "email": "sarah@example.com",
          "specialization": "doctor"
        },
        {
          "_id": "507f1f77bcf86cd799439012",
          "name": "Dr. Mike Johnson",
          "email": "mike@example.com",
          "specialization": "nutritionist"
        },
        {
          "_id": "507f1f77bcf86cd799439013",
          "name": "Dr. Lisa Chen",
          "email": "lisa@example.com",
          "specialization": "therapist"
        }
      ],
      "isActive": true,
      "creator": {
        "_id": "507f1f77bcf86cd799439001",
        "name": "Admin User",
        "email": "admin@example.com"
      },
      "createdAt": "2026-05-01T10:00:00.000Z",
      "updatedAt": "2026-05-08T15:30:00.000Z"
    }
  },
  "message": "Bundle updated successfully"
}
```

---

## ❌ Error Responses

### **✅ 404 Bundle Not Found:**
```json
{
  "success": false,
  "error": "Bundle not found"
}
```

### **✅ 403 Forbidden:**
```json
{
  "success": false,
  "error": "You do not have permission to edit this bundle"
}
```

### **✅ 400 Validation Errors:**

#### **Invalid Pricing:**
```json
{
  "success": false,
  "error": "Pricing validation failed",
  "details": {
    "oneMonth": "One month price must be positive",
    "threeMonths": "Three months price must be greater than one month",
    "sixMonths": "Six months price must be greater than three months"
  }
}
```

#### **Invalid Doctors:**
```json
{
  "success": false,
  "error": "Bundle must have 2-3 doctors",
  "details": {
    "doctors": "At least 2 doctors are required",
    "invalidDoctors": ["507f1f77bcf86cd799439999"],
    "missingDoctors": ["507f1f77bcf86cd799439000"]
  }
}
```

#### **Invalid Bundle ID:**
```json
{
  "success": false,
  "error": "Invalid bundle ID"
}
```

### **✅ 401 Unauthorized:**
```json
{
  "success": false,
  "error": "Authentication required"
}
```

### **✅ 500 Server Error:**
```json
{
  "success": false,
  "error": "Internal server error"
}
```

---

## 🔍 Validation Rules

### **✅ Bundle Name:**
- **Type:** String
- **Length:** 3-100 characters
- **Required:** Optional for updates
- **Validation:** Alphanumeric with spaces and special characters

### **✅ Description:**
- **Type:** String
- **Length:** 10-500 characters
- **Required:** Optional for updates
- **Validation:** Text content allowed

### **✅ Pricing:**
```javascript
{
  "oneMonth": {
    type: Number,
    min: 1,
    required: true
  },
  "threeMonths": {
    type: Number,
    min: 1,
    required: true,
    validate: {
      validator: function(value) {
        return value > this.oneMonth;
      },
      message: 'Three months price must be greater than one month'
    }
  },
  "sixMonths": {
    type: Number,
    min: 1,
    required: true,
    validate: {
      validator: function(value) {
        return value > this.threeMonths;
      },
      message: 'Six months price must be greater than three months'
    }
  }
}
```

### **✅ Doctors:**
- **Type:** Array of Object IDs
- **Length:** 2-3 doctors required
- **Validation:** All doctors must exist and have 'doctor' role

### **✅ Status:**
- **Type:** Boolean
- **Default:** true
- **Required:** Optional for updates

---

## 🎯 Frontend Implementation

### **✅ React Component:**
```javascript
import React, { useState, useEffect } from 'react';

const EditBundleForm = ({ bundleId, onBundleUpdated }) => {
  const [bundle, setBundle] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctors, setSelectedDoctors] = useState([]);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    pricing: {
      oneMonth: '',
      threeMonths: '',
      sixMonths: ''
    },
    isActive: true
  });

  useEffect(() => {
    fetchBundle();
    fetchDoctors();
  }, [bundleId]);

  const fetchBundle = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/bundles/${bundleId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const result = await response.json();

      if (result.success) {
        setBundle(result.data.bundle);
        setFormData({
          name: result.data.bundle.name,
          description: result.data.bundle.description,
          pricing: result.data.bundle.pricing,
          isActive: result.data.bundle.isActive
        });
        setSelectedDoctors(result.data.bundle.doctors.map(doc => doc._id));
      }
    } catch (error) {
      setError('Failed to fetch bundle details');
    }
  };

  const fetchDoctors = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/client-home/doctors', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const result = await response.json();

      if (result.success) {
        setDoctors(result.data.doctors);
      }
    } catch (error) {
      console.error('Error fetching doctors:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const updateData = {
        ...formData,
        doctors: selectedDoctors
      };

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
        onBundleUpdated(result.data.bundle);
      } else {
        setError(result.error);
      }
    } catch (error) {
      setError('Failed to update bundle');
    } finally {
      setLoading(false);
    }
  };

  const handleDoctorToggle = (doctorId) => {
    setSelectedDoctors(prev => {
      if (prev.includes(doctorId)) {
        return prev.filter(id => id !== doctorId);
      } else {
        if (prev.length >= 3) {
          setError('Maximum 3 doctors allowed');
          return prev;
        }
        return [...prev, doctorId];
      }
    });
  };

  return (
    <div className="edit-bundle-form">
      <h2>Edit Bundle</h2>
      
      {error && <div className="error">{error}</div>}
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Bundle Name:</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            required
            minLength={3}
            maxLength={100}
          />
        </div>

        <div className="form-group">
          <label>Description:</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            required
            minLength={10}
            maxLength={500}
            rows={4}
          />
        </div>

        <div className="form-group">
          <label>Pricing:</label>
          <div className="pricing-inputs">
            <input
              type="number"
              placeholder="1 Month"
              value={formData.pricing.oneMonth}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                pricing: { ...prev.pricing, oneMonth: parseFloat(e.target.value) }
              }))}
              min={1}
              required
            />
            <input
              type="number"
              placeholder="3 Months"
              value={formData.pricing.threeMonths}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                pricing: { ...prev.pricing, threeMonths: parseFloat(e.target.value) }
              }))}
              min={1}
              required
            />
            <input
              type="number"
              placeholder="6 Months"
              value={formData.pricing.sixMonths}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                pricing: { ...prev.pricing, sixMonths: parseFloat(e.target.value) }
              }))}
              min={1}
              required
            />
          </div>
        </div>

        <div className="form-group">
          <label>Doctors ({selectedDoctors.length}/3):</label>
          <div className="doctors-list">
            {doctors.map(doctor => (
              <label key={doctor._id} className="doctor-checkbox">
                <input
                  type="checkbox"
                  checked={selectedDoctors.includes(doctor._id)}
                  onChange={() => handleDoctorToggle(doctor._id)}
                />
                <span>{doctor.name} - {doctor.specialization}</span>
              </label>
            ))}
          </div>
          {selectedDoctors.length < 2 && (
            <small className="warning">At least 2 doctors are required</small>
          )}
        </div>

        <div className="form-group">
          <label>
            <input
              type="checkbox"
              checked={formData.isActive}
              onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
            />
            Active Bundle
          </label>
        </div>

        <button
          type="submit"
          disabled={loading || selectedDoctors.length < 2 || selectedDoctors.length > 3}
        >
          {loading ? 'Updating...' : 'Update Bundle'}
        </button>
      </form>
    </div>
  );
};
```

### **✅ Custom Hook:**
```javascript
import { useState, useCallback } from 'react';

export const useBundleEdit = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const updateBundle = useCallback(async (bundleId, updateData) => {
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
        return result.data.bundle;
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
  }, []);

  return {
    updateBundle,
    loading,
    error
  };
};

// Usage
const BundleEditPage = ({ bundleId }) => {
  const { updateBundle, loading, error } = useBundleEdit();

  const handleUpdate = async (formData) => {
    try {
      const updatedBundle = await updateBundle(bundleId, formData);
      console.log('Bundle updated successfully:', updatedBundle);
    } catch (error) {
      console.error('Update failed:', error);
    }
  };

  return (
    <div>
      {/* Your form implementation */}
    </div>
  );
};
```

---

## 🔍 Advanced Features

### **✅ Partial Updates:**
```javascript
// Update only pricing
const updatePricing = async (bundleId, newPricing) => {
  return await updateBundle(bundleId, { pricing: newPricing });
};

// Update only doctors
const updateDoctors = async (bundleId, newDoctors) => {
  return await updateBundle(bundleId, { doctors: newDoctors });
};

// Update only status
const toggleStatus = async (bundleId) => {
  const response = await fetch(`/api/bundles/${bundleId}`);
  const result = await response.json();
  
  return await updateBundle(bundleId, { 
    isActive: !result.data.bundle.isActive 
  });
};
```

### **✅ Batch Updates:**
```javascript
const updateMultipleBundles = async (updates) => {
  const results = await Promise.allSettled(
    updates.map(({ id, data }) => updateBundle(id, data))
  );

  const successful = results.filter(r => r.status === 'fulfilled');
  const failed = results.filter(r => r.status === 'rejected');

  return {
    successful: successful.length,
    failed: failed.length,
    results
  };
};
```

---

## 📊 Audit Logging

### **✅ Automatic Audit Trail:**
All bundle updates are automatically logged with:
- **Action Type:** `UPDATE_BUNDLE`
- **User ID:** Who made the change
- **Bundle ID:** Which bundle was updated
- **Changes:** What fields were modified
- **Timestamp:** When the change occurred
- **IP Address:** Origin of the request

### **✅ Audit Log Example:**
```json
{
  "_id": "507f1f77bcf86cd799439999",
  "actionType": "UPDATE_BUNDLE",
  "adminId": "507f1f77bcf86cd799439001",
  "targetId": "507f1f77bcf86cd799439020",
  "metadata": {
    "changes": {
      "name": {
        "from": "Premium Health Package",
        "to": "Updated Premium Package"
      },
      "pricing": {
        "oneMonth": {
          "from": 300,
          "to": 350
        }
      }
    },
    "requestInfo": {
      "ip": "192.168.1.100",
      "userAgent": "Mozilla/5.0...",
      "timestamp": "2026-05-08T15:30:00.000Z"
    }
  },
  "createdAt": "2026-05-08T15:30:00.000Z"
}
```

---

## 🎯 Best Practices

### **✅ Frontend Best Practices:**
1. **Validate on Client:** Perform basic validation before sending
2. **Show Loading States:** Indicate when update is in progress
3. **Handle Errors Gracefully:** Show user-friendly error messages
4. **Confirm Changes:** Show confirmation dialog for important updates
5. **Optimistic Updates:** Update UI immediately, roll back on error

### **✅ API Best Practices:**
1. **Use Partial Updates:** Only send fields that need to change
2. **Validate Server-Side:** Never trust client validation
3. **Audit All Changes:** Log every update for compliance
4. **Rate Limit:** Prevent abuse with rate limiting
5. **Version Control:** Track bundle versions for rollback capability

### **✅ Security Considerations:**
1. **Authorization:** Verify user has permission to edit
2. **Input Sanitization:** Clean all incoming data
3. **Field Restrictions:** Only allow authorized fields to be updated
4. **Business Logic:** Enforce pricing and doctor rules
5. **Audit Trail:** Maintain complete change history

---

## 📋 Testing Checklist

### **✅ Unit Tests:**
- [ ] Bundle name validation
- [ ] Pricing validation (hierarchy and positivity)
- [ ] Doctor count validation (2-3 requirement)
- [ ] Doctor existence validation
- [ ] Permission checking
- [ ] Audit logging

### **✅ Integration Tests:**
- [ ] Complete update flow
- [ ] Error handling scenarios
- [ ] Permission-based access
- [ ] Database transaction integrity
- [ ] Audit log creation

### **✅ End-to-End Tests:**
- [ ] Full UI update workflow
- [ ] Real-time updates
- [ ] Cross-browser compatibility
- [ ] Mobile responsiveness
- [ ] Performance under load

---

**🎯 This endpoint provides comprehensive bundle editing capabilities with full validation, security, and audit logging!**

Key features:
- ✅ Complete bundle information updates
- ✅ Pricing hierarchy validation
- ✅ Doctor assignment management
- ✅ Comprehensive error handling
- ✅ Automatic audit logging
- ✅ Permission-based access control
- ✅ Frontend-ready implementation examples
