# 🧪 AUDIT SYSTEM - TEST EXAMPLES & API DOCUMENTATION

---

## **🔗 API ENDPOINTS**

### **Base URL:** `/audit`

### **Authentication:** Required (Bearer Token)
### **Permissions:** `read_audit_logs` required for all endpoints

---

## **📊 ENDPOINT DOCUMENTATION**

### **1. Get Audit Logs**
```http
GET /audit/logs
Authorization: Bearer <access_token>
```

**Query Parameters:**
- `adminId` (string, optional) - Filter by admin ID
- `actionType` (string, optional) - Filter by action type
- `targetType` (string, optional) - Filter by target type
- `targetId` (string, optional) - Filter by target ID
- `result` (string, optional) - Filter by result ('success', 'failure', 'partial')
- `dateFrom` (string, optional) - Start date (ISO format)
- `dateTo` (string, optional) - End date (ISO format)
- `search` (string, optional) - Text search in reasons and metadata
- `page` (number, optional) - Page number (default: 1)
- `limit` (number, optional) - Items per page (default: 50, max: 100)

**Response:**
```json
{
  "success": true,
  "data": {
    "logs": [
      {
        "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
        "adminId": "64f8a1b2c3d4e5f6a7b8c9d1",
        "actionType": "approve_user",
        "targetId": "64f8a1b2c3d4e5f6a7b8c9d2",
        "targetType": "User",
        "details": {
          "reason": "Qualified professional with valid credentials",
          "requestInfo": {
            "endpoint": "/admin/approve/64f8a1b2c3d4e5f6a7b8c9d2",
            "method": "POST",
            "userAgent": "Mozilla/5.0...",
            "ipAddress": "192.168.1.100"
          }
        },
        "result": "success",
        "timestamp": "2024-01-15T10:30:00.000Z",
        "createdAt": "2024-01-15T10:30:00.000Z",
        "updatedAt": "2024-01-15T10:30:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 1250,
      "pages": 25,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

### **2. Get Audit Statistics**
```http
GET /audit/statistics
Authorization: Bearer <access_token>
```

**Query Parameters:**
- `adminId` (string, optional) - Filter by admin ID
- `dateFrom` (string, optional) - Start date (ISO format)
- `dateTo` (string, optional) - End date (ISO format)

**Response:**
```json
{
  "success": true,
  "data": {
    "totalActions": 1250,
    "successfulActions": 1230,
    "failedActions": 20,
    "actionTypes": ["approve_user", "reject_user", "block_user", "unblock_user"],
    "targetTypes": ["User", "Subscription"],
    "uniqueAdmins": ["64f8a1b2c3d4e5f6a7b8c9d1", "64f8a1b2c3d4e5f6a7b8c9d3"],
    "latestAction": "2024-01-15T15:45:00.000Z",
    "actionBreakdown": [
      {
        "_id": "approve_user",
        "count": 450,
        "success": 445,
        "failure": 5
      },
      {
        "_id": "reject_user",
        "count": 320,
        "success": 315,
        "failure": 5
      }
    ],
    "successRate": "98.4"
  }
}
```

### **3. Get Specific Audit Log**
```http
GET /audit/logs/:logId
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "log": {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
      "adminId": {
        "_id": "64f8a1b2c3d4e5f6a7b8c9d1",
        "name": "John Admin",
        "email": "admin@example.com",
        "role": "admin"
      },
      "actionType": "approve_user",
      "targetId": "64f8a1b2c3d4e5f6a7b8c9d2",
      "targetType": "User",
      "details": {
        "reason": "Qualified professional with valid credentials",
        "changes": {
          "oldValues": {
            "status": "pending"
          },
          "newValues": {
            "status": "approved"
          }
        },
        "metadata": {
          "query": {},
          "params": {
            "userId": "64f8a1b2c3d4e5f6a7b8c9d2"
          }
        },
        "requestInfo": {
          "endpoint": "/admin/approve/64f8a1b2c3d4e5f6a7b8c9d2",
          "method": "POST",
          "userAgent": "Mozilla/5.0...",
          "ipAddress": "192.168.1.100"
        }
      },
      "result": "success",
      "timestamp": "2024-01-15T10:30:00.000Z"
    }
  }
}
```

### **4. Export Audit Logs (CSV)**
```http
GET /audit/export
Authorization: Bearer <access_token>
```

**Query Parameters:** Same as `/audit/logs`

**Response:** CSV file download
```
Content-Type: text/csv
Content-Disposition: attachment; filename="audit-logs-2024-01-15.csv"
```

**CSV Format:**
```csv
Timestamp,Admin Name,Admin Email,Action Type,Target Type,Target ID,Result,Reason,IP Address,User Agent,Endpoint
"2024-01-15T10:30:00.000Z","John Admin","admin@example.com","approve_user","User","64f8a1b2c3d4e5f6a7b8c9d2","success","Qualified professional","192.168.1.100","Mozilla/5.0...","/admin/approve/64f8a1b2c3d4e5f6a7b8c9d2"
```

### **5. Get Action Types**
```http
GET /audit/action-types
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "actionTypes": [
      "approve_user",
      "reject_user",
      "block_user",
      "unblock_user",
      "soft_delete_user",
      "create_supervisor",
      "delete_supervisor"
    ]
  }
}
```

### **6. Get Target Types**
```http
GET /audit/target-types
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "targetTypes": [
      "User",
      "Subscription",
      "System",
      "Doctor",
      "Client",
      "Supervisor"
    ]
  }
}
```

### **7. Get Admin Activity Summary**
```http
GET /audit/activity-summary
Authorization: Bearer <access_token>
```

**Query Parameters:**
- `adminId` (string, optional) - Filter by admin ID
- `days` (number, optional) - Number of days to analyze (default: 30, max: 365)

**Response:**
```json
{
  "success": true,
  "data": {
    "summary": {
      "totalActions": 150,
      "successfulActions": 148,
      "failedActions": 2,
      "actionTypes": ["approve_user", "block_user"],
      "targetTypes": ["User"],
      "uniqueAdmins": ["64f8a1b2c3d4e5f6a7b8c9d1"],
      "latestAction": "2024-01-15T15:45:00.000Z",
      "actionBreakdown": [
        {
          "_id": "approve_user",
          "count": 120,
          "success": 119,
          "failure": 1
        }
      ],
      "successRate": "98.67"
    },
    "dailyActivity": [
      {
        "_id": "2024-01-15",
        "count": 25,
        "success": 24,
        "failure": 1
      },
      {
        "_id": "2024-01-14",
        "count": 30,
        "success": 30,
        "failure": 0
      }
    ],
    "period": {
      "days": 30,
      "dateFrom": "2023-12-16T00:00:00.000Z",
      "dateTo": "2024-01-15T23:59:59.999Z"
    }
  }
}
```

---

## **🧪 TESTING EXAMPLES**

### **1. Test Audit Logging on User Approval**

**Request:**
```http
POST /admin/approve/64f8a1b2c3d4e5f6a7b8c9d2
Authorization: Bearer <admin_access_token>
Content-Type: application/json

{
  "reason": "Professional meets all requirements"
}
```

**Expected Audit Log Created:**
```json
{
  "adminId": "admin_user_id",
  "actionType": "approve_user",
  "targetId": "64f8a1b2c3d4e5f6a7b8c9d2",
  "targetType": "User",
  "details": {
    "reason": "Professional meets all requirements",
    "changes": {
      "oldValues": { "status": "pending" },
      "newValues": { "status": "approved" }
    }
  },
  "result": "success"
}
```

### **2. Test Audit Logging on User Rejection**

**Request:**
```http
POST /admin/reject/64f8a1b2c3d4e5f6a7b8c9d3
Authorization: Bearer <admin_access_token>
Content-Type: application/json

{
  "reason": "Insufficient documentation provided"
}
```

**Expected Audit Log Created:**
```json
{
  "adminId": "admin_user_id",
  "actionType": "reject_user",
  "targetId": "64f8a1b2c3d4e5f6a7b8c9d3",
  "targetType": "User",
  "details": {
    "reason": "Insufficient documentation provided",
    "changes": {
      "oldValues": { "status": "pending" },
      "newValues": { "status": "rejected" }
    }
  },
  "result": "success"
}
```

### **3. Test Querying Audit Logs**

**Request:**
```http
GET /audit/logs?actionType=approve_user&dateFrom=2024-01-01&dateTo=2024-01-31&page=1&limit=10
Authorization: Bearer <admin_access_token>
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "logs": [...], // Array of approval logs
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 45,
      "pages": 5
    }
  }
}
```

### **4. Test Audit Statistics**

**Request:**
```http
GET /audit/statistics?dateFrom=2024-01-01
Authorization: Bearer <admin_access_token>
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "totalActions": 1250,
    "successRate": "98.4",
    "actionBreakdown": [...]
  }
}
```

---

## **🔍 COMMON USE CASES**

### **1. Monitor Admin Activity**
```javascript
// Get recent admin activity
GET /audit/logs?adminId=<admin_id>&page=1&limit=20

// Get activity for specific date range
GET /audit/logs?dateFrom=2024-01-01&dateTo=2024-01-31

// Get failed actions for investigation
GET /audit/logs?result=failure&dateFrom=2024-01-01
```

### **2. Generate Reports**
```javascript
// Export all logs for a month
GET /audit/export?dateFrom=2024-01-01&dateTo=2024-01-31

// Get statistics for reporting
GET /audit/statistics?dateFrom=2024-01-01&dateTo=2024-01-31

// Get activity summary for dashboard
GET /audit/activity-summary?days=30
```

### **3. Security Investigations**
```javascript
// Search for specific actions
GET /audit/logs?search=block_user&dateFrom=2024-01-01

// Get failed login attempts (if implemented)
GET /audit/logs?actionType=login_attempt&result=failure

// Track specific user modifications
GET /audit/logs?targetId=<user_id>&dateFrom=2024-01-01
```

---

## **🚨 ERROR HANDLING**

### **Common Error Responses:**

**401 Unauthorized:**
```json
{
  "success": false,
  "error": "Access token required"
}
```

**403 Forbidden:**
```json
{
  "success": false,
  "error": "Insufficient permissions for action: read_audit_logs"
}
```

**400 Bad Request:**
```json
{
  "success": false,
  "error": "Limit must be between 1 and 100"
}
```

**500 Internal Server Error:**
```json
{
  "success": false,
  "error": "Failed to fetch audit logs"
}
```

---

## **📈 PERFORMANCE CONSIDERATIONS**

### **Optimization Tips:**
1. **Use Date Ranges:** Always filter by date range for better performance
2. **Pagination:** Use pagination for large datasets
3. **Specific Filters:** Use specific actionType/targetType filters
4. **Index Usage:** Queries are optimized with proper database indexes
5. **Rate Limiting:** Audit endpoints have built-in rate limiting

### **Recommended Query Patterns:**
```javascript
// ✅ Good - Specific filters with date range
GET /audit/logs?actionType=approve_user&dateFrom=2024-01-01&dateTo=2024-01-31&page=1

// ❌ Avoid - Too broad queries
GET /audit/logs?page=1

// ✅ Good - Targeted search
GET /audit/logs?search=specific_term&dateFrom=2024-01-01

// ❌ Avoid - Search without date constraint
GET /audit/logs?search=broad_term
```

---

## **🔧 INTEGRATION EXAMPLES**

### **Frontend Integration (React):**
```javascript
// Fetch audit logs
const fetchAuditLogs = async (filters) => {
  const response = await fetch('/audit/logs?' + new URLSearchParams(filters), {
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  });
  return response.json();
};

// Use in component
const [logs, setLogs] = useState([]);
const [loading, setLoading] = useState(false);

useEffect(() => {
  const loadLogs = async () => {
    setLoading(true);
    const data = await fetchAuditLogs({
      page: 1,
      limit: 20,
      dateFrom: '2024-01-01'
    });
    setLogs(data.logs);
    setLoading(false);
  };
  loadLogs();
}, []);
```

### **Backend Integration (Service):**
```javascript
// Service for audit operations
class AuditService {
  static async getLogs(filters) {
    const response = await fetch(`/api/audit/logs?${new URLSearchParams(filters)}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.json();
  }

  static async getStatistics(filters) {
    const response = await fetch(`/api/audit/statistics?${new URLSearchParams(filters)}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.json();
  }
}
```

---

## **✅ TESTING CHECKLIST**

- [ ] **Authentication:** Verify only authenticated users can access endpoints
- [ ] **Authorization:** Verify only users with `read_audit_logs` permission can access
- [ ] **Rate Limiting:** Verify rate limiting is working
- [ ] **Data Sanitization:** Verify sensitive data is masked in logs
- [ ] **Pagination:** Verify pagination works correctly
- [ ] **Filtering:** Verify all filter options work
- [ ] **Export:** Verify CSV export functionality
- [ ] **Statistics:** Verify statistics calculations
- [ ] **Error Handling:** Verify proper error responses
- [ ] **Performance:** Verify queries are efficient

---

**🎯 The audit system is now fully implemented and ready for production use!**
