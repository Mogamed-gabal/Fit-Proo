# 🔄 Workout Plan Scheduler System

## 📋 Overview

The Workout Plan Scheduler automatically manages workout plan activation and deactivation based on dates, ensuring that:

1. **No overlapping workout plans** for any client
2. **Automatic activation** when start date arrives
3. **Automatic deactivation** when end date passes
4. **7-day workout periods** are strictly enforced

---

## 🛠️ Components

### ✅ 1. Model Middleware (WorkoutPlan.js)

**Pre-save middleware:**
```javascript
workoutPlanSchema.pre('save', async function(next) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const startDate = new Date(this.startDate);
  startDate.setHours(0, 0, 0, 0);
  
  const endDate = new Date(this.endDate);
  endDate.setHours(23, 59, 59, 999);
  
  // Auto-manage isActive based on dates
  if (today >= startDate && today <= endDate) {
    this.isActive = true;
  } else {
    this.isActive = false;
  }
  
  next();
});
```

**Static methods:**
- `getActivePlanForClient(clientId)` - Gets current active plan
- `deactivateExpiredPlans()` - Deactivates all expired plans
- `activateFuturePlans()` - Activates plans that should start today

### ✅ 2. Scheduler Utility (workoutPlanScheduler.js)

**Main methods:**
```javascript
// Run the scheduler (call via cron job)
await WorkoutPlanScheduler.runScheduler();

// Get active plan with auto-update
const activePlan = await WorkoutPlanScheduler.getActivePlanForClient(clientId);

// Check if new plan can be created
const canCreate = await WorkoutPlanScheduler.canCreateNewPlan(clientId, startDate, endDate);
```

### ✅ 3. API Routes (scheduler.js)

**Endpoints:**
- `POST /api/scheduler/run` - Manually run scheduler
- `GET /api/scheduler/active-plan/:clientId` - Get active plan for client
- `POST /api/scheduler/check-availability/:clientId` - Check if new plan can be created

---

## 🎯 Business Logic

### ✅ **7-Day Period Enforcement**

1. **No overlapping plans:** Client cannot have multiple plans during the same period
2. **Automatic activation:** Plans become active on their start date
3. **Automatic deactivation:** Plans become inactive after their end date
4. **Strict date checking:** Uses date boundaries (start of day to end of day)

### ✅ **Workflow Example**

```
Day 1: Plan A created (startDate: today, endDate: today + 7 days)
→ Plan A becomes active immediately

Day 2: Try to create Plan B (startDate: Day 3, endDate: Day 10)
→ REJECTED - overlaps with Plan A

Day 8: Plan A automatically becomes inactive
→ Plan A status changes to isActive: false

Day 9: Try to create Plan C (startDate: today, endDate: today + 7 days)
→ ACCEPTED - no overlapping plans
→ Plan C becomes active immediately
```

---

## 📅 Cron Job Setup

### **Recommended Schedule:**

```bash
# Run every day at midnight
0 0 * * * curl -X POST http://localhost:5000/api/scheduler/run \
  -H "Authorization: Bearer <system_token>" \
  -H "Content-Type: application/json"
```

### **Alternative: Node.js Cron**

```javascript
const cron = require('node-cron');
const WorkoutPlanScheduler = require('./utils/workoutPlanScheduler');

// Run every day at midnight
cron.schedule('0 0 * * *', async () => {
  try {
    await WorkoutPlanScheduler.runScheduler();
    console.log('✅ Daily workout plan scheduler completed');
  } catch (error) {
    console.error('🚨 Scheduler error:', error);
  }
});
```

---

## 🛡️ Error Handling

### ✅ **Validation Errors:**
- Overlapping workout plans
- Invalid date ranges
- Client not found or not approved

### ✅ **System Errors:**
- Database connection issues
- Scheduler execution failures
- Date calculation errors

---

## 📊 Monitoring

### ✅ **Scheduler Logs:**
```
🔄 Running workout plan scheduler...
📅 Deactivated 3 expired plans
📅 Activated 2 future plans
✅ Workout plan scheduler completed successfully
```

### ✅ **API Responses:**
```json
{
  "success": true,
  "message": "Workout plan scheduler completed successfully",
  "data": {
    "deactivatedCount": 3,
    "activatedCount": 2,
    "timestamp": "2024-03-30T00:00:00.000Z"
  }
}
```

---

## 🚀 Production Ready Features

### ✅ **Automatic Management:**
- No manual intervention required
- Real-time status updates
- Consistent date handling

### ✅ **Performance Optimized:**
- Efficient database queries
- Batch operations for bulk updates
- Minimal server load

### ✅ **Reliability:**
- Comprehensive error handling
- Transaction safety
- Rollback capabilities

---

## 🎯 Integration Points

### ✅ **Workout Plan Creation:**
- Scheduler runs before creating new plans
- Checks for overlapping periods
- Ensures 7-day rule compliance

### ✅ **Daily Operations:**
- Automatic status updates
- Client active plan queries
- Plan availability checks

---

## 📋 Usage Examples

### **Create New Plan:**
```javascript
// Controller automatically calls scheduler
await WorkoutPlanScheduler.runScheduler();

// Checks for overlapping plans
const canCreate = await WorkoutPlanScheduler.canCreateNewPlan(
  clientId, 
  '2024-03-30', 
  '2024-04-06'
);

if (canCreate) {
  // Create the plan
  const plan = new WorkoutPlan({...});
  await plan.save(); // Pre-save middleware handles isActive
}
```

### **Get Active Plan:**
```javascript
// Always up-to-date active plan
const activePlan = await WorkoutPlanScheduler.getActivePlanForClient(clientId);

if (activePlan) {
  console.log('Active plan:', activePlan.name);
  console.log('Ends on:', activePlan.endDate);
} else {
  console.log('No active plan');
}
```

---

## 🎯 Conclusion

**✅ The Workout Plan Scheduler ensures:**

1. **📅 Strict 7-day periods** - No overlapping workout plans
2. **🔄 Automatic management** - Plans activate/deactivate based on dates
3. **🛡️ Data integrity** - Consistent status across all plans
4. **⚡ Performance** - Optimized database operations
5. **🚀 Production ready** - Comprehensive error handling and monitoring

**System is ready for production deployment! 🚀**
