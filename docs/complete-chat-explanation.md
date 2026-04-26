# Complete Chat System Explanation

---

## System Overview

The chat system is a comprehensive real-time communication platform designed specifically for healthcare consultations between doctors and clients. It supports multiple access models including subscription-based and free messaging, with robust security and user experience features.

### Key Features
- **Real-time messaging** with WebSocket support
- **Subscription-based access control** for premium features
- **Free messaging tier** for trial users (15 messages/month)
- **File sharing** for medical documents
- **Read receipts and typing indicators**
- **Message reactions and editing**
- **Admin monitoring and moderation tools**

---



#### 1. Models (Data Layer)
- **Chat.js** - Chat room management with subscription binding
- **ChatMessage.js** - Individual message storage with metadata
- **UserMessageUsage.js** - Free message tracking per user
- **Subscription.js** - Subscription management for access control

#### 2. Controllers (Business Logic)
- **chatController.js** - HTTP API endpoints for chat operations
- **chatAccessController.js** - Access control testing and validation

#### 3. Services (Core Logic)
- **chatService.js** - Main chat business logic and operations
- **chatAccessService.js** - Access control and permission validation
- **enhancedChatAccessService.js** - Advanced access management

#### 4. Real-time Layer
- **chatSocketHandler.js** - WebSocket event handling
- **Socket.io integration** for real-time communication

#### 5. Routes (API Layer)
- **chat.js** - Main chat API routes
- **chatAccess.js** - Access control testing routes

#### 6. Configuration
- **chatAccessConfig.js** - System configuration and limits

---

## Chat Types & Access Control

### Chat Types

#### ONE_TO_ONE (Doctor-Client)
- **Purpose**: Private consultations between doctor and client
- **Participants**: Exactly 2 users (1 doctor, 1 client)
- **Use Case**: Standard medical consultations

#### GROUP (Multiple Participants)
- **Purpose**: Group discussions or consultations
- **Participants**: Multiple users (doctors, clients, supervisors)
- **Use Case**: Team consultations, family discussions

### Access Control Types

#### 1. DOCTOR Access
- **Requirement**: Active subscription with specific doctor
- **Validation**: Check subscription status and doctor assignment
- **Features**: Unlimited messaging, file sharing, all features

#### 2. BUNDLE Access
- **Requirement**: Active bundle subscription
- **Validation**: Check bundle membership and permissions
- **Features**: Access to multiple doctors/services

#### 3. COUPON Access
- **Requirement**: Valid promotional coupon
- **Validation**: Check coupon validity and expiration
- **Features**: Temporary access with specific limitations

#### 4. FREE Access
- **Requirement**: No subscription required
- **Validation**: Check free message limits
- **Features**: 15 free messages per month, basic features

### Access Priority System
```
1. ACTIVE Subscription (Highest Priority)
2. GRACE Period (After subscription expires)
3. FREE Usage (Lowest Priority - 15 messages/month)
```

---

## Doctor-Client Chat Flow

### Complete Chat Lifecycle

#### Phase 1: Chat Creation
```
Client books consultation → System creates chat room → Doctor gets notification
```

**Process:**
1. Client initiates consultation (booking, direct message, etc.)
2. System validates access (subscription or free tier)
3. Chat room created with appropriate access type
4. Participants added (client and assigned doctor)
5. Notifications sent to both parties

#### Phase 2: Active Messaging
```
Users join chat → Real-time messaging → File sharing → Read receipts
```

**Process:**
1. Users connect via WebSocket
2. Join chat room
3. Exchange messages in real-time
4. Share medical documents/images
5. Track read status and typing indicators

#### Phase 3: Consultation Management
```
Message editing → Reactions → Status updates → Consultation completion
```

**Process:**
1. Users can edit/delete messages
2. Add reactions for quick responses
3. Track consultation progress
4. Mark consultation as completed
5. Archive chat for future reference

### Technical Flow Example

#### 1. Client Initiates Chat
```javascript
// Frontend: Client wants to start consultation
const startConsultation = async (doctorId) => {
  // Check access (subscription or free)
  const accessCheck = await checkChatAccess(clientId, doctorId);
  
  if (accessCheck.hasAccess) {
    // Create chat room
    const chat = await createChat({
      type: 'ONE_TO_ONE',
      participants: [clientId, doctorId],
      accessType: accessCheck.accessType
    });
    
    // Join chat room
    await joinChat(chat.chatId);
    
    // Start messaging
    return chat;
  } else {
    // Show subscription prompt
    showSubscriptionPrompt();
  }
};
```

#### 2. Real-time Messaging
```javascript
// WebSocket connection setup
const socket = io('ws://localhost:5000', {
  auth: { token: jwtToken }
});

// Join chat room
socket.emit('join_room', { chatId: 'consultation_123' });

// Send message
socket.emit('send_message', {
  chatId: 'consultation_123',
  content: 'Hello doctor, I need help with...',
  type: 'TEXT'
});

// Receive messages
socket.on('new_message', (data) => {
  displayMessage(data.message);
});
```

---

## Free Messaging System

### Purpose & Benefits
The free messaging system serves as a trial feature to:
- **Acquire new users** by offering risk-free trial
- **Convert leads** to paid subscriptions
- **Provide emergency access** for urgent consultations
- **Demonstrate value** before purchase commitment

### Free Tier Features

#### Message Limits
- **15 free messages per user** per calendar month
- **Global tracking** across all chat conversations
- **Monthly reset** on the 1st day of each month at 00:00 UTC

#### Available Features
- ✅ Text messaging
- ✅ Basic file sharing (limited size)
- ✅ Read receipts
- ✅ Typing indicators
- ✅ Message editing (within 5 minutes)
- ❌ Advanced features (video calls, screen sharing, etc.)

#### Limitations
- **Message count restriction** (15 per month)
- **File size limits** (smaller than paid tier)
- **No advanced features** (video, voice, etc.)
- **Lower priority** support

### Free Message Tracking

#### Database Schema
```javascript
UserMessageUsage: {
  userId: ObjectId,
  totalMessagesSent: Number,      // Total messages ever sent
  freeMessagesUsed: Number,       // Free messages used this month
  currentPeriodStart: Date,        // Month start date
  currentPeriodEnd: Date,          // Month end date
  lastMessageAt: Date              // Last activity timestamp
}
```

#### Usage Flow
1. **User sends message** → System checks free message count
2. **If limit not reached** → Increment counter, allow message
3. **If limit reached** → Block message, show upgrade prompt
4. **Monthly reset** → Counter resets to 0 on 1st of month

### Free to Paid Migration

#### Upgrade Process
```
User subscribes → System detects active subscription → Access priority changes → Unlimited messaging
```

#### Grace Period
- **7-day grace period** after subscription expires
- **Continue messaging** during grace period
- **Return to free tier** after grace period ends

---

## Real-time Communication

### WebSocket Implementation

#### Connection Setup
```javascript
// Client-side WebSocket connection
const socket = io('ws://localhost:5000', {
  auth: {
    token: 'jwt_token_here'
  },
  transports: ['websocket']
});

// Connection events
socket.on('connect', () => {
  console.log('Connected to chat server');
});

socket.on('disconnect', () => {
  console.log('Disconnected from chat server');
});
```

#### Room Management
```javascript
// Join chat room
socket.emit('join_room', {
  chatId: 'consultation_123',
  userId: 'user_456'
});

// Leave chat room
socket.emit('leave_room', {
  chatId: 'consultation_123',
  userId: 'user_456'
});
```

### Real-time Events

#### 1. Message Events
```javascript
// Send message
socket.emit('send_message', {
  chatId: 'consultation_123',
  content: 'Hello doctor',
  type: 'TEXT',
  timestamp: new Date()
});

// Receive message
socket.on('new_message', (data) => {
  const { message, sender } = data;
  displayMessage(message, sender);
});
```

#### 2. Typing Indicators
```javascript
// Start typing
socket.emit('typing_start', {
  chatId: 'consultation_123',
  userId: 'user_456'
});

// Stop typing
socket.emit('typing_stop', {
  chatId: 'consultation_123',
  userId: 'user_456'
});

// Receive typing events
socket.on('user_typing', (data) => {
  showTypingIndicator(data.userId, data.userName);
});

socket.on('user_stopped_typing', (data) => {
  hideTypingIndicator(data.userId);
});
```

#### 3. Online/Offline Status
```javascript
// User comes online
socket.on('user_online', (data) => {
  updateUserStatus(data.userId, 'online');
});

// User goes offline
socket.on('user_offline', (data) => {
  updateUserStatus(data.userId, 'offline');
  updateUserLastSeen(data.userId, data.lastSeen);
});
```

#### 4. Read Receipts
```javascript
// Mark message as read
socket.emit('mark_read', {
  messageId: 'msg_789',
  userId: 'user_456',
  readAt: new Date()
});

// Receive read receipt
socket.on('message_read', (data) => {
  updateMessageReadStatus(data.messageId, data.userId, data.readAt);
});
```

### Connection Management

#### Auto-Reconnection
```javascript
socket.on('disconnect', (reason) => {
  console.log('Disconnected:', reason);
  
  // Attempt to reconnect
  if (reason === 'io server disconnect') {
    socket.connect();
  }
});

socket.on('reconnect', (attemptNumber) => {
  console.log('Reconnected after', attemptNumber, 'attempts');
  
  // Rejoin all active rooms
  activeChats.forEach(chatId => {
    socket.emit('join_room', { chatId });
  });
});
```

---

## Database Models

### Chat Model
```javascript
Chat: {
  chatId: String (unique, indexed),
  type: String (ONE_TO_ONE | GROUP),
  title: String (optional),
  
  // Subscription binding (CRITICAL for access control)
  subscriptionBinding: {
    subscriptionId: ObjectId (ref: Subscription),
    accessType: String (DOCTOR | BUNDLE | COUPON | FREE),
    allowedParticipantsSource: String (SUBSCRIPTION | BUNDLE_MEMBERS | DOCTOR_CLIENT | FREE_USERS),
    validatedAt: Date,
    expiresAt: Date,
    isActive: Boolean
  },
  
  // Participants
  participants: [{
    userId: ObjectId (ref: User),
    role: String (CLIENT | DOCTOR | ADMIN | SUPERVISOR),
    joinedAt: Date,
    lastSeen: Date,
    isOnline: Boolean
  }],
  
  // Chat status and metadata
  status: String (ACTIVE | SUSPENDED | CLOSED | ARCHIVED),
  metadata: {
    createdBy: ObjectId,
    createdAt: Date,
    lastMessage: { messageId, content, senderId, timestamp },
    messageCount: Number,
    isActive: Boolean
  }
}
```

### ChatMessage Model
```javascript
ChatMessage: {
  messageId: String (unique, indexed),
  chatId: String (ref: Chat),
  senderId: ObjectId (ref: User),
  content: String (required, max 4000 chars),
  type: String (TEXT | IMAGE | FILE | SYSTEM),
  
  // File attachments
  attachment: {
    url: String,
    filename: String,
    mimetype: String,
    size: Number
  },
  
  // Message status
  status: {
    isEdited: Boolean,
    editedAt: Date,
    isDeleted: Boolean,
    deletedAt: Date,
    replyTo: String (messageId)
  },
  
  // Reactions and read receipts
  reactions: [{
    userId: ObjectId,
    type: String (LIKE | LOVE | LAUGH | ANGRY | SAD),
    addedAt: Date
  }],
  
  readReceipts: [{
    userId: ObjectId,
    readAt: Date
  }],
  
  timestamps: {
    createdAt: Date,
    updatedAt: Date
  }
}
```

### UserMessageUsage Model
```javascript
UserMessageUsage: {
  userId: ObjectId (ref: User),
  totalMessagesSent: Number,
  freeMessagesUsed: Number,
  currentPeriodStart: Date,
  currentPeriodEnd: Date,
  lastMessageAt: Date
}
```

---

## API Endpoints

### Core Chat Endpoints

#### 1. Create Chat
```
POST /api/chat/create
```
**Purpose**: Create new chat room with access control
**Access**: Valid JWT + subscription/free tier validation

#### 2. Join Chat
```
POST /api/chat/join
```
**Purpose**: Join existing chat room
**Access**: Must be authorized participant

#### 3. Send Message
```
POST /api/chat/send-message
```
**Purpose**: Send message to chat room
**Access**: Participant with valid access

#### 4. Get Messages
```
GET /api/chat/messages/:chatId
```
**Purpose**: Retrieve chat history with pagination
**Access**: Participant in chat

#### 5. Mark as Read
```
POST /api/chat/mark-read
```
**Purpose**: Mark messages as read
**Access**: Message recipient

#### 6. Edit Message
```
PUT /api/chat/messages/:messageId
```
**Purpose**: Edit previously sent message
**Access**: Message sender only

#### 7. Delete Message
```
DELETE /api/chat/messages/:messageId
```
**Purpose**: Delete message (soft delete)
**Access**: Message sender or admin

#### 8. Add Reaction
```
POST /api/chat/messages/:messageId/reaction
```
**Purpose**: Add/remove reaction to message
**Access**: Chat participant

#### 9. Get User Chats
```
GET /api/chat/user-chats
```
**Purpose**: Get all chats for authenticated user
**Access**: Valid JWT

### Admin Endpoints

#### 1. Get All Chats
```
GET /api/admin/chat/all-chats
```
**Purpose**: System-wide chat retrieval
**Access**: Admin with view_all_chats permission

#### 2. Get Chat Details
```
GET /api/admin/chat/:chatId/details
```
**Purpose**: Comprehensive chat information
**Access**: Admin with view_all_chats permission

#### 3. Moderate Chat
```
POST /api/admin/chat/:chatId/moderate
```
**Purpose**: Content moderation
**Access**: Admin with moderate_chat_content permission

#### 4. Manage Access
```
POST /api/admin/chat/:chatId/manage-access
```
**Purpose**: Control user access to chats
**Access**: Admin with manage_chat_access permission

#### 5. Get Analytics
```
GET /api/admin/chat/analytics
```
**Purpose**: System analytics and statistics
**Access**: Admin with access_chat_analytics permission

---

## WebSocket Events

### Client → Server Events

#### Room Management
- `join_room` - Join chat room
- `leave_room` - Leave chat room

#### Messaging
- `send_message` - Send message to room
- `mark_read` - Mark message as read

#### Status Indicators
- `typing_start` - Start typing indicator
- `typing_stop` - Stop typing indicator

### Server → Client Events

#### Message Events
- `new_message` - New message received
- `message_edited` - Message was edited
- `message_deleted` - Message was deleted
- `message_read` - Message was read
- `message_reaction` - Reaction added/removed

#### User Status
- `user_online` - User came online
- `user_offline` - User went offline
- `user_typing` - User is typing
- `user_stopped_typing` - User stopped typing

#### System Events
- `room_joined` - Successfully joined room
- `room_left` - Successfully left room
- `access_denied` - Access to room denied
- `room_updated` - Room information updated

---

## File Sharing

### Supported File Types

#### Images
- **Formats**: JPG, JPEG, PNG, GIF, WebP
- **Size Limit**: 10MB
- **Use Case**: Medical photos, scans, documents

#### Documents
- **Formats**: PDF, DOC, DOCX, TXT
- **Size Limit**: 25MB
- **Use Case**: Medical reports, prescriptions

#### Audio
- **Formats**: MP3, WAV, M4A
- **Size Limit**: 50MB
- **Use Case**: Voice notes, consultations

#### Video
- **Formats**: MP4, MOV, AVI
- **Size Limit**: 100MB
- **Use Case**: Consultation recordings

### File Upload Process

#### Step 1: Request Upload URL
```javascript
const requestUploadUrl = async (file) => {
  const response = await fetch('/api/chat/upload/request', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      filename: file.name,
      mimetype: file.type,
      size: file.size
    })
  });
  
  return response.json();
};
```

#### Step 2: Upload File
```javascript
const uploadFile = async (uploadUrl, file) => {
  await fetch(uploadUrl, {
    method: 'PUT',
    body: file,
    headers: {
      'Content-Type': file.type
    }
  });
  
  return uploadUrl.split('?')[0]; // Return file URL
};
```

#### Step 3: Send File Message
```javascript
const sendFileMessage = async (chatId, file, fileUrl) => {
  const response = await fetch('/api/chat/send-message', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      chatId,
      content: `Shared file: ${file.name}`,
      type: 'FILE',
      attachment: {
        url: fileUrl,
        filename: file.name,
        mimetype: file.type,
        size: file.size
      }
    })
  });
  
  return response.json();
};
```

---

## Security & Permissions

### Authentication

#### JWT Token Validation
- **Required**: All API requests need valid JWT token
- **Header**: `Authorization: Bearer <token>`
- **Validation**: Token signature and expiration check
- **User Context**: Extract user ID and role from token

#### WebSocket Authentication
- **Handshake**: Token validated during connection
- **Socket Context**: User attached to socket instance
- **Room Access**: Validated before joining rooms

### Authorization

#### Role-Based Access
```javascript
ROLES: {
  CLIENT: {
    canCreateChat: true,
    canSendMessage: true,
    canUploadFiles: true,
    canModerate: false
  },
  DOCTOR: {
    canCreateChat: true,
    canSendMessage: true,
    canUploadFiles: true,
    canModerate: false
  },
  SUPERVISOR: {
    canCreateChat: false,
    canViewAllChats: true, // with permission
    canModerate: true, // with permission
    canManageAccess: false
  },
  ADMIN: {
    canCreateChat: true,
    canViewAllChats: true,
    canModerate: true,
    canManageAccess: true,
    canExportData: true
  }
}
```

#### Permission System
```javascript
PERMISSIONS: {
  // Chat permissions
  'view_all_chats': 4,
  'moderate_chat_content': 4,
  'access_chat_analytics': 3,
  'manage_chat_access': 5,
  'manage_chat_system': 5
}
```

### Access Control Validation

#### Chat Access Check
```javascript
const canAccessChat = async (userId, chatId) => {
  // 1. Check if user is participant
  const isParticipant = await checkParticipant(userId, chatId);
  if (!isParticipant) return false;
  
  // 2. Check subscription access
  const subscriptionAccess = await checkSubscriptionAccess(userId, chatId);
  if (subscriptionAccess.valid) return true;
  
  // 3. Check grace period access
  const graceAccess = await checkGracePeriodAccess(userId, chatId);
  if (graceAccess.valid) return true;
  
  // 4. Check free message access
  const freeAccess = await checkFreeMessageAccess(userId);
  return freeAccess.allowed;
};
```

#### Message Sending Validation
```javascript
const canSendMessage = async (userId, chatId) => {
  // 1. Check chat access
  const canAccess = await canAccessChat(userId, chatId);
  if (!canAccess) return false;
  
  // 2. Check rate limiting
  const rateLimit = await checkRateLimit(userId, chatId);
  if (!rateLimit.allowed) return false;
  
  // 3. Check message content
  const contentValid = await validateMessageContent(content);
  if (!contentValid) return false;
  
  return true;
};
```

---

## Error Handling

### Common Error Types

#### Access Errors
```javascript
{
  "success": false,
  "error": "ACCESS_DENIED",
  "message": "You do not have access to this chat",
  "details": {
    "reason": "SUBSCRIPTION_EXPIRED",
    "subscriptionId": "507f1f77bcf86cd799439013",
    "suggestion": "Renew subscription to continue"
  }
}
```

#### Validation Errors
```javascript
{
  "success": false,
  "error": "VALIDATION_ERROR",
  "message": "Invalid input data",
  "details": [
    {
      "field": "content",
      "message": "Message content cannot be empty"
    },
    {
      "field": "chatId",
      "message": "Invalid chat ID format"
    }
  ]
}
```

#### Rate Limit Errors
```javascript
{
  "success": false,
  "error": "RATE_LIMIT_EXCEEDED",
  "message": "Too many messages sent",
  "details": {
    "limit": 100,
    "resetIn": 3600,
    "currentCount": 101
  }
}
```

#### Free Message Errors
```javascript
{
  "success": false,
  "error": "FREE_MESSAGES_EXHAUSTED",
  "message": "You have used all your free messages",
  "details": {
    "limit": 15,
    "used": 15,
    "remaining": 0,
    "resetDate": "2024-02-01T00:00:00.000Z"
  }
}
```

### Error Handling Strategy

#### Frontend Error Handling
```javascript
const handleApiError = (error) => {
  switch (error.error) {
    case 'ACCESS_DENIED':
      if (error.details.reason === 'SUBSCRIPTION_EXPIRED') {
        showSubscriptionRenewalPrompt();
      } else if (error.details.reason === 'FREE_MESSAGES_EXHAUSTED') {
        showUpgradePrompt(error.details);
      } else {
        showAccessDeniedMessage();
      }
      break;
      
    case 'VALIDATION_ERROR':
      showValidationErrors(error.details);
      break;
      
    case 'RATE_LIMIT_EXCEEDED':
      showRateLimitMessage(error.details.resetIn);
      break;
      
    default:
      showGenericError(error.message);
  }
};
```

#### WebSocket Error Handling
```javascript
socket.on('error', (error) => {
  console.error('Socket error:', error);
  
  if (error.message === 'Authentication failed') {
    // Redirect to login
    redirectToLogin();
  } else if (error.message === 'Access denied') {
    // Show access denied message
    showAccessDeniedMessage();
  } else {
    // Show generic error
    showConnectionError();
  }
});

socket.on('connect_error', (error) => {
  console.error('Connection error:', error);
  
  // Attempt to reconnect
  setTimeout(() => {
    socket.connect();
  }, 5000);
});
```

---

## Frontend Integration

### React Component Example

#### Chat Component
```jsx
import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';

const ChatRoom = ({ chatId, token }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [socket, setSocket] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);

  useEffect(() => {
    // Initialize WebSocket connection
    const newSocket = io('ws://localhost:5000', {
      auth: { token }
    });
    
    setSocket(newSocket);
    
    // Join chat room
    newSocket.emit('join_room', { chatId });
    
    // Set up event listeners
    newSocket.on('new_message', (data) => {
      setMessages(prev => [...prev, data.message]);
    });
    
    newSocket.on('user_typing', (data) => {
      setIsTyping(true);
    });
    
    newSocket.on('user_stopped_typing', () => {
      setIsTyping(false);
    });
    
    newSocket.on('user_online', (data) => {
      setOnlineUsers(prev => [...prev, data.userId]);
    });
    
    // Load initial messages
    loadMessages();
    
    return () => {
      newSocket.emit('leave_room', { chatId });
      newSocket.disconnect();
    };
  }, [chatId, token]);

  const loadMessages = async () => {
    try {
      const response = await fetch(`/api/chat/messages/${chatId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const data = await response.json();
      if (data.success) {
        setMessages(data.data.messages);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;
    
    try {
      // Send via WebSocket for real-time delivery
      socket.emit('send_message', {
        chatId,
        content: newMessage,
        type: 'TEXT'
      });
      
      // Also send via HTTP for persistence
      await fetch('/api/chat/send-message', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          chatId,
          content: newMessage,
          type: 'TEXT'
        })
      });
      
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      handleApiError(error);
    }
  };

  const handleTyping = (e) => {
    setNewMessage(e.target.value);
    
    if (socket) {
      socket.emit('typing_start', { chatId });
      
      // Stop typing after 2 seconds of inactivity
      setTimeout(() => {
        socket.emit('typing_stop', { chatId });
      }, 2000);
    }
  };

  return (
    <div className="chat-room">
      <div className="messages">
        {messages.map(message => (
          <MessageComponent key={message.messageId} message={message} />
        ))}
      </div>
      
      {isTyping && <div className="typing-indicator">Someone is typing...</div>}
      
      <div className="message-input">
        <input
          type="text"
          value={newMessage}
          onChange={handleTyping}
          placeholder="Type a message..."
          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
        />
        <button onClick={sendMessage}>Send</button>
      </div>
    </div>
  );
};

export default ChatRoom;
```

#### Message Component
```jsx
const MessageComponent = ({ message }) => {
  const [showReactions, setShowReactions] = useState(false);
  
  const addReaction = async (reactionType) => {
    try {
      await fetch(`/api/chat/messages/${message.messageId}/reaction`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reactionType })
      });
      
      setShowReactions(false);
    } catch (error) {
      console.error('Error adding reaction:', error);
    }
  };
  
  return (
    <div className={`message ${message.senderId === currentUserId ? 'sent' : 'received'}`}>
      <div className="message-header">
        <span className="sender-name">{message.sender.name}</span>
        <span className="timestamp">
          {new Date(message.timestamps.createdAt).toLocaleTimeString()}
        </span>
      </div>
      
      <div className="message-content">
        {message.type === 'TEXT' && message.content}
        {message.type === 'IMAGE' && (
          <img src={message.attachment.url} alt="Shared image" />
        )}
        {message.type === 'FILE' && (
          <a href={message.attachment.url} download>
            {message.attachment.filename}
          </a>
        )}
      </div>
      
      {message.reactions.length > 0 && (
        <div className="reactions">
          {message.reactions.map(reaction => (
            <span key={reaction.userId} className="reaction">
              {reaction.type} {reaction.count}
            </span>
          ))}
        </div>
      )}
      
      <div className="message-actions">
        <button onClick={() => setShowReactions(!showReactions)}>
          😊 React
        </button>
        {message.senderId === currentUserId && (
          <>
            <button>Edit</button>
            <button>Delete</button>
          </>
        )}
      </div>
      
      {showReactions && (
        <div className="reaction-picker">
          {['LIKE', 'LOVE', 'LAUGH', 'ANGRY', 'SAD'].map(reaction => (
            <button
              key={reaction}
              onClick={() => addReaction(reaction)}
              className="reaction-button"
            >
              {getReactionEmoji(reaction)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
```

---

## Best Practices

### Performance Optimization

#### 1. Message Pagination
```javascript
// Load messages in chunks for better performance
const loadMessages = async (chatId, page = 1, limit = 50) => {
  const response = await fetch(`/api/chat/messages/${chatId}?page=${page}&limit=${limit}`);
  return response.json();
};

// Implement infinite scroll
const handleScroll = async () => {
  if (isNearBottom() && !isLoading) {
    setIsLoading(true);
    const newMessages = await loadMessages(chatId, currentPage + 1);
    setMessages(prev => [...newMessages.data.messages, ...prev]);
    setCurrentPage(prev => prev + 1);
    setIsLoading(false);
  }
};
```

#### 2. Caching Strategy
```javascript
// Cache messages locally for offline access
const cacheMessages = (chatId, messages) => {
  localStorage.setItem(`chat_${chatId}`, JSON.stringify(messages));
};

const getCachedMessages = (chatId) => {
  const cached = localStorage.getItem(`chat_${chatId}`);
  return cached ? JSON.parse(cached) : [];
};
```

#### 3. Lazy Loading
```javascript
// Load chat list on demand
const loadChatList = async (page = 1) => {
  const response = await fetch(`/api/chat/user-chats?page=${page}`);
  return response.json();
};
```

### User Experience

#### 1. Connection Status
```javascript
const ConnectionStatus = ({ isConnected }) => (
  <div className={`connection-status ${isConnected ? 'online' : 'offline'}`}>
    {isConnected ? '🟢 Connected' : '🔴 Reconnecting...'}
  </div>
);
```

#### 2. Typing Indicators
```javascript
const TypingIndicator = ({ users }) => (
  <div className="typing-indicator">
    {users.length > 0 && (
      <span>
        {users.map(user => user.name).join(', ')} 
        {users.length === 1 ? 'is' : 'are'} typing...
      </span>
    )}
  </div>
);
```

#### 3. Read Receipts
```javascript
const ReadReceipt = ({ message, currentUser }) => {
  const readBy = message.readReceipts.filter(
    receipt => receipt.userId !== currentUser.id
  );
  
  return (
    <div className="read-receipt">
      {readBy.length > 0 && (
        <span>Read by {readBy.length} people</span>
      )}
    </div>
  );
};
```

### Security Considerations

#### 1. Input Validation
```javascript
const validateMessage = (content) => {
  // Check length
  if (content.length === 0 || content.length > 4000) {
    return false;
  }
  
  // Check for malicious content
  const maliciousPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi
  ];
  
  return !maliciousPatterns.some(pattern => pattern.test(content));
};
```

#### 2. File Validation
```javascript
const validateFile = (file) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
  const maxSize = 25 * 1024 * 1024; // 25MB
  
  return allowedTypes.includes(file.type) && file.size <= maxSize;
};
```

#### 3. Rate Limiting
```javascript
const rateLimiter = {
  messages: [],
  
  checkLimit: (userId) => {
    const now = Date.now();
    const userMessages = rateLimiter.messages.filter(
      msg => msg.userId === userId && msg.timestamp > now - 60000
    );
    
    return userMessages.length < 10; // 10 messages per minute
  },
  
  addMessage: (userId) => {
    rateLimiter.messages.push({
      userId,
      timestamp: Date.now()
    });
    
    // Clean old messages
    rateLimiter.messages = rateLimiter.messages.filter(
      msg => msg.timestamp > Date.now() - 60000
    );
  }
};
```

---

## Summary

The complete chat system provides:

### ✅ **Core Features**
- Real-time messaging with WebSocket
- Subscription-based and free access models
- File sharing for medical documents
- Read receipts and typing indicators
- Message reactions and editing

### ✅ **Access Control**
- Multi-tier access (subscription, grace period, free)
- Role-based permissions
- Automatic access validation
- Secure authentication

### ✅ **User Experience**
- Smooth real-time updates
- Offline message caching
- Connection status indicators
- Mobile-responsive design

### ✅ **Admin Features**
- System-wide chat monitoring
- Content moderation tools
- Analytics and reporting
- Export capabilities

### ✅ **Technical Excellence**
- Scalable architecture
- Performance optimization
- Comprehensive error handling
- Security best practices

This system is production-ready and provides a complete solution for healthcare communication needs, with proper access control, security, and user experience considerations.
