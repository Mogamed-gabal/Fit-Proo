# 🏋️‍♂️ Fitness Platform - Backend API Documentation

## 📋 Table of Contents
- [Authentication Endpoints](#-authentication-endpoints)
- [Subscription Endpoints](#-subscription-endpoints)
- [Profile Endpoints](#-profile-endpoints)
- [Admin Endpoints](#-admin-endpoints)
- [General Endpoints](#-general-endpoints)
- [Authentication Details](#-authentication-details)
- [Environment Variables](#-environment-variables)
- [Setup Instructions](#-setup-instructions)

---

## 🔐 Authentication Endpoints

### POST /api/auth/register/client
**Description**: Register a new client user

**Request Body**:
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "phone": "+1234567890",
  "address": "123 Main St",
  "age": 30,
  "height": 175,
  "goal": "weight_loss"
}
```

**Success Response** (201):
```json
{
  "success": true,
  "message": "Registration successful. Please check your email for verification.",
  "data": {
    "user": {
      "_id": "507f1f77bcf86cd799439011",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "client",
      "emailVerified": false,
      "status": "pending"
    }
  }
}
```

**Error Responses**:
```json
// Email already registered (400)
{
  "success": false,
  "error": "Email already registered"
}

// Validation error (400)
{
  "success": false,
  "error": "Name is required"
}
```

---

### POST /api/auth/register/professional
**Description**: Register a doctor or professional

**Request Body** (multipart/form-data):
```
name: "Dr. Smith"
email: "doctor@example.com"
password: "password123"
phone: "+1234567890"
address: "123 Medical Center"
age: 35
height: 180
packages: [{"duration": 1, "price": 100}, {"duration": 3, "price": 250}, {"duration": 6, "price": 450}]
certificates: [file1.jpg, file2.pdf]
```

**Success Response** (201):
```json
{
  "success": true,
  "message": "Registration successful. Please check your email for verification and wait for admin approval.",
  "data": {
    "user": {
      "_id": "507f1f77bcf86cd799439012",
      "name": "Dr. Smith",
      "email": "doctor@example.com",
      "role": "doctor",
      "emailVerified": false,
      "status": "pending"
    }
  }
}
```

---

### POST /api/auth/login
**Description**: User login

**Request Body**:
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Success Response** (200):
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "_id": "507f1f77bcf86cd799439011",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "client",
      "emailVerified": true,
      "isBlocked": false,
      "status": "approved"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI1MDdmMWY3N2JjZjg2Y2Q3OTk0MzkwMTEiLCJpYXQiOjE3MDk1NDc4MDAsImV4cCI6MTcwOTU0ODcwMH0.signature",
    "refreshToken": "a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"
  }
}
```

**Error Responses**:
```json
// Invalid credentials (401)
{
  "success": false,
  "error": "Invalid credentials"
}

// Account blocked (401)
{
  "success": false,
  "error": "Account is blocked"
}

// Email not verified (403)
{
  "success": false,
  "message": "Email not verified. Please check your email and verify your account."
}
```

---

### POST /api/auth/refresh
**Description**: Refresh access token

**Request Body**:
```json
{
  "refreshToken": "a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"
}
```

**Success Response** (200):
```json
{
  "success": true,
  "data": {
    "accessToken": "new_jwt_token_here",
    "refreshToken": "new_refresh_token_here"
  }
}
```

---

### GET /api/auth/me
**Description**: Get current user profile

**Headers**: `Authorization: Bearer <access_token>`

**Success Response** (200):
```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "507f1f77bcf86cd799439011",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "client",
      "phone": "+1234567890",
      "address": "123 Main St",
      "age": 30,
      "height": 175,
      "goal": "weight_loss",
      "weightHistory": [
        {
          "value": 75.5,
          "date": "2026-03-01T10:00:00.000Z"
        }
      ]
    }
  }
}
```

---

## 📝 Subscription Endpoints

### POST /api/subscription/
**Description**: Create new subscription

**Headers**: `Authorization: Bearer <access_token>`

**Request Body**:
```json
{
  "clientId": "507f1f77bcf86cd799439011",
  "doctorId": "507f1f77bcf86cd799439012",
  "duration": 3,
  "monthlyPrice": 100,
  "totalPrice": 300
}
```

**Success Response** (201):
```json
{
  "success": true,
  "message": "Subscription created successfully. Please complete payment to activate.",
  "data": {
    "subscription": {
      "_id": "507f1f77bcf86cd799439013",
      "clientId": "507f1f77bcf86cd799439011",
      "doctorId": "507f1f77bcf86cd799439012",
      "duration": 3,
      "monthlyPrice": 100,
      "totalPrice": 300,
      "paymentStatus": "pending",
      "isActive": false,
      "startDate": "2026-03-04T17:00:00.000Z",
      "endDate": "2026-06-04T17:00:00.000Z"
    }
  }
}
```

---

### POST /api/subscription/:subscriptionId/confirm-payment
**Description**: Confirm subscription payment

**Headers**: `Authorization: Bearer <access_token>`

**Success Response** (200):
```json
{
  "success": true,
  "message": "Payment confirmed successfully",
  "data": {
    "subscription": {
      "_id": "507f1f77bcf86cd799439013",
      "paymentStatus": "paid",
      "isActive": true,
      "paidAt": "2026-03-04T17:00:00.000Z"
    }
  }
}
```

---

### GET /api/subscription/my-subscriptions
**Description**: Get user's subscriptions

**Headers**: `Authorization: Bearer <access_token>`

**Query Parameters**: `page`, `limit`

**Success Response** (200):
```json
{
  "success": true,
  "data": {
    "subscriptions": [
      {
        "_id": "507f1f77bcf86cd799439013",
        "clientId": "507f1f77bcf86cd799439011",
        "doctorId": {
          "_id": "507f1f77bcf86cd799439012",
          "name": "Dr. Smith",
          "email": "doctor@example.com"
        },
        "paymentStatus": "paid",
        "isActive": true
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 1,
      "totalItems": 1,
      "hasNext": false,
      "hasPrev": false
    }
  }
}
```

---

## 👤 Profile Endpoints

### GET /api/profile/
**Description**: Get user profile

**Headers**: `Authorization: Bearer <access_token>`

**Success Response** (200):
```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "507f1f77bcf86cd799439011",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "client",
      "phone": "+1234567890",
      "address": "123 Main St",
      "age": 30,
      "height": 175,
      "goal": "weight_loss"
    }
  }
}
```

---

### PUT /api/profile/
**Description**: Update user profile

**Headers**: `Authorization: Bearer <access_token>`

**Request Body**:
```json
{
  "name": "John Updated",
  "phone": "+1234567891",
  "address": "123 Updated St",
  "age": 31,
  "height": 176,
  "goal": "muscle_gain"
}
```

**Success Response** (200):
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "user": {
      "_id": "507f1f77bcf86cd799439011",
      "name": "John Updated",
      "phone": "+1234567891",
      "address": "123 Updated St",
      "age": 31,
      "height": 176,
      "goal": "muscle_gain"
    }
  }
}
```

---

### POST /api/profile/weight
**Description**: Add weight entry

**Headers**: `Authorization: Bearer <access_token>`

**Request Body**:
```json
{
  "weight": 75.2
}
```

**Success Response** (200):
```json
{
  "success": true,
  "message": "Weight entry added successfully",
  "data": {
    "weightEntry": {
      "value": 75.2,
      "date": "2026-03-04T17:00:00.000Z"
    }
  }
}
```

---

## 🔧 Admin Endpoints

### GET /api/admin/dashboard
**Description**: Admin dashboard access

**Headers**: `Authorization: Bearer <access_token>`

**Success Response** (200):
```json
{
  "success": true,
  "message": "Dashboard access granted",
  "data": {
    "userRole": "admin",
    "permissions": "dashboard_access"
  }
}
```

---

### GET /api/admin/users
**Description**: Get all users

**Headers**: `Authorization: Bearer <access_token>`

**Query Parameters**: `page`, `limit`, `role`, `status`

**Success Response** (200):
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "_id": "507f1f77bcf86cd799439011",
        "name": "John Doe",
        "email": "john@example.com",
        "role": "client",
        "status": "approved",
        "isBlocked": false
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 10,
      "totalItems": 100,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

---

### POST /api/admin/users/:userId/block
**Description**: Block a user

**Headers**: `Authorization: Bearer <access_token>`

**Success Response** (200):
```json
{
  "success": true,
  "message": "User blocked successfully",
  "data": {
    "user": {
      "_id": "507f1f77bcf86cd799439011",
      "isBlocked": true,
      "blockedAt": "2026-03-04T17:00:00.000Z"
    }
  }
}
```

---

## 🔍 General Endpoints

### GET /api/health
**Description**: Health check endpoint

**Success Response** (200):
```json
{
  "status": "OK",
  "message": "Fitness Platform API is running",
  "timestamp": "2026-03-04T17:00:00.000Z",
  "environment": "development"
}
```

---

## 🔐 Authentication Details

### Default Admin Accounts
```javascript
// System Administrator
{
  "email": "admin@fitness.com",
  "password": "Admin123!@#",
  "role": "admin"
}

// System Supervisor
{
  "email": "supervisor@fitness.com",
  "password": "Supervisor123!@#",
  "role": "supervisor"
}
```

### Token Structure
**Access Token (JWT)**:
```json
{
  "userId": "507f1f77bcf86cd799439011",
  "iat": 1709547800,
  "exp": 1709548700
}
```

**Refresh Token**: 128-character hex string stored in database

### Token Usage
- **Access Token**: 15 minutes expiry, sent in `Authorization: Bearer <token>` header
- **Refresh Token**: 7 days expiry, used to get new access tokens

---

## 🌍 Environment Variables

```bash
# Server Configuration
NODE_ENV=development
PORT=5000

# Database
MONGO_URI=mongodb://localhost:27017/fitness-platform

# JWT Configuration
JWT_SECRET=mohamedgabalisthebestprogreammeroveralltheworld
JWT_EXPIRE=7d

# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=gabalmohamed33@gmail.com
EMAIL_PASS=mupnxdxc lqvbybtw

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Admin Configuration
ADMIN_KEY=your-super-secret-admin-key-change-this-in-production

# Frontend Configuration
FRONTEND_URL=http://localhost:3000
```

---

## 🚀 Setup Instructions

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (v4.0 or higher)
- npm or yarn

### Installation
```bash
# Clone the repository
git clone <repository-url>
cd fitness-app/backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env
# Edit .env with your configuration
```

### Running the Application
```bash
# Development mode
npm run dev

# Production mode
npm start

# Create admin accounts
npm run seed:admin
```

### Server Information
- **Port**: 5000
- **Base URL**: `http://localhost:5000/api`
- **Database**: `mongodb://localhost:27017/fitness-platform`

---

## 📱 Rate Limiting

### Global Rate Limit
- **Window**: 15 minutes
- **Max Requests**: 100 per IP
- **Applied to**: All `/api/*` routes

### Auth-Specific Limits
- **Registration**: 5 requests per 15 minutes
- **Login**: 10 requests per 15 minutes
- **Refresh**: 20 requests per 15 minutes
- **Email Verification**: 5 requests per 15 minutes

---

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcrypt with salt rounds = 12
- **Rate Limiting**: DDoS protection
- **Input Validation**: Comprehensive request validation
- **CORS Protection**: Cross-origin resource sharing control
- **Helmet**: Security headers
- **MongoDB Sanitization**: NoSQL injection protection

---

## 📊 Error Handling

### Standard Error Response Format
```json
{
  "success": false,
  "error": "Error message",
  "details": "Additional error details (optional)"
}
```

### Common HTTP Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

---

## 📞 Support

For any questions or issues regarding the API, please contact the development team.

**API Version**: 1.0.0
**Last Updated**: March 4, 2026
