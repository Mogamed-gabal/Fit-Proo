# Get Doctors by Specializations Endpoint

## 📋 Overview

New endpoint to filter doctors by multiple specializations with comprehensive handling for non-existent specializations.

---

## 🚀 Endpoint Details

### **✅ Get Doctors by Specializations**

#### **Endpoint:** `GET /api/client-home/doctors/by-specializations`

#### **Purpose:** Filter doctors by one or more specializations with intelligent handling of non-existent specializations

#### **Authentication:** Required

#### **✅ Query Parameters:**
```javascript
?specializations=doctor,nutritionist,therapist    // Required: Comma-separated list
&page=1                                    // Optional: Page number (default: 1)
&limit=10                                  // Optional: Items per page (default: 10, max: 100)
&sortBy=name                                // Optional: Sort by name, specialization, experience, createdAt (default: name)
```

#### **✅ Request Implementation:**
```javascript
const getDoctorsBySpecializations = async (specializations, options = {}) => {
  try {
    const token = localStorage.getItem('token');
    
    // Convert array to comma-separated string if needed
    const specParam = Array.isArray(specializations) 
      ? specializations.join(',') 
      : specializations;
    
    const params = new URLSearchParams({
      specializations: specParam,
      page: options.page || 1,
      limit: options.limit || 10,
      ...(options.sortBy && { sortBy: options.sortBy })
    });

    const response = await fetch(`/api/client-home/doctors/by-specializations?${params}`, {
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
    console.error('Error fetching doctors by specializations:', error);
    throw error;
  }
};

// Usage examples
const doctorsBySpecs = await getDoctorsBySpecializations('doctor,nutritionist');
const multipleSpecs = await getDoctorsBySpecializations(['doctor', 'therapist', 'coach'], {
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
    "doctorsBySpecialization": {
      "doctor": [
        {
          "_id": "507f1f77bcf86cd799439011",
          "name": "Dr. Sarah Smith",
          "specialization": "doctor"
        }
      ],
      "nutritionist": [
        {
          "_id": "507f1f77bcf86cd799439012",
          "name": "Dr. Mike Johnson",
          "specialization": "nutritionist"
        }
      ]
    },
    "pagination": {
      "currentPage": 1,
      "totalPages": 2,
      "totalItems": 15,
      "itemsPerPage": 10,
      "hasNext": true,
      "hasPrev": false
    },
    "filters": {
      "requestedSpecializations": ["doctor", "nutritionist", "therapist"],
      "existingSpecializations": ["doctor", "nutritionist"],
      "sortBy": "name"
    },
    "stats": {
      "totalDoctors": 15,
      "specializationCounts": [
        {
          "name": "doctor",
          "count": 8
        },
        {
          "name": "nutritionist",
          "count": 7
        }
      ]
    }
  }
}
```

#### **✅ Response with Non-Existent Specializations:**
```json
{
  "success": true,
  "data": {
    "doctors": [],
    "doctorsBySpecialization": {},
    "pagination": {
      "currentPage": 1,
      "totalPages": 0,
      "totalItems": 0,
      "itemsPerPage": 10,
      "hasNext": false,
      "hasPrev": false
    },
    "filters": {
      "requestedSpecializations": ["invalid_spec", "another_invalid"],
      "existingSpecializations": [],
      "sortBy": "name"
    },
    "stats": {
      "totalDoctors": 0,
      "specializationCounts": []
    },
    "warnings": {
      "nonExistentSpecializations": ["invalid_spec", "another_invalid"],
      "message": "The following specializations do not exist: invalid_spec, another_invalid"
    }
  }
}
```

#### **✅ Mixed Response (Some Exist, Some Don't):**
```json
{
  "success": true,
  "data": {
    "doctors": [
      {
        "_id": "507f1f77bcf86cd799439011",
        "name": "Dr. Sarah Smith",
        "specialization": "doctor"
      }
    ],
    "doctorsBySpecialization": {
      "doctor": [
        {
          "_id": "507f1f77bcf86cd799439011",
          "name": "Dr. Sarah Smith",
          "specialization": "doctor"
        }
      ]
    },
    "pagination": {
      "currentPage": 1,
      "totalPages": 1,
      "totalItems": 8,
      "itemsPerPage": 10,
      "hasNext": false,
      "hasPrev": false
    },
    "filters": {
      "requestedSpecializations": ["doctor", "invalid_spec"],
      "existingSpecializations": ["doctor"],
      "sortBy": "name"
    },
    "stats": {
      "totalDoctors": 8,
      "specializationCounts": [
        {
          "name": "doctor",
          "count": 8
        }
      ]
    },
    "warnings": {
      "nonExistentSpecializations": ["invalid_spec"],
      "message": "The following specializations do not exist: invalid_spec"
    }
  }
}
```

#### **❌ Error Responses:**
```javascript
// 400 Missing Specializations
{
  "success": false,
  "error": "Specializations parameter is required"
}

// 400 Empty Specializations
{
  "success": false,
  "error": "At least one specialization must be provided"
}

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

## 🎯 Frontend Implementation

### **✅ React Component for Specialization Filter:**
```javascript
import React, { useState, useEffect } from 'react';

const SpecializationFilter = () => {
  const [selectedSpecializations, setSelectedSpecializations] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [warnings, setWarnings] = useState(null);
  const [availableSpecializations] = useState([
    'doctor', 'nutritionist', 'therapist', 'coach'
  ]);

  const fetchDoctorsBySpecializations = async () => {
    if (selectedSpecializations.length === 0) {
      return;
    }

    setLoading(true);
    setWarnings(null);

    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({
        specializations: selectedSpecializations.join(','),
        page: 1,
        limit: 20,
        sortBy: 'name'
      });

      const response = await fetch(`/api/client-home/doctors/by-specializations?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const result = await response.json();

      if (result.success) {
        setDoctors(result.data.doctors);
        if (result.data.warnings) {
          setWarnings(result.data.warnings);
        }
      }
    } catch (error) {
      console.error('Error fetching doctors:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSpecializationToggle = (specialization) => {
    setSelectedSpecializations(prev => {
      if (prev.includes(specialization)) {
        return prev.filter(spec => spec !== specialization);
      } else {
        return [...prev, specialization];
      }
    });
  };

  useEffect(() => {
    fetchDoctorsBySpecializations();
  }, [selectedSpecializations]);

  return (
    <div className="specialization-filter">
      <h2>Filter by Specializations</h2>
      
      <div className="specialization-checkboxes">
        {availableSpecializations.map(spec => (
          <label key={spec} className="specialization-checkbox">
            <input
              type="checkbox"
              checked={selectedSpecializations.includes(spec)}
              onChange={() => handleSpecializationToggle(spec)}
            />
            <span className="spec-name">
              {spec.charAt(0).toUpperCase() + spec.slice(1)}
            </span>
          </label>
        ))}
      </div>

      {warnings && (
        <div className="warnings">
          <h4>⚠️ Warnings:</h4>
          <p>{warnings.message}</p>
          <div className="non-existent-specs">
            <strong>Invalid specializations:</strong>
            <ul>
              {warnings.nonExistentSpecializations.map(spec => (
                <li key={spec}>{spec}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {loading && (
        <div className="loading">Loading doctors...</div>
      )}

      <div className="results">
        <h3>Results ({doctors.length} doctors found)</h3>
        <div className="doctors-grid">
          {doctors.map(doctor => (
            <DoctorCard key={doctor._id} doctor={doctor} />
          ))}
        </div>
      </div>
    </div>
  );
};
```

### **✅ Advanced Filter Component:**
```javascript
import React, { useState } from 'react';

const AdvancedSpecializationFilter = () => {
  const [filters, setFilters] = useState({
    specializations: [],
    page: 1,
    limit: 10,
    sortBy: 'name'
  });
  const [results, setResults] = useState(null);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const applyFilters = async () => {
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({
        specializations: filters.specializations.join(','),
        page: filters.page,
        limit: filters.limit,
        sortBy: filters.sortBy
      });

      const response = await fetch(`/api/client-home/doctors/by-specializations?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const result = await response.json();
      
      if (result.success) {
        setResults(result.data);
      }
    } catch (error) {
      console.error('Error applying filters:', error);
    }
  };

  return (
    <div className="advanced-filter">
      <h3>Advanced Specialization Filter</h3>
      
      <div className="filter-section">
        <label>Specializations:</label>
        <select
          multiple
          value={filters.specializations}
          onChange={(e) => handleFilterChange('specializations', 
            Array.from(e.target.selectedOptions, option => option.value)
          )}
        >
          <option value="doctor">Doctor</option>
          <option value="nutritionist">Nutritionist</option>
          <option value="therapist">Therapist</option>
          <option value="coach">Coach</option>
        </select>
      </div>

      <div className="filter-section">
        <label>Sort By:</label>
        <select
          value={filters.sortBy}
          onChange={(e) => handleFilterChange('sortBy', e.target.value)}
        >
          <option value="name">Name</option>
          <option value="specialization">Specialization</option>
          <option value="experience">Experience</option>
          <option value="createdAt">Date Joined</option>
        </select>
      </div>

      <div className="filter-section">
        <label>Results per page:</label>
        <select
          value={filters.limit}
          onChange={(e) => handleFilterChange('limit', parseInt(e.target.value))}
        >
          <option value={5}>5</option>
          <option value={10}>10</option>
          <option value={20}>20</option>
          <option value={50}>50</option>
        </select>
      </div>

      <button onClick={applyFilters} className="apply-filters-btn">
        Apply Filters
      </button>

      {results && (
        <div className="filter-results">
          <h4>Filter Results</h4>
          
          {results.warnings && (
            <div className="warnings">
              <p>⚠️ {results.warnings.message}</p>
            </div>
          )}

          <div className="stats">
            <p><strong>Total Doctors:</strong> {results.stats.totalDoctors}</p>
            <div className="spec-counts">
              {results.stats.specializationCounts.map(spec => (
                <span key={spec.name} className="spec-count">
                  {spec.name}: {spec.count}
                </span>
              ))}
            </div>
          </div>

          <div className="doctors-by-spec">
            {Object.entries(results.doctorsBySpecialization).map(([spec, doctors]) => (
              <div key={spec} className="spec-group">
                <h5>{spec.charAt(0).toUpperCase() + spec.slice(1)} ({doctors.length})</h5>
                <div className="spec-doctors">
                  {doctors.map(doctor => (
                    <div key={doctor._id} className="mini-doctor-card">
                      <strong>{doctor.name}</strong>
                      <small>{doctor.experienceYears} years exp.</small>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
```

### **✅ Custom Hook:**
```javascript
import { useState, useCallback } from 'react';

export const useSpecializationFilter = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const filterDoctorsBySpecializations = useCallback(async (specializations, options = {}) => {
    if (!specializations || specializations.length === 0) {
      setError('At least one specialization must be selected');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const specParam = Array.isArray(specializations) 
        ? specializations.join(',') 
        : specializations;
      
      const params = new URLSearchParams({
        specializations: specParam,
        page: options.page || 1,
        limit: options.limit || 10,
        ...(options.sortBy && { sortBy: options.sortBy })
      });

      const response = await fetch(`/api/client-home/doctors/by-specializations?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const result = await response.json();

      if (result.success) {
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
  }, []);

  return {
    filterDoctorsBySpecializations,
    loading,
    error
  };
};

// Usage
const FilterComponent = () => {
  const { filterDoctorsBySpecializations, loading, error } = useSpecializationFilter();

  const handleFilter = async () => {
    try {
      const results = await filterDoctorsBySpecializations(
        ['doctor', 'nutritionist'], 
        { sortBy: 'experience' }
      );
      console.log('Filtered results:', results);
    } catch (error) {
      console.error('Filter error:', error);
    }
  };

  return (
    <div>
      <button onClick={handleFilter} disabled={loading}>
        {loading ? 'Filtering...' : 'Apply Filter'}
      </button>
      {error && <div className="error">{error}</div>}
    </div>
  );
};
```

---

## 📊 Response Features

### **✅ Smart Handling of Non-Existent Specializations:**

#### **Validation:**
- Checks requested specializations against database
- Identifies valid vs invalid specializations
- Returns warnings for non-existent specializations

#### **Flexible Input:**
- Accepts comma-separated string: `"doctor,nutritionist,therapist"`
- Accepts array: `["doctor", "nutritionist"]`
- Handles mixed valid/invalid combinations

#### **Comprehensive Response:**
- Returns doctors for valid specializations
- Groups results by specialization
- Provides statistics and counts
- Includes warnings for invalid inputs

### **✅ Response Structure Benefits:**

#### **doctorsBySpecialization:**
- Organized by specialization for easy display
- Ready for UI rendering
- Includes counts per specialization

#### **warnings:**
- Clear indication of non-existent specializations
- Helpful for user feedback
- Non-blocking (still returns valid results)

#### **stats:**
- Total doctor count
- Per-specialization counts
- Useful for analytics and UI

---

## 🎯 Use Cases

### **✅ Common Scenarios:**

#### **1. Multi-Specialization Search:**
```javascript
// Find doctors across multiple specializations
const results = await getDoctorsBySpecializations('doctor,nutritionist,coach');
```

#### **2. Single Specialization Filter:**
```javascript
// Filter by one specialization
const doctors = await getDoctorsBySpecializations('therapist');
```

#### **3. Invalid Specialization Handling:**
```javascript
// Handles invalid specializations gracefully
const results = await getDoctorsBySpecializations('doctor,invalid_spec');
// Returns doctors for 'doctor' + warning about 'invalid_spec'
```

#### **4. Advanced Filtering:**
```javascript
// Complex filtering with sorting and pagination
const filtered = await getDoctorsBySpecializations(
  ['doctor', 'nutritionist'], 
  { 
    page: 2, 
    limit: 15, 
    sortBy: 'experience' 
  }
);
```

---

## 🔍 Error Handling Best Practices

### **✅ Frontend Error Handling:**
```javascript
const handleSpecializationFilter = async (specializations) => {
  try {
    const results = await getDoctorsBySpecializations(specializations);
    
    // Handle warnings for non-existent specializations
    if (results.warnings) {
      console.warn('Some specializations were not found:', results.warnings.nonExistentSpecializations);
      // Show user-friendly message
      showWarning(`The following specializations don't exist: ${results.warnings.nonExistentSpecializations.join(', ')}`);
    }
    
    // Process valid results
    setDoctors(results.doctors);
    setGroupedResults(results.doctorsBySpecialization);
    
  } catch (error) {
    console.error('Error filtering doctors:', error);
    showError('Failed to filter doctors. Please try again.');
  }
};
```

---

**🎯 This endpoint provides intelligent filtering with comprehensive handling for non-existent specializations!**

Key features:
- ✅ Multiple specialization filtering
- ✅ Graceful handling of invalid specializations
- ✅ Detailed warnings and feedback
- ✅ Grouped results by specialization
- ✅ Complete pagination and sorting
- ✅ Statistics and counts
- ✅ Frontend-ready response structure
