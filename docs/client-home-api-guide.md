# Client Home API Guide

## 📋 Overview

Complete API documentation for client home page endpoints including doctors, specializations, and detailed information retrieval.

---

## 🔐 Authentication

All endpoints require authentication with a valid JWT token.

### **✅ Required Headers:**
```http
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

---

## 🚀 Client Home Endpoints

### **✅ 1. Get All Doctors**

#### **Endpoint:** `GET /api/client-home/doctors`

#### **Purpose:** Retrieve all active doctors with pagination and filtering

#### **Authentication:** Required

#### **✅ Query Parameters:**
```javascript
?page=1                    // Page number (default: 1)
&limit=10                  // Items per page (default: 10, max: 100)
&specialization=doctor      // Filter by specialization
&search=john               // Search by name, email, or specialization
&sortBy=name               // Sort by: name, specialization, createdAt (default: name)
```

#### **✅ Request Implementation:**
```javascript
const getAllDoctors = async (options = {}) => {
  try {
    const token = localStorage.getItem('token');
    const params = new URLSearchParams({
      page: options.page || 1,
      limit: options.limit || 10,
      ...(options.specialization && { specialization: options.specialization }),
      ...(options.search && { search: options.search }),
      ...(options.sortBy && { sortBy: options.sortBy })
    });

    const response = await fetch(`/api/client-home/doctors?${params}`, {
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

// Usage examples
const allDoctors = await getAllDoctors();
const filteredDoctors = await getAllDoctors({ 
  specialization: 'doctor', 
  page: 1, 
  limit: 5 
});
const searchResults = await getAllDoctors({ 
  search: 'sarah', 
  sortBy: 'specialization' 
});
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
        "specialization": "doctor",
        "profileImage": "https://example.com/profile.jpg",
        "bio": "Experienced physician with 10+ years of practice",
        "experienceYears": 12,
        "createdAt": "2026-05-01T10:00:00.000Z"
      },
      {
        "_id": "507f1f77bcf86cd799439012",
        "name": "Dr. Mike Johnson",
        "email": "mike@example.com",
        "phone": "+1234567891",
        "specialization": "nutritionist",
        "profileImage": "https://example.com/profile2.jpg",
        "bio": "Certified nutritionist specializing in sports nutrition",
        "experienceYears": 8,
        "createdAt": "2026-05-02T11:00:00.000Z"
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
      "specialization": "doctor",
      "search": null,
      "sortBy": "name"
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

// 400 Invalid Query Parameters
{
  "success": false,
  "error": "Page must be a positive integer"
}

// 500 Server Error
{
  "success": false,
  "error": "Internal server error"
}
```

---

### **✅ 2. Get All Specializations**

#### **Endpoint:** `GET /api/client-home/specializations`

#### **Purpose:** Retrieve all available specializations with doctor counts

#### **Authentication:** Required

#### **✅ Request Implementation:**
```javascript
const getAllSpecializations = async () => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch('/api/client-home/specializations', {
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
    console.error('Error fetching specializations:', error);
    throw error;
  }
};

// Usage
const specializations = await getAllSpecializations();
```

#### **✅ Success Response (200):**
```json
{
  "success": true,
  "data": {
    "specializations": [
      {
        "name": "doctor",
        "doctorCount": 15
      },
      {
        "name": "nutritionist",
        "doctorCount": 8
      },
      {
        "name": "therapist",
        "doctorCount": 5
      },
      {
        "name": "coach",
        "doctorCount": 12
      }
    ],
    "total": 4
  }
}
```

---

### **✅ 3. Get Doctor by ID**

#### **Endpoint:** `GET /api/client-home/doctors/:id`

#### **Purpose:** Retrieve detailed information about a specific doctor

#### **Authentication:** Required

#### **✅ Request Implementation:**
```javascript
const getDoctorById = async (doctorId) => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`/api/client-home/doctors/${doctorId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const result = await response.json();

    if (result.success) {
      return result.data.doctor;
    } else {
      throw new Error(result.error);
    }
  } catch (error) {
    console.error('Error fetching doctor details:', error);
    throw error;
  }
};

// Usage
const doctorDetails = await getDoctorById('507f1f77bcf86cd799439011');
```

#### **✅ Success Response (200):**
```json
{
  "success": true,
  "data": {
    "doctor": {
      "_id": "507f1f77bcf86cd799439011",
      "name": "Dr. Sarah Smith",
      "email": "sarah@example.com",
      "phone": "+1234567890",
      "specialization": "doctor",
      "profileImage": "https://example.com/profile.jpg",
      "bio": "Experienced physician with 10+ years of practice in internal medicine",
      "experienceYears": 12,
      "education": [
        "MD from Harvard Medical School",
        "Residency at Massachusetts General Hospital"
      ],
      "certifications": [
        "Board Certified in Internal Medicine",
        "Advanced Cardiac Life Support"
      ],
      "createdAt": "2026-05-01T10:00:00.000Z",
      "stats": {
        "totalBundles": 3,
        "averagePricing": {
          "oneMonth": 250.00,
          "threeMonths": 650.00,
          "sixMonths": 1100.00
        }
      },
      "bundles": [
        {
          "_id": "507f1f77bcf86cd799439020",
          "name": "Premium Health Package",
          "pricing": {
            "oneMonth": 300,
            "threeMonths": 800,
            "sixMonths": 1400
          },
          "isActive": true,
          "createdAt": "2026-05-05T12:00:00.000Z"
        }
      ]
    }
  }
}
```

#### **❌ Error Responses:**
```javascript
// 404 Doctor Not Found
{
  "success": false,
  "error": "Doctor not found"
}

// 400 Invalid Doctor ID
{
  "success": false,
  "error": "Invalid doctor ID"
}
```

---

### **✅ 4. Get Specialization Details**

#### **Endpoint:** `GET /api/client-home/specializations/:specialization`

#### **Purpose:** Retrieve detailed information about a specific specialization

#### **Authentication:** Required

#### **✅ Query Parameters:**
```javascript
?page=1              // Page number (default: 1)
&limit=10            // Items per page (default: 10, max: 100)
&sortBy=name          // Sort by: name, experience, createdAt (default: name)
```

#### **✅ Request Implementation:**
```javascript
const getSpecializationDetails = async (specialization, options = {}) => {
  try {
    const token = localStorage.getItem('token');
    const params = new URLSearchParams({
      page: options.page || 1,
      limit: options.limit || 10,
      ...(options.sortBy && { sortBy: options.sortBy })
    });

    const response = await fetch(`/api/client-home/specializations/${specialization}?${params}`, {
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
    console.error('Error fetching specialization details:', error);
    throw error;
  }
};

// Usage
const doctorSpecialization = await getSpecializationDetails('doctor', { 
  page: 1, 
  limit: 5, 
  sortBy: 'experience' 
});
```

#### **✅ Success Response (200):**
```json
{
  "success": true,
  "data": {
    "specialization": "doctor",
    "doctors": [
      {
        "_id": "507f1f77bcf86cd799439011",
        "name": "Dr. Sarah Smith",
        "email": "sarah@example.com",
        "phone": "+1234567890",
        "specialization": "doctor",
        "profileImage": "https://example.com/profile.jpg",
        "bio": "Experienced physician with 10+ years of practice",
        "experienceYears": 12,
        "createdAt": "2026-05-01T10:00:00.000Z"
      }
    ],
    "bundles": [
      {
        "_id": "507f1f77bcf86cd799439020",
        "name": "Premium Health Package",
        "pricing": {
          "oneMonth": 300,
          "threeMonths": 800,
          "sixMonths": 1400
        },
        "isActive": true,
        "createdAt": "2026-05-05T12:00:00.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 2,
      "totalItems": 15,
      "itemsPerPage": 10,
      "hasNext": true,
      "hasPrev": false
    },
    "stats": {
      "totalDoctors": 15,
      "totalBundles": 8
    }
  }
}
```

#### **❌ Error Responses:**
```javascript
// 404 Specialization Not Found
{
  "success": false,
  "error": "Specialization not found"
}

// 400 Invalid Specialization
{
  "success": false,
  "error": "Invalid specialization"
}
```

---

## 🎯 Frontend Implementation Examples

### **✅ React Components:**

#### **Doctors List Component:**
```javascript
import React, { useState, useEffect } from 'react';

const DoctorsList = () => {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    page: 1,
    limit: 10,
    specialization: '',
    search: '',
    sortBy: 'name'
  });
  const [pagination, setPagination] = useState(null);

  useEffect(() => {
    fetchDoctors();
  }, [filters]);

  const fetchDoctors = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({
        page: filters.page,
        limit: filters.limit,
        ...(filters.specialization && { specialization: filters.specialization }),
        ...(filters.search && { search: filters.search }),
        sortBy: filters.sortBy
      });

      const response = await fetch(`/api/client-home/doctors?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const result = await response.json();

      if (result.success) {
        setDoctors(result.data.doctors);
        setPagination(result.data.pagination);
      }
    } catch (error) {
      console.error('Error fetching doctors:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
  };

  const handlePageChange = (newPage) => {
    setFilters(prev => ({ ...prev, page: newPage }));
  };

  return (
    <div className="doctors-list">
      <div className="filters">
        <input
          type="text"
          placeholder="Search doctors..."
          value={filters.search}
          onChange={(e) => handleFilterChange('search', e.target.value)}
        />
        
        <select
          value={filters.specialization}
          onChange={(e) => handleFilterChange('specialization', e.target.value)}
        >
          <option value="">All Specializations</option>
          <option value="doctor">Doctor</option>
          <option value="nutritionist">Nutritionist</option>
          <option value="therapist">Therapist</option>
          <option value="coach">Coach</option>
        </select>

        <select
          value={filters.sortBy}
          onChange={(e) => handleFilterChange('sortBy', e.target.value)}
        >
          <option value="name">Sort by Name</option>
          <option value="specialization">Sort by Specialization</option>
          <option value="createdAt">Sort by Date</option>
        </select>
      </div>

      {loading ? (
        <div>Loading doctors...</div>
      ) : (
        <>
          <div className="doctors-grid">
            {doctors.map(doctor => (
              <DoctorCard key={doctor._id} doctor={doctor} />
            ))}
          </div>

          {pagination && (
            <div className="pagination">
              <button
                disabled={!pagination.hasPrev}
                onClick={() => handlePageChange(pagination.currentPage - 1)}
              >
                Previous
              </button>
              <span>
                Page {pagination.currentPage} of {pagination.totalPages}
              </span>
              <button
                disabled={!pagination.hasNext}
                onClick={() => handlePageChange(pagination.currentPage + 1)}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};
```

#### **Doctor Card Component:**
```javascript
import React from 'react';

const DoctorCard = ({ doctor }) => {
  const formatExperience = (years) => {
    return years === 1 ? '1 year' : `${years} years`;
  };

  return (
    <div className="doctor-card">
      <div className="doctor-header">
        <img 
          src={doctor.profileImage || '/default-avatar.png'} 
          alt={doctor.name}
          className="doctor-avatar"
        />
        <div className="doctor-info">
          <h3>{doctor.name}</h3>
          <p className="specialization">{doctor.specialization}</p>
          <p className="experience">
            {formatExperience(doctor.experienceYears)} experience
          </p>
        </div>
      </div>

      <div className="doctor-details">
        <p className="bio">{doctor.bio}</p>
        
        <div className="contact-info">
          <p>📧 {doctor.email}</p>
          <p>📞 {doctor.phone}</p>
        </div>
      </div>

      <div className="doctor-actions">
        <button className="view-profile-btn">
          View Full Profile
        </button>
        <button className="book-consultation-btn">
          Book Consultation
        </button>
      </div>
    </div>
  );
};
```

#### **Specializations Component:**
```javascript
import React, { useState, useEffect } from 'react';

const SpecializationsList = () => {
  const [specializations, setSpecializations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSpecializations();
  }, []);

  const fetchSpecializations = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/client-home/specializations', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const result = await response.json();

      if (result.success) {
        setSpecializations(result.data.specializations);
      }
    } catch (error) {
      console.error('Error fetching specializations:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="specializations-list">
      <h2>Available Specializations</h2>
      
      {loading ? (
        <div>Loading specializations...</div>
      ) : (
        <div className="specializations-grid">
          {specializations.map(spec => (
            <div key={spec.name} className="specialization-card">
              <h3>{spec.name}</h3>
              <p>{spec.doctorCount} doctors available</p>
              <button>
                View {spec.name}s
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
```

### **✅ Custom Hook:**
```javascript
import { useState, useEffect } from 'react';

export const useClientHome = () => {
  const [doctors, setDoctors] = useState([]);
  const [specializations, setSpecializations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchDoctors = async (options = {}) => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams(options);

      const response = await fetch(`/api/client-home/doctors?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const result = await response.json();

      if (result.success) {
        setDoctors(result.data.doctors);
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

  const fetchSpecializations = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/client-home/specializations', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const result = await response.json();

      if (result.success) {
        setSpecializations(result.data.specializations);
      }
    } catch (err) {
      console.error('Error fetching specializations:', err);
    }
  };

  const getDoctorById = async (doctorId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/client-home/doctors/${doctorId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const result = await response.json();

      if (result.success) {
        return result.data.doctor;
      } else {
        throw new Error(result.error);
      }
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const getSpecializationDetails = async (specialization, options = {}) => {
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams(options);

      const response = await fetch(`/api/client-home/specializations/${specialization}?${params}`, {
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
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  useEffect(() => {
    fetchSpecializations();
  }, []);

  return {
    doctors,
    specializations,
    loading,
    error,
    fetchDoctors,
    fetchSpecializations,
    getDoctorById,
    getSpecializationDetails
  };
};

// Usage
const ClientHomePage = () => {
  const {
    doctors,
    specializations,
    loading,
    fetchDoctors,
    getDoctorById
  } = useClientHome();

  useEffect(() => {
    fetchDoctors({ limit: 6 });
  }, []);

  return (
    <div className="client-home">
      {/* Your home page implementation */}
    </div>
  );
};
```

---

## 📊 Response Format Summary

### **✅ Success Response Structure:**
```javascript
{
  success: true,
  data: {
    // Response data varies by endpoint
    doctors: Array,           // For doctors list
    specializations: Array,    // For specializations
    doctor: Object,          // For single doctor
    specialization: String,   // For specialization details
    pagination: Object,       // For paginated responses
    stats: Object,          // For statistics
    bundles: Array           // For related bundles
  }
}
```

### **❌ Error Response Structure:**
```javascript
{
  success: false,
  error: "Error message description"
}
```

---

## 🔍 Query Parameters Reference

### **✅ Common Parameters:**

#### **page:**
- **Type:** Integer
- **Default:** 1
- **Min:** 1
- **Description:** Page number for pagination

#### **limit:**
- **Type:** Integer
- **Default:** 10
- **Range:** 1-100
- **Description:** Items per page

#### **search:**
- **Type:** String
- **Max Length:** 100 characters
- **Description:** Search term for name, email, or specialization

#### **specialization:**
- **Type:** String
- **Values:** doctor, nutritionist, therapist, coach
- **Description:** Filter by specialization

#### **sortBy:**
- **Type:** String
- **Values:** name, specialization, experience, createdAt
- **Description:** Sort field

---

## 🎯 Best Practices

### **✅ Frontend Best Practices:**
1. **Pagination:** Implement proper pagination for large datasets
2. **Search:** Use debouncing for search inputs
3. **Loading States:** Show loading indicators during API calls
4. **Error Handling:** Display user-friendly error messages
5. **Caching:** Cache frequently accessed data
6. **Responsive Design:** Ensure mobile-friendly layouts

### **✅ Performance Optimization:**
1. **Lazy Loading:** Load images and data as needed
2. **Infinite Scroll:** Alternative to pagination for better UX
3. **Image Optimization:** Compress profile images
4. **API Optimization:** Use appropriate limit values

### **✅ Security Considerations:**
1. **Token Management:** Secure storage and refresh of tokens
2. **Input Validation:** Validate all user inputs
3. **Rate Limiting:** Respect API rate limits
4. **Error Handling:** Don't expose sensitive information

---

**🎯 This comprehensive client home API provides everything needed for building a complete doctor and specialization discovery system!**

The endpoints include:
- ✅ Complete doctor listing with filtering and search
- ✅ Specialization overview with counts
- ✅ Detailed doctor profiles with statistics
- ✅ Specialization-specific views
- ✅ Bundle integration for each doctor
- ✅ Pagination and sorting capabilities
- ✅ Full frontend implementation examples
