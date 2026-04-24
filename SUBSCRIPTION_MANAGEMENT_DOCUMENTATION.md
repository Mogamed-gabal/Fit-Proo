# Subscription Management System Documentation

## Overview
This document describes the **Subscription Management System** that handles subscription lifecycle, payment processing, and user access control for the fitness platform. The system supports multiple subscription tiers, automated billing, and comprehensive audit logging.

## Architecture

### System Components
- **Model**: `Subscription` - Core subscription schema with billing details
- **Service**: `SubscriptionService` - Business logic for subscription operations
- **Controller**: `SubscriptionController` - API endpoints for subscription management
- **Routes**: `/api/subscription/*` - Dedicated API endpoints
- **Middleware**: Permission-based access control
- **Payment Integration**: External payment gateway integration

### Key Features
- **Multiple Tiers**: Basic, Premium, Professional subscription plans
- **Automated Billing**: Recurring payment processing and renewal
- **Grace Periods**: Flexible payment confirmation periods
- **Access Control**: Feature-based access based on subscription level
- **Audit Trail**: Complete subscription change history
- **Payment Tracking**: Comprehensive payment status management

---

## Database Schema

### Subscription Model
```javascript
{
  // User and Plan Information
  userId: {
    type: ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  planType: {
    type: String,
    required: true,
    enum: ['BASIC', 'PREMIUM', 'PROFESSIONAL'],
    index: true
  },
  planName: {
    type: String,
    required: true,
    maxlength: [100, 'Plan name cannot exceed 100 characters']
  },
  
  // Billing Information
  price: {
    type: Number,
    required: true,
    min: [0, 'Price cannot be negative']
  },
  currency: {
    type: String,
    required: true,
    enum: ['USD', 'EUR', 'GBP'],
    default: 'USD'
  },
  billingCycle: {
    type: String,
    required: true,
    enum: ['MONTHLY', 'QUARTERLY', 'YEARLY']
  },
  
  // Payment Status
  status: {
    type: String,
    required: true,
    enum: ['ACTIVE', 'PENDING', 'SUSPENDED', 'CANCELLED', 'EXPIRED'],
    default: 'PENDING',
    index: true
  },
  paymentStatus: {
    type: String,
    required: true,
    enum: ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'REFUNDED'],
    default: 'PENDING'
  },
  
  // Dates
  startDate: {
    type: Date,
    required: true,
    index: true
  },
  endDate: {
    type: Date,
    required: true,
    index: true
  },
  trialEndDate: {
    type: Date,
    index: true
  },
  gracePeriodEnds: {
    type: Date,
    index: true
  },
  
  // Payment Details
  lastPaymentDate: {
    type: Date,
    index: true
  },
  nextBillingDate: {
    type: Date,
    index: true
  },
  paymentMethod: {
    type: String,
    enum: ['CREDIT_CARD', 'PAYPAL', 'BANK_TRANSFER', 'CRYPTO']
  },
  paymentGateway: {
    type: String,
    enum: ['STRIPE', 'PAYPAL', 'RAZORPAY', 'MANUAL']
  },
  
  // Features and Limits
  features: {
    type: Map,
    of: String,
    default: {}
  },
  limits: {
    type: Map,
    of: Number,
    default: {}
  },
  
  // Auto-renewal
  autoRenew: {
    type: Boolean,
    default: true
  },
  renewalAttempts: {
    type: Number,
    default: 0
  },
  maxRenewalAttempts: {
    type: Number,
    default: 3
  },
  
  // Cancellation
  cancelledAt: {
    type: Date,
    index: true
  },
  cancellationReason: {
    type: String,
    maxlength: [500, 'Cancellation reason cannot exceed 500 characters']
  },
  cancelledBy: {
    type: ObjectId,
    ref: 'User'
  },
  
  // Audit Trail
  createdBy: {
    type: ObjectId,
    ref: 'User',
    required: true
  },
  updatedBy: {
    type: ObjectId,
    ref: 'User'
  },
  
  // Soft Delete
  isDeleted: {
    type: Boolean,
    default: false,
    index: true
  },
  deletedAt: {
    type: Date,
    index: true
  },
  deletedBy: {
    type: ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  collection: 'subscriptions'
});
```

---

## API Endpoints

### Base URL
```
http://localhost:5000/api/subscription
```

### Authentication
All endpoints require:
- **Authorization Header**: `Bearer <user_token>`
- **Required Permissions**: Varies by endpoint and user role
- **User Verification**: Only subscription owners or admins can modify

### Available Endpoints

#### 1. Create Subscription
**POST** `/subscription/create`

**Request Body**:
```json
{
  "planType": "PREMIUM",
  "planName": "Monthly Premium",
  "price": 29.99,
  "currency": "USD",
  "billingCycle": "MONTHLY",
  "paymentMethod": "CREDIT_CARD",
  "paymentGateway": "STRIPE",
  "autoRenew": true,
  "features": {
    "premium_workouts": true,
    "nutrition_plans": true,
    "personal_training": false
  },
  "limits": {
    "max_clients": 50,
    "max_workout_plans": 100
  }
}
```

**Response**:
```json
{
  "success": true,
  "message": "Subscription created successfully",
  "data": {
    "subscription": {
      "_id": "507f1f77bcf86cd799439011",
      "userId": "507f1f77bcf86cd799439012",
      "planType": "PREMIUM",
      "status": "PENDING",
      "paymentStatus": "PENDING",
      "startDate": "2024-04-19T10:00:00.000Z",
      "endDate": "2024-05-19T10:00:00.000Z"
    },
    "paymentUrl": "https://stripe.com/pay/...",
    "message": "Please complete payment to activate subscription"
  }
}
```

#### 2. Confirm Payment
**POST** `/subscription/:subscriptionId/confirm-payment`

**Request Body**:
```json
{
  "paymentId": "pi_1234567890",
  "paymentGateway": "STRIPE",
  "amount": 29.99,
  "currency": "USD",
  "transactionId": "txn_1234567890"
}
```

#### 3. Fail Payment
**POST** `/subscription/:subscriptionId/fail-payment`

**Request Body**:
```json
{
  "paymentId": "pi_1234567890",
  "reason": "Insufficient funds",
  "errorCode": "card_declined",
  "paymentGateway": "STRIPE"
}
```

#### 4. Get User Subscriptions
**GET** `/subscription/my-subscriptions`

**Query Parameters**:
- `status` (optional): Filter by subscription status
- `planType` (optional): Filter by plan type
- `page` (optional): Pagination page number
- `limit` (optional): Results per page

**Response**:
```json
{
  "success": true,
  "data": {
    "subscriptions": [
      {
        "_id": "507f1f77bcf86cd799439011",
        "planType": "PREMIUM",
        "planName": "Monthly Premium",
        "status": "ACTIVE",
        "paymentStatus": "COMPLETED",
        "startDate": "2024-03-19T10:00:00.000Z",
        "endDate": "2024-04-19T10:00:00.000Z",
        "nextBillingDate": "2024-04-19T10:00:00.000Z",
        "features": {
          "premium_workouts": true,
          "nutrition_plans": true
        }
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 1,
      "totalSubscriptions": 1
    }
  }
}
```

#### 5. Get Doctor Subscriptions
**GET** `/subscription/doctor-subscriptions`

**Query Parameters**: Same as user subscriptions

#### 6. Cancel Subscription
**DELETE** `/subscription/:subscriptionId`

**Request Body**:
```json
{
  "reason": "No longer need the service",
  "immediate": false,
  "refundPolicy": "pro_rated"
}
```

#### 7. Update Subscription
**PUT** `/subscription/:subscriptionId`

**Request Body**:
```json
{
  "planType": "PROFESSIONAL",
  "autoRenew": true,
  "paymentMethod": "PAYPAL",
  "features": {
    "premium_workouts": true,
    "nutrition_plans": true,
    "personal_training": true
  }
}
```

#### 8. Renew Subscription
**POST** `/subscription/:subscriptionId/renew`

**Request Body**:
```json
{
  "billingCycle": "YEARLY",
  "paymentMethod": "CREDIT_CARD",
  "discountCode": "SAVE20"
}
```

#### 9. Get Subscription Details
**GET** `/subscription/:subscriptionId`

#### 10. Get Subscription Statistics
**GET** `/subscription/stats` (Admin only)

#### 11. Process Renewals (Cron Job)
**POST** `/subscription/process-renewals` (Admin only)

---

## Subscription Plans

### Basic Plan
- **Price**: $9.99/month
- **Features**: 
  - Basic workout plans
  - Limited nutrition tracking
  - Community access
- **Limits**:
  - Max 5 workout plans
  - Max 10 clients (for trainers)

### Premium Plan
- **Price**: $29.99/month
- **Features**:
  - Advanced workout plans
  - Full nutrition tracking
  - Personal training programs
  - Priority support
- **Limits**:
  - Max 50 workout plans
  - Max 100 clients (for trainers)
  - HD video content

### Professional Plan
- **Price**: $99.99/month
- **Features**:
  - Unlimited workout plans
  - Advanced nutrition AI
  - White-label options
  - API access
  - Dedicated support
- **Limits**:
  - Unlimited clients
  - Unlimited content
  - Custom branding

---

## Payment Processing

### Payment Gateways
- **Stripe**: Credit card and ACH payments
- **PayPal**: Digital wallet payments
- **Razorpay**: Indian market payments
- **Manual**: Admin-managed payments

### Payment Flow
1. **Subscription Creation**: Create pending subscription
2. **Payment Initiation**: Generate payment URL
3. **Payment Processing**: User completes payment
4. **Payment Confirmation**: Webhook or manual confirmation
5. **Subscription Activation**: Status updated to ACTIVE
6. **Renewal Processing**: Automated billing cycle

### Error Handling
- **Payment Failures**: Grace period and retry logic
- **Insufficient Funds**: User notification and retry options
- **Gateway Errors**: Fallback payment methods
- **Refund Processing**: Automatic or manual refund handling

---

## Access Control

### Feature-Based Access
```javascript
// Check if user has access to premium features
if (subscription.planType === 'PREMIUM' || subscription.planType === 'PROFESSIONAL') {
  // Allow premium features
}

// Check specific feature access
if (subscription.features.get('premium_workouts')) {
  // Allow premium workout features
}

// Check limits enforcement
if (subscription.limits.get('max_clients') <= currentClientCount) {
  // Enforce client limit
}
```

### Permission Integration
```javascript
// Subscription-based permission checks
const hasSubscriptionAccess = (user, feature) => {
  const subscription = await SubscriptionService.getActiveSubscription(user.userId);
  return subscription && subscription.features.get(feature);
};

// Use in routes
router.post('/premium-feature',
  authenticate,
  requireSubscriptionAccess('premium_workouts'),
  premiumFeatureController
);
```

---

## Billing and Renewals

### Automated Renewal
- **Renewal Schedule**: Process 7 days before expiration
- **Payment Retry**: Up to 3 retry attempts
- **Grace Period**: 7 days after failed renewal
- **Notification**: Email alerts for renewal status
- **Failure Handling**: Automatic downgrade or cancellation

### Billing Cycles
- **Monthly**: 30-day billing cycle
- **Quarterly**: 90-day billing cycle
- **Yearly**: 365-day billing cycle with 20% discount

### Proration
- **Mid-Cycle Upgrades**: Prorated charges for remaining days
- **Mid-Cycle Downgrades**: Credit for unused time
- **Cancellation**: Refund for unused portion

---

## Monitoring and Analytics

### Subscription Metrics
- **Active Subscriptions**: Current active subscription count
- **Revenue Tracking**: Monthly recurring revenue (MRR)
- **Churn Rate**: Subscription cancellation percentage
- **Conversion Rate**: Trial to paid conversion
- **Lifetime Value**: Average customer lifetime value

### Payment Analytics
- **Payment Success Rate**: Percentage of successful payments
- **Gateway Performance**: Success rate by payment method
- **Failure Reasons**: Common payment failure categories
- **Refund Rate**: Percentage of refunded payments

### User Behavior
- **Feature Usage**: Most used subscription features
- **Plan Upgrades**: Upgrade patterns and timing
- **Cancellation Patterns**: Common reasons and timing
- **Renewal Rates**: Percentage of users who renew

---

## Security Considerations

### Payment Security
- **PCI Compliance**: Secure handling of payment information
- **Tokenization**: Never store raw payment details
- **HTTPS Only**: All payment endpoints use HTTPS
- **Webhook Verification**: Secure payment confirmation handling

### Access Control
- **Subscription Validation**: Verify active subscription before access
- **Feature Enforcement**: Strict limit and feature checking
- **Audit Logging**: All subscription changes tracked
- **Role-Based Access**: Admin-only subscription management

### Data Protection
- **PII Protection**: Secure handling of billing information
- **Encryption**: Sensitive data encryption at rest
- **Access Logs**: Complete audit trail of subscription access
- **Data Retention**: Compliant data retention policies

---

## Integration Examples

### Client-Side Integration
```javascript
// Check subscription status
const checkSubscription = async () => {
  const response = await fetch('/api/subscription/my-subscriptions', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  const { data } = await response.json();
  return data.subscriptions.find(sub => sub.status === 'ACTIVE');
};

// Upgrade subscription
const upgradeSubscription = async (subscriptionId, newPlan) => {
  const response = await fetch(`/api/subscription/${subscriptionId}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      planType: newPlan,
      billingCycle: 'MONTHLY'
    })
  });
  
  return response.json();
};
```

### Server-Side Integration
```javascript
// Middleware for subscription-based access
const requireSubscription = (feature) => {
  return async (req, res, next) => {
    const subscription = await SubscriptionService.getActiveSubscription(req.user.userId);
    
    if (!subscription || subscription.status !== 'ACTIVE') {
      return res.status(402).json({
        success: false,
        error: 'Active subscription required',
        requiredFeature: feature
      });
    }
    
    if (feature && !subscription.features.get(feature)) {
      return res.status(403).json({
        success: false,
        error: 'Feature not included in subscription',
        requiredFeature: feature,
        currentPlan: subscription.planType
      });
    }
    
    req.subscription = subscription;
    next();
  };
};

// Use in routes
router.post('/premium-workout',
  authenticate,
  requireSubscription('premium_workouts'),
  workoutController
);
```

---

## Best Practices

### Subscription Management
- **Clear Pricing**: Transparent pricing and feature comparison
- **Easy Upgrades**: Simple upgrade and downgrade process
- **Fair Cancellation**: Clear cancellation terms and refund policy
- **Trial Periods**: Offer free trials for new users
- **Retention Focus**: Features that encourage long-term subscriptions

### Payment Processing
- **Multiple Gateways**: Offer various payment methods
- **Error Handling**: Graceful payment failure handling
- **Security First**: Never store sensitive payment data
- **Compliance**: Follow PCI DSS and GDPR guidelines
- **Testing**: Thorough payment flow testing

### User Experience
- **Clear Status**: Easy-to-understand subscription status
- **Renewal Reminders**: Timely renewal notifications
- **Self-Service**: Allow users to manage their subscriptions
- **Support Access**: Easy access to billing support
- **Mobile Friendly**: Responsive subscription management interface

---

## Troubleshooting

### Common Issues
1. **Payment Failures**: Check payment method and gateway status
2. **Subscription Not Active**: Verify payment confirmation
3. **Feature Access Denied**: Check subscription plan and features
4. **Renewal Failures**: Review payment method and billing info
5. **Access Revoked**: Check subscription status and expiration

### Debugging Tips
- Check subscription status before granting access
- Verify payment gateway webhooks are working
- Monitor renewal failure rates and reasons
- Review audit logs for subscription changes
- Test payment flows with different scenarios

---

*Last Updated: April 2024*
