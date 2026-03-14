# Fitness Platform API Documentation

## Overview

This document provides comprehensive API documentation for the Fitness Platform backend service. The API is RESTful and uses JSON for all requests and responses.

**Base URL**: `http://localhost:5000/api`

## Authentication

The API uses JWT (JSON Web Tokens) for authentication. Protected endpoints require a valid access token in the `Authorization` header.

**Header Format**: `Authorization: Bearer <access_token>`

**Token Expiry**:
- Access Token: 15 minutes
- Refresh Token: 30 days (stored in database)

## Security Measures

- **Helmet**: Security headers
- **Rate Limiting**: Applied to sensitive endpoints
- **Input Sanitization**: MongoDB injection and XSS protection
- **Password Hashing**: bcrypt with 12 salt rounds
- **CORS**: Cross-origin resource sharing configured
- **Request Size Limit**: 10MB max payload size

## Rate Limiting Rules

| Endpoint Type | Window | Max Requests | Error Message |
|---------------|---------|---------------|---------------|
| Login | 15 minutes | 5 | "Too many authentication attempts, please try again later." |
| Refresh Token | 15 minutes | 10 | "Too many refresh attempts, please try again later." |
| Registration | 1 hour | 3 | "Too many registration attempts, please try again later." |
| Email Verification | 15 minutes | 5 | "Too many verification attempts, please try again later." |

---

# Authentication Endpoints

## Register Client

**Endpoint URL**: `/auth/register/client`
**Method**: `POST`
**Authentication Required**: No
**Role Required**: None

**Request Body**:
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "phone": "+1234567890",
  "address": "123 Main St, City, Country",
  "age": 30,
  "height": 175,
  "goal": "weight_loss"
}
```

**Headers**:
```
Content-Type: application/json
```

**Example Response**:
```json
{
  "success": true,
  "message": "Registration successful. Please check your email to verify your account.",
  "data": {
    "user": {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "client",
      "phone": "+1234567890",
      "address": "123 Main St, City, Country",
      "emailVerified": false,
      "isBlocked": false,
      "status": "approved",
      "profile": {
        "age": 30,
        "height": 175,
        "goal": "weight_loss"
      },
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  }
}
```

**Possible Errors**:
- `400`: Address is required
- `400`: Email already registered
- `400`: Validation errors (invalid email, password too short, etc.)

---

## Register Professional

**Endpoint URL**: `/auth/register/professional`
**Method**: `POST`
**Authentication Required**: No
**Role Required**: None

**Request Body**:
```json
{
  "name": "Dr. Jane Smith",
  "email": "jane@example.com",
  "password": "password123",
  "phone": "+1234567890",
  "address": "456 Medical Ave, City, Country",
  "role": "doctor",
  "packages": [
    {
      "duration": 1,
      "price": 100
    },
    {
      "duration": 3,
      "price": 250
    },
    {
      "duration": 6,
      "price": 400
    }
  ]
}
```

**Headers**:
```
Content-Type: application/json
```

**Multipart Form Data** (for certificates):
- `certificates`: Up to 5 image files (max 5MB each)

**Example Response**:
```json
{
  "success": true,
  "message": "Registration successful. Please check your email to verify your account. Your account is pending admin approval.",
  "data": {
    "user": {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d1",
      "name": "Dr. Jane Smith",
      "email": "jane@example.com",
      "role": "doctor",
      "phone": "+1234567890",
      "address": "456 Medical Ave, City, Country",
      "emailVerified": false,
      "isBlocked": false,
      "status": "pending",
      "packages": [
        {
          "duration": 1,
          "price": 100
        },
        {
          "duration": 3,
          "price": 250
        },
        {
          "duration": 6,
          "price": 400
        }
      ],
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  }
}
```

**Possible Errors**:
- `400`: Invalid role. Must be doctor or coach
- `400`: Address is required
- `400`: Email already registered
- `400`: Invalid packages (must have 1, 3, and 6 month durations)
- `400`: Only image files are allowed (for certificates)

---

## Verify Email

**Endpoint URL**: `/auth/verify-email`
**Method**: `POST`
**Authentication Required**: No
**Role Required**: None

**Request Body**:
```json
{
  "token": "64f8a1b2c3d4e5f6a7b8c9d0abc123def456"
}
```

**Headers**:
```
Content-Type: application/json
```

**Example Response**:
```json
{
  "success": true,
  "message": "Email verified successfully. You can now login."
}
```

**Possible Errors**:
- `400`: Invalid or expired verification token

---

## Login

**Endpoint URL**: `/auth/login`
**Method**: `POST`
**Authentication Required**: No
**Role Required**: None

**Request Body**:
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Headers**:
```
Content-Type: application/json
```

**Example Response**:
```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "client",
      "emailVerified": true,
      "isBlocked": false,
      "status": "approved",
      "lastLogin": "2024-01-15T10:30:00.000Z"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "64f8a1b2c3d4e5f6a7b8c9d0abc123def456"
  }
}
```

**Possible Errors**:
- `400`: Invalid credentials
- `401`: Account is blocked
- `401`: Email not verified
- `401`: Account not approved (for professionals)

---

## Refresh Token

**Endpoint URL**: `/auth/refresh`
**Method**: `POST`
**Authentication Required**: No
**Role Required**: None

**Request Body**:
```json
{
  "refreshToken": "64f8a1b2c3d4e5f6a7b8c9d0abc123def456"
}
```

**Headers**:
```
Content-Type: application/json
```

**Example Response**:
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "64f8a1b2c3d4e5f6a7b8c9d0def789ghi012"
  }
}
```

**Possible Errors**:
- `401`: Invalid or expired refresh token
- `401`: Account is blocked
- `401`: Email not verified
- `401`: Account not approved

---

## Logout

**Endpoint URL**: `/auth/logout`
**Method**: `POST`
**Authentication Required**: Yes
**Role Required**: Any

**Request Body**:
```json
{
  "refreshToken": "64f8a1b2c3d4e5f6a7b8c9d0abc123def456"
}
```

**Headers**:
```
Content-Type: application/json
Authorization: Bearer <access_token>
```

**Example Response**:
```json
{
  "success": true,
  "message": "Logout successful"
}
```

**Possible Errors**:
- `400`: Invalid refresh token

---

## Logout All Devices

**Endpoint URL**: `/auth/logout-all`
**Method**: `POST`
**Authentication Required**: Yes
**Role Required**: Any

**Headers**:
```
Authorization: Bearer <access_token>
```

**Example Response**:
```json
{
  "success": true,
  "message": "Logged out from all devices successfully"
}
```

---

## Get Current User

**Endpoint URL**: `/auth/me`
**Method**: `GET`
**Authentication Required**: Yes
**Role Required**: Any

**Headers**:
```
Authorization: Bearer <access_token>
```

**Example Response**:
```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "client",
      "phone": "+1234567890",
      "address": "123 Main St, City, Country",
      "emailVerified": true,
      "isBlocked": false,
      "status": "approved",
      "profile": {
        "age": 30,
        "height": 175,
        "goal": "weight_loss"
      },
      "weightHistory": [
        {
          "value": 75,
          "date": "2024-01-15T10:30:00.000Z"
        }
      ],
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  }
}
```

**Possible Errors**:
- `404`: User not found
- `403`: Account is blocked

---

# Admin Endpoints

## Approve User

**Endpoint URL**: `/auth/admin/approve/:userId`
**Method**: `POST`
**Authentication Required**: Yes (Admin Key)
**Role Required**: Admin

**Headers**:
```
x-admin-key: <admin_key>
```

**Example Response**:
```json
{
  "success": true,
  "message": "User approved successfully"
}
```

**Possible Errors**:
- `403`: Admin access required
- `404`: User not found
- `400`: Client accounts do not require approval

---

## Reject User

**Endpoint URL**: `/auth/admin/reject/:userId`
**Method**: `POST`
**Authentication Required**: Yes (Admin Key)
**Role Required**: Admin

**Headers**:
```
x-admin-key: <admin_key>
```

**Example Response**:
```json
{
  "success": true,
  "message": "User rejected successfully"
}
```

**Possible Errors**:
- `403`: Admin access required
- `404`: User not found

---

## Block User

**Endpoint URL**: `/auth/admin/block/:userId`
**Method**: `POST`
**Authentication Required**: Yes (Admin Key)
**Role Required**: Admin

**Headers**:
```
x-admin-key: <admin_key>
```

**Example Response**:
```json
{
  "success": true,
  "message": "User blocked successfully"
}
```

**Possible Errors**:
- `403`: Admin access required
- `404`: User not found

---

## Unblock User

**Endpoint URL**: `/auth/admin/unblock/:userId`
**Method**: `POST`
**Authentication Required**: Yes (Admin Key)
**Role Required**: Admin

**Headers**:
```
x-admin-key: <admin_key>
```

**Example Response**:
```json
{
  "success": true,
  "message": "User unblocked successfully"
}
```

**Possible Errors**:
- `403`: Admin access required
- `404`: User not found

---

## Create Supervisor

**Endpoint URL**: `/auth/admin/create-supervisor`
**Method**: `POST`
**Authentication Required**: Yes
**Role Required**: Admin

**Request Body**:
```json
{
  "name": "John Supervisor",
  "email": "supervisor@example.com",
  "password": "password123",
  "phone": "+1234567890",
  "address": "123 Admin Office"
}
```

**Headers**:
```
Content-Type: application/json
Authorization: Bearer <admin_access_token>
```

**Example Response**:
```json
{
  "success": true,
  "message": "Supervisor created successfully",
  "data": {
    "user": {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d3",
      "name": "John Supervisor",
      "email": "supervisor@example.com",
      "role": "supervisor",
      "phone": "+1234567890",
      "address": "123 Admin Office",
      "emailVerified": true,
      "isBlocked": false,
      "status": "approved",
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  }
}
```

**Possible Errors**:
- `401`: Authentication required
- `403`: Admin role required
- `400`: Address is required
- `400`: Email already registered

---

# Subscription Endpoints

## Create Subscription

**Endpoint URL**: `/subscription`
**Method**: `POST`
**Authentication Required**: Yes
**Role Required**: Client

**Request Body**:
```json
{
  "doctorId": "64f8a1b2c3d4e5f6a7b8c9d1",
  "duration": 3
}
```

**Headers**:
```
Content-Type: application/json
Authorization: Bearer <access_token>
```

**Example Response**:
```json
{
  "success": true,
  "message": "Subscription created successfully",
  "data": {
    "subscription": {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d2",
      "clientId": "64f8a1b2c3d4e5f6a7b8c9d0",
      "doctorId": "64f8a1b2c3d4e5f6a7b8c9d1",
      "duration": 3,
      "monthlyPrice": 83.33,
      "totalPrice": 250,
      "paymentStatus": "pending",
      "startDate": "2024-01-15T10:30:00.000Z",
      "endDate": "2024-04-15T10:30:00.000Z",
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  }
}
```

**Possible Errors**:
- `401`: Authentication required
- `403`: Client role required
- `404`: Doctor not found
- `403`: Client account is blocked
- `403`: Client email must be verified
- `403`: Doctor account is blocked
- `400`: Invalid duration (must be 1, 3, or 6 months)

---

## Confirm Payment

**Endpoint URL**: `/subscription/:subscriptionId/confirm-payment`
**Method**: `POST`
**Authentication Required**: Yes
**Role Required**: Any (Client or Doctor)

**Headers**:
```
Authorization: Bearer <access_token>
```

**Example Response**:
```json
{
  "success": true,
  "message": "Payment confirmed successfully"
}
```

**Possible Errors**:
- `401`: Authentication required
- `404`: Subscription not found
- `403`: Not authorized to confirm this payment

---

## Fail Payment

**Endpoint URL**: `/subscription/:subscriptionId/fail-payment`
**Method**: `POST`
**Authentication Required**: Yes
**Role Required**: Any (Client or Doctor)

**Headers**:
```
Authorization: Bearer <access_token>
```

**Example Response**:
```json
{
  "success": true,
  "message": "Payment failure recorded"
}
```

**Possible Errors**:
- `401`: Authentication required
- `404`: Subscription not found
- `403`: Not authorized to fail this payment

---

## Get Client Subscriptions

**Endpoint URL**: `/subscription/my-subscriptions`
**Method**: `GET`
**Authentication Required**: Yes
**Role Required**: Client

**Headers**:
```
Authorization: Bearer <access_token>
```

**Example Response**:
```json
{
  "success": true,
  "data": {
    "subscriptions": [
      {
        "_id": "64f8a1b2c3d4e5f6a7b8c9d2",
        "clientId": "64f8a1b2c3d4e5f6a7b8c9d0",
        "doctorId": "64f8a1b2c3d4e5f6a7b8c9d1",
        "duration": 3,
        "monthlyPrice": 83.33,
        "totalPrice": 250,
        "paymentStatus": "paid",
        "startDate": "2024-01-15T10:30:00.000Z",
        "endDate": "2024-04-15T10:30:00.000Z",
        "doctorId": {
          "_id": "64f8a1b2c3d4e5f6a7b8c9d1",
          "name": "Dr. Jane Smith",
          "email": "jane@example.com"
        },
        "createdAt": "2024-01-15T10:30:00.000Z"
      }
    ]
  }
}
```

**Possible Errors**:
- `401`: Authentication required
- `403`: Client role required

---

## Get Doctor Subscriptions

**Endpoint URL**: `/subscription/doctor-subscriptions`
**Method**: `GET`
**Authentication Required**: Yes
**Role Required**: Doctor

**Headers**:
```
Authorization: Bearer <access_token>
```

**Example Response**:
```json
{
  "success": true,
  "data": {
    "subscriptions": [
      {
        "_id": "64f8a1b2c3d4e5f6a7b8c9d2",
        "clientId": "64f8a1b2c3d4e5f6a7b8c9d0",
        "doctorId": "64f8a1b2c3d4e5f6a7b8c9d1",
        "duration": 3,
        "monthlyPrice": 83.33,
        "totalPrice": 250,
        "paymentStatus": "paid",
        "startDate": "2024-01-15T10:30:00.000Z",
        "endDate": "2024-04-15T10:30:00.000Z",
        "clientId": {
          "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
          "name": "John Doe",
          "email": "john@example.com"
        },
        "createdAt": "2024-01-15T10:30:00.000Z"
      }
    ]
  }
}
```

**Possible Errors**:
- `401`: Authentication required
- `403`: Doctor role required

---

## Cancel Subscription

**Endpoint URL**: `/subscription/:subscriptionId`
**Method**: `DELETE`
**Authentication Required**: Yes
**Role Required**: Any (Client or Doctor)

**Headers**:
```
Authorization: Bearer <access_token>
```

**Example Response**:
```json
{
  "success": true,
  "message": "Subscription cancelled successfully"
}
```

**Possible Errors**:
- `401`: Authentication required
- `404`: Subscription not found
- `403`: Not authorized to cancel this subscription

---

# Profile Endpoints

## Add Weight Entry

**Endpoint URL**: `/profile/weight`
**Method**: `POST`
**Authentication Required**: Yes
**Role Required**: Client

**Request Body**:
```json
{
  "value": 75.5
}
```

**Headers**:
```
Content-Type: application/json
Authorization: Bearer <access_token>
```

**Example Response**:
```json
{
  "success": true,
  "message": "Weight entry added successfully",
  "data": {
    "weightEntry": {
      "value": 75.5,
      "date": "2024-01-15T10:30:00.000Z"
    }
  }
}
```

**Possible Errors**:
- `401`: Authentication required
- `403`: Client role required
- `403`: Account is blocked
- `400`: Weight must be at least 1 kg

---

## Get Weight History

**Endpoint URL**: `/profile/weight-history`
**Method**: `GET`
**Authentication Required**: Yes
**Role Required**: Client

**Headers**:
```
Authorization: Bearer <access_token>
```

**Example Response**:
```json
{
  "success": true,
  "data": {
    "weightHistory": [
      {
        "value": 75.5,
        "date": "2024-01-15T10:30:00.000Z"
      },
      {
        "value": 75.2,
        "date": "2024-01-14T10:30:00.000Z"
      }
    ]
  }
}
```

**Possible Errors**:
- `401`: Authentication required
- `403`: Client role required
- `403`: Account is blocked

---

# Middleware Behavior

## Authentication Middleware (`authenticate`)

- Validates JWT access token from `Authorization: Bearer <token>` header
- Checks if user exists and is not blocked
- Attaches user info to `req.user` object
- Returns `401` for invalid/missing tokens
- Returns `401` for blocked users

## Authorization Middleware (`authorize`)

- Factory function that takes allowed roles as parameters
- Checks if `req.user.role` is in the allowed roles list
- Returns `403` for insufficient permissions
- Usage: `authorize('client')`, `authorize('doctor', 'coach')`

## Admin Only Middleware (`adminOnly`)

- Validates `x-admin-key` header against `ADMIN_KEY` environment variable
- Returns `403` for missing/invalid admin key
- Used for administrative operations

# JWT Authentication Flow

1. **Login**: User provides credentials, receives access token (15min) and refresh token (30 days)
2. **Access Token**: Used for API requests in Authorization header
3. **Token Refresh**: When access token expires, use refresh token to get new pair
4. **Token Rotation**: Old refresh token is revoked, new one issued
5. **Logout**: Refresh token is revoked, invalidating future refresh attempts

# Logging System

## Winston Logger Configuration

- **Development**: Console output with colors, debug level
- **Production**: File output with JSON format, info level
- **Log Files**: 
  - `logs/error.log` - Error level logs only
  - `logs/combined.log` - All logs
- **Metadata**: Timestamp, service name, stack traces for errors

## Morgan HTTP Request Logging

- **Development**: `morgan('dev')` format to console
- **Production**: Custom format piped to Winston
- **Format**: `:method :url :status :response-time ms - :res[content-length]`

# Error Handling

## Global Error Handler

- Catches all unhandled errors
- Logs errors with Winston (including stack traces)
- Returns consistent JSON error responses
- Handles specific error types:
  - `CastError`: Resource not found (404)
  - `ValidationError`: Mongoose validation errors (400)
  - `11000`: Duplicate field (400)

## Process Handlers

- **Unhandled Rejections**: Logged and graceful shutdown
- **Uncaught Exceptions**: Logged and graceful shutdown
- **SIGINT**: Graceful server shutdown with MongoDB connection close

# Data Models

## User Model Fields

```javascript
{
  name: String (required, max 50 chars),
  email: String (required, unique, email format),
  password: String (required, min 6 chars, hashed),
  phone: String (required, phone format),
  address: String (required, max 200 chars),
  role: String (enum: ['admin', 'supervisor', 'doctor', 'client']),
  emailVerified: Boolean (default: false),
  isBlocked: Boolean (default: false),
  status: String (enum: ['pending', 'approved', 'rejected']),
  profile: {
    age: Number (min: 1, max: 120),
    height: Number (min: 50, max: 250),
    goal: String (enum: ['weight_loss', 'muscle_gain', 'fitness', 'health', 'performance'])
  },
  weightHistory: [{
    value: Number (min: 1),
    date: Date (default: Date.now)
  }],
  packages: [{
    duration: Number (enum: [1, 3, 6]),
    price: Number (min: 0)
  }],
  certificates: [Buffer] (for professionals)
}
```

## Subscription Model Fields

```javascript
{
  clientId: ObjectId (ref: 'User', indexed),
  doctorId: ObjectId (ref: 'User', indexed),
  duration: Number (enum: [1, 3, 6]),
  monthlyPrice: Number (min: 0),
  totalPrice: Number (min: 0),
  paymentStatus: String (enum: ['pending', 'paid', 'failed', 'cancelled']),
  startDate: Date,
  endDate: Date
}
```

---

# Admin Seeding Script

## Overview

The admin seeding script creates default administrator accounts for the system. This script should be run once during initial setup.

## Usage

**Method 1**: Direct execution
```bash
node scripts/seedAdmin.js
```

**Method 2**: NPM script
```bash
npm run seed:admin
```

## Default Admin Accounts

The script creates the following admin accounts if they don't exist:

1. **System Administrator**
   - Email: `admin@fitness.com`
   - Password: `Admin123!@#`

2. **Super Admin**
   - Email: `superadmin@fitness.com`
   - Password: `SuperAdmin123!@#`

## Script Features

- ✅ **Duplicate Prevention**: Checks if admin exists before creation
- ✅ **Safe MongoDB Connection**: Uses environment MONGO_URI
- ✅ **Password Security**: Passwords automatically hashed via User model
- ✅ **No Password Exposure**: Clean logging without showing passwords
- ✅ **Error Handling**: Comprehensive error handling
- ✅ **Process Safety**: Handles unhandled rejections and exceptions

## Script Behavior

- Checks each admin email for existence
- Creates only non-existing admins
- Skips existing admins with confirmation
- Auto-sets `emailVerified: true` and `status: 'approved'`
- Provides detailed summary of operations
- Graceful database connection cleanup

## Output Example

```
🚀 Starting admin seeding...

✅ Connected to MongoDB
✅ Created admin: admin@fitness.com
⏭️  Admin already exists: superadmin@fitness.com

📊 Summary:
✅ Created: 1 admin(s)
⏭️  Skipped: 1 admin(s)
📝 Total processed: 2 admin(s)
🔒 Database connection closed
```

---

# Environment Variables

Required environment variables:

```
NODE_ENV=development|production
PORT=5000
MONGO_URI=mongodb://localhost:27017/fitness-platform
JWT_SECRET=your_jwt_secret_key
ADMIN_KEY=your_admin_key
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_email_password
FRONTEND_URL=http://localhost:3000
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

---

*This documentation covers all available endpoints as of the current version. For any questions or issues, please contact the development team.*
