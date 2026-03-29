# Workout Plan API Documentation

## Table of Contents

1. [Authentication](#authentication)
2. [Workout Plan Management](#workout-plan-management)
3. [Exercise Progress](#exercise-progress)
4. [Error Responses](#error-responses)
5. [Data Models](#data-models)

---

## Authentication

All endpoints require authentication using Bearer token in the Authorization header.

```http
Authorization: Bearer <your_jwt_token>
```

### Required Permissions

- **Doctors**: `manage_client_workout_plans`, `view_client_workout_plans`, `view_client_progress`
- **Clients**: `manage_own_progress`, `view_own_progress`

---

## Workout Plan Management

### 1. Create Workout Plan

**Endpoint:** `POST /api/workout-plans/plans`

**Description:** Creates a new workout plan for a client

**Required Permissions:** `manage_client_workout_plans`

**Request Body:**
```json
{
  "clientId": "60d5f8b4a3b9e2a8c8c8e8f",
  "name": "Advanced Strength Training Program",
  "description": "12-week comprehensive strength building program focusing on progressive overload",
  "notes": "Focus on proper form and progressive overload. Increase weight by 5-10% each week.",
  "startDate": "2024-01-01",
  "endDate": "2024-03-31",
  "difficulty": "advanced",
  "weeklyPlan": [
    {
      "dayName": "Monday",
      "dailyPlanName": "Upper Body Power Day",
      "bodyParts": ["chest", "back", "shoulders"],
      "muscles": ["pectorals", "lats", "deltoids"],
      "exercises": [
        {
          "name": "Bench Press",
          "gifUrl": "https://example.com/exercises/bench-press.gif",
          "equipment": "barbell",
          "instructions": "Lie on bench with feet flat on floor. Lower bar to chest, then press up explosively. Keep back straight and core engaged.",
          "sets": 4,
          "reps": 8,
          "restTime": 120,
          "note": "Focus on explosive movement"
        }
      ]
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Workout plan created successfully",
  "data": {
    "workoutPlan": {
      "_id": "60d5f8b4a3b9e2a8c8c8e8f0",
      "clientId": "60d5f8b4a3b9e2a8c8c8e8f",
      "doctorId": "60d5f8b4a3b9e2a8c8c8e8e0",
      "doctorName": "Dr. John Smith",
      "name": "Advanced Strength Training Program",
      "description": "12-week comprehensive strength building program focusing on progressive overload",
      "notes": "Focus on proper form and progressive overload. Increase weight by 5-10% each week.",
      "startDate": "2024-01-01T00:00:00.000Z",
      "endDate": "2024-03-31T00:00:00.000Z",
      "difficulty": "advanced",
      "durationWeeks": 7,
      "weeklyPlan": [
        {
          "dayName": "Monday",
          "dailyPlanName": "Upper Body Power Day",
          "bodyParts": ["chest", "back", "shoulders"],
          "muscles": ["pectorals", "lats", "deltoids"],
          "exercises": [
            {
              "name": "Bench Press",
              "gifUrl": "https://example.com/exercises/bench-press.gif",
              "equipment": "barbell",
              "instructions": "Lie on bench with feet flat on floor. Lower bar to chest, then press up explosively. Keep back straight and core engaged.",
              "sets": 4,
              "reps": 8,
              "restTime": 120,
              "note": "Focus on explosive movement",
              "status": "incomplete",
              "completedAt": null
            }
          ],
          "status": "incomplete",
          "completedAt": null
        }
      ],
      "isActive": true,
      "createdAt": "2024-01-01T10:00:00.000Z",
      "updatedAt": "2024-01-01T10:00:00.000Z"
    }
  }
}
```

---

### 2. Update Workout Plan

**Endpoint:** `PUT /api/workout-plans/plans/:planId`

**Description:** Updates an existing workout plan

**Required Permissions:** `manage_client_workout_plans`

**Request Body:**
```json
{
  "planId": "60d5f8b4a3b9e2a8c8c8e8f0",
  "name": "Updated Advanced Strength Training Program",
  "description": "Updated description with new focus areas",
  "notes": "Updated notes: Focus on proper form and progressive overload",
  "startDate": "2024-01-01",
  "endDate": "2024-04-30",
  "difficulty": "advanced",
  "weeklyPlan": [
    {
      "dayName": "Monday",
      "dailyPlanName": "Updated Upper Body Power Day",
      "bodyParts": ["chest", "back", "shoulders", "arms"],
      "muscles": ["pectorals", "lats", "deltoids", "biceps", "triceps"],
      "exercises": [
        {
          "name": "Bench Press",
          "gifUrl": "https://example.com/exercises/bench-press.gif",
          "equipment": "barbell",
          "instructions": "Lie on bench with feet flat on floor. Lower bar to chest, then press up explosively.",
          "sets": 5,
          "reps": 8,
          "restTime": 120,
          "note": "Updated: Focus on explosive movement"
        },
        {
          "name": "Bicep Curls",
          "gifUrl": "https://example.com/exercises/bicep-curls.gif",
          "equipment": "dumbbells",
          "instructions": "Stand with dumbbells. Curl weights up, keeping elbows at sides.",
          "sets": 3,
          "reps": 15,
          "restTime": 45,
          "note": "New exercise added"
        }
      ]
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Workout plan updated successfully",
  "data": {
    "workoutPlan": {
      "_id": "60d5f8b4a3b9e2a8c8c8e8f0",
      "name": "Updated Advanced Strength Training Program",
      "description": "Updated description with new focus areas",
      "notes": "Updated notes: Focus on proper form and progressive overload",
      "startDate": "2024-01-01T00:00:00.000Z",
      "endDate": "2024-04-30T00:00:00.000Z",
      "difficulty": "advanced",
      "durationWeeks": 7,
      "weeklyPlan": [
        {
          "dayName": "Monday",
          "dailyPlanName": "Updated Upper Body Power Day",
          "bodyParts": ["chest", "back", "shoulders", "arms"],
          "muscles": ["pectorals", "lats", "deltoids", "biceps", "triceps"],
          "exercises": [
            {
              "name": "Bench Press",
              "status": "incomplete",
              "completedAt": null
            },
            {
              "name": "Bicep Curls",
              "status": "incomplete",
              "completedAt": null
            }
          ],
          "status": "incomplete",
          "completedAt": null
        }
      ],
      "updatedAt": "2024-01-01T12:00:00.000Z"
    }
  }
}
```

---

### 3. Get Workout Plan by ID

**Endpoint:** `GET /api/workout-plans/plans/:planId`

**Description:** Retrieves a specific workout plan by ID

**Required Permissions:** `view_client_workout_plans`

**URL Parameters:**
- `planId` (string): Workout plan ID

**Response:**
```json
{
  "success": true,
  "data": {
    "workoutPlan": {
      "_id": "60d5f8b4a3b9e2a8c8c8e8f0",
      "clientId": "60d5f8b4a3b9e2a8c8c8e8f",
      "doctorId": "60d5f8b4a3b9e2a8c8c8e8e0",
      "doctorName": "Dr. John Smith",
      "name": "Advanced Strength Training Program",
      "description": "12-week comprehensive strength building program",
      "weeklyPlan": [...],
      "isActive": true,
      "createdAt": "2024-01-01T10:00:00.000Z",
      "updatedAt": "2024-01-01T10:00:00.000Z"
    }
  }
}
```

---

### 4. Get Client Workout Plans

**Endpoint:** `GET /api/workout-plans/plans/client/:clientId`

**Description:** Retrieves all workout plans for a specific client

**Required Permissions:** `view_client_workout_plans`

**URL Parameters:**
- `clientId` (string): Client ID

**Response:**
```json
{
  "success": true,
  "data": {
    "workoutPlans": [
      {
        "_id": "60d5f8b4a3b9e2a8c8c8e8f0",
        "name": "Advanced Strength Training Program",
        "clientId": "60d5f8b4a3b9e2a8c8c8e8f",
        "doctorName": "Dr. John Smith",
        "isActive": true,
        "createdAt": "2024-01-01T10:00:00.000Z"
      }
    ],
    "total": 1
  }
}
```

---

### 5. Get Active Workout Plan

**Endpoint:** `GET /api/workout-plans/plans/client/:clientId/active`

**Description:** Retrieves the currently active workout plan for a client

**Required Permissions:** `view_client_workout_plans`

**URL Parameters:**
- `clientId` (string): Client ID

**Response:**
```json
{
  "success": true,
  "data": {
    "workoutPlan": {
      "_id": "60d5f8b4a3b9e2a8c8c8e8f0",
      "name": "Advanced Strength Training Program",
      "weeklyPlan": [...],
      "isActive": true
    }
  }
}
```

---

### 6. Get Client Workout History

**Endpoint:** `GET /api/workout-plans/plans/client/:clientId/history`

**Description:** Retrieves workout plan history for a client

**Required Permissions:** `view_client_workout_plans`

**URL Parameters:**
- `clientId` (string): Client ID

**Response:**
```json
{
  "success": true,
  "data": {
    "workoutPlans": [
      {
        "_id": "60d5f8b4a3b9e2a8c8c8e8f0",
        "name": "Previous Program",
        "isActive": false,
        "completedAt": "2024-01-01T00:00:00.000Z"
      }
    ]
  }
}
```

---

### 7. Reuse Workout Plan

**Endpoint:** `POST /api/workout-plans/plans/reuse`

**Description:** Creates a new workout plan by copying an existing one

**Required Permissions:** `manage_client_workout_plans`

**Request Body:**
```json
{
  "clientId": "60d5f8b4a3b9e2a8c8c8e8f",
  "originalPlanId": "60d5f8b4a3b9e2a8c8c8e8f0",
  "newStartDate": "2024-02-01",
  "newEndDate": "2024-04-30"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Workout plan reused successfully",
  "data": {
    "newPlan": {
      "_id": "60d5f8b4a3b9e2a8c8c8e8f1",
      "clientId": "60d5f8b4a3b9e2a8c8c8e8f",
      "doctorId": "60d5f8b4a3b9e2a8c8c8e8e0",
      "doctorName": "Dr. John Smith",
      "name": "Advanced Strength Training Program",
      "clonedFrom": "60d5f8b4a3b9e2a8c8c8e8f0",
      "isActive": true
    }
  }
}
```

---

### 8. Deactivate Workout Plan

**Endpoint:** `PUT /api/workout-plans/plans/:planId/deactivate`

**Description:** Deactivates a workout plan

**Required Permissions:** `manage_client_workout_plans`

**URL Parameters:**
- `planId` (string): Workout plan ID

**Response:**
```json
{
  "success": true,
  "message": "Workout plan deactivated successfully",
  "data": {
    "workoutPlan": {
      "_id": "60d5f8b4a3b9e2a8c8c8e8f0",
      "isActive": false,
      "deactivatedAt": "2024-01-01T12:00:00.000Z"
    }
  }
}
```

---

### 9. Delete Workout Plan

**Endpoint:** `DELETE /api/workout-plans/plans/:planId`

**Description:** Permanently deletes a workout plan

**Required Permissions:** `manage_client_workout_plans`

**URL Parameters:**
- `planId` (string): Workout plan ID

**Response:**
```json
{
  "success": true,
  "message": "Workout plan deleted successfully"
}
```

---

## Exercise Progress

### 1. Mark Exercise Complete

**Endpoint:** `POST /api/exercise-progress/complete-exercise`

**Description:** Marks a specific exercise as complete

**Required Permissions:** `manage_own_progress`

**Request Body:**
```json
{
  "workoutPlanId": "60d5f8b4a3b9e2a8c8c8e8f0",
  "dayIndex": 0,
  "exerciseIndex": 1
}
```

**Response:**
```json
{
  "success": true,
  "message": "Exercise marked as complete",
  "data": {
    "exercise": {
      "name": "Bench Press",
      "status": "complete",
      "completedAt": "2024-01-01T12:00:00.000Z"
    },
    "dayStatus": "incomplete",
    "allExercisesComplete": false
  }
}
```

---

### 2. Mark Day Complete

**Endpoint:** `POST /api/exercise-progress/complete-day`

**Description:** Marks all exercises in a day as complete

**Required Permissions:** `manage_own_progress`

**Request Body:**
```json
{
  "workoutPlanId": "60d5f8b4a3b9e2a8c8c8e8f0",
  "dayIndex": 0
}
```

**Response:**
```json
{
  "success": true,
  "message": "Day marked as complete",
  "data": {
    "dayName": "Monday",
    "status": "complete",
    "completedAt": "2024-01-01T12:00:00.000Z",
    "exercisesCompleted": 3
  }
}
```

---

### 3. Get Exercise Progress

**Endpoint:** `GET /api/exercise-progress/:workoutPlanId`

**Description:** Retrieves exercise progress for a workout plan

**Required Permissions:** `view_own_progress`

**URL Parameters:**
- `workoutPlanId` (string): Workout plan ID

**Response:**
```json
{
  "success": true,
  "data": {
    "workoutPlanId": "60d5f8b4a3b9e2a8c8c8e8f0",
    "overallProgress": {
      "totalExercises": 21,
      "completedExercises": 5,
      "totalDays": 7,
      "completedDays": 1,
      "exerciseProgressPercentage": 24,
      "dayProgressPercentage": 14
    },
    "dailyProgress": [
      {
        "dayIndex": 0,
        "dayName": "Monday",
        "dailyPlanName": "Upper Body Power Day",
        "status": "complete",
        "completedAt": "2024-01-01T12:00:00.000Z",
        "totalExercises": 3,
        "completedExercises": 3,
        "exercises": [
          {
            "name": "Bench Press",
            "status": "complete",
            "completedAt": "2024-01-01T10:00:00.000Z",
            "sets": 4,
            "reps": 8
          }
        ]
      }
    ]
  }
}
```

---

### 4. Reset Exercise Progress

**Endpoint:** `POST /api/exercise-progress/reset`

**Description:** Resets all exercise progress (for testing/admin purposes)

**Required Permissions:** `manage_own_progress`

**Request Body:**
```json
{
  "workoutPlanId": "60d5f8b4a3b9e2a8c8c8e8f0"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Exercise progress reset successfully",
  "data": {
    "workoutPlanId": "60d5f8b4a3b9e2a8c8c8e8f0",
    "resetAt": "2024-01-01T12:00:00.000Z"
  }
}
```

---

## Error Responses

### Validation Errors (400)
```json
{
  "success": false,
  "error": "Validation failed",
  "details": [
    {
      "field": "clientId",
      "message": "Client ID is required"
    },
    {
      "field": "weeklyPlan",
      "message": "Weekly plan must be an array with at least one day"
    }
  ]
}
```

### Authentication Errors (401)
```json
{
  "success": false,
  "error": "Authentication failed"
}
```

### Authorization Errors (403)
```json
{
  "success": false,
  "error": "Insufficient permissions"
}
```

### Not Found Errors (404)
```json
{
  "success": false,
  "error": "Workout plan not found"
}
```

### Server Errors (500)
```json
{
  "success": false,
  "error": "Internal server error"
}
```

---

## Data Models

### Workout Plan Structure
```json
{
  "_id": "string",
  "clientId": "string",
  "doctorId": "string",
  "doctorName": "string",
  "name": "string",
  "description": "string",
  "notes": "string",
  "startDate": "ISO 8601 date",
  "endDate": "ISO 8601 date",
  "difficulty": "beginner|intermediate|advanced",
  "durationWeeks": 7,
  "weeklyPlan": [
    {
      "dayName": "Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday",
      "dailyPlanName": "string",
      "bodyParts": ["chest|back|shoulders|biceps|triceps|legs|glutes|abs|calves|forearms|core|lower_back|traps|hamstrings|quads|adductors|abductors"],
      "muscles": ["pectorals|lats|rhomboids|traps|deltoids|biceps|triceps|forearms|quads|hamstrings|glutes|calves|abs|obliques|erector_spinae"],
      "exercises": [
        {
          "name": "string",
          "gifUrl": "string",
          "equipment": "dumbbells|barbell|machine|cable|bodyweight|resistance_bands|kettlebell|medicine_ball|foam_roller|none",
          "instructions": "string",
          "sets": "number (1-10)",
          "reps": "number (1-100)",
          "restTime": "number (0-600 seconds)",
          "note": "string (optional)",
          "status": "incomplete|complete",
          "completedAt": "ISO 8601 date|null"
        }
      ],
      "status": "incomplete|complete",
      "completedAt": "ISO 8601 date|null"
    }
  ],
  "isActive": true,
  "createdAt": "ISO 8601 date",
  "updatedAt": "ISO 8601 date"
}
```

### Exercise Status Values
- `incomplete`: Exercise not yet completed
- `complete`: Exercise has been completed

### Day Status Values
- `incomplete`: Day has incomplete exercises
- `complete`: All exercises in the day are complete

### Equipment Options
- `dumbbells`
- `barbell`
- `machine`
- `cable`
- `bodyweight`
- `resistance_bands`
- `kettlebell`
- `medicine_ball`
- `foam_roller`
- `none`

### Difficulty Levels
- `beginner`
- `intermediate`
- `advanced`

---

## Quick Reference

### Common Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request (Validation Error)
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

### Common Headers
```http
Content-Type: application/json
Authorization: Bearer <token>
```

### Base URL
```
https://fit-proo.vercel.app/api
```

---

*Last Updated: March 29, 2024*
