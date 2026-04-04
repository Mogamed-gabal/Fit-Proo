# 🔧 Meal Video Link Addition - Arabic Documentation

## 🎯 المطلوب
إضافة `videoLink` اختياري لكل meal مش بس لـ diet plan ككل.

---

## ✅ التعديل اللي تم

### **إضافة videoLink field لـ meal schema**
```javascript
// Meal schema for diet plans
const mealSchema = new mongoose.Schema({
  type: {
    type: String,
    required: [true, 'Meal type is required'],
    enum: ['breakfast', 'lunch', 'dinner', 'snack']
  },
  food: [foodSchema],
  totalCalories: {
    type: Number,
    default: 0,
    min: [0, 'Total calories cannot be negative']
  },
  totalProtein: {
    type: Number,
    default: 0,
    min: [0, 'Total protein cannot be negative']
  },
  totalCarbs: {
    type: Number,
    default: 0,
    min: [0, 'Total carbs cannot be negative']
  },
  totalFat: {
    type: Number,
    default: 0,
    min: [0, 'Total fat cannot be negative']
  },
  // Optional video link for the meal
  videoLink: {
    type: String,
    default: null,
    validate: {
      validator: function(v) {
        // Allow null/empty or valid URL
        if (!v) return true;
        // Basic URL validation
        return /^https?:\/\/.+/.test(v);
      },
      message: 'Meal video link must be a valid URL'
    }
  }
}, { _id: false });
```

---

## 📋 الخصائص

### **✅ Optional Field**
- `default: null` - مش مطلوب
- ممكن يتبعت أو يترك فاضي
- لكل meal بشكل منفصل

### **✅ URL Validation**
- بيستقبل بس URLs صحيحة
- `http://` أو `https://`
- لو مش URL صحيح بيرجع error

### **✅ Flexible**
- ممكن يكون أي نوع من الفيديوهات
- YouTube, Vimeo, أو أي فيديو URL
- مش محدد نوع معين

---

## 🎯 Usage Examples

### **✅ Meal مع Video Link**
```json
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
  "videoLink": "https://www.youtube.com/watch?v=breakfast-example"
}
```

### **✅ Meal بدون Video Link**
```json
{
  "type": "lunch",
  "food": [
    {
      "name": "grilled chicken",
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
  "totalFat": 3,
  "videoLink": null
}
```

### **✅ Snack مع Video Link**
```json
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
  "videoLink": "https://vimeo.com/snack-example"
}
```

---

## 📋 Full Diet Plan Example

### **✅ Diet Plan مع Meals وفيديوهات**
```json
{
  "clientId": "60f1b2c3d4e5f6789012345",
  "name": "Complete Meal Plan",
  "description": "Diet plan with video instructions for each meal",
  "startDate": "2024-01-01",
  "endDate": "2024-01-07",
  "weeklyPlan": [
    {
      "dayName": "Day 1",
      "dayNumber": 1,
      "meals": [
        {
          "type": "breakfast",
          "food": [...],
          "totalCalories": 350,
          "totalProtein": 20,
          "totalCarbs": 40,
          "totalFat": 12,
          "videoLink": "https://youtube.com/breakfast"
        },
        {
          "type": "lunch",
          "food": [...],
          "totalCalories": 450,
          "totalProtein": 35,
          "totalCarbs": 30,
          "totalFat": 18,
          "videoLink": "https://youtube.com/lunch"
        },
        {
          "type": "dinner",
          "food": [...],
          "totalCalories": 500,
          "totalProtein": 40,
          "totalCarbs": 45,
          "totalFat": 20,
          "videoLink": null
        },
        {
          "type": "snack",
          "food": [...],
          "totalCalories": 150,
          "totalProtein": 10,
          "totalCarbs": 15,
          "totalFat": 5,
          "videoLink": "https://youtube.com/snack"
        }
      ]
    }
  ]
}
```

---

## 🚀 الفوائد

### **✅ Enhanced User Experience**
- ممكن يضيف فيديو شرح لكل وجبة
- زيادة engagement مع الـ client
- سهولة في الشرح والتوضيح لكل meal

### **✅ Granular Control**
- كل meal ممكن يكون فيه فيديو
- مش لازم كل الوجبات تكون فيها فيديوهات
- مرونة في اختيار الوجبات اللي فيها فيديوهات

### **✅ Validation**
- يتأكد إن الـ URL صحيح
- error message واضح
- مش بيقبل invalid URLs

---

## ❌ Error Examples

### **✅ Invalid URL Error**
```json
{
  "success": false,
  "error": "Validation failed: meals.0.videoLink: Meal video link must be a valid URL"
}
```

---

## 🎉 النتيجة

**🔥 تم إضافة videoLink field لكل meal بنجاح!**

- ✅ **Per-meal videos**: كل meal ممكن يكون فيه فيديو
- ✅ **Optional field**: مش مطلوب
- ✅ **URL validation**: بس URLs صحيحة
- ✅ **Flexible**: أي نوع فيديو
- ✅ **User-friendly**: error messages واضحة

**النظام دلوقتي يدعم إضافة فيديوهات لكل وجبة على حدة! 🚀**
