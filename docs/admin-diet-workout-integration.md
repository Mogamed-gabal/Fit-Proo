# Admin Diet & Workout System Integration Guide

## 📋 Table of Contents
1. [Overview](#overview)
2. [Permission System](#permission-system)
3. [Diet System Admin Integration](#diet-system-admin-integration)
4. [Workout System Admin Integration](#workout-system-admin-integration)
5. [API Endpoints Reference](#api-endpoints-reference)
6. [Frontend Integration Guide](#frontend-integration-guide)
7. [Audit Logging](#audit-logging)
8. [Error Handling](#error-handling)
9. [Data Models](#data-models)

---

## 🎯 Overview

The admin panel has comprehensive control over both diet and workout systems, allowing administrators to manage, monitor, and oversee all fitness-related activities across the platform. This guide details the complete integration between admin functionality and diet/workout management systems.

### **Key Admin Capabilities:**
- ✅ **Full Diet Plan Management** - Create, view, update, delete diet plans
- ✅ **Workout Plan Oversight** - Monitor and manage workout plans (with limitations)
- ✅ **Progress Tracking** - View client progress across diet and workout activities
- ✅ **Template Management** - Manage workout templates (doctor-level access)
- ✅ **Audit Trail** - Complete audit logging for all actions
- ✅ **Client Management** - View and manage client diet/workout assignments

---

## 🔐 Permission System

### **Admin Permissions Matrix**

| Permission | Diet System | Workout System | Level | Description |
|------------|-------------|----------------|-------|-------------|
| `manage_diet_plans` | ✅ Full Access | ❌ N/A | 5 | Complete diet plan operations |
| `create_diet_plan` | ✅ Create | ❌ N/A | 3 | Create new diet plans |
| `update_diet_plan` | ✅ Update | ❌ N/A | 3 | Update existing diet plans |
| `delete_diet_plan` | ✅ Delete | ❌ N/A | 4 | Delete diet plans |
| `view_diet_plan` | ✅ View | ❌ N/A | 2 | View diet plan details |
| `manage_client_workout_plans` | ❌ N/A | ✅ Manage | 3 | Manage client workout plans |
| `view_client_workout_plans` | ❌ N/A | ✅ View | 2 | View workout plans |
| `manage_workout_templates` | ❌ N/A | ⚠️ Doctor Level | 3 | Manage workout templates |

### **Permission Hierarchy**
```
Level 5: System Admin (manage_diet_plans)
Level 4: Manager (delete_diet_plan)
Level 3: Creator (create_diet_plan, update_diet_plan, manage_workout_plans)
Level 2: Viewer (view_diet_plan, view_client_workout_plans)
Level 1: Basic User
```

---

## 🍽️ Diet System Admin Integration

### **Complete Admin Control**

#### **1. Diet Plan Management**
Admins have **full CRUD operations** on all diet plans in the system:

```javascript
// Admin can manage ANY diet plan regardless of doctor assignment
GET    /api/diet-plans              // View all diet plans (admin override)
POST   /api/diet-plans              // Create diet plans for any client
GET    /api/diet-plans/:id          // View any diet plan details
PUT    /api/diet-plans/:id          // Update any diet plan
DELETE /api/diet-plans/:id          // Delete any diet plan
```

#### **2. Client Diet Plan Oversight**
```javascript
// Admin can view diet plans for any client
GET /api/diet-plans/client/:clientId     // All diet plans for client
GET /api/diet-plans/active/:clientId     // Active diet plan for client
GET /api/progress/client/:clientId        // Diet progress for client
```

#### **3. Progress Monitoring**
```javascript
// Admin can monitor progress across all clients
GET /api/progress/:dietPlanId/stats           // Diet plan statistics
GET /api/progress/:dietPlanId/day/:dayName    // Daily progress details
GET /api/progress/:dietPlanId/nutrition       // Nutrition tracking
```

#### **4. Diet Plan Data Structure**
```javascript
{
  "_id": "diet_plan_id",
  "name": "Weight Loss Plan",
  "description": "Low-carb diet plan",
  "doctorId": "doctor_id",
  "doctorName": "Dr. Smith",
  "clientId": "client_id",
  "clientName": "John Doe",
  "weeklyPlan": {
    "Monday": {
      "breakfast": { "food": "Oatmeal", "calories": 250 },
      "lunch": { "food": "Grilled Chicken", "calories": 350 },
      "dinner": { "food": "Salmon", "calories": 400 }
    },
    // ... other days
  },
  "startDate": "2026-05-01",
  "endDate": "2026-05-31",
  "status": "active",
  "createdAt": "2026-05-01T00:00:00.000Z",
  "updatedAt": "2026-05-01T00:00:00.000Z"
}
```

---

## 💪 Workout System Admin Integration

### **Limited Admin Control**

#### **⚠️ Current Limitations**
Admins have **restricted access** to workout system compared to diet system:

- ❌ No `manage_workout_plans` admin permission
- ❌ No `manage_workout_templates` admin permission
- ✅ Can view workout plans via `manage_client_workout_plans`
- ✅ Can manage workout plans using doctor-level permissions

#### **1. Workout Plan Management (Current)**
```javascript
// Admin uses doctor-level permissions for workout management
GET    /api/workout-plans              // View workout plans (filtered)
POST   /api/workout-plans              // Create workout plans
GET    /api/workout-plans/:id          // View workout plan details
PUT    /api/workout-plans/:id          // Update workout plans
DELETE /api/workout-plans/:id          // Delete workout plans
```

#### **2. Client Workout Plan Oversight**
```javascript
// Admin can view workout plans for assigned clients only
GET /api/workout-plans/client/:clientId     // Workout plans for client
GET /api/workout-plans/active/:clientId     // Active workout plan
```

#### **3. Workout Template Management**
```javascript
// Admin manages templates using doctor-level permissions
GET    /api/workout-templates              // View templates
POST   /api/workout-templates              // Create templates
GET    /api/workout-templates/:templateId  // View template
PUT    /api/workout-templates/:templateId  // Update template
DELETE /api/workout-templates/:templateId  // Delete template
```

#### **4. Workout Plan Data Structure**
```javascript
{
  "_id": "workout_plan_id",
  "name": "Strength Training Plan",
  "doctorId": "doctor_id",
  "doctorName": "Dr. Smith",
  "clientId": "client_id",
  "clientName": "John Doe",
  "weeklyPlan": {
    "Monday": {
      "exercises": [
        {
          "name": "Bench Press",
          "sets": 4,
          "reps": 12,
          "weight": 135,
          "restTime": 90,
          "completed": false
        }
      ]
    },
    // ... other days
  },
  "startDate": "2026-05-01",
  "endDate": "2026-05-31",
  "status": "active",
  "createdAt": "2026-05-01T00:00:00.000Z",
  "updatedAt": "2026-05-01T00:00:00.000Z"
}
```

---

## 🔗 API Endpoints Reference

### **Diet System Admin Endpoints**

| Method | Endpoint | Permission | Description | Admin Override |
|--------|----------|------------|-------------|---------------|
| GET | `/api/diet-plans` | `view_diet_plan` | Get all diet plans | ✅ Can view ALL plans |
| POST | `/api/diet-plans` | `create_diet_plan` | Create diet plan | ✅ For any client |
| GET | `/api/diet-plans/:id` | `view_diet_plan` | Get diet plan details | ✅ Any plan |
| PUT | `/api/diet-plans/:id` | `update_diet_plan` | Update diet plan | ✅ Any plan |
| DELETE | `/api/diet-plans/:id` | `delete_diet_plan` | Delete diet plan | ✅ Any plan |
| GET | `/api/diet-plans/client/:clientId` | `view_diet_plan` | Get client diet plans | ✅ Any client |
| GET | `/api/diet-plans/active/:clientId` | `view_diet_plan` | Get active plan | ✅ Any client |

### **Workout System Admin Endpoints**

| Method | Endpoint | Permission | Description | Admin Limitation |
|--------|----------|------------|-------------|------------------|
| GET | `/api/workout-plans` | `view_client_workout_plans` | Get workout plans | ⚠️ Limited access |
| POST | `/api/workout-plans` | `manage_client_workout_plans` | Create workout plan | ⚠️ Doctor level |
| GET | `/api/workout-plans/:id` | `view_client_workout_plans` | Get workout plan | ⚠️ Limited access |
| PUT | `/api/workout-plans/:id` | `manage_client_workout_plans` | Update workout plan | ⚠️ Doctor level |
| DELETE | `/api/workout-plans/:id` | `manage_client_workout_plans` | Delete workout plan | ⚠️ Doctor level |

### **Progress Tracking Endpoints**

| Method | Endpoint | Permission | System | Description |
|--------|----------|------------|--------|-------------|
| GET | `/api/progress/:dietPlanId/stats` | `view_diet_plan` | Diet | Diet plan statistics |
| GET | `/api/progress/:dietPlanId/day/:dayName` | `view_diet_plan` | Diet | Daily progress |
| GET | `/api/progress/:dietPlanId/nutrition` | `view_diet_plan` | Diet | Nutrition tracking |
| GET | `/api/progress/client/:clientId` | `view_diet_plan` | Diet | Client progress |

---

## 🎨 Frontend Integration Guide

### **1. Permission-Based UI Rendering**

```javascript
// Check admin permissions before showing features
const canManageDietPlans = hasPermission('manage_diet_plans');
const canViewDietPlans = hasPermission('view_diet_plan');
const canManageWorkoutPlans = hasPermission('manage_client_workout_plans');
const canManageWorkoutTemplates = hasPermission('manage_workout_templates');

// Render UI based on permissions
{canManageDietPlans && (
  <Button onClick={createDietPlan}>Create Diet Plan</Button>
)}
{canManageWorkoutPlans && (
  <Button onClick={createWorkoutPlan}>Create Workout Plan</Button>
)}
```

### **2. Admin Dashboard Components**

#### **Diet Management Section**
```javascript
// Diet Plan Management Component
const DietPlanManagement = () => {
  const [dietPlans, setDietPlans] = useState([]);
  
  // Fetch all diet plans (admin override)
  const fetchDietPlans = async () => {
    try {
      const response = await api.get('/api/diet-plans');
      setDietPlans(response.data.data);
    } catch (error) {
      console.error('Error fetching diet plans:', error);
    }
  };
  
  return (
    <div>
      <h2>Diet Plan Management</h2>
      {hasPermission('manage_diet_plans') && (
        <CreateDietPlanModal onSuccess={fetchDietPlans} />
      )}
      <DietPlanList plans={dietPlans} />
    </div>
  );
};
```

#### **Workout Management Section**
```javascript
// Workout Plan Management Component
const WorkoutPlanManagement = () => {
  const [workoutPlans, setWorkoutPlans] = useState([]);
  
  const fetchWorkoutPlans = async () => {
    try {
      const response = await api.get('/api/workout-plans');
      setWorkoutPlans(response.data.data);
    } catch (error) {
      console.error('Error fetching workout plans:', error);
    }
  };
  
  return (
    <div>
      <h2>Workout Plan Management</h2>
      {hasPermission('manage_client_workout_plans') && (
        <CreateWorkoutPlanModal onSuccess={fetchWorkoutPlans} />
      )}
      <WorkoutPlanList plans={workoutPlans} />
    </div>
  );
};
```

### **3. Client Overview Integration**

```javascript
// Client Overview Component
const ClientOverview = ({ clientId }) => {
  const [dietPlans, setDietPlans] = useState([]);
  const [workoutPlans, setWorkoutPlans] = useState([]);
  const [progress, setProgress] = useState([]);
  
  useEffect(() => {
    // Fetch client's diet plans
    const fetchClientData = async () => {
      try {
        const [dietRes, workoutRes, progressRes] = await Promise.all([
          api.get(`/api/diet-plans/client/${clientId}`),
          api.get(`/api/workout-plans/client/${clientId}`),
          api.get(`/api/progress/client/${clientId}`)
        ]);
        
        setDietPlans(dietRes.data.data);
        setWorkoutPlans(workoutRes.data.data);
        setProgress(progressRes.data.data);
      } catch (error) {
        console.error('Error fetching client data:', error);
      }
    };
    
    fetchClientData();
  }, [clientId]);
  
  return (
    <div>
      <h3>Client Fitness Overview</h3>
      
      {/* Diet Plans Section */}
      {hasPermission('view_diet_plan') && (
        <Section title="Diet Plans">
          <DietPlanList plans={dietPlans} />
        </Section>
      )}
      
      {/* Workout Plans Section */}
      {hasPermission('view_client_workout_plans') && (
        <Section title="Workout Plans">
          <WorkoutPlanList plans={workoutPlans} />
        </Section>
      )}
      
      {/* Progress Section */}
      {hasPermission('view_diet_plan') && (
        <Section title="Progress Tracking">
          <ProgressChart data={progress} />
        </Section>
      )}
    </div>
  );
};
```

### **4. Permission Hook**

```javascript
// Custom hook for permission checking
const usePermissions = () => {
  const user = useSelector(state => state.auth.user);
  
  const hasPermission = (permission) => {
    if (!user) return false;
    
    // Admin has all permissions
    if (user.role === 'admin') return true;
    
    // Check user's assigned permissions
    return user.permissions?.includes(permission) || false;
  };
  
  return { hasPermission };
};

// Usage in components
const { hasPermission } = usePermissions();
```

---

## 📊 Audit Logging

### **Comprehensive Audit Trail**

All admin actions on diet and workout systems are automatically logged:

#### **Diet Plan Audit Logs**
```javascript
// Example audit log entry
{
  "_id": "audit_id",
  "adminId": "admin_user_id",
  "adminName": "Admin User",
  "actionType": "create_diet_plan",
  "targetType": "DIET_PLAN",
  "targetId": "diet_plan_id",
  "details": {
    "reason": "Created diet plan for client",
    "changes": {
      "oldValues": null,
      "newValues": {
        "name": "Weight Loss Plan",
        "clientId": "client_id"
      }
    }
  },
  "result": "success",
  "ipAddress": "192.168.1.1",
  "timestamp": "2026-05-03T13:00:00.000Z"
}
```

#### **Workout Plan Audit Logs**
```javascript
// Example workout audit log entry
{
  "_id": "audit_id",
  "adminId": "admin_user_id", 
  "adminName": "Admin User",
  "actionType": "create_workout_plan",
  "targetType": "WORKOUT_PLAN",
  "targetId": "workout_plan_id",
  "details": {
    "reason": "Created workout plan for client",
    "changes": {
      "oldValues": null,
      "newValues": {
        "name": "Strength Training",
        "clientId": "client_id"
      }
    }
  },
  "result": "success",
  "ipAddress": "192.168.1.1",
  "timestamp": "2026-05-03T13:00:00.000Z"
}
```

### **Audit Log Access**
```javascript
// Admin can view audit logs
GET /api/admin/audit-logs              // All audit logs
GET /api/admin/audit-logs/diet         // Diet plan logs
GET /api/admin/audit-logs/workout      // Workout plan logs
```

---

## ⚠️ Error Handling

### **Common Error Responses**

#### **Permission Errors**
```javascript
{
  "success": false,
  "error": "Forbidden: You do not have permission to manage_diet_plans",
  "timestamp": "2026-05-03T13:00:00.000Z"
}
```

#### **Validation Errors**
```javascript
{
  "success": false,
  "error": "Please check your input data and try again.",
  "details": {
    "message": "Diet plan name is required",
    "validation": {
      "name": "Diet plan name cannot be empty"
    }
  },
  "timestamp": "2026-05-03T13:00:00.000Z"
}
```

#### **Not Found Errors**
```javascript
{
  "success": false,
  "error": "Diet plan not found",
  "timestamp": "2026-05-03T13:00:00.000Z"
}
```

### **Frontend Error Handling**

```javascript
// API error handling wrapper
const apiCall = async (method, endpoint, data = null) => {
  try {
    const response = await api[method](endpoint, data);
    return response.data;
  } catch (error) {
    if (error.response?.status === 403) {
      // Permission error
      showNotification('You do not have permission for this action', 'error');
    } else if (error.response?.status === 404) {
      // Not found error
      showNotification('Resource not found', 'error');
    } else if (error.response?.status === 400) {
      // Validation error
      const validationErrors = error.response.data.details?.validation;
      showNotification(validationErrors || 'Invalid input data', 'error');
    } else {
      // Generic error
      showNotification('Something went wrong. Please try again.', 'error');
    }
    throw error;
  }
};
```

---

## 📋 Data Models

### **Diet Plan Model**
```javascript
const DietPlanSchema = {
  _id: ObjectId,
  name: String,                    // Diet plan name
  description: String,             // Description
  doctorId: ObjectId,              // Creating doctor
  doctorName: String,              // Doctor name
  clientId: ObjectId,              // Assigned client
  clientName: String,              // Client name
  weeklyPlan: {                    // 7-day meal plan
    Monday: {
      breakfast: { food: String, calories: Number },
      lunch: { food: String, calories: Number },
      dinner: { food: String, calories: Number }
    },
    // ... other days
  },
  startDate: Date,                 // Plan start date
  endDate: Date,                   // Plan end date
  status: String,                  // active, completed, paused
  createdAt: Date,
  updatedAt: Date
};
```

### **Workout Plan Model**
```javascript
const WorkoutPlanSchema = {
  _id: ObjectId,
  name: String,                    // Workout plan name
  description: String,             // Description
  doctorId: ObjectId,              // Creating doctor
  doctorName: String,              // Doctor name
  clientId: ObjectId,              // Assigned client
  clientName: String,              // Client name
  weeklyPlan: {                    // 7-day workout plan
    Monday: {
      exercises: [{
        name: String,             // Exercise name
        sets: Number,             // Number of sets
        reps: Number,             // Number of reps
        weight: Number,           // Weight
        restTime: Number,         // Rest time in seconds
        completed: Boolean        // Completion status
      }]
    },
    // ... other days
  },
  startDate: Date,                 // Plan start date
  endDate: Date,                   // Plan end date
  status: String,                  // active, completed, paused
  createdAt: Date,
  updatedAt: Date
};
```

### **Progress Model**
```javascript
const DietProgressSchema = {
  _id: ObjectId,
  dietPlanId: ObjectId,            // Related diet plan
  clientId: ObjectId,              // Client ID
  date: Date,                      // Progress date
  meals: {                         // Daily meals
    breakfast: { completed: Boolean, timestamp: Date },
    lunch: { completed: Boolean, timestamp: Date },
    dinner: { completed: Boolean, timestamp: Date }
  },
  nutrition: {                      // Nutrition tracking
    caloriesConsumed: Number,
    protein: Number,
    carbs: Number,
    fats: Number
  },
  createdAt: Date,
  updatedAt: Date
};
```

---

## 🚀 Implementation Checklist

### **Frontend Integration Steps**

#### **✅ Phase 1: Permission Integration**
- [ ] Implement permission checking system
- [ ] Create permission-based UI components
- [ ] Add role-based navigation
- [ ] Implement permission hooks

#### **✅ Phase 2: Diet System Integration**
- [ ] Create diet plan management components
- [ ] Implement diet plan CRUD operations
- [ ] Add progress tracking views
- [ ] Create diet plan templates
- [ ] Implement nutrition tracking

#### **✅ Phase 3: Workout System Integration**
- [ ] Create workout plan management components
- [ ] Implement workout plan CRUD operations
- [ ] Add workout template management
- [ ] Create exercise library
- [ ] Implement progress tracking

#### **✅ Phase 4: Client Management**
- [ ] Create client overview dashboard
- [ ] Implement client assignment features
- [ ] Add client progress monitoring
- [ ] Create client analytics
- [ ] Implement client communication

#### **✅ Phase 5: Audit & Monitoring**
- [ ] Create audit log viewer
- [ ] Implement activity monitoring
- [ ] Add reporting features
- [ ] Create admin analytics
- [ ] Implement system health monitoring

---

## 🎯 Best Practices

### **1. Permission Management**
- Always check permissions before rendering UI
- Implement permission-based API calls
- Handle permission errors gracefully
- Provide clear feedback for permission issues

### **2. Data Management**
- Use optimistic updates for better UX
- Implement proper error handling
- Cache frequently accessed data
- Implement real-time updates where possible

### **3. User Experience**
- Provide loading states for all operations
- Use consistent error messaging
- Implement proper confirmation dialogs
- Provide undo functionality where possible

### **4. Security**
- Validate all inputs on both client and server
- Implement proper authentication checks
- Use HTTPS for all API calls
- Implement proper session management

---

## 📞 Support & Troubleshooting

### **Common Issues**

#### **Permission Denied Errors**
- Check user role and permissions
- Verify admin authentication
- Ensure proper permission assignment

#### **API Integration Issues**
- Verify API endpoint URLs
- Check authentication headers
- Validate request/response formats

#### **Data Synchronization**
- Implement proper error handling
- Use retry mechanisms for failed requests
- Implement proper caching strategies

### **Debug Information**
- Enable debug mode in development
- Check browser console for errors
- Monitor network requests
- Review server logs for detailed errors

---

## 📈 Future Enhancements

### **Planned Features**
- [ ] Real-time progress tracking
- [ ] Advanced analytics dashboard
- [ ] Automated meal planning
- [ ] Integration with fitness trackers
- [ ] Mobile app support
- [ ] Video exercise demonstrations
- [ ] AI-powered recommendations

### **System Improvements**
- [ ] Enhanced permission system
- [ ] Better error handling
- [ ] Performance optimizations
- [ ] Improved caching strategies
- [ ] Better mobile responsiveness

---

**This document serves as the complete reference for frontend developers integrating the admin diet and workout management systems. All API endpoints, permissions, data models, and integration patterns are documented here for comprehensive implementation.**
