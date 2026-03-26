# Workout Template API Endpoints

## Authentication Required
All endpoints require JWT authentication: `Authorization: Bearer <token>`

## DOCTOR TEMPLATE ENDPOINTS

### Create Workout Template
```http
POST /api/workout-templates/templates
Content-Type: application/json

{
  "name": "string (3-100 chars)",
  "description": "string (optional, max 500 chars)",
  "difficulty": "beginner|intermediate|advanced",
  "durationWeeks": "number (1-52)",
  "isPublic": "boolean (optional, default false)",
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

### Get Doctor's Templates
```http
GET /api/workout-templates/templates?page=1&limit=10&search=chest
```

### Get Specific Template
```http
GET /api/workout-templates/templates/:templateId
```

### Update Workout Template
```http
PUT /api/workout-templates/templates/:templateId
Content-Type: application/json

{
  "name": "string (optional, 3-100 chars)",
  "description": "string (optional, max 500 chars)",
  "difficulty": "beginner|intermediate|advanced (optional)",
  "durationWeeks": "number (optional, 1-52)",
  "isPublic": "boolean (optional)",
  "exercises": "array (optional)"
}
```

### Delete Workout Template
```http
DELETE /api/workout-templates/templates/:templateId
```

### Assign Template to Client
```http
POST /api/workout-templates/templates/assign
Content-Type: application/json

{
  "templateId": "string",
  "clientId": "string",
  "startDate": "YYYY-MM-DD",
  "endDate": "YYYY-MM-DD"
}
```

### Duplicate Template
```http
POST /api/workout-templates/templates/duplicate
Content-Type: application/json

{
  "templateId": "string",
  "name": "string (optional, 3-100 chars)"
}
```

### Get Public Templates
```http
GET /api/workout-templates/templates/public?page=1&limit=10&search=beginner
```

## PERMISSIONS

### Doctor Permissions
- `manage_workout_templates` - Create, update, delete workout templates
- `manage_client_workout_plans` - Assign templates to clients
- `view_client_workout_plans` - View templates and public templates

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

## FEATURES

### Template Management
- **Create reusable workout templates** for faster client setup
- **Edit and update templates** without affecting assigned plans
- **Delete unused templates** to keep library clean
- **Duplicate templates** for variations

### Template Assignment
- **Assign any template to any client** with one click
- **Automatic plan deactivation** when assigning new template
- **Usage tracking** for template popularity
- **Template remains unchanged** after assignment

### Public Templates
- **Share templates** with other doctors
- **Browse public library** for inspiration
- **Search and filter** public templates
- **Usage-based ranking** for quality templates

### Integration
- **Seamless integration** with existing workout plan system
- **Template assignments create** full workout plans with all features
- **Progress tracking** works normally on template-assigned plans
- **Reuse functionality** preserved for historical plans

## PAGINATION

All list endpoints support:
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10, max: 50)
- `search` - Search term (optional, max: 50 chars)

Response includes pagination metadata:
```json
{
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalTemplates": 48,
    "hasNext": true
  }
}
```
