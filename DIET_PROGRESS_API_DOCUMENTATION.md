# 🔧 Diet Progress API Documentation - Complete Guide

## 📋 Overview
Diet Progress API بتتعامل مع تمرين الـ diet plans للـ client، بيتيح للـ client يتابع nutrition progress بتاعه ويعمل mark للـ foods كـ eaten.

---

## 🛣️ Endpoints

### **1. POST /api/diet-progress/food**
**Description:** Mark food as eaten
**Access:** Private (Client only)

#### **Request:**
```bash
POST /api/diet-progress/food
Authorization: Bearer <client_access_token>
Content-Type: application/json

{
  "dietPlanId": "507f1f77bcf86cd799439011",
  "dayName": "Monday",
  "mealType": "breakfast",
  "foodName": "Oatmeal with Berries"
}
```

#### **Response:**
```json
{
  "success": true,
  "message": "Food marked as eaten successfully",
  "data": {
    "progress": {
      "_id": "507f1f77bcf86cd799439013",
      "clientId": "507f1f77bcf86cd799439012",
      "dietPlanId": "507f1f77bcf86cd799439011",
      "dayName": "Monday",
      "mealType": "breakfast",
      "foodName": "Oatmeal with Berries",
      "isEaten": true,
      "eatenAt": "2024-04-05T08:30:00.000Z",
      "nutrition": {
        "calories": 250,
        "protein": 8,
        "carbs": 45,
        "fat": 6
      },
      "image": "https://example.com/oatmeal.jpg",
      "recipe": "Cook oats with milk, add berries and honey"
    }
  }
}
```

#### **Error Responses:**
```json
// 404 - Diet plan not found
{
  "success": false,
  "error": "Diet plan not found or access denied"
}

// 404 - Day not found
{
  "success": false,
  "error": "Day not found in diet plan"
}

// 404 - Meal not found
{
  "success": false,
  "error": "Meal not found in diet plan"
}

// 404 - Food not found
{
  "success": false,
  "error": "Food not found in diet plan"
}

// 400 - Validation failed
{
  "success": false,
  "error": "Validation failed",
  "details": [
    {
      "field": "dietPlanId",
      "message": "Invalid diet plan ID"
    }
  ]
}
```

---

### **2. GET /api/diet-progress/:dietPlanId/day/:dayName**
**Description:** Get daily progress
**Access:** Private (Client only)

#### **Request:**
```bash
GET /api/diet-progress/507f1f77bcf86cd799439011/day/Monday
Authorization: Bearer <client_access_token>
```

#### **Response:**
```json
{
  "success": true,
  "data": {
    "dayName": "Monday",
    "progress": {
      "breakfast": {
        "eaten": [
          {
            "foodName": "Oatmeal with Berries",
            "nutrition": {
              "calories": 250,
              "protein": 8,
              "carbs": 45,
              "fat": 6
            },
            "image": "https://example.com/oatmeal.jpg",
            "recipe": "Cook oats with milk, add berries and honey",
            "eatenAt": "2024-04-05T08:30:00.000Z"
          }
        ],
        "notEaten": [
          {
            "foodName": "Greek Yogurt",
            "nutrition": {
              "calories": 150,
              "protein": 12,
              "carbs": 8,
              "fat": 4
            },
            "image": "https://example.com/yogurt.jpg",
            "recipe": "Serve with honey and nuts",
            "eatenAt": null
          }
        ]
      },
      "lunch": {
        "eaten": [],
        "notEaten": [
          {
            "foodName": "Grilled Chicken Salad",
            "nutrition": {
              "calories": 350,
              "protein": 35,
              "carbs": 15,
              "fat": 18
            },
            "image": "https://example.com/chicken-salad.jpg",
            "recipe": "Grilled chicken with mixed greens and vinaigrette",
            "eatenAt": null
          }
        ]
      },
      "dinner": {
        "eaten": [],
        "notEaten": [
          {
            "foodName": "Salmon with Vegetables",
            "nutrition": {
              "calories": 420,
              "protein": 38,
              "carbs": 20,
              "fat": 22
            },
            "image": "https://example.com/salmon.jpg",
            "recipe": "Grilled salmon with roasted vegetables",
            "eatenAt": null
          }
        ]
      }
    },
    "dailyTotals": {
      "calories": 250,
      "protein": 8,
      "carbs": 45,
      "fat": 6
    },
    "totalFoods": 3,
    "eatenFoods": 1,
    "completionRate": 33
  }
}
```

#### **Error Responses:**
```json
// 404 - Diet plan not found
{
  "success": false,
  "error": "Diet plan not found or access denied"
}

// 400 - Invalid diet plan ID
{
  "success": false,
  "error": "Validation failed",
  "details": [
    {
      "field": "dietPlanId",
      "message": "Invalid diet plan ID"
    }
  ]
}
```

---

### **3. GET /api/diet-progress/client/:clientId**
**Description:** Get diet progress for a client
**Access:** Private (Client only - own progress, Doctor - client progress)

#### **Request:**
```bash
GET /api/diet-progress/client/507f1f77bcf86cd799439012
Authorization: Bearer <client_access_token>
```

#### **Response:**
```json
{
  "success": true,
  "data": {
    "clientId": "507f1f77bcf86cd799439012",
    "dietPlan": {
      "id": "507f1f77bcf86cd799439011",
      "name": "Weight Loss Diet Plan",
      "startDate": "2024-04-01T00:00:00.000Z",
      "endDate": "2024-04-07T00:00:00.000Z",
      "durationWeeks": 1
    },
    "dailyProgress": [
      {
        "dayName": "Monday",
        "meals": {
          "breakfast": [
            {
              "foodName": "Oatmeal with Berries",
              "isEaten": true,
              "nutrition": {
                "calories": 250,
                "protein": 8,
                "carbs": 45,
                "fat": 6
              },
              "eatenAt": "2024-04-05T08:30:00.000Z"
            },
            {
              "foodName": "Greek Yogurt",
              "isEaten": false,
              "nutrition": {
                "calories": 150,
                "protein": 12,
                "carbs": 8,
                "fat": 4
              },
              "eatenAt": null
            }
          ],
          "lunch": [
            {
              "foodName": "Grilled Chicken Salad",
              "isEaten": false,
              "nutrition": {
                "calories": 350,
                "protein": 35,
                "carbs": 15,
                "fat": 18
              },
              "eatenAt": null
            }
          ],
          "dinner": [
            {
              "foodName": "Salmon with Vegetables",
              "isEaten": false,
              "nutrition": {
                "calories": 420,
                "protein": 38,
                "carbs": 20,
                "fat": 22
              },
              "eatenAt": null
            }
          ]
        },
        "totalNutrition": {
          "calories": 250,
          "protein": 8,
          "carbs": 45,
          "fat": 6
        },
        "completionRate": 33
      }
    ],
    "overallStats": {
      "totalDays": 7,
      "overallCompletion": 45,
      "targetNutrition": {
        "calories": 2000,
        "protein": 150,
        "carbs": 250,
        "fat": 65
      },
      "consumedNutrition": {
        "calories": 1750,
        "protein": 130,
        "carbs": 220,
        "fat": 58
      },
      "remainingNutrition": {
        "calories": 250,
        "protein": 20,
        "carbs": 30,
        "fat": 7
      }
    },
    "generatedAt": "2024-04-05T12:00:00.000Z"
  }
}
```

#### **Error Responses:**
```json
// 403 - Access denied (client trying to access other client's data)
{
  "success": false,
  "error": "Access denied - clients can only view their own progress"
}

// 404 - Client not found
{
  "success": false,
  "error": "Client not found or access denied"
}

// 404 - No active diet plan
{
  "success": false,
  "error": "No active diet plan found for this client"
}
```

---

### **4. GET /api/diet-progress/:dietPlanId/nutrition**
**Description:** Get real-time nutrition tracking
**Access:** Private (Client only)

#### **Request:**
```bash
GET /api/diet-progress/507f1f77bcf86cd799439011/nutrition
Authorization: Bearer <client_access_token>
```

#### **Response:**
```json
{
  "success": true,
  "data": {
    "target": {
      "calories": 2000,
      "protein": 150,
      "carbs": 250,
      "fat": 65
    },
    "consumed": {
      "calories": 1750,
      "protein": 130,
      "carbs": 220,
      "fat": 58
    },
    "remaining": {
      "calories": 250,
      "protein": 20,
      "carbs": 30,
      "fat": 7
    },
    "percentages": {
      "calories": 88,
      "protein": 87,
      "carbs": 88,
      "fat": 89
    },
    "totalFoodsEaten": 12,
    "lastUpdated": "2024-04-05T12:00:00.000Z"
  }
}
```

#### **Error Responses:**
```json
// 404 - Diet plan not found
{
  "success": false,
  "error": "Diet plan not found or access denied"
}

// 400 - Invalid diet plan ID
{
  "success": false,
  "error": "Validation failed",
  "details": [
    {
      "field": "dietPlanId",
      "message": "Invalid diet plan ID"
    }
  ]
}
```

---

## 🔒 Security & Authentication

### **Authentication:**
- All endpoints require `Authorization: Bearer <token>` header
- Token must be valid client access token
- Token is validated using `authenticate` middleware

### **Authorization:**
- All endpoints use `requirePermission('view_client_workout_plans')` middleware
- Client can only access their own diet plans (`clientId === req.user.userId`)
- Doctor can access their clients' diet plans
- Admin has full access

### **Data Validation:**
- All requests are validated using `express-validator`
- Required fields are checked for presence and format
- Invalid requests return 400 with detailed error messages

---

## 📊 Data Models

### **DietProgress Structure:**
```javascript
{
  _id: "507f1f77bcf86cd799439013",
  clientId: "507f1f77bcf86cd799439012",
  dietPlanId: "507f1f77bcf86cd799439011",
  dayName: "Monday",
  mealType: "breakfast",
  foodName: "Oatmeal with Berries",
  isEaten: true,
  eatenAt: "2024-04-05T08:30:00.000Z",
  nutrition: {
    calories: 250,
    protein: 8,
    carbs: 45,
    fat: 6
  },
  image: "https://example.com/oatmeal.jpg",
  recipe: "Cook oats with milk, add berries and honey"
}
```

### **DietPlan Structure:**
```javascript
{
  _id: "507f1f77bcf86cd799439011",
  clientId: "507f1f77bcf86cd799439012",
  doctorId: "507f1f77bcf86cd799439013",
  name: "Weight Loss Diet Plan",
  weeklyPlan: [
    {
      dayName: "Monday",
      meals: [
        {
          mealType: "breakfast",
          foods: [
            {
              name: "Oatmeal with Berries",
              nutrition: {
                calories: 250,
                protein: 8,
                carbs: 45,
                fat: 6
              },
              image: "https://example.com/oatmeal.jpg",
              recipe: "Cook oats with milk, add berries and honey"
            }
          ]
        }
      ]
    }
  ],
  targetCalories: 2000,
  targetMacros: {
    protein: 150,
    carbs: 250,
    fat: 65
  }
}
```

---

## 🎯 Usage Examples

### **Mark Food as Eaten:**
```javascript
// Client marks breakfast food as eaten
const response = await fetch('/api/diet-progress/food', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + clientToken,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    dietPlanId: '507f1f77bcf86cd799439011',
    dayName: 'Monday',
    mealType: 'breakfast',
    foodName: 'Oatmeal with Berries'
  })
});
```

### **Get Daily Progress:**
```javascript
// Client gets Monday's progress
const response = await fetch('/api/diet-progress/507f1f77bcf86cd799439011/day/Monday', {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer ' + clientToken
  }
});
```

### **Get Client Progress:**
```javascript
// Client gets their complete diet progress
const response = await fetch('/api/diet-progress/client/507f1f77bcf86cd799439012', {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer ' + clientToken
  }
});
```

### **Get Nutrition Tracking:**
```javascript
// Client gets real-time nutrition tracking
const response = await fetch('/api/diet-progress/507f1f77bcf86cd799439011/nutrition', {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer ' + clientToken
  }
});
```

---

## 📋 Validation Rules

### **POST /food Validation:**
```javascript
{
  dietPlanId: {
    required: true,
    format: "MongoDB ObjectId"
  },
  dayName: {
    required: true,
    enum: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
  },
  mealType: {
    required: true,
    enum: ["breakfast", "lunch", "dinner"]
  },
  foodName: {
    required: true,
    maxLength: 100,
    trimmed: true
  }
}
```

### **GET /:dietPlanId/day/:dayName Validation:**
```javascript
{
  dietPlanId: {
    required: true,
    format: "MongoDB ObjectId"
  },
  dayName: {
    required: true,
    enum: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
  }
}
```

---

## 🎉 Summary

**🔥 Diet Progress API Documentation كاملة!**

- ✅ **4 endpoints**: mark food as eaten, get daily progress, get client progress, get nutrition tracking
- ✅ **Complete request/response examples**: مع الـ validation errors
- ✅ **Security documentation**: authentication و authorization
- ✅ **Data models**: DietProgress و DietPlan structures
- ✅ **Usage examples**: JavaScript code snippets
- ✅ **Error handling**: كل الـ error cases مغطاة
- ✅ **Validation rules**: كل الـ validation rules مفصلة

**النظام دلوقتي متكامل للـ diet progress tracking! 🚀**
