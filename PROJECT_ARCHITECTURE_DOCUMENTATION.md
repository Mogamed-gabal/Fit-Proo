# Fitness Platform - Project Architecture Documentation

## Overview
This document provides a comprehensive overview of the fitness platform's architecture, structure, and development patterns.

## Technology Stack

### Backend
- **Framework**: Node.js with Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **File Storage**: Cloudinary
- **Environment**: Environment variables configuration

### Frontend
- **Framework**: Angular 19
- **Language**: TypeScript
- **Styling**: SCSS
- **HTTP Client**: Angular HttpClient
- **Routing**: Angular Router

---

## Project Structure

### Backend Directory Structure
```
backend/
├── src/
│   ├── controllers/           # Business logic handlers
│   │   ├── adminController.js
│   │   ├── authController.js
│   │   ├── dietPlanController.js
│   │   ├── dietProgressController.js
│   │   ├── doctorController.js
│   │   └── userController.js
│   ├── middleware/           # Custom middleware functions
│   │   ├── auth.js
│   │   ├── auditMiddleware.js
│   │   └── permissionMiddleware.js
│   ├── models/              # Mongoose schemas
│   │   ├── User.js
│   │   ├── DietPlan.js
│   │   ├── DietProgress.js
│   │   └── Notification.js
│   ├── routes/               # API route definitions
│   │   ├── admin.js
│   │   ├── auth.js
│   │   ├── dietPlans.js
│   │   ├── dietProgress.js
│   │   ├── doctors.js
│   │   └── users.js
│   └── utils/                # Utility functions
│       ├── transactionHelper.js
│       └── emailService.js
├── scripts/                  # Database seeding scripts
│   └── seedAdmin.js
├── server.js                 # Express server entry point
├── package.json
└── .env                     # Environment variables
```

### Frontend Directory Structure
```
frontend/src/app/
├── core/                    # Shared services and models
│   ├── services/
│   │   ├── auth.service.ts
│   │   ├── blocked.service.ts
│   │   └── doctor.service.ts
│   ├── models/
│   │   ├── user.model.ts
│   │   └── blocked-user.model.ts
│   └── interceptors/          # HTTP interceptors
├── features/                 # Feature-based modules
│   ├── auth/
│   ├── blocked-users/
│   │   ├── components/
│   │   │   ├── blocked-table/
│   │   │   ├── blocked-filter/
│   │   │   └── blocked-modal/
│   │   ├── blocked-users.component.ts
│   │   ├── blocked-users.component.html
│   │   └── blocked-users.component.scss
│   ├── diet-plans/
│   ├── exercises/
│   └── users/
├── shared/                   # Shared components
├── environments/              # Environment configurations
└── app-routing.module.ts      # App routing configuration
```

---

## API Architecture

### Base URLs
- **Backend API**: `http://localhost:5000/api`
- **Frontend**: `http://localhost:4200` (Development)
- **Production**: `https://fit-front-three.vercel.app`

### API Modules

#### 1. Authentication Module (`/api/auth`)
- **POST** `/login` - User authentication
- **POST** `/register` - User registration
- **GET** `/me` - Get current user profile
- **POST** `/admin/approve/:userId` - Approve doctor
- **POST** `/admin/reject/:userId` - Reject doctor

#### 2. Admin Module (`/api/admin`)
- **GET** `/dashboard` - Admin dashboard
- **GET** `/users` - Get all users
- **GET** `/users/:userId` - Get user by ID
- **POST** `/users/:userId/block` - Block user
- **POST** `/users/:userId/unblock` - Unblock user
- **DELETE** `/users/:userId` - Soft delete user
- **POST** `/supervisors` - Create supervisor
- **DELETE** `/supervisors/:userId` - Delete supervisor
- **GET** `/supervisors` - Get all supervisors
- **GET** `/blocked-users` - Get blocked users

#### 3. Doctors Module (`/api/doctors`)
- **GET** `/` - Get all doctors
- **GET** `/:doctorId` - Get doctor by ID
- **GET** `/specialization/:specialization` - Get doctors by specialization
- **PATCH** `/:doctorId/approve` - Approve doctor
- **PATCH** `/:doctorId/reject` - Reject doctor
- **PATCH** `/:doctorId/restore` - Restore soft-deleted doctor
- **GET** `/stats` - Get doctor statistics

#### 4. Diet Plans Module (`/api/diet-plans`)
- **POST** `/` - Create diet plan
- **GET** `/` - Get all diet plans
- **GET** `/:id` - Get diet plan by ID
- **PUT** `/:id` - Update diet plan
- **DELETE** `/:id` - Delete diet plan
- **GET** `/client/:clientId` - Get client diet plans
- **GET** `/active/:clientId` - Get active diet plan

#### 5. Diet Progress Module (`/api/progress`)
- **POST** `/food` - Mark food as eaten
- **GET** `/:dietPlanId/day/:dayName` - Get daily progress
- **GET** `/client/:clientId` - Get client progress
- **GET** `/:dietPlanId/nutrition` - Get nutrition tracking

#### 6. Users Module (`/api/users`)
- **GET** `/` - Get all users (client role)
- **GET** `/:userId` - Get user by ID
- **PUT** `/:userId` - Update user
- **DELETE** `/:userId` - Delete user
- **GET** `/stats` - Get user statistics

---

## Database Schema

### User Model
```javascript
{
  _id: ObjectId,
  name: String,
  email: String,
  password: String, // Hashed
  role: String, // client, doctor, admin, supervisor
  specialization: String, // For doctors
  status: String, // pending, approved, rejected
  isBlocked: Boolean,
  blockedAt: Date,
  blockedBy: ObjectId,
  blockReason: String,
  isDeleted: Boolean,
  deletedAt: Date,
  deletedBy: ObjectId,
  certificates: [{
    filename: String,
    originalName: String,
    mimetype: String,
    size: Number,
    secure_url: String,
    public_id: String
  }],
  profilePicture: {
    filename: String,
    originalName: String,
    mimetype: String,
    size: Number,
    secure_url: String,
    public_id: String
  },
  // ... other fields
}
```

### Diet Plan Model
```javascript
{
  _id: ObjectId,
  name: String,
  description: String,
  clientId: ObjectId,
  doctorId: ObjectId,
  weeklyPlan: [{
    dayName: String,
    meals: [{
      type: String, // breakfast, lunch, dinner, snack
      food: [{
        name: String,
        nutrition: {
          calories: Number,
          protein: Number,
          carbs: Number,
          fat: Number
        },
        image: String,
        recipe: String
      }],
      totalCalories: Number
    }]
  }],
  startDate: Date,
  endDate: Date,
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

---

## Security Architecture

### Authentication Flow
1. **Login**: User credentials → JWT token
2. **Token Storage**: Client stores JWT in localStorage
3. **API Requests**: Bearer token in Authorization header
4. **Token Validation**: Middleware verifies token on protected routes
5. **Permission Check**: Role-based access control

### Permission System
```javascript
// Permission Levels
const permissions = {
  // Admin permissions
  'read_dashboard': ['admin'],
  'read_users': ['admin', 'supervisor'],
  'block_client': ['admin'],
  'unblock_client': ['admin'],
  'delete_user': ['admin'],
  'manage_supervisors': ['admin'],
  'read_supervisors': ['admin', 'supervisor'],
  
  // Doctor permissions
  'manage_client_workout_plans': ['admin', 'doctor'],
  'view_client_workout_plans': ['admin', 'doctor', 'client'],
  
  // Client permissions
  'view_own_profile': ['admin', 'doctor', 'client', 'supervisor']
};
```

### Security Features
- **Password Hashing**: bcrypt for secure password storage
- **JWT Tokens**: Secure authentication with expiration
- **Role-Based Access**: Permission middleware for route protection
- **CORS Configuration**: Proper cross-origin resource sharing
- **Input Validation**: express-validator for request sanitization
- **Audit Trail**: Track who performed actions (blockedBy, deletedBy)
- **Soft Delete**: Preserve data while marking as deleted

---

## Development Patterns

### Backend Patterns
- **MVC Architecture**: Models, Views (Controllers), Routes
- **Middleware Chain**: Authentication → Permission → Validation → Controller
- **Error Handling**: Centralized error handling middleware
- **Database Transactions**: ACID compliance for complex operations
- **Environment Configuration**: Separate dev/prod configurations

### Frontend Patterns
- **Feature-Based Modules**: Organized by business features
- **Component Composition**: Reusable components with @Input/@Output
- **Service Layer**: Separated API calls from components
- **Observable Pattern**: RxJS for asynchronous operations
- **TypeScript**: Strong typing throughout application

---

## CORS Configuration

### Development
```javascript
const corsOptions = {
  origin: [
    'http://localhost:4200',
    'http://localhost:3000',
    'http://localhost:5500'
  ],
  credentials: true
};
```

### Production
```javascript
const corsOptions = {
  origin: [
    'https://fit-front-three.vercel.app'
  ],
  credentials: true
};
```

---

## Environment Variables

### Backend (.env)
```
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/fitness-platform
JWT_SECRET=your-jwt-secret
JWT_EXPIRE=7d
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
FRONTEND_URL=http://localhost:4200
```

---

## API Response Format

### Success Response
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": {
    // Response data
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message",
  "details": [
    {
      "field": "email",
      "message": "Email is required"
    }
  ]
}
```

---

## Development Workflow

### 1. Backend Development
```bash
cd backend
npm install
npm run dev
```

### 2. Frontend Development
```bash
cd frontend
npm install
ng serve
```

### 3. Database Setup
```bash
# Start MongoDB
mongod

# Seed admin users
node scripts/seedAdmin.js
```

---

## Deployment

### Backend Deployment
- **Platform**: Vercel/Heroku/AWS
- **Environment**: Production environment variables
- **Database**: MongoDB Atlas for production
- **File Storage**: Cloudinary for media files

### Frontend Deployment
- **Platform**: Vercel
- **Build**: `ng build`
- **Environment**: Production configuration
- **Domain**: https://fit-front-three.vercel.app

---

## Testing Strategy

### Backend Testing
- **Unit Tests**: Jest for controllers and services
- **Integration Tests**: Supertest for API endpoints
- **Database Tests**: MongoDB memory server

### Frontend Testing
- **Unit Tests**: Jasmine/Karma for components
- **Integration Tests**: Angular testing utilities
- **E2E Tests**: Cypress for user flows

---

## Monitoring and Logging

### Backend Monitoring
- **Request Logging**: Morgan for HTTP requests
- **Error Logging**: Winston for error tracking
- **Performance Monitoring**: Response time tracking
- **Database Monitoring**: Query performance metrics

### Frontend Monitoring
- **Error Tracking**: Global error handler
- **Performance**: Angular DevTools integration
- **User Analytics**: Custom analytics service

---

## Scalability Considerations

### Backend Scaling
- **Database Indexing**: Optimized query performance
- **Caching**: Redis for frequently accessed data
- **Load Balancing**: Multiple server instances
- **API Rate Limiting**: Prevent abuse

### Frontend Scaling
- **Lazy Loading**: Code splitting for performance
- **State Management**: Efficient data flow
- **Image Optimization**: WebP format for images
- **CDN Integration**: Cloudinary for media delivery

---

## Future Enhancements

### Planned Features
- **Real-time Notifications**: WebSocket integration
- **Advanced Analytics**: Power BI integration
- **Mobile App**: React Native development
- **AI Recommendations**: Machine learning for diet plans
- **Video Consultations**: WebRTC for doctor calls

### Technical Improvements
- **Microservices**: Service decomposition
- **GraphQL**: API query optimization
- **Docker**: Containerization
- **CI/CD Pipeline**: Automated deployment

---

*Last Updated: April 2024*
