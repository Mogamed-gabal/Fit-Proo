# Enhanced Chat Access Control Engine Documentation

## Overview
This document describes the **Enhanced Chat Access Control Engine** - a secure, production-ready system that eliminates all bypass risks, logic issues, and concurrency problems while providing proper access priority, subscription binding, and atomic operations.

## Critical Security Fixes

### 1. Fixed Access Priority Logic (CRITICAL)
**BEFORE:** Free usage could override subscription access
**AFTER:** Proper priority order enforced:
1. **Active Subscription Access** (Priority 1 - Highest)
2. **Grace Period Access** (Priority 2)
3. **Free Message Usage** (Priority 3 - Fallback only)

### 2. Strong Chat-Subscription Binding (ANTI-BYPASS)
**BEFORE:** Relied on client-provided doctorId/bundleId
**AFTER:** Each chat is explicitly bound to:
- `subscriptionId` (Required database reference)
- `accessType` (DOCTOR | BUNDLE | COUPON | FREE)
- `allowedParticipantsSource` (Validated from subscription)
- `validatedAt` (Timestamp of binding validation)

### 3. Atomic Free Message Handling (Concurrency Fix)
**BEFORE:** Separate "check then update" with race conditions
**AFTER:** Single atomic operation:
```javascript
// Atomic increment with limit check
const usage = await UserMessageUsage.findOneAndUpdate(
  { 
    userId,
    freeMessagesUsed: { $lt: 15 } // Atomic limit check
  },
  { 
    $inc: { 
      freeMessagesUsed: 1,
      totalMessagesSent: 1
    }
  }
);
```

### 4. Rate Limiting Layer
**NEW:** Per-user rate limiting with progressive penalties:
- **5 messages/minute** - Base limit
- **50 messages/hour** - Hourly limit
- **200 messages/day** - Daily limit
- **Automatic blocking** - Progressive penalties (5min, 30min, 2hr)

### 5. Enhanced Grace Period UX
**BEFORE:** Simple boolean flag
**AFTER:** Structured warnings:
```javascript
{
  "isInGracePeriod": true,
  "willExpireSoon": true,
  "expiresAt": "2024-04-20T10:00:00.000Z",
  "originalSubscriptionEnd": "2024-04-19T10:00:00.000Z"
}
```

---

## Architecture

### Enhanced System Components
- **Chat Model**: `Chat.js` - Subscription binding and validation
- **User Rate Limit**: `UserRateLimit.js` - Per-user rate limiting
- **Enhanced Service**: `enhancedChatAccessService.js` - Secure business logic
- **Enhanced Controller**: `enhancedChatAccessController.js` - Advanced API endpoints
- **Enhanced Routes**: `enhancedChatAccess.js` - Secure API routes

### Security Enhancements
- **Database-Driven Validation**: All chat data validated from database
- **Subscription Binding**: Chats bound to subscriptions at creation
- **Atomic Operations**: All counter updates are atomic
- **Rate Limiting**: Multi-level rate limiting with penalties
- **Access Priority**: Correct priority order enforced

---

## API Endpoints

### Enhanced Access Control
```
POST /api/chat-access/enhanced/check-access     - Check chat access (database validated)
POST /api/chat-access/enhanced/check-send       - Check send permission
POST /api/chat-access/enhanced/record-message   - Record message (atomic)
GET  /api/chat-access/enhanced/user-summary/:id - Enhanced user summary
POST /api/chat-access/enhanced/create-chat      - Create bound chat
POST /api/chat-access/enhanced/test-access      - Test with current user
POST /api/chat-access/enhanced/analyze-access   - Detailed analysis
POST /api/chat-access/enhanced/concurrency-test - Concurrency testing
GET  /api/chat-access/enhanced/health          - System health
```

### Enhanced Response Structure
```javascript
{
  "allowed": true,
  "reason": "SUBSCRIPTION_ACTIVE",
  "mode": "SUBSCRIPTION",
  "isUsingFreeMessage": false,
  "isInGracePeriod": false,
  "willExpireSoon": true,
  "remainingFreeMessages": 12,
  "subscriptionId": "507f1f77bcf86cd799439011",
  "subscriptionType": "DOCTOR_BASED",
  "expiresAt": "2024-04-25T10:00:00.000Z",
  "timestamp": "2024-04-19T10:39:00.000Z"
}
```

---

## Security Features

### 1. Subscription Binding Validation
```javascript
// Chat creation with mandatory subscription binding
const chat = await Chat.createBoundChat(chatData, subscriptionId, accessType);

// Access validation against subscription
const validation = await Chat.validateChatAccess(chatId, userId);
if (!validation.valid) {
  return { allowed: false, reason: validation.reason };
}
```

### 2. Atomic Message Recording
```javascript
// Free message with atomic limit check
const usage = await UserMessageUsage.findOneAndUpdate(
  { 
    userId,
    freeMessagesUsed: { $lt: 15 } // Atomic limit check
  },
  { 
    $inc: { 
      freeMessagesUsed: 1,
      totalMessagesSent: 1
    }
  }
);

if (!usage) {
  throw new Error('Free messages exhausted');
}
```

### 3. Rate Limiting with Penalties
```javascript
// Check user rate limit
const rateLimitCheck = await UserRateLimit.checkRateLimit(userId, 'SEND_MESSAGE');
if (!rateLimitCheck.allowed) {
  return {
    allowed: false,
    reason: 'RATE_LIMITED',
    blockedUntil: rateLimitCheck.blockedUntil
  };
}
```

### 4. Access Priority Enforcement
```javascript
// Priority 1: Active Subscription
if (subscription.status === 'ACTIVE' && subscription.endDate >= now) {
  return createAccessResponse(true, 'SUBSCRIPTION_ACTIVE', { mode: 'SUBSCRIPTION' });
}

// Priority 2: Grace Period
const gracePeriodEnd = new Date(subscription.endDate.getTime() + (24 * 60 * 60 * 1000));
if (now <= gracePeriodEnd) {
  return createAccessResponse(true, 'GRACE_PERIOD', { mode: 'GRACE' });
}

// Priority 3: Free Usage (Fallback only)
const freeAccess = await checkFreeMessageAccess(userId);
if (freeAccess.allowed) {
  return createAccessResponse(true, 'FREE_USAGE', { mode: 'FREE' });
}
```

---

## Database Schema Enhancements

### Chat Model (New)
```javascript
{
  chatId: String,                    // Unique chat identifier
  type: String,                      // ONE_TO_ONE | GROUP
  subscriptionBinding: {
    subscriptionId: ObjectId,        // Required subscription reference
    accessType: String,              // DOCTOR | BUNDLE | COUPON | FREE
    allowedParticipantsSource: String, // Source of allowed participants
    validatedAt: Date,              // When binding was validated
    isActive: Boolean               // Binding status
  },
  participants: [{
    userId: ObjectId,
    role: String,                   // CLIENT | DOCTOR | ADMIN
    joinedAt: Date,
    isActive: Boolean
  }],
  rateLimiting: {
    maxMessagesPerMinute: Number,
    maxMessagesPerHour: Number,
    currentMinuteCount: Number,
    currentHourCount: Number
  }
}
```

### User Rate Limit Model (New)
```javascript
{
  userId: ObjectId,
  messageCounters: {
    lastMinute: { count: Number, resetAt: Date },
    lastHour: { count: Number, resetAt: Date },
    lastDay: { count: Number, resetAt: Date }
  },
  limits: {
    maxPerMinute: Number,
    maxPerHour: Number,
    maxPerDay: Number
  },
  violations: {
    totalViolations: Number,
    currentBlockUntil: Date,
    blockHistory: [{
      blockedAt: Date,
      reason: String,
      duration: Number,
      unblockedAt: Date
    }]
  }
}
```

---

## Concurrency Safety

### Atomic Operations
All counter updates use MongoDB atomic operations:
```javascript
// Atomic increment with limit check
$inc: { freeMessagesUsed: 1, totalMessagesSent: 1 }

// Atomic rate limit update
$inc: { 'messageCounters.lastMinute.count': 1 }
```

### Race Condition Prevention
- **Single Operation**: Check and update in one atomic operation
- **No Separate Steps**: No "check then update" pattern
- **Database Constraints**: Limits enforced at database level
- **Retry Logic**: Automatic retry for concurrent operations

### Lock-Free Design
- **Optimistic Concurrency**: Use atomic operations instead of locks
- **No Deadlocks**: No locking mechanisms that can cause deadlocks
- **High Performance**: Optimized for concurrent access

---

## Rate Limiting System

### Multi-Level Limits
```javascript
USER_LIMITS: {
  MAX_PER_MINUTE: 5,    // 5 messages per minute
  MAX_PER_HOUR: 50,     // 50 messages per hour  
  MAX_PER_DAY: 200      // 200 messages per day
}
```

### Progressive Penalties
```javascript
VIOLATION_PENALTIES: {
  FIRST_VIOLATION: 5 * 60 * 1000,      // 5 minutes
  SECOND_VIOLATION: 30 * 60 * 1000,     // 30 minutes
  MULTIPLE_VIOLATIONS: 2 * 60 * 60 * 1000 // 2 hours
}
```

### Automatic Blocking
- **Violation Tracking**: Count of violations maintained
- **Progressive Blocking**: Longer blocks for repeat violations
- **Automatic Unblocking**: Blocks expire automatically
- **Manual Override**: Admins can manually unblock users

---

## Subscription Binding Validation

### Doctor-Based Access
```javascript
// Validate doctor-client relationship
const subscriptionDoctorId = subscription.features.get('doctor_id');
if (user._id.toString() === subscriptionDoctorId.toString()) {
  return { allowed: true, reason: 'DOCTOR_ACCESS' };
}

// Client access validation
if (user.role === 'client' && isParticipant) {
  return { allowed: true, reason: 'CLIENT_DOCTOR_ACCESS' };
}
```

### Bundle-Based Access
```javascript
// Validate bundle membership
const bundleParticipants = subscription.features.get('bundle_participants') || [];
if (bundleParticipants.includes(userId.toString())) {
  return { allowed: true, reason: 'BUNDLE_ACCESS' };
}
```

### Coupon-Based Access
```javascript
// Validate coupon validity
const couponUsers = subscription.features.get('coupon_users') || [];
if (couponUsers.includes(userId.toString())) {
  return { allowed: true, reason: 'COUPON_ACCESS' };
}
```

---

## Enhanced UX Signaling

### Expiration Warnings
```javascript
{
  "willExpireSoon": true,
  "expiresAt": "2024-04-20T10:00:00.000Z",
  "hoursUntilExpiration": 23,
  "warningType": "EXPIRATION_WARNING"
}
```

### Grace Period Notifications
```javascript
{
  "isInGracePeriod": true,
  "gracePeriodEnds": "2024-04-20T10:00:00.000Z",
  "hoursUntilGraceEnd": 2,
  "warningType": "GRACE_PERIOD_WARNING"
}
```

### Free Message Warnings
```javascript
{
  "remainingFreeMessages": 2,
  "freeMessagesWarning": true,
  "warningType": "FREE_MESSAGES_LOW"
}
```

---

## Testing and Validation

### Concurrency Testing
```bash
# Test concurrent message sending
curl -X POST "http://localhost:5000/api/chat-access/enhanced/concurrency-test" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "507f1f77bcf86cd799439011",
    "chatId": "chat123",
    "messageCount": 10
  }'
```

### Access Analysis
```bash
# Detailed access analysis
curl -X POST "http://localhost:5000/api/chat-access/enhanced/analyze-access" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "507f1f77bcf86cd799439011",
    "chatId": "chat123"
  }'
```

### System Health
```bash
# Get system health metrics
curl -X GET "http://localhost:5000/api/chat-access/enhanced/health" \
  -H "Authorization: Bearer <token>"
```

---

## Performance Optimizations

### Database Indexes
```javascript
// Chat model indexes
chatSchema.index({ chatId: 1 });
chatSchema.index({ 'subscriptionBinding.subscriptionId': 1 });
chatSchema.index({ 'participants.userId': 1 });

// User rate limit indexes
userRateLimitSchema.index({ userId: 1 });
userRateLimitSchema.index({ 'violations.currentBlockUntil': 1 });
```

### Caching Strategy
```javascript
CACHE: {
  TTL_SECONDS: 300,              // 5 minutes for user access
  CHAT_CACHE_TTL: 600,           // 10 minutes for chat data
  SUBSCRIPTION_CACHE_TTL: 300    // 5 minutes for subscription data
}
```

### Atomic Operations
- **Single Database Call**: Check and update in one operation
- **No Round Trips**: Minimize database round trips
- **Efficient Queries**: Optimized database queries
- **Connection Pooling**: Reuse database connections

---

## Security Considerations

### Input Validation
- **Strict Validation**: All inputs validated and sanitized
- **Type Checking**: Strict type checking for all parameters
- **SQL Injection Prevention**: Use parameterized queries
- **XSS Prevention**: Output encoding and sanitization

### Access Control
- **Database Validation**: All access validated from database
- **Subscription Binding**: Chats bound to subscriptions
- **Participant Validation**: Strict participant checking
- **Rate Limiting**: Prevent abuse and spam

### Data Protection
- **No Sensitive Data**: No sensitive data in responses
- **Audit Logging**: All access checks logged
- **Error Handling**: Secure error handling
- **Encryption**: Data encrypted at rest

---

## Monitoring and Analytics

### System Metrics
```javascript
{
  "totalUsers": 1000,
  "activeChats": 250,
  "totalMessages": 50000,
  "blockedUsers": 5,
  "avgFreeMessagesUsed": 8,
  "avgFreeMessagesRemaining": 7
}
```

### Performance Metrics
- **Response Time**: Average response time for access checks
- **Throughput**: Messages per second
- **Error Rate**: Percentage of failed operations
- **Concurrency**: Concurrent user count

### Security Metrics
- **Blocked Attempts**: Number of blocked access attempts
- **Rate Limit Violations**: Rate limiting violations
- **Suspicious Activity**: Unusual access patterns
- **Security Events**: Security-related events

---

## Integration Guidelines

### Chat System Integration
```javascript
// Enhanced message sending
async function sendMessage(req, res) {
  const { userId, chatId, message } = req.body;
  
  // Check send permission (includes all validations)
  const canSend = await EnhancedChatAccessService.canSendMessage(userId, chatId);
  
  if (!canSend.allowed) {
    return res.status(403).json({
      error: 'Access denied',
      reason: canSend.reason,
      willExpireSoon: canSend.willExpireSoon
    });
  }
  
  // Record message atomically
  const result = await EnhancedChatAccessService.recordMessage(userId, chatId, {
    messageType: 'TEXT',
    content: message
  });
  
  // Send message
  await sendChatMessage(chatId, message);
  
  return res.json({
    success: true,
    usage: result.usage
  });
}
```

### Subscription System Integration
```javascript
// Create chat with subscription binding
async function createChat(req, res) {
  const { userId, chatData, subscriptionId } = req.body;
  
  // Create bound chat
  const result = await EnhancedChatAccessService.createBoundChat(
    userId, 
    chatData, 
    subscriptionId
  );
  
  return res.json(result);
}
```

---

## Migration Guide

### From Original System
1. **Create Chat Records**: Migrate existing chats to new Chat model
2. **Bind Subscriptions**: Link chats to subscriptions
3. **Update Rate Limits**: Initialize user rate limit records
4. **Update API Calls**: Use enhanced endpoints
5. **Test Thoroughly**: Validate all access scenarios

### Backward Compatibility
- **Original Endpoints**: Still available for testing
- **Gradual Migration**: Can migrate gradually
- **Feature Flags**: Can enable/disable features
- **Rollback Support**: Can rollback if needed

---

## Troubleshooting

### Common Issues
1. **Access Denied**: Check subscription binding and participant status
2. **Rate Limited**: Check user rate limit status
3. **Concurrent Messages**: Atomic operations should handle this
4. **Chat Not Found**: Validate chat exists and is active

### Debugging Tools
- **Access Analysis**: Use analyze-access endpoint
- **Concurrency Testing**: Use concurrency-test endpoint
- **System Health**: Use health endpoint
- **User Summary**: Use user-summary endpoint

---

## Future Enhancements

### Planned Features
- **Redis Caching**: Redis integration for better performance
- **WebSocket Support**: Real-time access updates
- **Advanced Analytics**: More detailed analytics
- **Machine Learning**: Anomaly detection for abuse
- **Multi-Region**: Multi-region deployment support

### Extensibility
- **Plugin System**: Support for custom access rules
- **Webhook Support**: Real-time event notifications
- **API Versioning**: Backward-compatible API evolution
- **Configuration UI**: Admin interface for management

---

*Last Updated: April 2024*
