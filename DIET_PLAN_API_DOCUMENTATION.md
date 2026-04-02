# 📋 Diet Plan API Documentation

## 🎯 Overview
Complete API documentation for Diet Plan system with request/response examples for all endpoints.

---

## 🔐 Authentication
All endpoints require JWT authentication:
```http
Authorization: Bearer <jwt_token>
```

---

## 📋 Endpoints

### **1. Create Diet Plan**
**POST** `/api/diet-plans`

#### **Request:**
```json
{
  "clientId": "507f1f77bcf86cd799439011",
  "name": "Weight Loss Plan - 7 Days",
  "description": "7-day weight loss diet plan focusing on balanced nutrition",
  "startDate": "2024-03-30",
  "endDate": "2024-04-06",
  "weeklyPlan": [
    {
      "dayName": "Monday",
      "dailyPlanName": "High Protein Day",
      "meals": [
        {
          "type": "breakfast",
          "food": [
            {
              "name": "Greek Yogurt with Berries",
              "calories": 250,
              "protein": 20,
              "carbs": 30,
              "fat": 8,
              "image": "https://example.com/yogurt.jpg",
              "recipe": "Mix Greek yogurt with fresh berries and honey"
            }
          ]
        },
        {
          "type": "lunch",
          "food": [
            {
              "name": "Grilled Chicken Salad",
              "calories": 450,
              "protein": 35,
              "carbs": 25,
              "fat": 20,
              "image": "https://example.com/chicken-salad.jpg",
              "recipe": "Grilled chicken breast with mixed greens and olive oil dressing"
            }
          ]
        },
        {
          "type": "dinner",
          "food": [
            {
              "name": "Salmon with Vegetables",
              "calories": 550,
              "protein": 40,
              "carbs": 35,
              "fat": 25,
              "image": "https://example.com/salmon.jpg",
              "recipe": "Pan-seared salmon with roasted vegetables"
            }
          ]
        }
      ]
    },
    {
      "dayName": "Tuesday",
      "dailyPlanName": "Balanced Nutrition Day",
      "meals": [
        {
          "type": "breakfast",
          "food": [
            {
              "name": "Oatmeal with Nuts",
              "calories": 300,
              "protein": 12,
              "carbs": 45,
              "fat": 10,
              "image": "https://example.com/oatmeal.jpg",
              "recipe": "Steel-cut oats with mixed nuts and banana"
            }
          ]
        }
      ]
    }
  ]
}
```

#### **Response (201):**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439012",
    "clientId": "507f1f77bcf86cd799439011",
    "name": "Weight Loss Plan - 7 Days",
    "description": "7-day weight loss diet plan focusing on balanced nutrition",
    "startDate": "2024-03-30T00:00:00.000Z",
    "endDate": "2024-04-06T00:00:00.000Z",
    "weeklyPlan": [...],
    "createdAt": "2024-03-30T10:00:00.000Z",
    "updatedAt": "2024-03-30T10:00:00.000Z"
  },
  "message": "Diet plan created successfully"
}
```

---

### **2. Get All Diet Plans**
**GET** `/api/diet-plans`

#### **Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `clientId` (optional): Filter by client ID
- `search` (optional): Search by name or description

#### **Request:**
```http
GET /api/diet-plans?page=1&limit=10&search=weight
Authorization: Bearer <jwt_token>
```

#### **Response (200):**
```json
{
  "success": true,
  "data": {
    "dietPlans": [
      {
        "_id": "507f1f77bcf86cd799439012",
        "clientId": "507f1f77bcf86cd799439011",
        "name": "Weight Loss Plan - 7 Days",
        "description": "7-day weight loss diet plan focusing on balanced nutrition",
        "startDate": "2024-03-30T00:00:00.000Z",
        "endDate": "2024-04-06T00:00:00.000Z",
        "weeklyPlan": [...],
        "createdAt": "2024-03-30T10:00:00.000Z",
        "updatedAt": "2024-03-30T10:00:00.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 3,
      "totalPlans": 25,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

---

### **3. Get Diet Plan by ID**
**GET** `/api/diet-plans/:planId`

#### **Request:**
```http
GET /api/diet-plans/507f1f77bcf86cd799439012
Authorization: Bearer <jwt_token>
```

#### **Response (200):**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439012",
    "clientId": "507f1f77bcf86cd799439011",
    "name": "Weight Loss Plan - 7 Days",
    "description": "7-day weight loss diet plan focusing on balanced nutrition",
    "startDate": "2024-03-30T00:00:00.000Z",
    "endDate": "2024-04-06T00:00:00.000Z",
    "weeklyPlan": [...],
    "createdAt": "2024-03-30T10:00:00.000Z",
    "updatedAt": "2024-03-30T10:00:00.000Z"
  }
}
```

#### **Response (404):**
```json
{
  "success": false,
  "error": "Diet plan not found"
}
```

---

### **4. Update Diet Plan**
**PUT** `/api/diet-plans/:planId`

#### **Request:**
```json
{
  "name": "Updated Weight Loss Plan",
  "description": "Updated 7-day weight loss diet plan",
  "startDate": "2024-04-01",
  "endDate": "2024-04-07",
  "weeklyPlan": [...]
}
```

#### **Response (200):**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439012",
    "clientId": "507f1f77bcf86cd799439011",
    "name": "Updated Weight Loss Plan",
    "description": "Updated 7-day weight loss diet plan",
    "startDate": "2024-04-01T00:00:00.000Z",
    "endDate": "2024-04-07T00:00:00.000Z",
    "weeklyPlan": [...],
    "createdAt": "2024-03-30T10:00:00.000Z",
    "updatedAt": "2024-04-01T15:30:00.000Z"
  },
  "message": "Diet plan updated successfully"
}
```

---

### **5. Delete Diet Plan**
**DELETE** `/api/diet-plans/:planId`

#### **Request:**
```http
DELETE /api/diet-plans/507f1f77bcf86cd799439012
Authorization: Bearer <jwt_token>
```

#### **Response (200):**
```json
{
  "success": true,
  "message": "Diet plan deleted successfully"
}
```

---

### **6. Get Diet Plans by Client**
**GET** `/api/diet-plans/client/:clientId`

#### **Request:**
```http
GET /api/diet-plans/client/507f1f77bcf86cd799439011?page=1&limit=10
Authorization: Bearer <jwt_token>
```

#### **Response (200):**
```json
{
  "success": true,
  "data": {
    "dietPlans": [
      {
        "_id": "507f1f77bcf86cd799439012",
        "clientId": "507f1f77bcf86cd799439011",
        "name": "Weight Loss Plan - 7 Days",
        "description": "7-day weight loss diet plan focusing on balanced nutrition",
        "startDate": "2024-03-30T00:00:00.000Z",
        "endDate": "2024-04-06T00:00:00.000Z",
        "weeklyPlan": [...],
        "createdAt": "2024-03-30T10:00:00.000Z",
        "updatedAt": "2024-03-30T10:00:00.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 2,
      "totalPlans": 15,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

---

### **7. Get Diet Progress**
**GET** `/api/diet-progress/client/:clientId`

#### **Request:**
```http
GET /api/diet-progress/client/507f1f77bcf86cd799439011?startDate=2024-03-30&endDate=2024-04-06
Authorization: Bearer <jwt_token>
```

#### **Response (200):**
```json
{
  "success": true,
  "data": {
    "clientId": "507f1f77bcf86cd799439011",
    "progress": [
      {
        "_id": "507f1f77bcf86cd799439013",
        "planId": "507f1f77bcf86cd799439012",
        "date": "2024-03-30T00:00:00.000Z",
        "dailyProgress": [
          {
            "dayName": "Monday",
            "meals": [
              {
                "type": "breakfast",
                "food": [
                  {
                    "name": "Greek Yogurt with Berries",
                    "calories": 250,
                    "protein": 20,
                    "carbs": 30,
                    "fat": 8,
                    "eaten": true,
                    "image": "https://example.com/yogurt.jpg",
                    "recipe": "Mix Greek yogurt with fresh berries and honey"
                  }
                ]
              }
            ],
            "completed": true
          }
        ],
        "totalCalories": 2500,
        "totalProtein": 180,
        "totalCarbs": 250,
        "totalFat": 80
      }
    ],
    "summary": {
      "totalDays": 7,
      "completedDays": 3,
      "completionRate": 42.86,
      "averageCalories": 2200,
      "averageProtein": 160,
      "averageCarbs": 220,
      "averageFat": 70
    }
  }
}
```

---

### **8. Mark Food as Eaten**
**POST** `/api/diet-progress/mark-eaten`

#### **Request:**
```json
{
  "planId": "507f1f77bcf86cd799439012",
  "date": "2024-03-30",
  "dayName": "Monday",
  "mealType": "breakfast",
  "foodIndex": 0,
  "food": {
    "name": "Greek Yogurt with Berries",
    "calories": 250,
    "protein": 20,
    "carbs": 30,
    "fat": 8,
    "image": "https://example.com/yogurt.jpg",
    "recipe": "Mix Greek yogurt with fresh berries and honey"
  }
}
```

#### **Response (200):**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439014",
    "planId": "507f1f77bcf86cd799439012",
    "date": "2024-03-30T00:00:00.000Z",
    "dayName": "Monday",
    "mealType": "breakfast",
    "food": {
      "name": "Greek Yogurt with Berries",
      "calories": 250,
      "protein": 20,
      "carbs": 30,
      "fat": 8,
      "eaten": true,
      "image": "https://example.com/yogurt.jpg",
      "recipe": "Mix Greek yogurt with fresh berries and honey"
    },
    "createdAt": "2024-03-30T12:00:00.000Z"
  },
  "message": "Food marked as eaten successfully"
}
```

---

### **9. Get Diet Plan Statistics**
**GET** `/api/diet-plan-stats/client/:clientId`

#### **Request:**
```http
GET /api/diet-plan-stats/client/507f1f77bcf86cd799439011?startDate=2024-03-01&endDate=2024-03-31
Authorization: Bearer <jwt_token>
```

#### **Response (200):**
```json
{
  "success": true,
  "data": {
    "clientId": "507f1f77bcf86cd799439011",
    "period": {
      "startDate": "2024-03-01T00:00:00.000Z",
      "endDate": "2024-03-31T00:00:00.000Z"
    },
    "statistics": {
      "totalPlans": 3,
      "activePlans": 2,
      "completedPlans": 1,
      "totalDays": 21,
      "completedDays": 15,
      "completionRate": 71.43,
      "totalCalories": 46200,
      "totalProtein": 3360,
      "totalCarbs": 4620,
      "totalFat": 1680,
      "averageCalories": 2200,
      "averageProtein": 160,
      "averageCarbs": 220,
      "averageFat": 80,
      "mostConsumedFoods": [
        {
          "name": "Grilled Chicken Salad",
          "count": 8,
          "totalCalories": 3600
        }
      ],
      "macroDistribution": {
        "protein": 30.43,
        "carbs": 42.86,
        "fat": 26.71
      }
    }
  }
}
```

---

## 📋 Data Structures

### **Diet Plan Structure:**
```json
{
  "_id": "ObjectId",
  "clientId": "ObjectId",
  "name": "String (required, max 100)",
  "description": "String (optional, max 500)",
  "startDate": "Date (required, ISO format)",
  "endDate": "Date (required, ISO format)",
  "weeklyPlan": [
    {
      "dayName": "String (Monday-Sunday)",
      "dailyPlanName": "String (required, max 100)",
      "meals": [
        {
          "type": "String (breakfast/lunch/dinner)",
          "food": [
            {
              "name": "String (required, max 100)",
              "calories": "Number (required, min 0)",
              "protein": "Number (required, min 0)",
              "carbs": "Number (required, min 0)",
              "fat": "Number (required, min 0)",
              "image": "String (optional, max 500)",
              "recipe": "String (optional, max 1000)"
            }
          ]
        }
      ]
    }
  ],
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

### **Diet Progress Structure:**
```json
{
  "_id": "ObjectId",
  "planId": "ObjectId",
  "clientId": "ObjectId",
  "date": "Date",
  "dailyProgress": [
    {
      "dayName": "String (Monday-Sunday)",
      "meals": [
        {
          "type": "String (breakfast/lunch/dinner)",
          "food": [
            {
              "name": "String",
              "calories": "Number",
              "protein": "Number",
              "carbs": "Number",
              "fat": "Number",
              "eaten": "Boolean",
              "image": "String (optional)",
              "recipe": "String (optional)"
            }
          ]
        }
      ],
      "completed": "Boolean"
    }
  ],
  "totalCalories": "Number",
  "totalProtein": "Number",
  "totalCarbs": "Number",
  "totalFat": "Number"
}
```

---

## 🔧 Validation Rules

### **Required Fields:**
- `clientId`: Valid MongoDB ObjectId
- `name`: String, 3-100 characters
- `startDate`: Valid date, not in past
- `endDate`: Valid date, after startDate
- `weeklyPlan`: Array with exactly 7 days
- Each day must have exactly 3 meals (breakfast, lunch, dinner)

### **Optional Fields:**
- `description`: String, max 500 characters
- `image`: String, max 500 characters (food item)
- `recipe`: String, max 1000 characters (food item)

### **Numeric Constraints:**
- `calories`: Number, min 0
- `protein`: Number, min 0
- `carbs`: Number, min 0
- `fat`: Number, min 0

---

## 🚨 Error Responses

### **Validation Error (400):**
```json
{
  "success": false,
  "error": "Validation failed",
  "details": [
    {
      "field": "name",
      "message": "Diet plan name must be between 3 and 100 characters"
    },
    {
      "field": "weeklyPlan",
      "message": "Weekly plan must contain exactly 7 days"
    }
  ]
}
```

### **Authentication Error (401):**
```json
{
  "success": false,
  "error": "Authentication failed"
}
```

### **Not Found Error (404):**
```json
{
  "success": false,
  "error": "Diet plan not found"
}
```

### **Authorization Error (403):**
```json
{
  "success": false,
  "error": "Access denied"
}
```

---

## 📊 Pagination

### **Standard Pagination Response:**
```json
{
  "pagination": {
    "currentPage": 1,
    "totalPages": 3,
    "totalPlans": 25,
    "hasNext": true,
    "hasPrev": false
  }
}
```

### **Query Parameters:**
- `page`: Page number (default: 1, min: 1)
- `limit`: Items per page (default: 10, min: 1, max: 50)
- `search`: Search term (optional, max 50 characters)
- `clientId`: Filter by client (optional)

---

## 🎯 Usage Examples

### **Postman Collection Ready:**
```javascript
// Create Diet Plan
POST http://localhost:5000/api/diet-plans
Headers: {
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "Content-Type": "application/json"
}
Body: {
  "clientId": "507f1f77bcf86cd799439011",
  "name": "Weight Loss Plan",
  "description": "7-day weight loss plan",
  "startDate": "2024-03-30",
  "endDate": "2024-04-06",
  "weeklyPlan": [...]
}

// Get Diet Plans
GET http://localhost:5000/api/diet-plans?page=1&limit=10
Headers: {
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}

// Get Diet Progress
GET http://localhost:5000/api/diet-progress/client/507f1f77bcf86cd799439011?startDate=2024-03-30&endDate=2024-04-06
Headers: {
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}

// Mark Food as Eaten
POST http://localhost:5000/api/diet-progress/mark-eaten
Headers: {
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "Content-Type": "application/json"
}
Body: {
  "planId": "507f1f77bcf86cd799439012",
  "date": "2024-03-30",
  "dayName": "Monday",
  "mealType": "breakfast",
  "foodIndex": 0,
  "food": {
    "name": "Greek Yogurt with Berries",
    "calories": 250,
    "protein": 20,
    "carbs": 30,
    "fat": 8,
    "image": "https://example.com/yogurt.jpg",
    "recipe": "Mix Greek yogurt with fresh berries"
  }
}
```

---

## 📋 Summary

### **✅ Key Features:**
- **7-Day Plans**: Exactly 7 days with 3 meals each
- **Flexible Food Items**: Optional image and recipe fields
- **Progress Tracking**: Daily meal completion tracking
- **Statistics**: Comprehensive nutrition analytics
- **Pagination**: Efficient data retrieval
- **Search**: Find plans by name/description
- **Client Filtering**: Filter by specific client

### **✅ Production Ready:**
- **Complete CRUD**: Create, Read, Update, Delete
- **Progress System**: Track daily meal completion
- **Statistics**: Analyze nutrition patterns
- **Validation**: Robust input validation
- **Error Handling**: Comprehensive error responses
- **Authentication**: JWT-based security
- **Pagination**: Scalable data handling

---

## 🎯 Ready for Testing

**All Diet Plan endpoints are documented and ready for POSTMAN testing! 🚀**

Use the examples above to test each endpoint with POSTMAN or any API client.
