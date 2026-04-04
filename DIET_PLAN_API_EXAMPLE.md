# 📋 Diet Plan API Example - Arabic Documentation

## 🎯 مثال JSON لإنشاء Diet Plan جديد

---

## ✅ Complete Example مع كل المميزات

### **POST /api/diet-plans**

```json
{
  "clientId": "60f1b2c3d4e5f6789012345",
  "name": "Complete Weight Loss Plan",
  "description": "Balanced diet plan for weight loss with video instructions",
  "startDate": "2024-01-01",
  "endDate": "2024-01-07",
  "weeklyPlan": [
    {
      "dayName": "Day 1",
      "dayNumber": 1,
      "meals": [
        {
          "type": "breakfast",
          "food": [
            {
              "name": "oatmeal with berries",
              "calories": 280,
              "protein": 8,
              "carbs": 45,
              "fat": 6,
              "source": "manual",
              "image": "https://example.com/oatmeal.jpg",
              "recipe": "Cook oats with water, add mixed berries and honey"
            },
            {
              "name": "green tea",
              "calories": 2,
              "protein": 0,
              "carbs": 0,
              "fat": 0,
              "source": "manual"
            }
          ],
          "totalCalories": 282,
          "totalProtein": 8,
          "totalCarbs": 45,
          "totalFat": 6,
          "videoLink": "https://www.youtube.com/watch?v=breakfast-example"
        },
        {
          "type": "lunch",
          "food": [
            {
              "name": "grilled chicken breast",
              "calories": 165,
              "protein": 31,
              "carbs": 0,
              "fat": 3.6,
              "source": "manual"
            },
            {
              "name": "brown rice",
              "calories": 216,
              "protein": 5,
              "carbs": 45,
              "fat": 1.8,
              "source": "manual"
            },
            {
              "name": "steamed broccoli",
              "calories": 55,
              "protein": 3.7,
              "carbs": 11,
              "fat": 0.6,
              "source": "manual"
            }
          ],
          "totalCalories": 436,
          "totalProtein": 39.7,
          "totalCarbs": 56,
          "totalFat": 6,
          "videoLink": "https://www.youtube.com/watch?v=lunch-example"
        },
        {
          "type": "dinner",
          "food": [
            {
              "name": "salmon fillet",
              "calories": 367,
              "protein": 40,
              "carbs": 0,
              "fat": 22,
              "source": "manual"
            },
            {
              "name": "sweet potato",
              "calories": 180,
              "protein": 4,
              "carbs": 41,
              "fat": 0.3,
              "source": "manual"
            },
            {
              "name": "asparagus",
              "calories": 27,
              "protein": 3,
              "carbs": 5,
              "fat": 0.2,
              "source": "manual"
            }
          ],
          "totalCalories": 574,
          "totalProtein": 47,
          "totalCarbs": 46,
          "totalFat": 22.5,
          "videoLink": null
        },
        {
          "type": "snack",
          "food": [
            {
              "name": "protein shake",
              "calories": 120,
              "protein": 25,
              "carbs": 3,
              "fat": 2,
              "source": "manual"
            }
          ],
          "totalCalories": 120,
          "totalProtein": 25,
          "totalCarbs": 3,
          "totalFat": 2,
          "videoLink": "https://vimeo.com/snack-example"
        }
      ],
      "dailyTotals": {
        "calories": 1412,
        "protein": 119.7,
        "carbs": 150,
        "fat": 36.5
      }
    },
    {
      "dayName": "Day 2",
      "dayNumber": 2,
      "meals": [
        {
          "type": "breakfast",
          "food": [
            {
              "name": "scrambled eggs",
              "calories": 220,
              "protein": 18,
              "carbs": 2,
              "fat": 15,
              "source": "manual"
            },
            {
              "name": "whole wheat toast",
              "calories": 80,
              "protein": 4,
              "carbs": 15,
              "fat": 1,
              "source": "manual"
            }
          ],
          "totalCalories": 300,
          "totalProtein": 22,
          "totalCarbs": 17,
          "totalFat": 16,
          "videoLink": "https://www.youtube.com/watch?v=breakfast-day2"
        },
        {
          "type": "lunch",
          "food": [
            {
              "name": "turkey sandwich",
              "calories": 320,
              "protein": 24,
              "carbs": 30,
              "fat": 12,
              "source": "manual"
            }
          ],
          "totalCalories": 320,
          "totalProtein": 24,
          "totalCarbs": 30,
          "totalFat": 12,
          "videoLink": null
        },
        {
          "type": "dinner",
          "food": [
            {
              "name": "beef stir-fry",
              "calories": 350,
              "protein": 25,
              "carbs": 35,
              "fat": 18,
              "source": "manual"
            }
          ],
          "totalCalories": 350,
          "totalProtein": 25,
          "totalCarbs": 35,
          "totalFat": 18,
          "videoLink": "https://www.youtube.com/watch?v=dinner-day2"
        }
      ],
      "dailyTotals": {
        "calories": 970,
        "protein": 71,
        "carbs": 82,
        "fat": 46
      }
    }
  ]
}
```

---

## 📋 Simple Example (بدل فيديوهات)

```json
{
  "clientId": "60f1b2c3d4e5f6789012345",
  "name": "Simple Diet Plan",
  "description": "Basic diet plan without videos",
  "startDate": "2024-01-01",
  "endDate": "2024-01-03",
  "weeklyPlan": [
    {
      "dayName": "Day 1",
      "dayNumber": 1,
      "meals": [
        {
          "type": "breakfast",
          "food": [
            {
              "name": "oatmeal",
              "calories": 150,
              "protein": 5,
              "carbs": 27,
              "fat": 3,
              "source": "manual"
            }
          ],
          "totalCalories": 150,
          "totalProtein": 5,
          "totalCarbs": 27,
          "totalFat": 3,
          "videoLink": null
        },
        {
          "type": "lunch",
          "food": [
            {
              "name": "chicken salad",
              "calories": 250,
              "protein": 30,
              "carbs": 10,
              "fat": 8,
              "source": "manual"
            }
          ],
          "totalCalories": 250,
          "totalProtein": 30,
          "totalCarbs": 10,
          "totalFat": 8,
          "videoLink": null
        },
        {
          "type": "dinner",
          "food": [
            {
              "name": "grilled fish",
              "calories": 200,
              "protein": 35,
              "carbs": 0,
              "fat": 5,
              "source": "manual"
            }
          ],
          "totalCalories": 200,
          "totalProtein": 35,
          "totalCarbs": 0,
          "totalFat": 5,
          "videoLink": null
        }
      ],
      "dailyTotals": {
        "calories": 600,
        "protein": 70,
        "carbs": 37,
        "fat": 16
      }
    },
    {
      "dayName": "Day 2",
      "dayNumber": 2,
      "meals": [
        {
          "type": "breakfast",
          "food": [
            {
              "name": "eggs",
              "calories": 140,
              "protein": 12,
              "carbs": 1,
              "fat": 10,
              "source": "manual"
            }
          ],
          "totalCalories": 140,
          "totalProtein": 12,
          "totalCarbs": 1,
          "totalFat": 10,
          "videoLink": null
        },
        {
          "type": "lunch",
          "food": [
            {
              "name": "rice and beans",
              "calories": 300,
              "protein": 12,
              "carbs": 50,
              "fat": 3,
              "source": "manual"
            }
          ],
          "totalCalories": 300,
          "totalProtein": 12,
          "totalCarbs": 50,
          "totalFat": 3,
          "videoLink": null
        },
        {
          "type": "snack",
          "food": [
            {
              "name": "apple",
              "calories": 95,
              "protein": 0.5,
              "carbs": 25,
              "fat": 0.3,
              "source": "manual"
            }
          ],
          "totalCalories": 95,
          "totalProtein": 0.5,
          "totalCarbs": 25,
          "totalFat": 0.3,
          "videoLink": "https://www.youtube.com/watch?v=snack-example"
        }
      ],
      "dailyTotals": {
        "calories": 535,
        "protein": 24.5,
        "carbs": 76,
        "fat": 13.3
      }
    }
  ]
}
```

---

## 📋 Minimal Example (3 أيام بس)

```json
{
  "clientId": "60f1b2c3d4e5f6789012345",
  "name": "3-Day Quick Plan",
  "description": "Simple 3-day diet plan",
  "startDate": "2024-01-01",
  "endDate": "2024-01-03",
  "weeklyPlan": [
    {
      "dayName": "Day 1",
      "dayNumber": 1,
      "meals": [
        {
          "type": "breakfast",
          "food": [
            {
              "name": "protein shake",
              "calories": 200,
              "protein": 25,
              "carbs": 10,
              "fat": 5,
              "source": "manual"
            }
          ],
          "totalCalories": 200,
          "totalProtein": 25,
          "totalCarbs": 10,
          "totalFat": 5,
          "videoLink": null
        },
        {
          "type": "lunch",
          "food": [
            {
              "name": "chicken breast",
              "calories": 165,
              "protein": 31,
              "carbs": 0,
              "fat": 3.6,
              "source": "manual"
            }
          ],
          "totalCalories": 165,
          "totalProtein": 31,
          "totalCarbs": 0,
          "totalFat": 3.6,
          "videoLink": null
        },
        {
          "type": "dinner",
          "food": [
            {
              "name": "salad",
              "calories": 150,
              "protein": 8,
              "carbs": 12,
              "fat": 6,
              "source": "manual"
            }
          ],
          "totalCalories": 150,
          "totalProtein": 8,
          "totalCarbs": 12,
          "totalFat": 6,
          "videoLink": null
        }
      ],
      "dailyTotals": {
        "calories": 515,
        "protein": 64,
        "carbs": 22,
        "fat": 14.6
      }
    },
    {
      "dayName": "Day 2",
      "dayNumber": 2,
      "meals": [
        {
          "type": "breakfast",
          "food": [
            {
              "name": "oatmeal",
              "calories": 150,
              "protein": 5,
              "carbs": 27,
              "fat": 3,
              "source": "manual"
            }
          ],
          "totalCalories": 150,
          "totalProtein": 5,
          "totalCarbs": 27,
          "totalFat": 3,
          "videoLink": null
        },
        {
          "type": "lunch",
          "food": [
            {
              "name": "tuna sandwich",
              "calories": 280,
              "protein": 20,
              "carbs": 30,
              "fat": 8,
              "source": "manual"
            }
          ],
          "totalCalories": 280,
          "totalProtein": 20,
          "totalCarbs": 30,
          "totalFat": 8,
          "videoLink": null
        },
        {
          "type": "dinner",
          "food": [
            {
              "name": "pasta",
              "calories": 300,
              "protein": 12,
              "carbs": 50,
              "fat": 8,
              "source": "manual"
            }
          ],
          "totalCalories": 300,
          "totalProtein": 12,
          "totalCarbs": 50,
          "totalFat": 8,
          "videoLink": null
        }
      ],
      "dailyTotals": {
        "calories": 730,
        "protein": 37,
        "carbs": 107,
        "fat": 19
      }
    },
    {
      "dayName": "Day 3",
      "dayNumber": 3,
      "meals": [
        {
          "type": "breakfast",
          "food": [
            {
              "name": "eggs",
              "calories": 140,
              "protein": 12,
              "carbs": 1,
              "fat": 10,
              "source": "manual"
            }
          ],
          "totalCalories": 140,
          "totalProtein": 12,
          "totalCarbs": 1,
          "totalFat": 10,
          "videoLink": null
        },
        {
          "type": "lunch",
          "food": [
            {
              "name": "chicken salad",
              "calories": 250,
              "protein": 30,
              "carbs": 10,
              "fat": 8,
              "source": "manual"
            }
          ],
          "totalCalories": 250,
          "totalProtein": 30,
          "totalCarbs": 10,
          "totalFat": 8,
          "videoLink": null
        },
        {
          "type": "snack",
          "food": [
            {
              "name": "protein bar",
              "calories": 200,
              "protein": 15,
              "carbs": 20,
              "fat": 8,
              "source": "manual"
            }
          ],
          "totalCalories": 200,
          "totalProtein": 15,
          "totalCarbs": 20,
          "totalFat": 8,
          "videoLink": "https://www.youtube.com/watch?v=snack-day3"
        }
      ],
      "dailyTotals": {
        "calories": 590,
        "protein": 57,
        "carbs": 31,
        "fat": 26
      }
    }
  ]
}
```

---

## 📋 Expected Response

### **✅ Success Response**
```json
{
  "success": true,
  "message": "Diet plan created successfully",
  "data": {
    "dietPlan": {
      "_id": "60f1b2c3d4e5f6789012345",
      "clientId": "60f1b2c3d4e5f6789012345",
      "doctorId": "60f1b2c3d4e5f6789012346",
      "doctorName": "Dr. John Doe",
      "name": "Complete Weight Loss Plan",
      "description": "Balanced diet plan for weight loss with video instructions",
      "startDate": "2024-01-01T00:00:00.000Z",
      "endDate": "2024-01-07T00:00:00.000Z",
      "weeklyPlan": [...],
      "videoLink": null,
      "isActive": true,
      "durationWeeks": 7,
      "createdAt": "2024-01-01T10:30:00.000Z",
      "updatedAt": "2024-01-01T10:30:00.000Z"
    }
  }
}
```

---

## 🎯 شرح الحقول

### **Required Fields:**
- `clientId` - Client ID (ObjectId)
- `name` - Diet plan name
- `startDate` - Start date (Date)
- `endDate` - End date (Date)
- `weeklyPlan` - Array of daily plans

### **Optional Fields:**
- `description` - Diet plan description
- `videoLink` - Diet plan video link

### **Weekly Plan Structure:**
- `dayName` - Day name (flexible)
- `dayNumber` - Day number (required)
- `meals` - Array of meals

### **Meal Structure:**
- `type` - Meal type: 'breakfast', 'lunch', 'dinner', 'snack'
- `food` - Array of food items
- `videoLink` - Optional meal video link

### **Food Item Structure:**
- `name` - Food name (required)
- `calories` - Calories (required)
- `protein` - Protein (required)
- `carbs` - Carbs (required)
- `fat` - Fat (required)
- `source` - Source: 'smart_input', 'selector', 'manual'
- `image` - Optional food image URL
- `recipe` - Optional recipe instructions

---

## 🚀 ملاحظات هامة

### **✅ المرونة:**
- أي عدد من الأيام (1-30)
- أي عدد من الوجبات (مش محدد)
- أي أسماء للأيام (مش محددة)
- فيديوهات اختيارية لكل meal

### **✅ Validation:**
- كل الحقول المطلوبة متحقق منها
- URLs متحقق منها
- مش بيقبل invalid data

### **✅ Calculations:**
- الـ totals بتتحسب أوتوماتيك
- meal totals بتتحكم
- daily totals بتتحكم
