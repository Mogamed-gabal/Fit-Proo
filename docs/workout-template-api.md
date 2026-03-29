# Workout Template API Documentation

## Table of Contents

1. [Authentication](#authentication)
2. [Workout Template Management](#workout-template-management)
3. [Template Assignment](#template-assignment)
4. [Error Responses](#error-responses)
5. [Data Models](#data-models)

---

## Authentication

All endpoints require authentication using Bearer token in the Authorization header.

```http
Authorization: Bearer <your_jwt_token>
```

### Required Permissions

- **Doctors**: `manage_client_workout_plans`, `view_client_workout_plans`
- **Clients**: `view_client_workout_plans` (for viewing public templates)

---

## Workout Template Management

### 1. Create Workout Template

**Endpoint:** `POST /api/workout-templates/templates`

**Description:** Creates a new workout template that can be reused for multiple clients

**Required Permissions:** `manage_client_workout_plans` (Doctor only)

**Request Body:**
```json
{
  "name": "Advanced Strength Training Template",
  "description": "12-week comprehensive strength building template focusing on progressive overload",
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
        },
        {
          "name": "Pull-ups",
          "gifUrl": "https://example.com/exercises/pull-ups.gif",
          "equipment": "bodyweight",
          "instructions": "Hang from bar with overhand grip. Pull body up until chin clears bar. Lower slowly.",
          "sets": 3,
          "reps": 12,
          "restTime": 90,
          "note": "Add weight when comfortable"
        },
        {
          "name": "Shoulder Press",
          "gifUrl": "https://example.com/exercises/shoulder-press.gif",
          "equipment": "dumbbells",
          "instructions": "Sit with back straight. Press dumbbells overhead until arms fully extended. Lower slowly.",
          "sets": 3,
          "reps": 10,
          "restTime": 60,
          "note": "Keep core tight"
        }
      ]
    },
    {
      "dayName": "Tuesday",
      "dailyPlanName": "Lower Body Strength",
      "bodyParts": ["legs", "glutes"],
      "muscles": ["quads", "hamstrings", "glutes"],
      "exercises": [
        {
          "name": "Squats",
          "gifUrl": "https://example.com/exercises/squats.gif",
          "equipment": "barbell",
          "instructions": "Stand with bar on shoulders. Squat down until thighs parallel to floor. Keep back straight.",
          "sets": 4,
          "reps": 10,
          "restTime": 180,
          "note": "Focus on depth and form"
        },
        {
          "name": "Romanian Deadlifts",
          "gifUrl": "https://example.com/exercises/romanian-deadlifts.gif",
          "equipment": "barbell",
          "instructions": "Stand with bar at thighs. Hinge at hips, lower bar keeping legs straight. Squeeze glutes to return.",
          "sets": 3,
          "reps": 12,
          "restTime": 120,
          "note": "Feel stretch in hamstrings"
        }
      ]
    }
  ],
  "isPublic": false
}
```

**Response:**
```json
{
  "success": true,
  "message": "Workout template created successfully",
  "data": {
    "template": {
      "_id": "60d5f8b4a3b9e2a8c8c8e8f0",
      "doctorId": "60d5f8b4a3b9e2a8c8c8e8e0",
      "doctorName": "Dr. John Smith",
      "name": "Advanced Strength Training Template",
      "description": "12-week comprehensive strength building template focusing on progressive overload",
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
              "note": "Focus on explosive movement"
            }
          ]
        }
      ],
      "isPublic": false,
      "usageCount": 0,
      "tags": [],
      "createdAt": "2024-01-01T10:00:00.000Z",
      "updatedAt": "2024-01-01T10:00:00.000Z"
    }
  }
}
```

---

### 2. Update Workout Template

**Endpoint:** `PUT /api/workout-templates/templates/:templateId`

**Description:** Updates an existing workout template

**Required Permissions:** `manage_client_workout_plans` (Doctor only)

**Request Body:**
```json
{
  "templateId": "60d5f8b4a3b9e2a8c8c8e8f0",
  "name": "Updated Advanced Strength Training Template",
  "description": "Updated description with new focus areas",
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
  ],
  "isPublic": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Workout template updated successfully",
  "data": {
    "template": {
      "_id": "60d5f8b4a3b9e2a8c8c8e8f0",
      "name": "Updated Advanced Strength Training Template",
      "description": "Updated description with new focus areas",
      "difficulty": "advanced",
      "durationWeeks": 7,
      "weeklyPlan": [...],
      "isPublic": true,
      "updatedAt": "2024-01-01T12:00:00.000Z"
    }
  }
}
```

---

### 3. Get Template by ID

**Endpoint:** `GET /api/workout-templates/templates/:templateId`

**Description:** Retrieves a specific workout template by ID

**Required Permissions:** `manage_client_workout_plans` (Doctor) or `view_client_workout_plans` (Client for public templates)

**URL Parameters:**
- `templateId` (string): Template ID

**Response:**
```json
{
  "success": true,
  "data": {
    "template": {
      "_id": "60d5f8b4a3b9e2a8c8c8e8f0",
      "doctorId": "60d5f8b4a3b9e2a8c8c8e8e0",
      "doctorName": "Dr. John Smith",
      "name": "Advanced Strength Training Template",
      "description": "12-week comprehensive strength building template",
      "difficulty": "advanced",
      "durationWeeks": 7,
      "weeklyPlan": [...],
      "isPublic": false,
      "usageCount": 5,
      "tags": ["strength", "advanced"],
      "createdAt": "2024-01-01T10:00:00.000Z",
      "updatedAt": "2024-01-01T10:00:00.000Z"
    }
  }
}
```

---

### 4. Get Doctor Templates

**Endpoint:** `GET /api/workout-templates/templates`

**Description:** Retrieves all templates for the authenticated doctor with pagination and search

**Required Permissions:** `manage_client_workout_plans` (Doctor only)

**Query Parameters:**
- `page` (number, optional): Page number (default: 1)
- `limit` (number, optional): Items per page (default: 10, max: 50)
- `search` (string, optional): Search term for name/description

**Response:**
```json
{
  "success": true,
  "data": {
    "templates": [
      {
        "_id": "60d5f8b4a3b9e2a8c8c8e8f0",
        "name": "Advanced Strength Training Template",
        "description": "12-week comprehensive strength building template",
        "difficulty": "advanced",
        "isPublic": false,
        "usageCount": 5,
        "createdAt": "2024-01-01T10:00:00.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 3,
      "totalTemplates": 25,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

---

### 5. Get Public Templates

**Endpoint:** `GET /api/workout-templates/public`

**Description:** Retrieves all public templates available for use

**Required Permissions:** `view_client_workout_plans`

**Query Parameters:**
- `page` (number, optional): Page number (default: 1)
- `limit` (number, optional): Items per page (default: 10, max: 50)
- `search` (string, optional): Search term
- `difficulty` (string, optional): Filter by difficulty (beginner, intermediate, advanced)

**Response:**
```json
{
  "success": true,
  "data": {
    "templates": [
      {
        "_id": "60d5f8b4a3b9e2a8c8c8e8f0",
        "doctorName": "Dr. John Smith",
        "name": "Advanced Strength Training Template",
        "description": "12-week comprehensive strength building template",
        "difficulty": "advanced",
        "usageCount": 25,
        "tags": ["strength", "advanced"],
        "createdAt": "2024-01-01T10:00:00.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalTemplates": 48,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

---

### 6. Delete Workout Template

**Endpoint:** `DELETE /api/workout-templates/templates/:templateId`

**Description:** Deletes a workout template (only if not assigned to active clients)

**Required Permissions:** `manage_client_workout_plans` (Doctor only)

**URL Parameters:**
- `templateId` (string): Template ID

**Response:**
```json
{
  "success": true,
  "message": "Workout template deleted successfully"
}
```

---

### 7. Duplicate Template

**Endpoint:** `POST /api/workout-templates/templates/duplicate`

**Description:** Creates a copy of an existing template

**Required Permissions:** `manage_client_workout_plans` (Doctor only)

**Request Body:**
```json
{
  "templateId": "60d5f8b4a3b9e2a8c8c8e8f0",
  "name": "Copy of Advanced Strength Training Template"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Template duplicated successfully",
  "data": {
    "template": {
      "_id": "60d5f8b4a3b9e2a8c8c8e8f1",
      "doctorId": "60d5f8b4a3b9e2a8c8c8e8e0",
      "doctorName": "Dr. John Smith",
      "name": "Copy of Advanced Strength Training Template",
      "weeklyPlan": [...],
      "isPublic": false,
      "usageCount": 0,
      "createdAt": "2024-01-01T12:00:00.000Z"
    }
  }
}
```

---

## Template Assignment

### 1. Assign Template to Client

**Endpoint:** `POST /api/workout-templates/templates/assign`

**Description:** Creates a new workout plan for a client based on a template

**Required Permissions:** `manage_client_workout_plans` (Doctor only)

**Request Body:**
```json
{
  "templateId": "60d5f8b4a3b9e2a8c8c8e8f0",
  "clientId": "60d5f8b4a3b9e2a8c8c8e8f",
  "startDate": "2024-01-01",
  "endDate": "2024-03-31"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Template assigned to client successfully",
  "data": {
    "workoutPlan": {
      "_id": "60d5f8b4a3b9e2a8c8c8e8f2",
      "clientId": "60d5f8b4a3b9e2a8c8c8e8f",
      "doctorId": "60d5f8b4a3b9e2a8c8c8e8e0",
      "doctorName": "Dr. John Smith",
      "name": "Advanced Strength Training Template",
      "description": "12-week comprehensive strength building template",
      "notes": "Created from template: Advanced Strength Training Template",
      "startDate": "2024-01-01T00:00:00.000Z",
      "endDate": "2024-03-31T00:00:00.000Z",
      "difficulty": "advanced",
      "durationWeeks": 7,
      "weeklyPlan": [...],
      "isActive": true,
      "createdAt": "2024-01-01T12:00:00.000Z"
    }
  }
}
```

---

### 2. Get Template Usage Statistics

**Endpoint:** `GET /api/workout-templates/templates/:templateId/stats`

**Description:** Retrieves usage statistics for a specific template

**Required Permissions:** `manage_client_workout_plans` (Doctor only)

**URL Parameters:**
- `templateId` (string): Template ID

**Response:**
```json
{
  "success": true,
  "data": {
    "templateId": "60d5f8b4a3b9e2a8c8c8e8f0",
    "usageCount": 15,
    "activeAssignments": 8,
    "completedAssignments": 7,
    "averageCompletionTime": "21 days",
    "recentAssignments": [
      {
        "clientId": "60d5f8b4a3b9e2a8c8c8e8f",
        "clientName": "John Doe",
        "assignedAt": "2024-01-01T12:00:00.000Z",
        "status": "active"
      }
    ]
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
      "field": "name",
      "message": "Template name is required"
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
  "error": "Only doctors can create workout templates"
}
```

### Not Found Errors (404)
```json
{
  "success": false,
  "error": "Template not found"
}
```

### Conflict Errors (409)
```json
{
  "success": false,
  "error": "Template is currently assigned to active clients and cannot be deleted"
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

### Workout Template Structure
```json
{
  "_id": "string",
  "doctorId": "string",
  "doctorName": "string",
  "name": "string",
  "description": "string",
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
          "note": "string (optional)"
        }
      ]
    }
  ],
  "isPublic": true,
  "usageCount": "number",
  "tags": ["string"],
  "createdAt": "ISO 8601 date",
  "updatedAt": "ISO 8601 date"
}
```

### Exercise Fields
- **name**: Exercise name (required, max 100 chars)
- **gifUrl**: GIF URL for exercise demonstration (required, max 500 chars)
- **equipment**: Equipment type (required, enum)
- **instructions**: Exercise instructions (required, max 1000 chars)
- **sets**: Number of sets (required, 1-10)
- **reps**: Number of repetitions (required, 1-100)
- **restTime**: Rest time in seconds (required, 0-600)
- **note**: Optional notes (max 200 chars)

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

### Body Parts
- `chest`, `back`, `shoulders`, `biceps`, `triceps`
- `legs`, `glutes`, `abs`, `calves`, `forearms`
- `core`, `lower_back`, `traps`, `hamstrings`, `quads`
- `adductors`, `abductors`

### Muscle Groups
- `pectorals`, `lats`, `rhomboids`, `traps`, `deltoids`
- `biceps`, `triceps`, `forearms`, `quads`, `hamstrings`
- `glutes`, `calves`, `abs`, `obliques`, `erector_spinae`

---

## Quick Reference

### Common Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request (Validation Error)
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
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

## Usage Examples

### Creating a Template
```bash
curl -X POST https://fit-proo.vercel.app/api/workout-templates/templates \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <doctor_token>" \
  -d '{
    "name": "Beginner Full Body Template",
    "description": "Perfect for beginners starting their fitness journey",
    "difficulty": "beginner",
    "weeklyPlan": [...],
    "isPublic": true
  }'
```

### Assigning Template to Client
```bash
curl -X POST https://fit-proo.vercel.app/api/workout-templates/templates/assign \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <doctor_token>" \
  -d '{
    "templateId": "60d5f8b4a3b9e2a8c8c8e8f0",
    "clientId": "60d5f8b4a3b9e2a8c8c8e8f",
    "startDate": "2024-01-01",
    "endDate": "2024-03-31"
  }'
```

### Getting Public Templates
```bash
curl -X GET "https://fit-proo.vercel.app/api/workout-templates/public?difficulty=beginner&page=1&limit=10" \
  -H "Authorization: Bearer <client_token>"
```

---

*Last Updated: March 29, 2024*
