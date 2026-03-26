# Workout Plan API Endpoints

## Authentication Required
All endpoints require JWT authentication: `Authorization: Bearer <token>`

## DOCTOR ENDPOINTS

### Create Workout Plan
```http
POST /api/workout-plans/plans
Content-Type: application/json

{
  "clientId": "string",
  "name": "string (3-100 chars)",
  "description": "string (optional, max 500 chars)",
  "startDate": "YYYY-MM-DD",
  "endDate": "YYYY-MM-DD",
  "difficulty": "beginner|intermediate|advanced",
  "durationWeeks": "number (1-52)",
  "exercises": [
    {
      "name": "string",
      "muscle": "chest|back|shoulders|biceps|triceps|legs|glutes|abs|calves|forearms",
      "image": "string (optional)",
      "sets": "number (min 1)",
      "reps": "number (min 1)",
      "rest": "number (seconds, min 0)",
      "notes": "string (optional, max 200 chars)"
    }
  ]
}
```

### Update Workout Plan
```http
PUT /api/workout-plans/plans/:planId
Content-Type: application/json

{
  "name": "string (optional, 3-100 chars)",
  "description": "string (optional, max 500 chars)",
  "startDate": "YYYY-MM-DD (optional)",
  "endDate": "YYYY-MM-DD (optional)",
  "difficulty": "beginner|intermediate|advanced (optional)",
  "durationWeeks": "number (optional, 1-52)",
  "exercises": "array (optional)"
}
```

### Get Client's Workout Plans
```http
GET /api/workout-plans/plans/client/:clientId
```

### Get Client's Active Workout Plan
```http
GET /api/workout-plans/plans/client/:clientId/active
```

### Get Client's Workout Plan History
```http
GET /api/workout-plans/plans/client/:clientId/history
```

### Reuse Workout Plan
```http
POST /api/workout-plans/plans/reuse
Content-Type: application/json

{
  "clientId": "string",
  "originalPlanId": "string",
  "newStartDate": "YYYY-MM-DD",
  "newEndDate": "YYYY-MM-DD"
}
```

### Deactivate Workout Plan
```http
PUT /api/workout-plans/plans/:planId/deactivate
```

### Delete Workout Plan
```http
DELETE /api/workout-plans/plans/:planId
```

## CLIENT PROGRESS ENDPOINTS

### Complete Exercise
```http
POST /api/workout-plans/progress/exercise
Content-Type: application/json

{
  "workoutPlanId": "string",
  "exerciseId": "string",
  "exerciseName": "string (1-100 chars)",
  "notes": "string (optional, max 200 chars)"
}
```

### Complete Day
```http
POST /api/workout-plans/progress/day
Content-Type: application/json

{
  "workoutPlanId": "string",
  "date": "YYYY-MM-DD",
  "notes": "string (optional, max 200 chars)"
}
```

### Get Progress for Workout Plan
```http
GET /api/workout-plans/progress/:workoutPlanId
```

### Get All Client Progress (Doctor View)
```http
GET /api/workout-plans/progress/client/:clientId
```

### Update Progress Status
```http
PUT /api/workout-plans/progress/:workoutPlanId/status
Content-Type: application/json

{
  "status": "in_progress|completed|paused"
}
```

## PERMISSIONS

### Doctor Permissions
- `manage_client_workout_plans` - Create, update, delete workout plans
- `view_client_workout_plans` - View client workout plans
- `view_client_progress` - View client progress

### Client Permissions
- `manage_own_progress` - Complete exercises, complete days, update status
- `view_own_progress` - View own progress

### Admin/Supervisor Permissions
- All permissions (full access)

## RESPONSE FORMAT

### Success Response
```json
{
  "success": true,
  "message": "Operation completed",
  "data": { ... }
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message",
  "details": [
    {
      "field": "field_name",
      "message": "Validation error"
    }
  ]
}
```

## AUTOMATED CLEANUP

### Deactivate Expired Plans
```bash
npm run cleanup:workout-plans
```

This will automatically deactivate all workout plans that have passed their end date while still marked as active.
