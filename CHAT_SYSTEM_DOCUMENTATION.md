# Production-Ready Chat System Documentation

## Overview
This document describes the **Production-Ready Chat System** built with Node.js + Socket.io + MongoDB, featuring real-time messaging, subscription-based access control, admin monitoring, and supervisor permissions.

## Architecture

### System Components
- **Models**: `Chat.js`, `ChatMessage.js` - Data models with relationships
- **Services**: `chatService.js` - Business logic with access control integration
- **Controllers**: `chatController.js` - HTTP API endpoints
- **Socket Handler**: `chatSocketHandler.js` - Real-time messaging
- **Socket Server**: `index.js` - Socket.io server setup
- **Routes**: `chat.js` - API route definitions

### Key Features
- **Real-time Messaging**: Socket.io-based instant messaging
- **Access Control**: Integration with subscription system
- **Rate Limiting**: Multi-level rate limiting per user
- **Admin Monitoring**: Read-only admin access to all chats
- **Supervisor Permissions**: Dynamic permission-based access
- **Security**: Full validation and atomic operations

---

## Database Schema

### Chat Model
```javascript
{
  chatId: String,                    // Unique chat identifier
  type: String,                      // ONE_TO_ONE | GROUP
  title: String,                     // Optional chat title
  subscriptionBinding: {
    subscriptionId: ObjectId,        // Required subscription reference
    accessType: String,              // DOCTOR | BUNDLE | COUPON | FREE
    allowedParticipantsSource: String,
    validatedAt: Date,
    isActive: Boolean
  },
  participants: [{
    userId: ObjectId,
    role: String,                   // CLIENT | DOCTOR | ADMIN
    joinedAt: Date,
    isActive: Boolean
  }],
  status: String,                   // ACTIVE | SUSPENDED | CLOSED | ARCHIVED
  rateLimiting: {
    maxMessagesPerMinute: Number,
    maxMessagesPerHour: Number,
    currentMinuteCount: Number,
    currentHourCount: Number
  }
}
```

### ChatMessage Model
```javascript
{
  messageId: String,                // Unique message identifier
  chatId: String,                   // Reference to Chat
  senderId: ObjectId,               // Reference to User
  content: String,                   // Message content
  type: String,                     // TEXT | IMAGE | FILE | SYSTEM
  attachment: {
    url: String,
    filename: String,
    mimeType: String,
    size: Number,
    thumbnailUrl: String
  },
  readBy: [{
    userId: ObjectId,
    readAt: Date
  }],
  status: String,                   // SENT | DELIVERED | READ | FAILED
  metadata: {
    isEdited: Boolean,
    editedAt: Date,
    originalContent: String,
    replyTo: String,
    mentions: [ObjectId],
    reactions: [{
      userId: ObjectId,
      type: String,
      createdAt: Date
    }]
  },
  isDeleted: Boolean,
  deletedAt: Date,
  deletedBy: ObjectId
}
```

---

## API Endpoints

### Base URL
```
http://localhost:5000/api/chat
```

### Authentication
All endpoints require:
- **Authorization Header**: `Bearer <token>`
- **Valid User**: User must exist and be authenticated

### Chat Operations

#### 1. Create Chat
**POST** `/chat/create`

**Request Body**:
```json
{
  "chatData": {
    "chatId": "chat_12345",
    "type": "ONE_TO_ONE",
    "title": "Consultation with Dr. Smith",
    "participants": [
      { "userId": "507f1f77bcf86cd799439011", "role": "CLIENT" },
      { "userId": "507f1f77bcf86cd799439012", "role": "DOCTOR" }
    ]
  },
  "subscriptionId": "507f1f77bcf86cd799439013"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "chat": {
      "chatId": "chat_12345",
      "type": "ONE_TO_ONE",
      "participants": [...],
      "subscriptionBinding": {
        "subscriptionId": "507f1f77bcf86cd799439013",
        "accessType": "DOCTOR",
        "isActive": true
      }
    },
    "subscription": {
      "id": "507f1f77bcf86cd799439013",
      "type": "DOCTOR_BASED",
      "accessType": "DOCTOR"
    }
  }
}
```

#### 2. Send Message
**POST** `/chat/send-message`

**Request Body**:
```json
{
  "chatId": "chat_12345",
  "content": "Hello, I need help with my workout plan",
  "type": "TEXT"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "message": {
      "messageId": "msg_1640123456789_abc123",
      "chatId": "chat_12345",
      "senderId": "507f1f77bcf86cd799439011",
      "content": "Hello, I need help with my workout plan",
      "type": "TEXT",
      "status": "SENT",
      "createdAt": "2024-04-19T10:30:00.000Z"
    },
    "usage": {
      "totalMessagesSent": 16,
      "freeMessagesUsed": 16,
      "remainingFreeMessages": 0
    },
    "accessResult": {
      "allowed": true,
      "reason": "FREE_USAGE",
      "mode": "FREE"
    }
  }
}
```

#### 3. Get Chat Messages
**GET** `/chat/:chatId/messages?page=1&limit=50&markAsRead=true`

**Response**:
```json
{
  "success": true,
  "data": {
    "messages": [
      {
        "messageId": "msg_1640123456789_abc123",
        "chatId": "chat_12345",
        "senderId": "507f1f77bcf86cd799439011",
        "content": "Hello, I need help with my workout plan",
        "type": "TEXT",
        "status": "SENT",
        "readBy": [],
        "createdAt": "2024-04-19T10:30:00.000Z",
        "sender": {
          "name": "John Doe",
          "email": "john@example.com",
          "role": "client"
        }
      }
    ],
    "unreadCount": 0,
    "accessResult": {
      "allowed": true,
      "reason": "FREE_USAGE"
    }
  }
}
```

#### 4. Get User's Chats
**GET** `/chat/my-chats?page=1&limit=20`

**Response**:
```json
{
  "success": true,
  "data": {
    "chats": [
      {
        "chatId": "chat_12345",
        "type": "ONE_TO_ONE",
        "title": "Consultation with Dr. Smith",
        "participants": [...],
        "unreadCount": 0,
        "lastMessage": {
          "content": "Hello, I need help with my workout plan",
          "createdAt": "2024-04-19T10:30:00.000Z"
        }
      }
    ],
    "page": 1,
    "limit": 20
  }
}
```

### Admin Endpoints

#### 5. Get All Chats (Admin)
**GET** `/chat/admin/all-chats?page=1&limit=20&status=ACTIVE`

#### 6. View Chat Messages (Admin)
**GET** `/chat/admin/:chatId/messages?page=1&limit=50`

#### 7. Get Chat Statistics (Admin)
**GET** `/chat/admin/:chatId/statistics`

---

## Socket.io Events

### Connection
```javascript
// Client connects with authentication
const socket = io('http://localhost:5000', {
  auth: {
    token: 'Bearer <jwt_token>'
  }
});
```

### Core Events

#### 1. Join Chat
**Client**:
```javascript
socket.emit('join_chat', {
  chatId: 'chat_12345'
});
```

**Server Response**:
```javascript
socket.on('chat_joined', (data) => {
  console.log('Joined chat:', data.chatId);
  console.log('Unread count:', data.unreadCount);
});
```

#### 2. Send Message
**Client**:
```javascript
socket.emit('send_message', {
  chatId: 'chat_12345',
  content: 'Hello, how are you?',
  type: 'TEXT'
});
```

**Server Response**:
```javascript
socket.on('message_sent', (data) => {
  console.log('Message sent:', data.messageId);
});
```

**Broadcast to Room**:
```javascript
socket.on('new_message', (data) => {
  console.log('New message:', data.message);
  console.log('Sender:', data.sender);
});
```

#### 3. Mark as Read
**Client**:
```javascript
socket.emit('mark_read', {
  messageId: 'msg_1640123456789_abc123'
});
```

#### 4. Typing Indicators
**Client**:
```javascript
socket.emit('typing_start', { chatId: 'chat_12345' });
socket.emit('typing_stop', { chatId: 'chat_12345' });
```

**Server Broadcast**:
```javascript
socket.on('typing_start', (data) => {
  console.log('User typing:', data.userName);
});
```

### Admin Events

#### 5. Admin Join Chat View
**Client**:
```javascript
socket.emit('admin_join_chat', {
  chatId: 'chat_12345'
});
```

**Server Response**:
```javascript
socket.on('admin_chat_joined', (data) => {
  console.log('Admin joined chat view:', data.chatId);
});
```

**Admin receives all messages**:
```javascript
socket.on('new_message', (data) => {
  if (data.viewerType === 'admin') {
    console.log('Admin monitoring message:', data.message);
  }
});
```

### Supervisor Events

#### 6. Supervisor Join Chat View
**Client**:
```javascript
socket.emit('supervisor_join_chat', {
  chatId: 'chat_12345'
});
```

**Server Response**:
```javascript
socket.on('supervisor_chat_joined', (data) => {
  console.log('Supervisor joined chat view:', data.chatId);
});
```

---

## Access Control Integration

### Message Flow with Access Control
1. **User sends message** via socket
2. **Rate limiting check** (5/min, 50/hour, 200/day)
3. **Subscription validation** via ChatAccessService
4. **Chat participant validation**
5. **Atomic free message update** (if applicable)
6. **Message saved to database**
7. **Broadcast to room**
8. **Broadcast to admin/supervisor viewers**

### Access Priority Order
1. **Active Subscription** (Highest priority)
2. **Grace Period** (24 hours after expiration)
3. **Free Messages** (Fallback, 15 global limit)

### Rate Limiting
```javascript
USER_LIMITS: {
  MAX_PER_MINUTE: 5,    // 5 messages per minute
  MAX_PER_HOUR: 50,     // 50 messages per hour  
  MAX_PER_DAY: 200      // 200 messages per day
}
```

### Permission System
- **Admin**: Full read-only access to all chats
- **Supervisor**: READ_ALL_CHATS permission required
- **Users**: Access only to their own chats with valid subscription

---

## Security Features

### Input Validation
- **All inputs validated** and sanitized
- **Message length limits** (4000 characters)
- **File attachment validation** (type, size)
- **Chat ID format validation**

### Access Control
- **Subscription binding**: Chats bound to subscriptions
- **Participant validation**: Strict participant checking
- **Rate limiting**: Multi-level rate limiting
- **Permission checks**: Dynamic permission system

### Data Protection
- **Atomic operations**: No race conditions
- **Soft deletes**: Messages can be recovered
- **Read receipts**: Track message read status
- **Audit logging**: All actions logged

---

## Performance Optimizations

### Database Indexes
```javascript
// Chat model indexes
chatSchema.index({ chatId: 1 });
chatSchema.index({ 'participants.userId': 1 });
chatSchema.index({ 'subscriptionBinding.subscriptionId': 1 });

// Message model indexes
messageSchema.index({ chatId: 1, createdAt: -1 });
messageSchema.index({ senderId: 1, createdAt: -1 });
messageSchema.index({ 'readBy.userId': 1 });
```

### Socket.io Optimization
- **Room-based broadcasting**: Efficient message delivery
- **Connection pooling**: Reuse connections
- **Compression**: Message compression
- **Heartbeat**: Connection health monitoring

### Caching Strategy
- **Subscription cache**: 5-minute TTL
- **User permission cache**: 10-minute TTL
- **Chat metadata cache**: 15-minute TTL

---

## Admin Monitoring

### Admin Capabilities
- **View all chats**: Real-time access to any chat
- **Read-only mode**: Cannot send messages or interact
- **Live monitoring**: See messages as they're sent
- **Statistics**: Chat activity metrics

### Admin Socket Events
```javascript
// Join chat view
socket.emit('admin_join_chat', { chatId: 'chat_12345' });

// Leave chat view
socket.emit('admin_leave_chat', { chatId: 'chat_12345' });

// Receive messages
socket.on('new_message', (data) => {
  if (data.viewerType === 'admin') {
    // Handle admin monitoring
  }
});
```

### Admin API Endpoints
```javascript
// Get all chats
GET /api/chat/admin/all-chats

// View chat messages
GET /api/chat/admin/:chatId/messages

// Get chat statistics
GET /api/chat/admin/:chatId/statistics
```

---

## Supervisor Permissions

### Permission-Based Access
- **VIEW_ALL_CHATS**: Required for supervisor access
- **Dynamic assignment**: Admin can grant/revoke permissions
- **Read-only**: Supervisors cannot send messages
- **User-specific**: Not role-based global access

### Supervisor Socket Events
```javascript
// Join chat view (requires permission)
socket.emit('supervisor_join_chat', { chatId: 'chat_12345' });

// Leave chat view
socket.emit('supervisor_leave_chat', { chatId: 'chat_12345' });

// Receive messages
socket.on('new_message', (data) => {
  if (data.viewerType === 'supervisor') {
    // Handle supervisor monitoring
  }
});
```

### Permission Management
```javascript
// Grant permission
POST /api/permissions/grant
{
  "userId": "507f1f77bcf86cd799439011",
  "permissionName": "VIEW_ALL_CHATS",
  "reason": "Grant chat monitoring access"
}

// Check permission
GET /api/permissions/check/:userId/VIEW_ALL_CHATS
```

---

## Testing

### Concurrency Testing
```javascript
// Test concurrent messages
POST /api/chat-access/enhanced/concurrency-test
{
  "userId": "507f1f77bcf86cd799439011",
  "chatId": "chat_12345",
  "messageCount": 10
}
```

### Access Control Testing
```javascript
// Test access analysis
POST /api/chat-access/enhanced/analyze-access
{
  "userId": "507f1f77bcf86cd799439011",
  "chatId": "chat_12345"
}
```

### Load Testing
```javascript
// Simulate multiple users
const users = Array.from({ length: 100 }, (_, i) => ({
  userId: `user_${i}`,
  socket: io('http://localhost:5000', { auth: { token: getToken(`user_${i}`) } })
}));

// Send concurrent messages
users.forEach(user => {
  user.socket.emit('send_message', {
    chatId: 'chat_12345',
    content: `Message from ${user.userId}`,
    type: 'TEXT'
  });
});
```

---

## Monitoring and Analytics

### System Metrics
```javascript
// Get system health
GET /api/chat-access/enhanced/health

Response:
{
  "success": true,
  "data": {
    "status": "HEALTHY",
    "metrics": {
      "totalUsers": 1000,
      "activeChats": 250,
      "totalMessages": 50000,
      "blockedUsers": 5
    },
    "services": {
      "chatAccessService": "HEALTHY",
      "userMessageUsage": "HEALTHY",
      "userRateLimit": "HEALTHY",
      "chatModel": "HEALTHY"
    }
  }
}
```

### Performance Metrics
- **Message throughput**: Messages per second
- **Response time**: Average response time
- **Connection count**: Active socket connections
- **Error rate**: Percentage of failed operations

### Security Metrics
- **Blocked attempts**: Rate limit violations
- **Access denials**: Permission failures
- **Suspicious activity**: Unusual patterns
- **System health**: Service availability

---

## Integration Examples

### Frontend Integration
```javascript
// Initialize socket connection
const socket = io('http://localhost:5000', {
  auth: { token: localStorage.getItem('token') }
});

// Join chat
socket.emit('join_chat', { chatId: 'chat_12345' });

// Send message
socket.emit('send_message', {
  chatId: 'chat_12345',
  content: 'Hello!',
  type: 'TEXT'
});

// Receive messages
socket.on('new_message', (data) => {
  displayMessage(data.message, data.sender);
});

// Handle typing indicators
socket.on('typing_start', (data) => {
  showTypingIndicator(data.userName);
});
```

### Admin Dashboard Integration
```javascript
// Admin monitoring
const adminSocket = io('http://localhost:5000', {
  auth: { token: adminToken }
});

// Join chat view
adminSocket.emit('admin_join_chat', { chatId: 'chat_12345' });

// Monitor messages
adminSocket.on('new_message', (data) => {
  if (data.viewerType === 'admin') {
    updateAdminChatView(data.message, data.sender);
  }
});
```

---

## Deployment Considerations

### Environment Variables
```bash
# Server
PORT=5000
NODE_ENV=production
FRONTEND_URL=https://yourapp.com

# Database
MONGODB_URI=mongodb://localhost:27017/fitness-platform

# JWT
JWT_SECRET=your-super-secret-jwt-key

# Socket.io
SOCKET_CORS_ORIGIN=https://yourapp.com
```

### Scaling Considerations
- **Multiple server instances**: Use Redis adapter for Socket.io
- **Database sharding**: Shard by chatId or userId
- **Load balancing**: Distribute socket connections
- **Monitoring**: Track performance metrics

### Security Hardening
- **HTTPS**: Use SSL/TLS in production
- **Rate limiting**: Adjust limits based on traffic
- **Input validation**: Strict validation rules
- **Access control**: Regular permission audits

---

## Troubleshooting

### Common Issues
1. **Socket connection fails**: Check authentication token
2. **Messages not sending**: Check subscription status
3. **Rate limit errors**: Check user rate limit status
4. **Access denied**: Check user permissions and chat participants
5. **Admin access denied**: Check admin role and permissions

### Debugging Tools
- **Socket.io debugging**: Enable debug logging
- **Access analysis**: Use analyze-access endpoint
- **System health**: Check health endpoint
- **Database queries**: Monitor database performance

### Performance Issues
- **High latency**: Check database indexes
- **Memory usage**: Monitor socket connections
- **CPU usage**: Optimize message processing
- **Network bandwidth**: Compress messages

---

## Future Enhancements

### Planned Features
- **File sharing**: Enhanced file attachment support
- **Voice messages**: Audio message support
- **Video calls**: WebRTC integration
- **Message encryption**: End-to-end encryption
- **Push notifications**: Mobile push notifications

### Scalability Improvements
- **Redis adapter**: Multi-server Socket.io support
- **Message queuing**: Queue system for high volume
- **Database optimization**: Advanced indexing strategies
- **CDN integration**: Static file delivery

### Security Enhancements
- **End-to-end encryption**: Message encryption
- **Two-factor authentication**: Enhanced security
- **Audit logging**: Comprehensive audit trail
- **Rate limiting**: Advanced rate limiting algorithms

---

*Last Updated: April 2024*
