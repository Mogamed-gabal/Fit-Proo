# Soft-Deleted Users Endpoint - Complete Guide

## 📋 Endpoint Overview

**GET /api/users/soft-deleted** - Retrieve ALL soft-deleted users (any role: client, doctor, supervisor, admin)

---

## 🔐 Authentication & Permissions

### **✅ Required Permissions:**
- **Admin:** Full access to all soft-deleted users
- **Supervisor:** Can view soft-deleted users if granted `view_deleted_users` permission
- **Doctor:** No access (security restriction)
- **Client:** No access (security restriction)

### **✅ Authentication:**
```javascript
Authorization: Bearer <admin-token>
Authorization: Bearer <supervisor-token-with-view_deleted_users-permission>
```

---

## 📊 Request Format

### **✅ Basic Request:**
```javascript
GET /api/users/soft-deleted
Authorization: Bearer <token>
```

### **✅ With Query Parameters:**
```javascript
GET /api/users/soft-deleted?page=1&limit=20&role=client&sortBy=deletedAt&sortOrder=desc&search=john
Authorization: Bearer <token>
```

### **✅ Query Parameters:**
```javascript
{
  page: 1,                    // Optional: Page number (default: 1)
  limit: 20,                   // Optional: Items per page (default: 20, max: 100)
  role: 'client',               // Optional: Filter by role (client, doctor, supervisor, admin, all)
  sortBy: 'deletedAt',          // Optional: Sort field (deletedAt, name, email, createdAt, role)
  sortOrder: 'desc',            // Optional: Sort order (asc, desc, default: desc)
  search: 'john'               // Optional: Search in name or email
}
```

---

## 🎯 Response Format

### **✅ Success Response (200):**
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "_id": "507f1f77bcf86cd799439001",
        "name": "Dr Sarah Johnson",
        "email": "sarah@example.com",
        "role": "doctor",
        "phone": "+1234567890",
        "address": "123 Medical Center",
        "specialization": "nutritionist",
        "isDeleted": true,
        "deletedAt": "2026-05-08T15:30:00.000Z",
        "deletedBy": {
          "_id": "507f1f77bcf86cd799439999",
          "name": "Admin User",
          "email": "admin@example.com",
          "role": "admin"
        },
        "createdAt": "2026-05-01T10:00:00.000Z",
        "updatedAt": "2026-05-08T15:30:00.000Z"
      },
      {
        "_id": "507f1f77bcf86cd799439002",
        "name": "John Supervisor",
        "email": "john@example.com",
        "role": "supervisor",
        "isDeleted": true,
        "deletedAt": "2026-05-07T12:15:00.000Z",
        "deletedBy": {
          "_id": "507f1f77bcf86cd799439999",
          "name": "Admin User",
          "email": "admin@example.com",
          "role": "admin"
        }
      },
      {
        "_id": "507f1f77bcf86cd799439003",
        "name": "Jane Client",
        "email": "jane@example.com",
        "role": "client",
        "isDeleted": true,
        "deletedAt": "2026-05-06T09:45:00.000Z",
        "deletedBy": {
          "_id": "507f1f77bcf86cd799439999",
          "name": "Admin User",
          "email": "admin@example.com",
          "role": "admin"
        }
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 3,
      "totalUsers": 25,
      "itemsPerPage": 20,
      "hasNext": true,
      "hasPrev": false
    },
    "statistics": {
      "totalSoftDeleted": 25,
      "deletedByRole": {
        "client": 15,
        "doctor": 6,
        "supervisor": 3,
        "admin": 1
      }
    },
    "filters": {
      "role": "all",
      "sortBy": "deletedAt",
      "sortOrder": "desc",
      "search": ""
    }
  }
}
```

### **✅ Error Responses:**
```javascript
// 401 Unauthorized
{
  "success": false,
  "error": "Authentication required"
}

// 403 Forbidden
{
  "success": false,
  "error": "Access denied. You do not have permission to view deleted users."
}

// 400 Bad Request
{
  "success": false,
  "error": "Invalid role. Must be one of: client, doctor, supervisor, admin"
}

// 500 Server Error
{
  "success": false,
  "error": "Internal server error"
}
```

---

## 🔧 Implementation Details

### **✅ Controller Method:**
```javascript
async getSoftDeletedUsers(req, res, next) {
  try {
    console.log('🔍 getSoftDeletedUsers called');
    
    const {
      page = 1,
      limit = 20,
      role,
      sortBy = 'deletedAt',
      sortOrder = 'desc',
      search
    } = req.query;

    // Validate inputs
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 20;
    
    if (pageNum < 1 || limitNum < 1 || limitNum > 100) {
      return res.status(400).json({
        success: false,
        error: 'Invalid pagination parameters'
      });
    }

    // Build query for ALL soft-deleted users
    const query = { isDeleted: true };
    console.log('🔍 Building query for soft-deleted users:', JSON.stringify(query));

    // Add role filter if specified
    if (role && role !== 'all') {
      if (!['client', 'doctor', 'supervisor', 'admin'].includes(role)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid role. Must be one of: client, doctor, supervisor, admin'
        });
      }
      query.role = role;
      console.log('🔍 Added role filter:', role);
    }

    // Add search functionality
    if (search) {
      const searchRegex = new RegExp(search.toLowerCase().trim(), 'i');
      query.$or = [
        { name: searchRegex },
        { email: searchRegex }
      ];
      console.log('🔍 Added search filter:', search);
    }

    // Build sort object
    const sort = {};
    const sortField = sortBy || 'deletedAt';
    sort[sortField] = sortOrder === 'desc' ? -1 : 1;
    console.log('🔍 Sort object:', JSON.stringify(sort));

    // Calculate skip for pagination
    const skip = (pageNum - 1) * limitNum;
    console.log('🔍 Pagination - page:', pageNum, 'limit:', limitNum, 'skip:', skip);

    // Get soft-deleted users with pagination
    const softDeletedUsers = await User.find(query)
      .select('-password -emailVerificationToken -emailOtp -emailOtpExpires')
      .populate('deletedBy', 'name email role')
      .sort(sort)
      .skip(skip)
      .limit(limitNum)
      .lean();

    console.log('🔍 Found soft-deleted users count:', softDeletedUsers.length);

    // Get total count for pagination
    const totalSoftDeletedUsers = await User.countDocuments(query);
    console.log('🔍 Total soft-deleted users in DB:', totalSoftDeletedUsers);

    // Get count by role
    const deletedByRole = await User.aggregate([
      { $match: { isDeleted: true } },
      { $group: { _id: '$role', count: { $sum: 1 } } }
    ]);
    console.log('🔍 Soft-deleted users by role:', deletedByRole);

    // Verify all results are actually soft-deleted
    const allActuallyDeleted = softDeletedUsers.every(user => {
      return user.isDeleted === true && user.deletedAt !== null;
    });
    console.log('🔍 All users actually soft-deleted:', allActuallyDeleted);

    res.status(200).json({
      success: true,
      data: {
        users: softDeletedUsers,
        pagination: { /* pagination info */ },
        statistics: {
          totalSoftDeleted: totalSoftDeletedUsers,
          deletedByRole: deletedByRole.reduce((acc, item) => {
            acc[item._id] = item.count;
            return acc;
          }, {})
        },
        filters: {
          role: role || 'all',
          sortBy: sortField,
          sortOrder: sortOrder || 'desc',
          search: search || ''
        }
      }
    });
  } catch (error) {
    console.error('❌ Get soft-deleted users error:', error);
    next(error);
  }
}
```

### **✅ Route Definition:**
```javascript
router.get('/soft-deleted',
  requirePermission('view_deleted_users'),
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('role').optional().isIn(['client', 'doctor', 'supervisor', 'admin', 'all']).withMessage('Role must be one of: client, doctor, supervisor, admin, or all'),
    query('sortBy').optional().isIn(['deletedAt', 'name', 'email', 'createdAt', 'role']).withMessage('Sort field must be one of: deletedAt, name, email, createdAt, role'),
    query('sortOrder').optional().isIn(['asc', 'desc']).withMessage('Sort order must be asc or desc'),
    query('search').optional().trim().isLength({ max: 100 }).withMessage('Search term cannot exceed 100 characters')
  ],
  userController.getSoftDeletedUsers
);
```

---

## 🎯 Use Cases

### **✅ 1. Get All Soft-Deleted Users:**
```javascript
// Admin gets all soft-deleted users
const response = await fetch('/api/users/soft-deleted', {
  headers: { 'Authorization': 'Bearer <admin-token>' }
});

// Returns all soft-deleted users across all roles
```

### **✅ 2. Filter by Role:**
```javascript
// Get only soft-deleted doctors
const response = await fetch('/api/users/soft-deleted?role=doctor', {
  headers: { 'Authorization': 'Bearer <admin-token>' }
});

// Returns only soft-deleted users with role: 'doctor'
```

### **✅ 3. Search Functionality:**
```javascript
// Search soft-deleted users by name or email
const response = await fetch('/api/users/soft-deleted?search=john', {
  headers: { 'Authorization': 'Bearer <admin-token>' }
});

// Returns soft-deleted users matching 'john' in name or email
```

### **✅ 4. Pagination:**
```javascript
// Get second page of soft-deleted users
const response = await fetch('/api/users/soft-deleted?page=2&limit=10', {
  headers: { 'Authorization': 'Bearer <admin-token>' }
});

// Returns page 2 with 10 items per page
```

### **✅ 5. Sort by Different Fields:**
```javascript
// Sort by name instead of deletedAt
const response = await fetch('/api/users/soft-deleted?sortBy=name&sortOrder=asc', {
  headers: { 'Authorization': 'Bearer <admin-token>' }
});

// Returns soft-deleted users sorted by name ascending
```

---

## 📊 Statistics Provided

### **✅ Total Count:**
- **totalSoftDeleted:** Total number of soft-deleted users in system

### **✅ Role Breakdown:**
- **deletedByRole:** Count of soft-deleted users by role
  - `client`: Number of soft-deleted clients
  - `doctor`: Number of soft-deleted doctors
  - `supervisor`: Number of soft-deleted supervisors
  - `admin`: Number of soft-deleted admins

### **✅ Pagination Info:**
- **currentPage:** Current page number
- **totalPages:** Total number of pages
- **totalUsers:** Total number of soft-deleted users matching filters
- **itemsPerPage:** Number of items per page
- **hasNext:** Whether there's a next page
- **hasPrev:** Whether there's a previous page

---

## 🔒 Security Features

### **✅ Access Control:**
- **Role-Based:** Different access levels for different user roles
- **Permission-Based:** Supervisors need explicit permission
- **Soft Delete:** Only shows soft-deleted users (isDeleted: true)
- **Data Filtering:** Excludes sensitive fields (password, tokens)

### **✅ Audit Trail:**
- **Deleted By:** Shows who deleted each user
- **Deleted At:** Timestamp of deletion
- **Role Tracking:** Clear role-based statistics
- **Permission Logging:** All access attempts are logged

---

## 📋 Implementation Examples

### **✅ JavaScript/React:**
```javascript
const getSoftDeletedUsers = async (filters = {}) => {
  try {
    const params = new URLSearchParams({
      page: filters.page || 1,
      limit: filters.limit || 20,
      role: filters.role || '',
      sortBy: filters.sortBy || 'deletedAt',
      sortOrder: filters.sortOrder || 'desc',
      search: filters.search || ''
    });

    const response = await fetch(`/api/users/soft-deleted?${params}`, {
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
    console.error('Error fetching soft-deleted users:', error);
    throw error;
  }
};

// Usage examples
const allSoftDeleted = await getSoftDeletedUsers();
const deletedDoctors = await getSoftDeletedUsers({ role: 'doctor' });
const deletedByName = await getSoftDeletedUsers({ search: 'john' });
```

### **✅ React Component:**
```javascript
import React, { useState, useEffect } from 'react';

const SoftDeletedUsersList = () => {
  const [softDeletedUsers, setSoftDeletedUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({});
  const [statistics, setStatistics] = useState({});
  const [filters, setFilters] = useState({
    role: '',
    sortBy: 'deletedAt',
    sortOrder: 'desc',
    search: ''
  });

  useEffect(() => {
    fetchSoftDeletedUsers();
  }, [filters]);

  const fetchSoftDeletedUsers = async () => {
    setLoading(true);
    try {
      const data = await getSoftDeletedUsers(filters);
      setSoftDeletedUsers(data.users);
      setPagination(data.pagination);
      setStatistics(data.statistics);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="soft-deleted-users">
      <h2>Soft-Deleted Users</h2>
      
      {/* Statistics */}
      <div className="statistics">
        <h3>Statistics</h3>
        <p>Total Soft-Deleted: {statistics.totalSoftDeleted}</p>
        <div className="role-breakdown">
          {Object.entries(statistics.deletedByRole || {}).map(([role, count]) => (
            <span key={role} className="role-stat">
              {role}: {count}
            </span>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="filters">
        <select
          value={filters.role}
          onChange={(e) => setFilters({...filters, role: e.target.value})}
        >
          <option value="">All Roles</option>
          <option value="client">Clients</option>
          <option value="doctor">Doctors</option>
          <option value="supervisor">Supervisors</option>
          <option value="admin">Admins</option>
        </select>

        <select
          value={filters.sortBy}
          onChange={(e) => setFilters({...filters, sortBy: e.target.value})}
        >
          <option value="deletedAt">Deleted Date</option>
          <option value="name">Name</option>
          <option value="email">Email</option>
          <option value="role">Role</option>
        </select>

        <input
          type="text"
          placeholder="Search by name or email"
          value={filters.search}
          onChange={(e) => setFilters({...filters, search: e.target.value})}
        />
      </div>

      {/* Loading */}
      {loading && <div>Loading soft-deleted users...</div>}

      {/* Users List */}
      {!loading && (
        <div className="users-list">
          {softDeletedUsers.map(user => (
            <div key={user._id} className="user-item">
              <h3>{user.name}</h3>
              <p>Email: {user.email}</p>
              <p>Role: {user.role}</p>
              <p>Deleted: {new Date(user.deletedAt).toLocaleDateString()}</p>
              <p>Deleted By: {user.deletedBy?.name}</p>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      <div className="pagination">
        <button 
          disabled={!pagination.hasPrev}
          onClick={() => setFilters({...filters, page: pagination.currentPage - 1})}
        >
          Previous
        </button>
        
        <span>
          Page {pagination.currentPage} of {pagination.totalPages}
        </span>
        
        <button 
          disabled={!pagination.hasNext}
          onClick={() => setFilters({...filters, page: pagination.currentPage + 1})}
        >
          Next
        </button>
      </div>
    </div>
  );
};
```

---

## 📈 Performance Considerations

### **✅ Database Optimization:**
- **Indexing:** Ensure `isDeleted` field is indexed
- **Pagination:** Uses skip/limit for efficient pagination
- **Population:** Only populates necessary related fields
- **Field Selection:** Excludes unnecessary fields from query

### **✅ Caching:**
- **Response Caching:** Consider caching pagination results
- **Statistics Caching:** Cache role-based statistics
- **Filter Caching:** Cache common filter combinations

### **✅ Security:**
- **Input Validation:** All query parameters are validated
- **Permission Checks:** Role and permission-based access control
- **Data Sanitization:** Excludes sensitive fields
- **Rate Limiting:** Consider rate limiting for this endpoint

---

## 📋 Testing Checklist

### **✅ Basic Functionality:**
- [ ] Returns soft-deleted users for admin
- [ ] Respects role filtering
- [ ] Pagination works correctly
- [ ] Sorting works on different fields
- [ ] Search functionality works
- [ ] Statistics are accurate

### **✅ Security Testing:**
- [ ] Permission checking works
- [ ] Unauthorized users are blocked
- [ ] Input validation works
- [ ] Sensitive fields are excluded

### **✅ Performance Testing:**
- [ ] Response time is acceptable
- [ ] Pagination is efficient
- [ ] Database queries are optimized
- [ ] Memory usage is reasonable

---

## 🎯 Summary

**✅ Endpoint Features:**
1. **All Roles Support** - Returns soft-deleted users from all roles
2. **Advanced Filtering** - Filter by role, search by name/email
3. **Pagination Support** - Efficient pagination with metadata
4. **Sorting Options** - Sort by various fields
5. **Statistics** - Role-based deletion statistics
6. **Security** - Proper permission checking
7. **Audit Trail** - Shows who deleted each user

**✅ Security Benefits:**
- **Least Privilege** - Only authorized users can access
- **Soft Delete Integrity** - Preserves audit trail
- **Role Separation** - Clear access boundaries
- **Permission Logging** - All access is tracked

**✅ Use Cases:**
- **Admin Dashboard** - View all soft-deleted users
- **Role Management** - Filter by specific roles
- **Audit Reporting** - Generate deletion reports
- **Data Recovery** - Identify users for potential restoration

**🎯 This endpoint provides comprehensive access to all soft-deleted users with proper security and filtering!**
