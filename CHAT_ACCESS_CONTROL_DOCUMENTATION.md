# Chat Access Control Engine Documentation

## Overview
This document describes the **Chat Access Control Engine** - a centralized business logic layer that determines whether users can access chats and send messages based on subscription status, free message limits, and chat participation rules.

## Architecture

### System Components
- **Config**: `chatAccessConfig.js` - Centralized configuration and constants
- **Model**: `UserMessageUsage.js` - Tracks global free message usage per user
- **Service**: `ChatAccessService.js` - Core business logic engine
- **Controller**: `ChatAccessController.js` - API endpoints for testing and management
- **Routes**: `/api/chat-access/*` - Dedicated API endpoints

### Key Features
- **Global Free Messages**: 15 free messages per user across entire system
- **Subscription-Based Access**: Doctor-based, bundle, and coupon subscriptions
- **Grace Period**: 1-day access after subscription expiration
- **Chat Participation**: Users can only access chats they're participants in
- **Usage Tracking**: Comprehensive message usage monitoring
- **Performance Optimized**: Efficient caching and database queries

---

## Business Rules

### 1. Free Usage Rules
- **Global Limit**: 15 free messages per user across entire system
- **Not Per-Chat**: Messages counted globally, not per doctor or chat
- **Monthly Reset**: Free message counter resets monthly (first day of month)
- **Priority Check**: Free usage checked before subscription access

### 2. Subscription Access Rules

#### Doctor-Based Subscription
- User can only chat with the specific doctor linked to subscription
- Subscription must be active or within grace period
- Doctor ID validation enforced

#### Bundle Subscription
- User can access group chats with multiple participants
- User must be part of the bundle to access
- Bundle ID validation enforced

#### Coupon Subscription
- Treated like doctor-based subscription with time duration
- Specific doctor access only
- Time-limited access with expiration

### 3. Grace Period Rules
- **Duration**: 1 day after subscription expires
- **Access Allowed**: Users can still send messages during grace period
- **Flag Returned**: `isInGracePeriod: true` in response
- **After Grace Period**: Access denied completely

### 4. Chat Ownership Rules
- **Participant Validation**: User must be in chat participants list
- **Chat Types**: Supports ONE_TO_ONE and GROUP chats
- **Access Control**: Participation + valid access required

---

## API Endpoints

### Base URL
```
http://localhost:5000/api/chat-access
```

### Authentication
All endpoints require:
- **Authorization Header**: `Bearer <user_token>`
- **Valid User**: User must exist in system

### Available Endpoints

#### 1. Check Chat Access
**POST** `/chat-access/check-access`

**Request Body**:
```json
{
  "userId": "507f1f77bcf86cd799439011",
  "chatContext": {
    "chatId": "507f1f77bcf86cd799439012",
    "chatType": "ONE_TO_ONE",
    "participants": ["507f1f77bcf86cd799439011", "507f1f77bcf86cd799439013"],
    "doctorId": "507f1f77bcf86cd799439013",
    "bundleId": null
  }
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "allowed": true,
    "reason": "FREE_USAGE",
    "isUsingFreeMessage": true,
    "isInGracePeriod": false,
    "remainingFreeMessages": 14,
    "timestamp": "2024-04-19T10:39:00.000Z",
    "subscriptionStatus": "FREE_USAGE"
  }
}
```

#### 2. Check Send Message Permission
**POST** `/chat-access/check-send`

**Request Body**: Same as check-access

**Response**: Same structure as check-access with additional send validation

#### 3. Record Message (Testing)
**POST** `/chat-access/record-message`

**Request Body**:
```json
{
  "userId": "507f1f77bcf86cd799439011",
  "messageContext": {
    "chatContext": {
      "chatId": "507f1f77bcf86cd799439012",
      "chatType": "ONE_TO_ONE",
      "participants": ["507f1f77bcf86cd799439011", "507f1f77bcf86cd799439013"]
    },
    "messageType": "TEXT"
  }
}
```

#### 4. Get User Access Summary
**GET** `/chat-access/user-summary/:userId`

**Response**:
```json
{
  "success": true,
  "data": {
    "userId": "507f1f77bcf86cd799439011",
    "userName": "John Doe",
    "userEmail": "john@example.com",
    "userRole": "client",
    "messageUsage": {
      "totalMessagesSent": 5,
      "freeMessagesUsed": 5,
      "remainingFreeMessages": 10,
      "currentPeriodStart": "2024-04-01T00:00:00.000Z",
      "currentPeriodEnd": "2024-04-30T23:59:59.000Z",
      "lastMessageAt": "2024-04-19T10:00:00.000Z",
      "isFreeMessagesExhausted": false
    },
    "activeSubscriptions": [],
    "gracePeriodSubscriptions": [],
    "hasFreeMessages": true,
    "hasActiveSubscription": false,
    "isInGracePeriod": false
  }
}
```

#### 5. Test Access with Current User
**POST** `/chat-access/test-access`

**Request Body**:
```json
{
  "chatContext": {
    "chatId": "507f1f77bcf86cd799439012",
    "chatType": "ONE_TO_ONE",
    "participants": ["507f1f77bcf86cd799439011", "507f1f77bcf86cd799439013"]
  }
}
```

---

## Service Methods

### Core Methods

#### `canAccessChat(userId, chatContext)`
Main method to determine if user can access chat.

**Parameters**:
- `userId` (String): User ID
- `chatContext` (Object): Chat context information

**Returns**: Promise<Object> with access decision

#### `canSendMessage(userId, chatContext)`
Extended method for send message permissions.

**Returns**: Promise<Object> with send permission decision

#### `recordMessage(userId, messageContext)`
Records a message and updates usage counters.

**Returns**: Promise<Object> with updated usage information

#### `getUserAccessSummary(userId)`
Gets comprehensive user access status.

**Returns**: Promise<Object> with user access summary

---

## Response Structure

### Access Response Format
```javascript
{
  allowed: boolean,           // Can access or not
  reason: string,            // Access reason
  isUsingFreeMessage: boolean, // Using free message quota
  isInGracePeriod: boolean,  // Within grace period
  remainingFreeMessages: number, // Remaining free messages
  timestamp: Date,           // Check timestamp
  subscriptionStatus: string, // Current subscription status
  subscriptionType: string,  // Type of subscription
  expiresAt: Date           // Subscription expiration
}
```

### Access Reasons
- `FREE_USAGE` - Using free message quota
- `SUBSCRIPTION_ACTIVE` - Active subscription access
- `GRACE_PERIOD` - Within grace period
- `NO_ACCESS` - No access available
- `INVALID_CHAT` - Invalid chat context
- `NOT_PARTICIPANT` - User not in chat participants
- `WRONG_DOCTOR` - Wrong doctor for subscription
- `NOT_IN_BUNDLE` - Not part of bundle subscription
- `FREE_MESSAGES_EXHAUSTED` - No free messages remaining

---

## Database Schema

### UserMessageUsage Model
```javascript
{
  userId: ObjectId,           // User reference
  totalMessagesSent: Number,  // Total messages sent
  freeMessagesUsed: Number,   // Free messages used
  currentPeriodStart: Date,   // Current period start
  currentPeriodEnd: Date,     // Current period end
  lastMessageAt: Date,        // Last message timestamp
  lastResetAt: Date          // Last reset timestamp
}
```

### Indexes for Performance
- `{ userId: 1, currentPeriodStart: 1 }` - User period lookup
- `{ currentPeriodEnd: 1 }` - Period expiration tracking
- `{ lastMessageAt: 1 }` - Recent activity tracking

---

## Configuration

### Chat Access Config
```javascript
module.exports = {
  FREE_USAGE: {
    GLOBAL_MESSAGE_LIMIT: 15,    // Free messages per user
    RESET_PERIOD: 'monthly'      // Reset frequency
  },
  GRACE_PERIOD: {
    DURATION_DAYS: 1,            // Grace period duration
    ACCESS_ALLOWED: true         // Allow access during grace
  },
  CACHE: {
    TTL_SECONDS: 300,           // Cache duration
    MAX_SIZE: 1000              // Max cache entries
  }
};
```

---

## Usage Examples

### Basic Access Check
```javascript
const ChatAccessService = require('./services/chatAccessService');

// Check if user can access chat
const result = await ChatAccessService.canAccessChat(userId, {
  chatId: 'chat123',
  chatType: 'ONE_TO_ONE',
  participants: [userId, doctorId],
  doctorId: 'doctor123'
});

if (result.allowed) {
  // Allow chat access
  console.log(`Access granted: ${result.reason}`);
} else {
  // Deny access
  console.log(`Access denied: ${result.reason}`);
}
```

### Message Recording
```javascript
// Record a message after checking access
const accessResult = await ChatAccessService.canSendMessage(userId, chatContext);

if (accessResult.allowed) {
  const recordResult = await ChatAccessService.recordMessage(userId, {
    chatContext,
    messageType: 'TEXT'
  });
  
  console.log(`Message recorded. Usage: ${recordResult.usage.freeMessagesUsed}/15`);
}
```

### User Summary
```javascript
// Get comprehensive user access status
const summary = await ChatAccessService.getUserAccessSummary(userId);

console.log(`User ${summary.userName} has:`);
console.log(`- ${summary.messageUsage.remainingFreeMessages} free messages left`);
console.log(`- ${summary.activeSubscriptions.length} active subscriptions`);
console.log(`- In grace period: ${summary.isInGracePeriod}`);
```

---

## Performance Considerations

### Database Optimization
- **Efficient Indexes**: Optimized for user and period lookups
- **Lean Queries**: Minimal data retrieval
- **Batch Operations**: Efficient usage updates

### Caching Strategy
- **User Access Cache**: 5-minute TTL for access checks
- **Usage Cache**: Cached usage statistics
- **Subscription Cache**: Active subscription status cached

### Scalability
- **Horizontal Scaling**: Stateless service design
- **Database Sharding**: Can shard by user ID
- **Load Balancing**: Service can be load balanced

---

## Integration Guidelines

### Chat System Integration
```javascript
// In chat message handler
const ChatAccessService = require('./services/chatAccessService');

async function handleSendMessage(req, res) {
  const { userId, chatId, message } = req.body;
  
  // Check send permission
  const canSend = await ChatAccessService.canSendMessage(userId, {
    chatId,
    chatType: 'ONE_TO_ONE',
    participants: [userId, req.body.doctorId],
    doctorId: req.body.doctorId
  });
  
  if (!canSend.allowed) {
    return res.status(403).json({
      error: 'Access denied',
      reason: canSend.reason
    });
  }
  
  // Record and send message
  await ChatAccessService.recordMessage(userId, { chatContext });
  // ... send message logic
}
```

### Subscription System Integration
```javascript
// When subscription is created/updated
const ChatAccessService = require('./services/chatAccessService');

// Access control will automatically detect new subscriptions
// No additional integration needed for basic functionality
```

---

## Testing

### API Testing Examples
```bash
# Test chat access
curl -X POST "http://localhost:5000/api/chat-access/check-access" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "507f1f77bcf86cd799439011",
    "chatContext": {
      "chatId": "507f1f77bcf86cd799439012",
      "chatType": "ONE_TO_ONE",
      "participants": ["507f1f77bcf86cd799439011", "507f1f77bcf86cd799439013"],
      "doctorId": "507f1f77bcf86cd799439013"
    }
  }'

# Test with current user
curl -X POST "http://localhost:5000/api/chat-access/test-access" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "chatContext": {
      "chatId": "507f1f77bcf86cd799439012",
      "chatType": "ONE_TO_ONE",
      "participants": ["507f1f77bcf86cd799439011", "507f1f77bcf86cd799439013"]
    }
  }'
```

### Unit Testing
```javascript
const ChatAccessService = require('./services/chatAccessService');

describe('ChatAccessService', () => {
  test('should allow access with free messages', async () => {
    const result = await ChatAccessService.canAccessChat(userId, chatContext);
    expect(result.allowed).toBe(true);
    expect(result.reason).toBe('FREE_USAGE');
  });
  
  test('should deny access when free messages exhausted', async () => {
    // Exhaust free messages first
    await exhaustFreeMessages(userId);
    
    const result = await ChatAccessService.canAccessChat(userId, chatContext);
    expect(result.allowed).toBe(false);
    expect(result.reason).toBe('FREE_MESSAGES_EXHAUSTED');
  });
});
```

---

## Monitoring and Analytics

### Key Metrics
- **Free Message Usage**: Track free message consumption
- **Subscription Access**: Monitor subscription-based access patterns
- **Grace Period Usage**: Track grace period utilization
- **Access Denials**: Monitor access denial reasons
- **Performance**: Response time and throughput metrics

### Logging
```javascript
// Access control logging
console.log(`Chat Access Check: User ${userId}, Chat ${chatId}, Result: ${result.allowed}, Reason: ${result.reason}`);

// Usage tracking
console.log(`Message Usage: User ${userId}, Free Used: ${usage.freeMessagesUsed}, Remaining: ${usage.remainingFreeMessages}`);
```

---

## Security Considerations

### Data Protection
- **No Sensitive Data**: Access responses don't expose sensitive information
- **Input Validation**: All inputs validated and sanitized
- **User Verification**: User existence verified before access checks

### Access Control
- **Participant Validation**: Strict chat participant checking
- **Subscription Validation**: Comprehensive subscription verification
- **Rate Limiting**: Consider implementing rate limiting for API endpoints

---

## Future Enhancements

### Planned Features
- **Advanced Caching**: Redis integration for better performance
- **Rate Limiting**: Message rate limiting per user
- **Analytics Dashboard**: Comprehensive usage analytics
- **A/B Testing**: Feature flag support for different access rules
- **Multi-tenant**: Support for multiple organizations

### Extensibility
- **Plugin Architecture**: Support for custom access rules
- **Webhook Support**: Real-time access event notifications
- **API Versioning**: Backward-compatible API evolution
- **Configuration UI**: Admin interface for rule configuration

---

*Last Updated: April 2024*
