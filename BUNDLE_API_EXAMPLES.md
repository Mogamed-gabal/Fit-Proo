# Bundle Management API Examples

## Create Bundle
```http
POST /api/bundles
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "name": "Bundle A",
  "doctors": ["507f1f77bcf86cd799439011", "507f1f77bcf86cd799439012"],
  "price": 500
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439013",
    "name": "Bundle A",
    "doctors": [
      {
        "doctorId": {
          "_id": "507f1f77bcf86cd799439011",
          "name": "Dr. Smith",
          "email": "smith@example.com"
        }
      },
      {
        "doctorId": {
          "_id": "507f1f77bcf86cd799439012",
          "name": "Dr. Johnson",
          "email": "johnson@example.com"
        }
      }
    ],
    "price": 500,
    "isActive": true,
    "createdBy": {
      "_id": "507f1f77bcf86cd799439014",
      "name": "Admin User",
      "email": "admin@example.com"
    },
    "createdAt": "2026-05-03T13:00:00.000Z",
    "updatedAt": "2026-05-03T13:00:00.000Z"
  }
}
```

## Get All Bundles (Admin/Supervisor)
```http
GET /api/bundles
Authorization: Bearer <admin_token>
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439013",
      "name": "Bundle A",
      "doctors": [
        {
          "doctorId": {
            "_id": "507f1f77bcf86cd799439011",
            "name": "Dr. Smith",
            "email": "smith@example.com"
          }
        },
        {
          "doctorId": {
            "_id": "507f1f77bcf86cd799439012",
            "name": "Dr. Johnson",
            "email": "johnson@example.com"
          }
        }
      ],
      "price": 500,
      "isActive": true,
      "createdBy": {
        "_id": "507f1f77bcf86cd799439014",
        "name": "Admin User",
        "email": "admin@example.com"
      },
      "createdAt": "2026-05-03T13:00:00.000Z",
      "updatedAt": "2026-05-03T13:00:00.000Z"
    }
  ]
}
```

## Get All Bundles (Client)
```http
GET /api/bundles
Authorization: Bearer <client_token>
```

**Response (Only active bundles):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439013",
      "name": "Bundle A",
      "doctors": [
        {
          "doctorId": {
            "_id": "507f1f77bcf86cd799439011",
            "name": "Dr. Smith",
            "email": "smith@example.com"
          }
        },
        {
          "doctorId": {
            "_id": "507f1f77bcf86cd799439012",
            "name": "Dr. Johnson",
            "email": "johnson@example.com"
          }
        }
      ],
      "price": 500,
      "isActive": true,
      "createdBy": {
        "_id": "507f1f77bcf86cd799439014",
        "name": "Admin User",
        "email": "admin@example.com"
      },
      "createdAt": "2026-05-03T13:00:00.000Z",
      "updatedAt": "2026-05-03T13:00:00.000Z"
    }
  ]
}
```

## Update Bundle
```http
PUT /api/bundles/507f1f77bcf86cd799439013
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "name": "Updated Bundle A",
  "price": 600
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439013",
    "name": "Updated Bundle A",
    "doctors": [
      {
        "doctorId": {
          "_id": "507f1f77bcf86cd799439011",
          "name": "Dr. Smith",
          "email": "smith@example.com"
        }
      },
      {
        "doctorId": {
          "_id": "507f1f77bcf86cd799439012",
          "name": "Dr. Johnson",
          "email": "johnson@example.com"
        }
      }
    ],
    "price": 600,
    "isActive": true,
    "createdBy": {
      "_id": "507f1f77bcf86cd799439014",
      "name": "Admin User",
      "email": "admin@example.com"
    },
    "createdAt": "2026-05-03T13:00:00.000Z",
    "updatedAt": "2026-05-03T13:30:00.000Z"
  }
}
```

## Deactivate Bundle
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
    "name": "Updated Bundle A",
    "doctors": [
      {
        "doctorId": {
          "_id": "507f1f77bcf86cd799439011",
          "name": "Dr. Smith",
          "email": "smith@example.com"
        }
      },
      {
        "doctorId": {
          "_id": "507f1f77bcf86cd799439012",
          "name": "Dr. Johnson",
          "email": "johnson@example.com"
        }
      }
    ],
    "price": 600,
    "isActive": false,
    "createdBy": {
      "_id": "507f1f77bcf86cd799439014",
      "name": "Admin User",
      "email": "admin@example.com"
    },
    "createdAt": "2026-05-03T13:00:00.000Z",
    "updatedAt": "2026-05-03T13:35:00.000Z"
  }
}
```

## Error Responses

### Permission Denied
```json
{
  "success": false,
  "error": "Forbidden: You do not have permission to MANAGE_BUNDLES",
  "timestamp": "2026-05-03T13:00:00.000Z"
}
```

### Validation Error
```json
{
  "success": false,
  "error": "Bundle must contain exactly 2 doctors"
}
```

### Not Found
```json
{
  "success": false,
  "error": "Bundle not found"
}
```
