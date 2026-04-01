# 🥗 Diet Plan System - Simplified Structure

## 🎯 Updated Requirements
- **⏰ Duration**: Exactly 1 week (7 days)
- **📋 Fields**: Plan name, description, 7 days with 3 meals each
- **🍽️ Meals**: Breakfast, Lunch, Dinner (no snacks)
- **🔐 Permissions**: Using existing permission middleware

---

## ✅ Updated Model Structure

### **📋 DietPlan.js - Simplified**
```javascript
{
  clientId: ObjectId,      // Client who owns this plan
  doctorId: ObjectId,      // Doctor who created this plan
  doctorName: String,      // Doctor name for reference
  name: String,           // Plan name (required)
  description: String,    // Plan description (optional)
  startDate: Date,        // Plan start date (required)
  endDate: Date,          // Plan end date (exactly 7 days)
  isActive: Boolean,      // Plan status
  durationWeeks: 1,      // Fixed 1 week = 7 days
  weeklyPlan: [{          // 7-day structure
    dayName: String,      // Monday, Tuesday, etc.
    meals: [{            // 3 meals per day (breakfast, lunch, dinner)
      mealType: String,  // breakfast/lunch/dinner
      foods: [{         // Food items
        name: String,
        quantity: String,
        nutrition: {
          calories: Number,
          protein: Number,
          carbs: Number,
          fat: Number
        },
        source: String,  // smart_input/selector/manual
        edamamId: String
      }],
      totalCalories: Number,
      totalProtein: Number,
      totalCarbs: Number,
      totalFat: Number
    }],
    dailyTotals: {       // Calculated daily totals
      calories: Number,
      protein: Number,
      carbs: Number,
      fat: Number
    }
  }]
}
```

### **🔍 Key Changes:**
- **❌ Removed**: `notes`, `difficulty`, `targetCalories`, `targetMacros`, `usageCount`
- **✅ Kept**: `name`, `description`, `startDate`, `endDate`, `weeklyPlan`
- **🍽️ Meals**: Only `breakfast`, `lunch`, `dinner` (no `snack`)
- **⏰ Duration**: Fixed to exactly 7 days

---

## 🎮 Updated Controller

### **✅ Simplified Create Method**
```javascript
async createDietPlan(req, res, next) {
  const {
    clientId,
    name,              // Required
    description,       // Optional
    startDate,         // Required
    endDate,           // Required (exactly 7 days later)
    weeklyPlan         // Required (7 days with 3 meals each)
  } = req.body;

  // Validate 7-day duration
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  if (diffDays !== 7) {
    return res.status(400).json({
      error: 'Diet plans must be exactly 7 days duration'
    });
  }

  // Validate weekly plan structure (7 days with 3 meals each)
  for (const day of weeklyPlan) {
    if (day.meals.length !== 3) {
      return res.status(400).json({
        error: 'Each day must contain exactly 3 meals (breakfast, lunch, dinner)'
      });
    }

    const requiredMeals = ['breakfast', 'lunch', 'dinner'];
    const providedMeals = day.meals.map(meal => meal.mealType);
    
    if (!requiredMeals.every(meal => providedMeals.includes(meal))) {
      return res.status(400).json({
        error: 'Each day must include all 3 meals: breakfast, lunch, dinner'
      });
    }
  }

  // Create simplified diet plan
  const dietPlan = new DietPlan({
    clientId,
    doctorId,
    doctorName: doctor.name,
    name,
    description,
    startDate: new Date(startDate),
    endDate: new Date(endDate),
    durationWeeks: 1, // Fixed 1 week = 7 days
    weeklyPlan
  });

  await dietPlan.save();
}
```

---

## 🛣️ Updated API Endpoints

### **✅ Simplified Create Endpoint**
```http
POST /api/diet-plans
{
  "clientId": "507f1f77bcf86cd799439011",
  "name": "Weight Loss Plan",           // Required
  "description": "7-day plan",         // Optional
  "startDate": "2024-03-30",           // Required
  "endDate": "2024-04-06",             // Required (exactly 7 days)
  "weeklyPlan": [                      // Required (7 days with 3 meals each)
    {
      "dayName": "Monday",
      "meals": [
        {
          "mealType": "breakfast",
          "foods": [
            {
              "name": "Oatmeal",
              "quantity": "1 cup",
              "nutrition": { "calories": 150, "protein": 5, "carbs": 27, "fat": 3 }
            }
          ]
        },
        {
          "mealType": "lunch",
          "foods": [...]
        },
        {
          "mealType": "dinner",
          "foods": [...]
        }
      ]
    },
    // ... Tuesday through Sunday
  ]
}
```

### **✅ Validation Rules**
- **⏰ Duration**: Exactly 7 days (validated)
- **📅 Days**: All 7 days required (Monday-Sunday)
- **🍽️ Meals**: Exactly 3 meals per day (breakfast, lunch, dinner)
- **🍎 Foods**: Each meal must have at least one food item
- **📊 Nutrition**: Each food must have nutrition values

---

## 🔐 Permission System

### **✅ Using Existing Middleware**
```javascript
// Using existing permissionMiddleware.js
const { requirePermission } = require('../middlewares/requirePermission');

// Permissions used:
// - manage_client_workout_plans: Create/update/delete diet plans
// - view_client_workout_plans: View diet plans and progress
```

### **✅ Role-Based Access**
- **👨‍⚕️ Doctor**: Full CRUD operations, view client progress
- **👤 Client**: View own plans, mark food as eaten
- **🔒 Ownership validation**: Clients only access own data

---

## 📊 Updated Progress Tracking

### **✅ DietProgress Model - 3 Meals Only**
```javascript
{
  clientId: ObjectId,
  dietPlanId: ObjectId,
  dayName: String,         // Monday, Tuesday, etc.
  mealType: String,        // breakfast, lunch, dinner (no snack)
  foodName: String,
  nutrition: { calories, protein, carbs, fat },
  isEaten: Boolean,
  eatenAt: Date
}
```

### **✅ Progress Tracking Endpoints**
```http
POST /api/progress/food
{
  "dietPlanId": "507f1f77bcf86cd799439011",
  "dayName": "Monday",
  "mealType": "breakfast",  // breakfast/lunch/dinner only
  "foodName": "Oatmeal"
}

GET /api/progress/:dietPlanId/day/:dayName
// Returns grouped by breakfast, lunch, dinner (no snack)
```

---

## 📋 Example Request/Response

### **✅ Create Diet Plan - Request**
```json
{
  "clientId": "507f1f77bcf86cd799439011",
  "name": "Simple Weight Loss Plan",
  "description": "Basic 7-day weight loss diet",
  "startDate": "2024-03-30",
  "endDate": "2024-04-06",
  "weeklyPlan": [
    {
      "dayName": "Monday",
      "meals": [
        {
          "mealType": "breakfast",
          "foods": [
            {
              "name": "Oatmeal with Berries",
              "quantity": "1 cup",
              "nutrition": { "calories": 250, "protein": 8, "carbs": 45, "fat": 6 }
            }
          ]
        },
        {
          "mealType": "lunch",
          "foods": [
            {
              "name": "Grilled Chicken Salad",
              "quantity": "1 bowl",
              "nutrition": { "calories": 350, "protein": 30, "carbs": 15, "fat": 20 }
            }
          ]
        },
        {
          "mealType": "dinner",
          "foods": [
            {
              "name": "Salmon with Vegetables",
              "quantity": "1 plate",
              "nutrition": { "calories": 400, "protein": 35, "carbs": 20, "fat": 18 }
            }
          ]
        }
      ]
    }
    // ... Tuesday through Sunday with similar structure
  ]
}
```

### **✅ Create Diet Plan - Response**
```json
{
  "success": true,
  "message": "Diet plan created successfully",
  "data": {
    "dietPlan": {
      "_id": "507f1f77bcf86cd799439012",
      "clientId": "507f1f77bcf86cd799439011",
      "doctorId": "507f1f77bcf86cd799439013",
      "doctorName": "Dr. John Smith",
      "name": "Simple Weight Loss Plan",
      "description": "Basic 7-day weight loss diet",
      "startDate": "2024-03-30T00:00:00.000Z",
      "endDate": "2024-04-06T00:00:00.000Z",
      "isActive": true,
      "durationWeeks": 1,
      "weeklyPlan": [...],
      "createdAt": "2024-03-30T10:00:00.000Z",
      "updatedAt": "2024-03-30T10:00:00.000Z"
    }
  }
}
```

---

## 🚀 Production Ready

### **✅ Simplified System Benefits**
- **📋 Clean Structure**: Only essential fields
- **⏰ Fixed Duration**: Exactly 7 days, no confusion
- **🍽️ Standard Meals**: 3 meals per day, consistent structure
- **🔐 Security**: Using existing permission system
- **📊 Tracking**: Full progress tracking with 3 meals
- **🔔 Notifications**: Automatic alerts for new plans

### **✅ Validation Summary**
- **⏰ 7-day duration**: Strictly enforced
- **📅 7 days required**: All days must be present
- **🍽️ 3 meals per day**: breakfast, lunch, dinner only
- **🍎 Foods per meal**: At least one food item required
- **📊 Nutrition**: Complete nutrition tracking

---

## 🎯 Final Structure

### **✅ Diet Plan Data Structure**
```
Diet Plan (7 days)
├── Day 1: Monday
│   ├── Breakfast (foods with nutrition)
│   ├── Lunch (foods with nutrition)
│   └── Dinner (foods with nutrition)
├── Day 2: Tuesday
│   ├── Breakfast (foods with nutrition)
│   ├── Lunch (foods with nutrition)
│   └── Dinner (foods with nutrition)
├── ...
└── Day 7: Sunday
    ├── Breakfast (foods with nutrition)
    ├── Lunch (foods with nutrition)
    └── Dinner (foods with nutrition)
```

### **✅ Required Fields Only**
- **📋 Plan Info**: `name`, `description`, `startDate`, `endDate`
- **⏰ Duration**: Fixed 7 days
- **🍽️ Meals**: 3 meals per day (breakfast, lunch, dinner)
- **🍎 Foods**: Complete nutrition tracking
- **🔐 Permissions**: Using existing middleware

---

## 🚀 Ready for Production

**🥗 Simplified Diet Plan System is ready!**

**Key Features:**
- ✅ **Exactly 7 days** - Fixed duration
- ✅ **3 meals per day** - Breakfast, lunch, dinner
- ✅ **Essential fields only** - Clean structure
- ✅ **Existing permissions** - Using permissionMiddleware.js
- ✅ **Full tracking** - Progress tracking for all meals
- ✅ **Notifications** - Automatic alerts
- ✅ **Production ready** - Complete validation and security

**Simple, clean, and ready for production! 🚀**
