# 🔧 Exercise Progress API Documentation - Complete Guide

## 📋 Overview
Exercise Progress API بتتعامل مع تمرين الـ client في الـ workout plans، بيتيح للـ client يتابع progress بتاعه ويعمل mark للـ exercises والـ days كـ complete.

---

## 🛣️ Endpoints

### **1. POST /api/exercise-progress/complete-exercise**
**Description:** Mark a specific exercise as complete
**Access:** Private (Client only)

#### **Request:**
```bash
POST /api/exercise-progress/complete-exercise
Authorization: Bearer <client_access_token>
Content-Type: application/json

{
  "workoutPlanId": "507f1f77bcf86cd799439011",
  "dayIndex": 0,
  "exerciseIndex": 2
}
```

#### **Response:**
```json
{
  "success": true,
  "message": "Exercise marked as complete",
  "data": {
    "exercise": {
      "name": "Push-ups",
      "status": "complete",
      "completedAt": "2024-04-05T10:30:00.000Z"
    },
    "dayStatus": "incomplete",
    "allExercisesComplete": false
  }
}
```

#### **Error Responses:**
```json
// 404 - Workout plan not found
{
  "success": false,
  "error": "Workout plan not found"
}

// 404 - Day not found
{
  "success": false,
  "error": "Day not found"
}

// 404 - Exercise not found
{
  "success": false,
  "error": "Exercise not found"
}

// 400 - Validation failed
{
  "success": false,
  "error": "Validation failed",
  "details": [
    {
      "field": "workoutPlanId",
      "message": "Workout plan ID is required"
    }
  ]
}
```

---

### **2. POST /api/exercise-progress/complete-day**
**Description:** Mark all exercises in a day as complete
**Access:** Private (Client only)

#### **Request:**
```bash
POST /api/exercise-progress/complete-day
Authorization: Bearer <client_access_token>
Content-Type: application/json

{
  "workoutPlanId": "507f1f77bcf86cd799439011",
  "dayIndex": 1
}
```

#### **Response:**
```json
{
  "success": true,
  "message": "Day marked as complete",
  "data": {
    "dayName": "Tuesday",
    "status": "complete",
    "completedAt": "2024-04-05T11:45:00.000Z",
    "exercisesCompleted": 4
  }
}
```

#### **Error Responses:**
```json
// 404 - Workout plan not found
{
  "success": false,
  "error": "Workout plan not found"
}

// 404 - Day not found
{
  "success": false,
  "error": "Day not found"
}

// 400 - Validation failed
{
  "success": false,
  "error": "Validation failed",
  "details": [
    {
      "field": "dayIndex",
      "message": "Day index must be a non-negative integer"
    }
  ]
}
```

---

### **3. GET /api/exercise-progress/:workoutPlanId**
**Description:** Get exercise progress for a workout plan
**Access:** Private (Client only)

#### **Request:**
```bash
GET /api/exercise-progress/507f1f77bcf86cd799439011
Authorization: Bearer <client_access_token>
```

#### **Response:**
```json
{
  "success": true,
  "data": {
    "workoutPlanId": "507f1f77bcf86cd799439011",
    "overallProgress": {
      "totalExercises": 12,
      "completedExercises": 8,
      "totalDays": 4,
      "completedDays": 2,
      "exerciseProgressPercentage": 67,
      "dayProgressPercentage": 50
    },
    "dailyProgress": [
      {
        "dayIndex": 0,
        "dayName": "Monday",
        "dailyPlanName": "Upper Body",
        "status": "complete",
        "completedAt": "2024-04-05T10:30:00.000Z",
        "totalExercises": 3,
        "completedExercises": 3,
        "exercises": [
          {
            "name": "Bench Press",
            "status": "complete",
            "completedAt": "2024-04-05T09:15:00.000Z",
            "sets": 3,
            "reps": 12
          },
          {
            "name": "Incline Dumbbell Press",
            "status": "complete",
            "completedAt": "2024-04-05T09:45:00.000Z",
            "sets": 3,
            "reps": 10
          },
          {
            "name": "Tricep Dips",
            "status": "complete",
            "completedAt": "2024-04-05T10:30:00.000Z",
            "sets": 3,
            "reps": 15
          }
        ]
      },
      {
        "dayIndex": 1,
        "dayName": "Tuesday",
        "dailyPlanName": "Lower Body",
        "status": "incomplete",
        "completedAt": null,
        "totalExercises": 3,
        "completedExercises": 1,
        "exercises": [
          {
            "name": "Squats",
            "status": "complete",
            "completedAt": "2024-04-05T11:00:00.000Z",
            "sets": 4,
            "reps": 12
          },
          {
            "name": "Lunges",
            "status": "incomplete",
            "completedAt": null,
            "sets": 3,
            "reps": 10
          },
          {
            "name": "Calf Raises",
            "status": "incomplete",
            "completedAt": null,
            "sets": 4,
            "reps": 15
          }
        ]
      }
    ]
  }
}
```

#### **Error Responses:**
```json
// 404 - Workout plan not found
{
  "success": false,
  "error": "Workout plan not found"
}

// 400 - Invalid workout plan ID
{
  "success": false,
  "error": "Validation failed",
  "details": [
    {
      "field": "workoutPlanId",
      "message": "Invalid workout plan ID format"
    }
  ]
}
```

---

### **4. POST /api/exercise-progress/reset**
**Description:** Reset exercise progress (for testing/admin)
**Access:** Private (Client only)

#### **Request:**
```bash
POST /api/exercise-progress/reset
Authorization: Bearer <client_access_token>
Content-Type: application/json

{
  "workoutPlanId": "507f1f77bcf86cd799439011"
}
```

#### **Response:**
```json
{
  "success": true,
  "message": "Exercise progress reset successfully",
  "data": {
    "workoutPlanId": "507f1f77bcf86cd799439011",
    "resetAt": "2024-04-05T12:00:00.000Z"
  }
}
```

#### **Error Responses:**
```json
// 404 - Workout plan not found
{
  "success": false,
  "error": "Workout plan not found"
}

// 400 - Validation failed
{
  "success": false,
  "error": "Validation failed",
  "details": [
    {
      "field": "workoutPlanId",
      "message": "Workout plan ID is required"
    }
  ]
}
```

---

## 🔒 Security & Authentication

### **Authentication:**
- All endpoints require `Authorization: Bearer <token>` header
- Token must be valid client access token
- Token is validated using `auth.authenticate` middleware

### **Authorization:**
- All endpoints use `auth.authorize('client')` middleware
- Only users with `client` role can access these endpoints
- Client can only access their own workout plans (validated by `clientId === req.user.userId`)

### **Data Validation:**
- All requests are validated using `express-validator`
- Required fields are checked for presence and format
- Invalid requests return 400 with detailed error messages

---

## 📊 Data Models

### **WorkoutPlan Structure:**
```javascript
{
  _id: "507f1f77bcf86cd799439011",
  clientId: "507f1f77bcf86cd799439012",
  planName: "Weight Loss Plan",
  weeklyPlan: [
    {
      dayName: "Monday",
      dailyPlanName: "Upper Body",
      status: "complete", // "complete" | "incomplete"
      completedAt: "2024-04-05T10:30:00.000Z",
      exercises: [
        {
          name: "Bench Press",
          status: "complete", // "complete" | "incomplete"
          completedAt: "2024-04-05T09:15:00.000Z",
          sets: 3,
          reps: 12
        }
      ]
    }
  ]
}
```

### **ClientProgress Structure:**
```javascript
{
  _id: "507f1f77bcf86cd799439013",
  clientId: "507f1f77bcf86cd799439012",
  workoutPlanId: "507f1f77bcf86cd799439011",
  date: "2024-04-05T10:30:00.000Z",
  exercisesCompleted: 3,
  totalExercises: 3,
  dayName: "Monday",
  notes: "Completed exercise: Bench Press"
}
```

---

## 🎯 Usage Examples

### **Complete Exercise:**
```javascript
// Client completes first exercise of Monday
const response = await fetch('/api/exercise-progress/complete-exercise', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + clientToken,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    workoutPlanId: '507f1f77bcf86cd799439011',
    dayIndex: 0,
    exerciseIndex: 0
  })
});
```

### **Complete Day:**
```javascript
// Client completes all exercises for Monday
const response = await fetch('/api/exercise-progress/complete-day', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + clientToken,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    workoutPlanId: '507f1f77bcf86cd799439011',
    dayIndex: 0
  })
});
```

### **Get Progress:**
```javascript
// Client gets complete progress for workout plan
const response = await fetch('/api/exercise-progress/507f1f77bcf86cd799439011', {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer ' + clientToken
  }
});
```

### **Reset Progress:**
```javascript
// Client resets progress (for testing)
const response = await fetch('/api/exercise-progress/reset', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + clientToken,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    workoutPlanId: '507f1f77bcf86cd799439011'
  })
});
```

---

## 🎉 Summary

**🔥 Exercise Progress API Documentation كاملة!**

- ✅ **4 endpoints**: complete-exercise, complete-day, get progress, reset
- ✅ **Complete request/response examples**: مع الـ validation errors
- ✅ **Security documentation**: authentication و authorization
- ✅ **Data models**: WorkoutPlan و ClientProgress structures
- ✅ **Usage examples**: JavaScript code snippets
- ✅ **Error handling**: كل الـ error cases مغطاة

**النظام دلوقتي متكامل للـ exercise progress tracking! 🚀**
