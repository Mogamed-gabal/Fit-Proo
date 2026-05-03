# Admin Monitoring System - Diet & Workout Oversight

## 📋 Table of Contents
1. [Overview](#overview)
2. [Permission Requirements](#permission-requirements)
3. [Diet Plan Monitoring](#diet-plan-monitoring)
4. [Workout Plan Monitoring](#workout-plan-monitoring)
5. [Progress Tracking](#progress-tracking)
6. [Client Overview](#client-overview)
7. [Analytics & Statistics](#analytics--statistics)
8. [API Endpoints](#api-endpoints)
9. [Frontend Integration](#frontend-integration)
10. [Data Models](#data-models)

---

## 🎯 Overview

The admin monitoring system provides comprehensive oversight of all diet and workout activities across the platform. Admins can view plans, track progress, monitor compliance, and analyze performance without any creation, editing, or deletion capabilities.

### **Monitoring Capabilities:**
- ✅ **View All Diet Plans** - Complete visibility into all client diet plans
- ✅ **View All Workout Plans** - Monitor workout plan assignments and progress
- ✅ **Progress Tracking** - Real-time progress monitoring across all clients
- ✅ **Status Monitoring** - Track plan status (active, completed, paused)
- ✅ **Compliance Analytics** - Monitor client adherence to plans
- ✅ **Performance Metrics** - Analyze effectiveness of diet and workout programs

---

## 🔐 Permission Requirements

### **Monitoring Permissions Matrix**

| Permission | Diet Monitoring | Workout Monitoring | Level | Description |
|------------|-----------------|-------------------|-------|-------------|
| `view_diet_plan` | ✅ All Diet Plans | ❌ N/A | 2 | View any diet plan details |
| `view_client_workout_plans` | ❌ N/A | ✅ Assigned Workout Plans | 2 | View assigned workout plans |
| `read_dashboard` | ✅ Dashboard Access | ✅ Dashboard Access | 2 | Access admin monitoring dashboard |
| `view_system_reports` | ✅ Analytics | ✅ Analytics | 2 | View system-wide reports |

### **Permission Hierarchy for Monitoring**
```
Level 2: Viewer (All monitoring permissions)
Level 1: Basic User (Limited access)
```

---

## 🍽️ Diet Plan Monitoring

### **1. View All Diet Plans**

Admin can view **all diet plans** in the system regardless of doctor assignment:

```javascript
// Get all diet plans with pagination and filtering
GET /api/diet-plans?page=1&limit=20&status=active&search=weight

// Response Structure
{
  "success": true,
  "data": {
    "dietPlans": [
      {
        "_id": "diet_plan_id",
        "name": "Weight Loss Plan",
        "description": "Low-carb diet for weight management",
        "doctorId": "doctor_id",
        "doctorName": "Dr. Sarah Smith",
        "clientId": "client_id",
        "clientName": "John Doe",
        "status": "active",
        "startDate": "2026-05-01",
        "endDate": "2026-05-31",
        "progress": {
          "completedDays": 12,
          "totalDays": 31,
          "completionRate": 38.7
        },
        "createdAt": "2026-05-01T00:00:00.000Z",
        "updatedAt": "2026-05-03T13:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 150,
      "pages": 8
    }
  }
}
```

### **2. Diet Plan Details Monitoring**

```javascript
// View specific diet plan details
GET /api/diet-plans/:id

// Response Structure
{
  "success": true,
  "data": {
    "_id": "diet_plan_id",
    "name": "Weight Loss Plan",
    "description": "Comprehensive low-carb diet plan",
    "doctorId": "doctor_id",
    "doctorName": "Dr. Sarah Smith",
    "clientId": "client_id",
    "clientName": "John Doe",
    "weeklyPlan": {
      "Monday": {
        "breakfast": { 
          "food": "Oatmeal with berries", 
          "calories": 250,
          "protein": 8,
          "carbs": 35,
          "fats": 6
        },
        "lunch": { 
          "food": "Grilled chicken salad", 
          "calories": 350,
          "protein": 30,
          "carbs": 15,
          "fats": 20
        },
        "dinner": { 
          "food": "Salmon with vegetables", 
          "calories": 400,
          "protein": 35,
          "carbs": 20,
          "fats": 25
        }
      },
      // ... other days
    },
    "startDate": "2026-05-01",
    "endDate": "2026-05-31",
    "status": "active",
    "createdAt": "2026-05-01T00:00:00.000Z",
    "updatedAt": "2026-05-03T13:00:00.000Z"
  }
}
```

### **3. Client Diet Plans Overview**

```javascript
// View all diet plans for a specific client
GET /api/diet-plans/client/:clientId

// Response Structure
{
  "success": true,
  "data": {
    "clientInfo": {
      "clientId": "client_id",
      "clientName": "John Doe",
      "email": "john@example.com",
      "currentWeight": 85.5,
      "targetWeight": 75.0
    },
    "dietPlans": [
      {
        "_id": "diet_plan_id",
        "name": "Weight Loss Plan",
        "status": "active",
        "progress": {
          "completedDays": 12,
          "totalDays": 31,
          "completionRate": 38.7
        },
        "startDate": "2026-05-01",
        "endDate": "2026-05-31"
      }
    ],
    "statistics": {
      "totalPlans": 3,
      "activePlans": 1,
      "completedPlans": 2,
      "averageCompletionRate": 75.3
    }
  }
}
```

### **4. Active Diet Plan Monitoring**

```javascript
// Get currently active diet plan for client
GET /api/diet-plans/active/:clientId

// Response Structure
{
  "success": true,
  "data": {
    "_id": "diet_plan_id",
    "name": "Weight Loss Plan",
    "status": "active",
    "daysRemaining": 19,
    "progress": {
      "completedDays": 12,
      "totalDays": 31,
      "completionRate": 38.7,
      "currentWeek": 2
    },
    "weeklyProgress": [
      { "week": 1, "completionRate": 85.7 },
      { "week": 2, "completionRate": 71.4 }
    ]
  }
}
```

---

## 💪 Workout Plan Monitoring

### **1. View Workout Plans (Limited Access)**

Admin can view workout plans based on assigned permissions:

```javascript
// Get workout plans (based on admin assignments)
GET /api/workout-plans?page=1&limit=20&status=active

// Response Structure
{
  "success": true,
  "data": {
    "workoutPlans": [
      {
        "_id": "workout_plan_id",
        "name": "Strength Training Program",
        "description": "Full body strength training",
        "doctorId": "doctor_id",
        "doctorName": "Dr. Mike Johnson",
        "clientId": "client_id",
        "clientName": "John Doe",
        "status": "active",
        "startDate": "2026-05-01",
        "endDate": "2026-05-31",
        "progress": {
          "completedWorkouts": 8,
          "totalWorkouts": 12,
          "completionRate": 66.7
        },
        "createdAt": "2026-05-01T00:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 45,
      "pages": 3
    }
  }
}
```

### **2. Workout Plan Details**

```javascript
// View specific workout plan details
GET /api/workout-plans/:id

// Response Structure
{
  "success": true,
  "data": {
    "_id": "workout_plan_id",
    "name": "Strength Training Program",
    "description": "Progressive strength training plan",
    "doctorId": "doctor_id",
    "doctorName": "Dr. Mike Johnson",
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
            "completed": true,
            "completedAt": "2026-05-01T09:00:00.000Z"
          }
        ]
      },
      // ... other days
    },
    "startDate": "2026-05-01",
    "endDate": "2026-05-31",
    "status": "active",
    "createdAt": "2026-05-01T00:00:00.000Z"
  }
}
```

### **3. Client Workout Plans Overview**

```javascript
// View workout plans for a specific client
GET /api/workout-plans/client/:clientId

// Response Structure
{
  "success": true,
  "data": {
    "clientInfo": {
      "clientId": "client_id",
      "clientName": "John Doe",
      "email": "john@example.com"
    },
    "workoutPlans": [
      {
        "_id": "workout_plan_id",
        "name": "Strength Training Program",
        "status": "active",
        "progress": {
          "completedWorkouts": 8,
          "totalWorkouts": 12,
          "completionRate": 66.7
        },
        "startDate": "2026-05-01",
        "endDate": "2026-05-31"
      }
    ],
    "statistics": {
      "totalPlans": 2,
      "activePlans": 1,
      "completedPlans": 1,
      "averageCompletionRate": 78.5
    }
  }
}
```

---

## 📊 Progress Tracking

### **1. Diet Progress Monitoring**

```javascript
// Get diet progress for a specific plan
GET /api/progress/:dietPlanId/stats

// Response Structure
{
  "success": true,
  "data": {
    "dietPlanId": "diet_plan_id",
    "overallProgress": {
      "completedDays": 12,
      "totalDays": 31,
      "completionRate": 38.7,
      "streakDays": 5,
      "missedDays": 3
    },
    "weeklyProgress": [
      {
        "week": 1,
        "completedDays": 6,
        "totalDays": 7,
        "completionRate": 85.7
      },
      {
        "week": 2,
        "completedDays": 5,
        "totalDays": 7,
        "completionRate": 71.4
      }
    ],
    "nutritionSummary": {
      "averageDailyCalories": 1850,
      "targetDailyCalories": 2000,
      "averageProtein": 85,
      "targetProtein": 90,
      "averageCarbs": 120,
      "targetCarbs": 130
    }
  }
}
```

### **2. Daily Diet Progress**

```javascript
// Get daily progress details
GET /api/progress/:dietPlanId/day/:dayName

// Response Structure
{
  "success": true,
  "data": {
    "dietPlanId": "diet_plan_id",
    "dayName": "Monday",
    "date": "2026-05-03",
    "meals": {
      "breakfast": {
        "planned": { "food": "Oatmeal", "calories": 250 },
        "actual": { "food": "Oatmeal with berries", "calories": 280 },
        "completed": true,
        "completedAt": "2026-05-03T08:30:00.000Z"
      },
      "lunch": {
        "planned": { "food": "Grilled Chicken", "calories": 350 },
        "actual": null,
        "completed": false
      },
      "dinner": {
        "planned": { "food": "Salmon", "calories": 400 },
        "actual": null,
        "completed": false
      }
    },
    "dailyTotals": {
      "plannedCalories": 1000,
      "actualCalories": 280,
      "completionRate": 28.0
    }
  }
}
```

### **3. Nutrition Tracking**

```javascript
// Get nutrition tracking data
GET /api/progress/:dietPlanId/nutrition

// Response Structure
{
  "success": true,
  "data": {
    "dietPlanId": "diet_plan_id",
    "nutritionData": [
      {
        "date": "2026-05-01",
        "calories": {
          "consumed": 1850,
          "target": 2000,
          "percentage": 92.5
        },
        "macros": {
          "protein": { "consumed": 85, "target": 90, "percentage": 94.4 },
          "carbs": { "consumed": 120, "target": 130, "percentage": 92.3 },
          "fats": { "consumed": 65, "target": 70, "percentage": 92.9 }
        }
      }
    ],
    "averages": {
      "calories": { "consumed": 1850, "target": 2000, "percentage": 92.5 },
      "protein": { "consumed": 85, "target": 90, "percentage": 94.4 },
      "carbs": { "consumed": 120, "target": 130, "percentage": 92.3 },
      "fats": { "consumed": 65, "target": 70, "percentage": 92.9 }
    }
  }
}
```

### **4. Client Progress Overview**

```javascript
// Get comprehensive progress for a client
GET /api/progress/client/:clientId

// Response Structure
{
  "success": true,
  "data": {
    "clientId": "client_id",
    "clientName": "John Doe",
    "dietProgress": {
      "activePlan": {
        "planId": "diet_plan_id",
        "planName": "Weight Loss Plan",
        "completionRate": 38.7,
        "daysCompleted": 12,
        "totalDays": 31
      },
      "nutritionAverages": {
        "calories": 1850,
        "protein": 85,
        "carbs": 120,
        "fats": 65
      }
    },
    "workoutProgress": {
      "activePlan": {
        "planId": "workout_plan_id",
        "planName": "Strength Training",
        "completionRate": 66.7,
        "workoutsCompleted": 8,
        "totalWorkouts": 12
      }
    },
    "overallMetrics": {
      "weightProgress": {
        "startingWeight": 88.0,
        "currentWeight": 85.5,
        "targetWeight": 75.0,
        "weightLoss": 2.5
      },
      "complianceRate": 52.7,
      "lastActiveDate": "2026-05-03"
    }
  }
}
```

---

## 👥 Client Overview

### **1. Client Fitness Dashboard**

```javascript
// Get comprehensive client overview
GET /api/clients/:clientId/fitness-overview

// Response Structure
{
  "success": true,
  "data": {
    "clientInfo": {
      "clientId": "client_id",
      "clientName": "John Doe",
      "email": "john@example.com",
      "phone": "+1234567890",
      "age": 35,
      "gender": "male",
      "registrationDate": "2026-04-01"
    },
    "currentPlans": {
      "activeDietPlan": {
        "planId": "diet_plan_id",
        "planName": "Weight Loss Plan",
        "doctorName": "Dr. Sarah Smith",
        "status": "active",
        "progress": 38.7,
        "daysRemaining": 19
      },
      "activeWorkoutPlan": {
        "planId": "workout_plan_id",
        "planName": "Strength Training",
        "doctorName": "Dr. Mike Johnson",
        "status": "active",
        "progress": 66.7,
        "workoutsRemaining": 4
      }
    },
    "progressMetrics": {
      "weightProgress": {
        "startingWeight": 88.0,
        "currentWeight": 85.5,
        "targetWeight": 75.0,
        "weightLoss": 2.5,
        "progressPercentage": 31.3
      },
      "complianceMetrics": {
        "dietCompliance": 85.7,
        "workoutCompliance": 66.7,
        "overallCompliance": 76.2
      },
      "recentActivity": {
        "lastDietLog": "2026-05-03",
        "lastWorkout": "2026-05-02",
        "streakDays": 5
      }
    }
  }
}
```

### **2. All Clients Monitoring**

```javascript
// Get monitoring data for all clients
GET /api/clients/fitness-monitoring?page=1&limit=20&status=active

// Response Structure
{
  "success": true,
  "data": {
    "clients": [
      {
        "clientId": "client_id",
        "clientName": "John Doe",
        "email": "john@example.com",
        "status": "active",
        "currentPlans": {
          "dietPlan": {
            "planName": "Weight Loss Plan",
            "progress": 38.7,
            "status": "active"
          },
          "workoutPlan": {
            "planName": "Strength Training",
            "progress": 66.7,
            "status": "active"
          }
        },
        "overallMetrics": {
          "weightLoss": 2.5,
          "complianceRate": 76.2,
          "lastActive": "2026-05-03"
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 150,
      "pages": 8
    },
    "summary": {
      "totalClients": 150,
      "activeClients": 142,
      "averageCompliance": 78.5,
      "totalWeightLoss": 187.5
    }
  }
}
```

---

## 📈 Analytics & Statistics

### **1. System-wide Diet Analytics**

```javascript
// Get diet system analytics
GET /api/analytics/diet-system

// Response Structure
{
  "success": true,
  "data": {
    "overview": {
      "totalDietPlans": 450,
      "activePlans": 320,
      "completedPlans": 130,
      "averageCompletionRate": 73.5
    },
    "complianceMetrics": {
      "averageDailyCompliance": 78.2,
      "weeklyComplianceTrend": [
        { "week": "2026-W18", "rate": 75.3 },
        { "week": "2026-W19", "rate": 78.2 },
        { "week": "2026-W20", "rate": 79.1 }
      ]
    },
    "nutritionAnalytics": {
      "averageDailyCalories": 1850,
      "targetCalories": 2000,
      "calorieCompliance": 92.5,
      "macroCompliance": {
        "protein": 94.4,
        "carbs": 92.3,
        "fats": 92.9
      }
    },
    "popularPlans": [
      {
        "planName": "Weight Loss Plan",
        "usage": 125,
        "averageCompletion": 78.5
      },
      {
        "planName": "Muscle Building Diet",
        "usage": 98,
        "averageCompletion": 71.2
      }
    ]
  }
}
```

### **2. System-wide Workout Analytics**

```javascript
// Get workout system analytics
GET /api/analytics/workout-system

// Response Structure
{
  "success": true,
  "data": {
    "overview": {
      "totalWorkoutPlans": 280,
      "activePlans": 195,
      "completedPlans": 85,
      "averageCompletionRate": 81.2
    },
    "performanceMetrics": {
      "averageWorkoutFrequency": 3.2,
      "averageSessionDuration": 45,
      "completionTrend": [
        { "week": "2026-W18", "rate": 79.1 },
        { "week": "2026-W19", "rate": 81.2 },
        { "week": "2026-W20", "rate": 83.5 }
      ]
    },
    "exerciseAnalytics": {
      "mostPopularExercises": [
        { "name": "Bench Press", "usage": 245 },
        { "name": "Squats", "usage": 198 },
        { "name": "Deadlifts", "usage": 156 }
      ],
      "averageIntensity": 75.3,
      "progressiveOverloadRate": 68.7
    }
  }
}
```

---

## 🔗 API Endpoints Reference

### **Diet Monitoring Endpoints**

| Method | Endpoint | Permission | Description |
|--------|----------|------------|-------------|
| GET | `/api/diet-plans` | `view_diet_plan` | View all diet plans |
| GET | `/api/diet-plans/:id` | `view_diet_plan` | View diet plan details |
| GET | `/api/diet-plans/client/:clientId` | `view_diet_plan` | View client diet plans |
| GET | `/api/diet-plans/active/:clientId` | `view_diet_plan` | View active diet plan |

### **Workout Monitoring Endpoints**

| Method | Endpoint | Permission | Description |
|--------|----------|------------|-------------|
| GET | `/api/workout-plans` | `view_client_workout_plans` | View workout plans |
| GET | `/api/workout-plans/:id` | `view_client_workout_plans` | View workout plan details |
| GET | `/api/workout-plans/client/:clientId` | `view_client_workout_plans` | View client workout plans |
| GET | `/api/workout-plans/active/:clientId` | `view_client_workout_plans` | View active workout plan |

### **Progress Monitoring Endpoints**

| Method | Endpoint | Permission | Description |
|--------|----------|------------|-------------|
| GET | `/api/progress/:dietPlanId/stats` | `view_diet_plan` | Diet plan statistics |
| GET | `/api/progress/:dietPlanId/day/:dayName` | `view_diet_plan` | Daily progress |
| GET | `/api/progress/:dietPlanId/nutrition` | `view_diet_plan` | Nutrition tracking |
| GET | `/api/progress/client/:clientId` | `view_diet_plan` | Client progress |

### **Client Monitoring Endpoints**

| Method | Endpoint | Permission | Description |
|--------|----------|------------|-------------|
| GET | `/api/clients/:clientId/fitness-overview` | `read_dashboard` | Client fitness overview |
| GET | `/api/clients/fitness-monitoring` | `read_dashboard` | All clients monitoring |

### **Analytics Endpoints**

| Method | Endpoint | Permission | Description |
|--------|----------|------------|-------------|
| GET | `/api/analytics/diet-system` | `view_system_reports` | Diet system analytics |
| GET | `/api/analytics/workout-system` | `view_system_reports` | Workout system analytics |

---

## 🎨 Frontend Integration

### **1. Permission-Based Monitoring**

```javascript
// Monitoring permission hook
const useMonitoringPermissions = () => {
  const { hasPermission } = usePermissions();
  
  return {
    canMonitorDiets: hasPermission('view_diet_plan'),
    canMonitorWorkouts: hasPermission('view_client_workout_plans'),
    canViewDashboard: hasPermission('read_dashboard'),
    canViewAnalytics: hasPermission('view_system_reports')
  };
};

// Usage
const { canMonitorDiets, canMonitorWorkouts } = useMonitoringPermissions();
```

### **2. Diet Monitoring Component**

```javascript
// Diet Plan Monitoring Component
const DietPlanMonitoring = () => {
  const [dietPlans, setDietPlans] = useState([]);
  const [loading, setLoading] = useState(false);
  const { canMonitorDiets } = useMonitoringPermissions();
  
  const fetchDietPlans = async (filters = {}) => {
    if (!canMonitorDiets) return;
    
    setLoading(true);
    try {
      const params = new URLSearchParams(filters);
      const response = await api.get(`/api/diet-plans?${params}`);
      setDietPlans(response.data.data.dietPlans);
    } catch (error) {
      console.error('Error fetching diet plans:', error);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div>
      <h2>Diet Plan Monitoring</h2>
      
      {/* Filters */}
      <DietPlanFilters onFilterChange={fetchDietPlans} />
      
      {/* Diet Plans List */}
      {loading ? (
        <Spinner />
      ) : (
        <DietPlanList plans={dietPlans} viewOnly={true} />
      )}
      
      {/* Pagination */}
      <Pagination />
    </div>
  );
};
```

### **3. Workout Monitoring Component**

```javascript
// Workout Plan Monitoring Component
const WorkoutPlanMonitoring = () => {
  const [workoutPlans, setWorkoutPlans] = useState([]);
  const [loading, setLoading] = useState(false);
  const { canMonitorWorkouts } = useMonitoringPermissions();
  
  const fetchWorkoutPlans = async (filters = {}) => {
    if (!canMonitorWorkouts) return;
    
    setLoading(true);
    try {
      const params = new URLSearchParams(filters);
      const response = await api.get(`/api/workout-plans?${params}`);
      setWorkoutPlans(response.data.data.workoutPlans);
    } catch (error) {
      console.error('Error fetching workout plans:', error);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div>
      <h2>Workout Plan Monitoring</h2>
      
      {/* Filters */}
      <WorkoutPlanFilters onFilterChange={fetchWorkoutPlans} />
      
      {/* Workout Plans List */}
      {loading ? (
        <Spinner />
      ) : (
        <WorkoutPlanList plans={workoutPlans} viewOnly={true} />
      )}
      
      {/* Pagination */}
      <Pagination />
    </div>
  );
};
```

### **4. Progress Tracking Component**

```javascript
// Progress Tracking Component
const ProgressTracking = ({ clientId }) => {
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const fetchProgress = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/api/progress/client/${clientId}`);
      setProgress(response.data.data);
    } catch (error) {
      console.error('Error fetching progress:', error);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchProgress();
  }, [clientId]);
  
  if (loading) return <Spinner />;
  if (!progress) return <div>No progress data available</div>;
  
  return (
    <div>
      <h3>Progress Tracking</h3>
      
      {/* Diet Progress */}
      <Section title="Diet Progress">
        <DietProgressChart data={progress.dietProgress} />
        <NutritionSummary data={progress.dietProgress.nutritionAverages} />
      </Section>
      
      {/* Workout Progress */}
      <Section title="Workout Progress">
        <WorkoutProgressChart data={progress.workoutProgress} />
      </Section>
      
      {/* Overall Metrics */}
      <Section title="Overall Metrics">
        <WeightProgress data={progress.overallMetrics.weightProgress} />
        <ComplianceRate rate={progress.overallMetrics.complianceRate} />
      </Section>
    </div>
  );
};
```

### **5. Client Overview Component**

```javascript
// Client Overview Component
const ClientOverview = ({ clientId }) => {
  const [clientData, setClientData] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const fetchClientOverview = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/api/clients/${clientId}/fitness-overview`);
      setClientData(response.data.data);
    } catch (error) {
      console.error('Error fetching client overview:', error);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchClientOverview();
  }, [clientId]);
  
  if (loading) return <Spinner />;
  if (!clientData) return <div>No client data available</div>;
  
  return (
    <div>
      <h3>Client Overview</h3>
      
      {/* Client Info */}
      <ClientInfoCard client={clientData.clientInfo} />
      
      {/* Current Plans */}
      <Section title="Current Plans">
        <CurrentPlans plans={clientData.currentPlans} />
      </Section>
      
      {/* Progress Metrics */}
      <Section title="Progress Metrics">
        <ProgressMetrics metrics={clientData.progressMetrics} />
      </Section>
    </div>
  );
};
```

### **6. Analytics Dashboard Component**

```javascript
// Analytics Dashboard Component
const AnalyticsDashboard = () => {
  const [dietAnalytics, setDietAnalytics] = useState(null);
  const [workoutAnalytics, setWorkoutAnalytics] = useState(null);
  const [loading, setLoading] = useState(false);
  const { canViewAnalytics } = useMonitoringPermissions();
  
  const fetchAnalytics = async () => {
    if (!canViewAnalytics) return;
    
    setLoading(true);
    try {
      const [dietRes, workoutRes] = await Promise.all([
        api.get('/api/analytics/diet-system'),
        api.get('/api/analytics/workout-system')
      ]);
      
      setDietAnalytics(dietRes.data.data);
      setWorkoutAnalytics(workoutRes.data.data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchAnalytics();
  }, [canViewAnalytics]);
  
  if (loading) return <Spinner />;
  
  return (
    <div>
      <h2>System Analytics</h2>
      
      {/* Diet Analytics */}
      <Section title="Diet System Analytics">
        <DietAnalyticsChart data={dietAnalytics} />
        <ComplianceMetrics data={dietAnalytics.complianceMetrics} />
        <PopularPlans plans={dietAnalytics.popularPlans} />
      </Section>
      
      {/* Workout Analytics */}
      <Section title="Workout System Analytics">
        <WorkoutAnalyticsChart data={workoutAnalytics} />
        <PerformanceMetrics data={workoutAnalytics.performanceMetrics} />
        <ExerciseAnalytics data={workoutAnalytics.exerciseAnalytics} />
      </Section>
    </div>
  );
};
```

---

## 📋 Data Models

### **Diet Plan Monitoring Model**
```javascript
const DietPlanMonitoring = {
  _id: ObjectId,
  name: String,                    // Plan name
  description: String,             // Plan description
  doctorId: ObjectId,              // Creating doctor
  doctorName: String,              // Doctor name
  clientId: ObjectId,              // Assigned client
  clientName: String,              // Client name
  status: String,                  // active, completed, paused
  startDate: Date,                 // Plan start date
  endDate: Date,                   // Plan end date
  progress: {                      // Progress tracking
    completedDays: Number,         // Days completed
    totalDays: Number,             // Total days in plan
    completionRate: Number,       // Completion percentage
    streakDays: Number,            // Current streak
    missedDays: Number             // Missed days
  },
  weeklyPlan: {                    // 7-day meal plan
    Monday: {
      breakfast: { food: String, calories: Number },
      lunch: { food: String, calories: Number },
      dinner: { food: String, calories: Number }
    },
    // ... other days
  },
  createdAt: Date,
  updatedAt: Date
};
```

### **Workout Plan Monitoring Model**
```javascript
const WorkoutPlanMonitoring = {
  _id: ObjectId,
  name: String,                    // Plan name
  description: String,             // Plan description
  doctorId: ObjectId,              // Creating doctor
  doctorName: String,              // Doctor name
  clientId: ObjectId,              // Assigned client
  clientName: String,              // Client name
  status: String,                  // active, completed, paused
  startDate: Date,                 // Plan start date
  endDate: Date,                   // Plan end date
  progress: {                      // Progress tracking
    completedWorkouts: Number,     // Completed workouts
    totalWorkouts: Number,         // Total workouts
    completionRate: Number         // Completion percentage
  },
  weeklyPlan: {                    // 7-day workout plan
    Monday: {
      exercises: [{
        name: String,             // Exercise name
        sets: Number,             // Number of sets
        reps: Number,             // Number of reps
        weight: Number,           // Weight used
        restTime: Number,         // Rest time
        completed: Boolean,       // Completion status
        completedAt: Date         // Completion timestamp
      }]
    },
    // ... other days
  },
  createdAt: Date,
  updatedAt: Date
};
```

### **Progress Monitoring Model**
```javascript
const ProgressMonitoring = {
  _id: ObjectId,
  dietPlanId: ObjectId,            // Related diet plan
  clientId: ObjectId,              // Client ID
  date: Date,                      // Progress date
  meals: {                         // Daily meals
    breakfast: { 
      planned: { food: String, calories: Number },
      actual: { food: String, calories: Number },
      completed: Boolean,
      completedAt: Date
    },
    lunch: { 
      planned: { food: String, calories: Number },
      actual: { food: String, calories: Number },
      completed: Boolean,
      completedAt: Date
    },
    dinner: { 
      planned: { food: String, calories: Number },
      actual: { food: String, calories: Number },
      completed: Boolean,
      completedAt: Date
    }
  },
  nutrition: {                      // Daily nutrition
    calories: {
      consumed: Number,
      target: Number,
      percentage: Number
    },
    macros: {
      protein: { consumed: Number, target: Number, percentage: Number },
      carbs: { consumed: Number, target: Number, percentage: Number },
      fats: { consumed: Number, target: Number, percentage: Number }
    }
  },
  createdAt: Date,
  updatedAt: Date
};
```

---

## 🎯 Implementation Notes

### **Monitoring-Only Design**
- **No Creation/Editing**: All endpoints are GET requests only
- **Read-Only Access**: Admins can view but not modify plans
- **Comprehensive Visibility**: Full access to all client data
- **Real-Time Updates**: Progress tracking updates in real-time

### **Security Considerations**
- **Permission-Based Access**: All monitoring requires specific permissions
- **Data Privacy**: Client data access is controlled by permissions
- **Audit Logging**: All monitoring actions are logged
- **Read-Only Operations**: No modification capabilities

### **Performance Optimization**
- **Pagination**: Large datasets use pagination
- **Caching**: Frequently accessed data is cached
- **Efficient Queries**: Optimized database queries for monitoring
- **Lazy Loading**: Data loaded on demand

---

**This monitoring system provides comprehensive oversight capabilities while maintaining strict read-only access, ensuring admins can effectively monitor diet and workout programs without modification capabilities.**
