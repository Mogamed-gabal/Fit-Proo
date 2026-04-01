# 🍽️ Food Image & Recipe Features - Implementation

## 🎯 Overview
Added optional image and recipe fields to food items in diet plans for enhanced user experience.

---

## ✅ Updated Models

### **📋 DietPlan.js - Enhanced Food Schema**
```javascript
// Food item schema for diet plans
const foodSchema = new mongoose.Schema({
  name: String,           // Required
  quantity: String,       // Required
  nutrition: { ... },     // Required
  source: String,         // smart_input/selector/manual
  edamamId: String,       // Edamam API ID
  
  // ✅ NEW: Optional food image
  image: {
    type: String,
    default: null
  },
  
  // ✅ NEW: Optional recipe instructions
  recipe: {
    type: String,
    default: null,
    maxlength: [1000, 'Recipe cannot exceed 1000 characters']
  }
});
```

### **📊 DietProgress.js - Enhanced Tracking**
```javascript
{
  clientId: ObjectId,
  dietPlanId: ObjectId,
  dayName: String,
  mealType: String,
  foodName: String,
  nutrition: { ... },
  
  // ✅ NEW: Optional food image (copied from original food)
  image: {
    type: String,
    default: null
  },
  
  // ✅ NEW: Optional recipe instructions (copied from original food)
  recipe: {
    type: String,
    default: null,
    maxlength: [1000, 'Recipe cannot exceed 1000 characters']
  },
  
  isEaten: Boolean,
  eatenAt: Date
}
```

---

## 🎮 Updated Controllers

### **✅ DietPlanController.js - Enhanced Validation**
```javascript
// Validate each food item
for (const food of meal.foods) {
  if (!food.name || !food.quantity) {
    return res.status(400).json({
      error: `Each food must have a name and quantity.`
    });
  }

  // ✅ NEW: Validate optional image field
  if (food.image && typeof food.image !== 'string') {
    return res.status(400).json({
      error: `Food image must be a string URL.`
    });
  }

  // ✅ NEW: Validate optional recipe field
  if (food.recipe && typeof food.recipe !== 'string') {
    return res.status(400).json({
      error: `Food recipe must be a string.`
    });
  }

  if (food.recipe && food.recipe.length > 1000) {
    return res.status(400).json({
      error: `Food recipe cannot exceed 1000 characters.`
    });
  }
}
```

### **✅ DietProgressController.js - Enhanced Tracking**
```javascript
// Create progress entry with image and recipe
progress = new DietProgress({
  clientId,
  dietPlanId,
  dayName,
  mealType,
  foodName,
  nutrition: food.nutrition || { calories: 0, protein: 0, carbs: 0, fat: 0 },
  image: food.image || null,      // ✅ NEW: Copy image from original food
  recipe: food.recipe || null    // ✅ NEW: Copy recipe from original food
});

// ✅ NEW: Include image and recipe in response
progressEntries.forEach(entry => {
  const mealData = {
    foodName: entry.foodName,
    nutrition: entry.nutrition,
    image: entry.image,          // ✅ NEW: Include image
    recipe: entry.recipe,        // ✅ NEW: Include recipe
    eatenAt: entry.eatenAt
  };
});
```

---

## 🛣️ Enhanced API Responses

### **✅ Create Diet Plan - Enhanced Request**
```json
{
  "clientId": "507f1f77bcf86cd799439011",
  "name": "Weight Loss Plan",
  "description": "7-day weight loss diet",
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
              "nutrition": { "calories": 250, "protein": 8, "carbs": 45, "fat": 6 },
              "source": "manual",
              
              // ✅ NEW: Optional image URL
              "image": "https://example.com/images/oatmeal-berries.jpg",
              
              // ✅ NEW: Optional recipe instructions
              "recipe": "Cook oats with milk for 5 minutes, add fresh berries and honey. Serve warm."
            }
          ]
        },
        {
          "mealType": "lunch",
          "foods": [
            {
              "name": "Grilled Chicken Salad",
              "quantity": "1 bowl",
              "nutrition": { "calories": 350, "protein": 30, "carbs": 15, "fat": 20 },
              "source": "manual",
              "image": null,            // Optional - can be null
              "recipe": null            // Optional - can be null
            }
          ]
        },
        {
          "mealType": "dinner",
          "foods": [
            {
              "name": "Salmon with Vegetables",
              "quantity": "1 plate",
              "nutrition": { "calories": 400, "protein": 35, "carbs": 20, "fat": 18 },
              "source": "smart_input",
              "image": "https://edamam.com/images/salmon-veggies.jpg",
              "recipe": "Season salmon with salt and pepper. Grill for 4 minutes per side. Serve with steamed vegetables."
            }
          ]
        }
      ]
    }
  ]
}
```

### **✅ Get Daily Progress - Enhanced Response**
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
            "nutrition": { "calories": 250, "protein": 8, "carbs": 45, "fat": 6 },
            "image": "https://example.com/images/oatmeal-berries.jpg",  // ✅ NEW
            "recipe": "Cook oats with milk for 5 minutes...",           // ✅ NEW
            "eatenAt": "2024-03-30T08:30:00.000Z"
          }
        ],
        "notEaten": [
          {
            "foodName": "Greek Yogurt",
            "nutrition": { "calories": 150, "protein": 15, "carbs": 8, "fat": 2 },
            "image": null,                                          // ✅ NEW
            "recipe": null,                                          // ✅ NEW
            "eatenAt": null
          }
        ]
      },
      "lunch": {
        "eaten": [],
        "notEaten": [...]
      },
      "dinner": {
        "eaten": [...],
        "notEaten": [...]
      }
    },
    "dailyTotals": {
      "calories": 250,
      "protein": 8,
      "carbs": 45,
      "fat": 6
    },
    "totalFoods": 8,
    "eatenFoods": 1,
    "completionRate": 12.5
  }
}
```

---

## 🔧 Validation Rules

### **✅ Image Field Validation**
- **Type**: String (URL)
- **Required**: No (optional)
- **Validation**: Must be string if provided
- **Default**: null

### **✅ Recipe Field Validation**
- **Type**: String
- **Required**: No (optional)
- **Validation**: Must be string if provided
- **Length**: Maximum 1000 characters
- **Default**: null

---

## 📊 Enhanced User Experience

### **✅ For Doctors**
- **📸 Add Images**: Upload food images for better visualization
- **📝 Add Recipes**: Provide cooking instructions
- **🍎 Smart Input**: Edamam API integration with images
- **📋 Manual Entry**: Add custom images and recipes

### **✅ For Clients**
- **🖼️ Visual Food Guide**: See images of meals
- **📖 Recipe Instructions**: Know how to prepare meals
- **📱 Better Tracking**: Visual progress with images
- **🍽️ Enhanced Experience**: More engaging meal planning

---

## 🎯 Use Cases

### **✅ Complete Meal Information**
```json
{
  "name": "Mediterranean Quinoa Bowl",
  "quantity": "1 bowl",
  "nutrition": { "calories": 420, "protein": 18, "carbs": 52, "fat": 16 },
  "image": "https://example.com/images/quinoa-bowl.jpg",
  "recipe": "Cook quinoa according to package directions. Top with grilled vegetables, feta cheese, and olive oil. Serve with lemon wedge."
}
```

### **✅ Minimal Information (Still Works)**
```json
{
  "name": "Apple",
  "quantity": "1 medium",
  "nutrition": { "calories": 95, "protein": 0, "carbs": 25, "fat": 0 },
  "image": null,
  "recipe": null
}
```

---

## 🚀 Benefits

### **✅ Enhanced Experience**
- **🖼️ Visual Appeal**: Food images make meals more appealing
- **📖 Clear Instructions**: Recipes help with meal preparation
- **📱 Better Engagement**: More interactive meal planning
- **🎯 Professional Look**: Complete meal information

### **✅ Backward Compatibility**
- **✅ Existing Plans**: Work without images/recipes
- **✅ Optional Fields**: No breaking changes
- **✅ Progressive Enhancement**: Add details as needed
- **✅ Flexible Implementation**: Use with or without images

---

## 📋 Implementation Summary

### **✅ What Was Added:**
1. **🖼️ Image Field**: Optional food image URL
2. **📖 Recipe Field**: Optional cooking instructions
3. **🔧 Enhanced Validation**: Proper field validation
4. **📊 Enhanced Responses**: Include images/recipes in API responses
5. **🔄 Progress Tracking**: Copy images/recipes to progress entries

### **✅ Files Updated:**
- **DietPlan.js**: Added image and recipe to food schema
- **DietProgress.js**: Added image and recipe to progress schema
- **DietPlanController.js**: Enhanced validation and copying
- **DietProgressController.js**: Enhanced responses with images/recipes

---

## 🎯 Production Ready

**🍽️ Food Image & Recipe Features are ready for production!**

**Key Features:**
- ✅ **Optional Fields**: No breaking changes
- ✅ **Proper Validation**: Type and length validation
- ✅ **Enhanced UX**: Visual meal planning
- ✅ **Backward Compatible**: Works with existing data
- ✅ **Complete Tracking**: Images/recipes in progress tracking
- ✅ **Professional API**: Enhanced responses

**Enhanced diet planning with images and recipes! 🚀**
