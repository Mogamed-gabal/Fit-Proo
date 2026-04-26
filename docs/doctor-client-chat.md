# Doctor-Client Chat System Documentation

## Overview

This documentation covers the complete chat system for doctor-client interactions. It provides the technical implementation details needed for frontend developers to integrate real-time messaging between doctors and their clients.

---

## Chat Flow Overview

### Complete Chat Lifecycle

```
1. Client starts consultation → 2. Chat room created → 3. Doctor joins → 4. Real-time messaging → 5. Consultation ends
```

### Key Components

1. **Chat Creation** - Automatic chat room creation when consultation starts
2. **Real-time Messaging** - WebSocket-based instant messaging
3. **Message Management** - Send, receive, edit, delete messages
4. **File Sharing** - Share medical documents and images
5. **Read Receipts** - Track message read status
6. **Typing Indicators** - Show when someone is typing

---

## Authentication & Access Control

### Required Headers

All API requests must include:

```http
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

### Subscription-Based Access

Chat access is tied to active subscriptions:

- **Doctor Access**: Must have active subscription with client
- **Client Access**: Must have active consultation package
- **Validation**: Every request checks subscription status

---

## Core API Endpoints

### 1. Create Chat Room

#### Endpoint
```
POST /api/chat/create
```

#### Purpose
Create a new chat room for doctor-client consultation.

#### When to Use
- When a client books a consultation
- When a doctor starts a new session
- When creating a follow-up conversation

#### Request Body

```json
{
  "chatData": {
    "chatId": "consultation_123456789",
    "type": "ONE_TO_ONE",
    "title": "Consultation with Dr. Sarah Smith",
    "participants": [
      {
        "userId": "507f1f77bcf86cd799439011",
        "role": "CLIENT"
      },
      {
        "userId": "507f1f77bcf86cd799439012",
        "role": "DOCTOR"
      }
    ]
  },
  "subscriptionId": "507f1f77bcf86cd799439013"
}
```

#### Request Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| chatData.chatId | String | Yes | Unique identifier for chat room |
| chatData.type | String | Yes | Always "ONE_TO_ONE" for doctor-client |
| chatData.title | String | No | Display name for chat |
| chatData.participants | Array | Yes | Doctor and client participants |
| subscriptionId | String | Yes | Active subscription ID |

#### Response Structure

```json
{
  "success": true,
  "data": {
    "chat": {
      "chatId": "consultation_123456789",
      "type": "ONE_TO_ONE",
      "title": "Consultation with Dr. Sarah Smith",
      "subscriptionBinding": {
        "subscriptionId": "507f1f77bcf86cd799439013",
        "accessType": "DOCTOR",
        "allowedParticipantsSource": "SUBSCRIPTION",
        "validatedAt": "2024-01-15T10:30:00.000Z",
        "expiresAt": "2024-04-15T10:30:00.000Z",
        "isActive": true
      },
      "participants": [
        {
          "userId": "507f1f77bcf86cd799439011",
          "role": "CLIENT",
          "joinedAt": "2024-01-15T10:30:00.000Z",
          "isOnline": false
        },
        {
          "userId": "507f1f77bcf86cd799439012",
          "role": "DOCTOR",
          "joinedAt": "2024-01-15T10:30:00.000Z",
          "isOnline": false
        }
      ],
      "metadata": {
        "createdBy": "507f1f77bcf86cd799439015",
        "createdAt": "2024-01-15T10:30:00.000Z",
        "messageCount": 0,
        "isActive": true
      }
    }
  }
}
```

#### Error Handling

```json
{
  "success": false,
  "error": "SUBSCRIPTION_NOT_ACTIVE",
  "message": "Subscription is not active or expired",
  "details": {
    "subscriptionId": "507f1f77bcf86cd799439013",
    "status": "EXPIRED"
  }
}
```

---

### 2. Join Chat Room

#### Endpoint
```
POST /api/chat/join
```

#### Purpose
Join an existing chat room and receive initial data.

#### When to Use
- When opening chat interface
- When reconnecting after disconnection
- When switching between chats

#### Request Body

```json
{
  "chatId": "consultation_123456789"
}
```

#### Response Structure

```json
{
  "success": true,
  "data": {
    "chat": {
      "chatId": "consultation_123456789",
      "type": "ONE_TO_ONE",
      "title": "Consultation with Dr. Sarah Smith",
      "participants": [
        {
          "userId": "507f1f77bcf86cd799439011",
          "name": "John Doe",
          "role": "CLIENT",
          "isOnline": true,
          "lastSeen": "2024-01-15T14:30:00.000Z"
        },
        {
          "userId": "507f1f77bcf86cd799439012",
          "name": "Dr. Sarah Smith",
          "role": "DOCTOR",
          "isOnline": true,
          "lastSeen": "2024-01-15T14:28:00.000Z"
        }
      ],
      "metadata": {
        "lastMessage": null,
        "messageCount": 0,
        "isActive": true
      }
    },
    "participantInfo": {
      "userId": "507f1f77bcf86cd799439011",
      "role": "CLIENT",
      "joinedAt": "2024-01-15T10:30:00.000Z",
      "isOnline": true
    },
    "recentMessages": [],
    "unreadCount": 0
  }
}
```

---

### 3. Send Message

#### Endpoint
```
POST /api/chat/send-message
```

#### Purpose
Send a message to the chat room.

#### When to Use
- Sending text messages
- Sharing images or files
- Replying to previous messages

#### Request Body

```json
{
  "chatId": "consultation_123456789",
  "content": "Hello, I'm experiencing some symptoms...",
  "type": "TEXT",
  "attachment": null,
  "replyTo": null
}
```

#### Request Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| chatId | String | Yes | Target chat room ID |
| content | String | Yes | Message content (1-4000 chars) |
| type | String | No | Message type (TEXT, IMAGE, FILE) |
| attachment | Object | No | File attachment info |
| replyTo | String | No | Message ID being replied to |

#### File Attachment Example

```json
{
  "chatId": "consultation_123456789",
  "content": "Here's my medical report",
  "type": "FILE",
  "attachment": {
    "url": "https://storage.example.com/files/medical_report.pdf",
    "filename": "medical_report.pdf",
    "mimetype": "application/pdf",
    "size": 2048576
  }
}
```

#### Response Structure

```json
{
  "success": true,
  "data": {
    "message": {
      "messageId": "msg_123456789",
      "chatId": "consultation_123456789",
      "senderId": "507f1f77bcf86cd799439011",
      "content": "Hello, I'm experiencing some symptoms...",
      "type": "TEXT",
      "status": {
        "isEdited": false,
        "isDeleted": false
      },
      "reactions": [],
      "readReceipts": [],
      "timestamps": {
        "createdAt": "2024-01-15T14:35:00.000Z",
        "updatedAt": "2024-01-15T14:35:00.000Z"
      }
    },
    "participants": [
      {
        "userId": "507f1f77bcf86cd799439012",
        "isOnline": true,
        "lastSeen": "2024-01-15T14:35:00.000Z"
      }
    ]
  }
}
```

---

### 4. Get Chat Messages

#### Endpoint
```
GET /api/chat/messages/:chatId
```

#### Purpose
Retrieve chat history with pagination.

#### When to Use
- Loading initial chat history
- Loading more messages when scrolling up
- Refreshing chat after reconnection

#### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | Number | 1 | Page number for pagination |
| limit | Number | 50 | Messages per page (max 100) |
| before | String | null | Get messages before this message ID |
| after | String | null | Get messages after this message ID |

#### Response Structure

```json
{
  "success": true,
  "data": {
    "messages": [
      {
        "messageId": "msg_123456789",
        "chatId": "consultation_123456789",
        "senderId": "507f1f77bcf86cd799439011",
        "content": "Hello, I'm experiencing some symptoms...",
        "type": "TEXT",
        "status": {
          "isEdited": false,
          "isDeleted": false
        },
        "reactions": [],
        "readReceipts": [
          {
            "userId": "507f1f77bcf86cd799439012",
            "readAt": "2024-01-15T14:36:00.000Z"
          }
        ],
        "timestamps": {
          "createdAt": "2024-01-15T14:35:00.000Z",
          "updatedAt": "2024-01-15T14:35:00.000Z"
        },
        "sender": {
          "userId": "507f1f77bcf86cd799439011",
          "name": "John Doe",
          "role": "CLIENT",
          "profilePicture": {
            "url": "https://storage.example.com/avatars/john.jpg"
          }
        }
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 3,
      "totalMessages": 125,
      "hasNext": true,
      "hasPrev": false
    },
    "chatInfo": {
      "chatId": "consultation_123456789",
      "type": "ONE_TO_ONE",
      "title": "Consultation with Dr. Sarah Smith",
      "participants": [...],
      "metadata": {
        "lastMessage": {...},
        "messageCount": 125,
        "isActive": true
      }
    }
  }
}
```

---

### 5. Mark Messages as Read

#### Endpoint
```
POST /api/chat/mark-read
```

#### Purpose
Mark messages as read for the current user.

#### When to Use
- When opening a chat
- When viewing new messages
- When marking specific messages as read

#### Request Body

```json
{
  "messageId": "msg_123456789"
}
```

#### Response Structure

```json
{
  "success": true,
  "data": {
    "messageId": "msg_123456789",
    "readAt": "2024-01-15T14:40:00.000Z",
    "unreadCount": 4
  }
}
```

---

### 6. Edit Message

#### Endpoint
```
PUT /api/chat/messages/:messageId
```

#### Purpose
Edit a previously sent message.

#### When to Use
- Correcting typos in messages
- Updating message content
- Adding additional information

#### Request Body

```json
{
  "content": "Updated message content with corrections"
}
```

#### Response Structure

```json
{
  "success": true,
  "data": {
    "message": {
      "messageId": "msg_123456789",
      "content": "Updated message content with corrections",
      "status": {
        "isEdited": true,
        "editedAt": "2024-01-15T14:45:00.000Z"
      },
      "timestamps": {
        "createdAt": "2024-01-15T14:35:00.000Z",
        "updatedAt": "2024-01-15T14:45:00.000Z"
      }
    }
  }
}
```

---

### 7. Delete Message

#### Endpoint
```
DELETE /api/chat/messages/:messageId
```

#### Purpose
Delete a message (soft delete).

#### When to Use
- Removing incorrect messages
- Deleting sensitive information
- Cleaning up chat history

#### Response Structure

```json
{
  "success": true,
  "data": {
    "messageId": "msg_123456789",
    "deletedAt": "2024-01-15T14:50:00.000Z",
    "deletedBy": "507f1f77bcf86cd799439011"
  }
}
```

---

### 8. Add Reaction

#### Endpoint
```
POST /api/chat/messages/:messageId/reaction
```

#### Purpose
Add or remove reactions to messages.

#### When to Use
- Reacting to messages with emojis
- Acknowledging receipt of information
- Expressing emotions about content

#### Request Body

```json
{
  "reactionType": "LIKE"
}
```

#### Available Reactions

| Reaction | Description |
|----------|-------------|
| LIKE | Thumbs up / approval |
| LOVE | Heart / appreciation |
| LAUGH | Laughing / humor |
| ANGRY | Angry / concern |
| SAD | Sad / sympathy |

#### Response Structure

```json
{
  "success": true,
  "data": {
    "messageId": "msg_123456789",
    "reactions": [
      {
        "userId": "507f1f77bcf86cd799439012",
        "type": "LIKE",
        "addedAt": "2024-01-15T14:55:00.000Z"
      }
    ],
    "reactionCounts": {
      "LIKE": 1,
      "LOVE": 0,
      "LAUGH": 0,
      "ANGRY": 0,
      "SAD": 0
    }
  }
}
```

---

### 9. Get User Chats

#### Endpoint
```
GET /api/chat/user-chats
```

#### Purpose
Get all chats for the current user.

#### When to Use
- Loading chat list
- Refreshing chat list
- Displaying unread counts

#### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | Number | 1 | Page number for pagination |
| limit | Number | 20 | Chats per page |
| type | String | null | Filter by chat type (ONE_TO_ONE) |
| status | String | null | Filter by status (ACTIVE, ARCHIVED) |

#### Response Structure

```json
{
  "success": true,
  "data": {
    "chats": [
      {
        "chatId": "consultation_123456789",
        "type": "ONE_TO_ONE",
        "title": "Consultation with Dr. Sarah Smith",
        "participants": [
          {
            "userId": "507f1f77bcf86cd799439012",
            "name": "Dr. Sarah Smith",
            "role": "DOCTOR",
            "profilePicture": {
              "url": "https://storage.example.com/avatars/sarah.jpg"
            },
            "isOnline": true,
            "lastSeen": "2024-01-15T14:30:00.000Z"
          }
        ],
        "metadata": {
          "lastMessage": {
            "messageId": "msg_456789",
            "content": "Thank you for the consultation",
            "senderId": "507f1f77bcf86cd799439011",
            "timestamp": "2024-01-15T14:30:00.000Z"
          },
          "messageCount": 25,
          "unreadCount": 5,
          "isActive": true
        },
        "subscriptionInfo": {
          "accessType": "DOCTOR",
          "expiresAt": "2024-04-15T10:30:00.000Z",
          "isActive": true
        }
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 2,
      "totalChats": 15,
      "hasNext": true,
      "hasPrev": false
    },
    "statistics": {
      "totalChats": 15,
      "unreadMessages": 23,
      "activeChats": 12,
      "archivedChats": 3
    }
  }
}
```

---

## WebSocket Integration

### Connection Setup

```javascript
// Connect to WebSocket server
const socket = io('ws://localhost:5000', {
  auth: {
    token: 'your_jwt_token_here'
  }
});
```

### Core WebSocket Events

#### 1. Join Chat Room
```javascript
// Join a chat room
socket.emit('join_room', {
  chatId: 'consultation_123456789'
});

// Handle successful join
socket.on('room_joined', (data) => {
  console.log('Joined room:', data.chatId);
  console.log('Online participants:', data.participants);
});
```

#### 2. Send Real-time Message
```javascript
// Send message via WebSocket
socket.emit('send_message', {
  chatId: 'consultation_123456789',
  content: 'Hello doctor!',
  type: 'TEXT'
});

// Receive message
socket.on('new_message', (data) => {
  console.log('New message:', data.message);
  // Update UI with new message
  addMessageToChat(data.message);
});
```

#### 3. Typing Indicators
```javascript
// Start typing
socket.emit('typing_start', {
  chatId: 'consultation_123456789'
});

// Stop typing
socket.emit('typing_stop', {
  chatId: 'consultation_123456789'
});

// Handle typing events
socket.on('user_typing', (data) => {
  console.log('User is typing:', data.userId);
  showTypingIndicator(data.userId);
});

socket.on('user_stopped_typing', (data) => {
  console.log('User stopped typing:', data.userId);
  hideTypingIndicator(data.userId);
});
```

#### 4. Online/Offline Status
```javascript
// Handle user online status
socket.on('user_online', (data) => {
  console.log('User came online:', data.userId);
  updateUserOnlineStatus(data.userId, true);
});

// Handle user offline status
socket.on('user_offline', (data) => {
  console.log('User went offline:', data.userId);
  updateUserOnlineStatus(data.userId, false);
  updateUserLastSeen(data.userId, data.lastSeen);
});
```

#### 5. Read Receipts
```javascript
// Mark message as read
socket.emit('mark_read', {
  messageId: 'msg_123456789'
});

// Handle read receipt updates
socket.on('message_read', (data) => {
  console.log('Message read:', data.messageId);
  updateMessageReadStatus(data.messageId, data.readAt, data.userId);
});
```

#### 6. Message Reactions
```javascript
// Handle reaction updates
socket.on('message_reaction', (data) => {
  console.log('Reaction updated:', data);
  updateMessageReactions(data.messageId, data.reactions, data.reactionCounts);
});
```

#### 7. Message Updates
```javascript
// Handle message edits
socket.on('message_edited', (data) => {
  console.log('Message edited:', data.message);
  updateMessageInChat(data.message);
});

// Handle message deletions
socket.on('message_deleted', (data) => {
  console.log('Message deleted:', data.messageId);
  removeMessageFromChat(data.messageId);
});
```

---

## Complete Implementation Flow

### Step 1: Initialize Chat
```javascript
// 1. Create chat room (if doesn't exist)
const createChat = async () => {
  try {
    const response = await fetch('/api/chat/create', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        chatData: {
          chatId: `consultation_${consultationId}`,
          type: 'ONE_TO_ONE',
          title: `Consultation with Dr. ${doctorName}`,
          participants: [
            { userId: clientId, role: 'CLIENT' },
            { userId: doctorId, role: 'DOCTOR' }
          ]
        },
        subscriptionId: subscriptionId
      })
    });
    
    const data = await response.json();
    if (data.success) {
      return data.data.chat;
    }
  } catch (error) {
    console.error('Error creating chat:', error);
  }
};
```

### Step 2: Join Chat Room
```javascript
// 2. Join the chat room
const joinChat = async (chatId) => {
  try {
    const response = await fetch('/api/chat/join', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ chatId })
    });
    
    const data = await response.json();
    if (data.success) {
      // Join WebSocket room
      socket.emit('join_room', { chatId });
      return data.data;
    }
  } catch (error) {
    console.error('Error joining chat:', error);
  }
};
```

### Step 3: Load Chat History
```javascript
// 3. Load initial messages
const loadMessages = async (chatId, page = 1) => {
  try {
    const response = await fetch(`/api/chat/messages/${chatId}?page=${page}&limit=50`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const data = await response.json();
    if (data.success) {
      return data.data.messages;
    }
  } catch (error) {
    console.error('Error loading messages:', error);
  }
};
```

### Step 4: Send Message
```javascript
// 4. Send message
const sendMessage = async (chatId, content, type = 'TEXT') => {
  try {
    // Send via HTTP API
    const response = await fetch('/api/chat/send-message', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        chatId,
        content,
        type
      })
    });
    
    const data = await response.json();
    if (data.success) {
      // Message will also be received via WebSocket
      return data.data.message;
    }
  } catch (error) {
    console.error('Error sending message:', error);
  }
};
```

### Step 5: Handle Real-time Updates
```javascript
// 5. Set up WebSocket event handlers
const setupWebSocketHandlers = () => {
  // New message received
  socket.on('new_message', (data) => {
    addMessageToChat(data.message);
    markMessageAsRead(data.message.messageId);
  });
  
  // User typing
  socket.on('user_typing', (data) => {
    if (data.userId !== currentUserId) {
      showTypingIndicator(data.userId);
    }
  });
  
  socket.on('user_stopped_typing', (data) => {
    if (data.userId !== currentUserId) {
      hideTypingIndicator(data.userId);
    }
  });
  
  // User online/offline
  socket.on('user_online', (data) => {
    updateUserStatus(data.userId, 'online');
  });
  
  socket.on('user_offline', (data) => {
    updateUserStatus(data.userId, 'offline');
  });
  
  // Read receipts
  socket.on('message_read', (data) => {
    updateReadReceipt(data.messageId, data.userId, data.readAt);
  });
};
```

---

## File Upload Implementation

### Step 1: Request Upload URL
```javascript
const requestUploadUrl = async (file) => {
  try {
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
    
    const data = await response.json();
    if (data.success) {
      return data.data.uploadUrl;
    }
  } catch (error) {
    console.error('Error requesting upload URL:', error);
  }
};
```

### Step 2: Upload File
```javascript
const uploadFile = async (uploadUrl, file) => {
  try {
    await fetch(uploadUrl, {
      method: 'PUT',
      body: file,
      headers: {
        'Content-Type': file.type
      }
    });
    
    // Extract file URL from upload URL
    const fileUrl = uploadUrl.split('?')[0];
    return fileUrl;
  } catch (error) {
    console.error('Error uploading file:', error);
  }
};
```

### Step 3: Send File Message
```javascript
const sendFileMessage = async (chatId, file, fileUrl) => {
  try {
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
    
    const data = await response.json();
    return data.success ? data.data.message : null;
  } catch (error) {
    console.error('Error sending file message:', error);
  }
};
```

---

## Error Handling

### Common Error Responses

#### Access Denied
```json
{
  "success": false,
  "error": "ACCESS_DENIED",
  "message": "You do not have access to this chat",
  "details": {
    "reason": "SUBSCRIPTION_EXPIRED",
    "subscriptionId": "507f1f77bcf86cd799439013"
  }
}
```

#### Validation Error
```json
{
  "success": false,
  "error": "VALIDATION_ERROR",
  "message": "Message content is required",
  "details": [
    {
      "field": "content",
      "message": "Message content cannot be empty"
    }
  ]
}
```

#### Rate Limit
```json
{
  "success": false,
  "error": "RATE_LIMIT_EXCEEDED",
  "message": "Too many messages sent",
  "details": {
    "limit": 100,
    "resetIn": 3600
  }
}
```

### Error Handling Implementation
```javascript
const handleApiError = (error) => {
  if (error.error === 'ACCESS_DENIED') {
    // Show subscription expired message
    showSubscriptionExpiredAlert();
  } else if (error.error === 'VALIDATION_ERROR') {
    // Show validation errors
    showValidationErrors(error.details);
  } else if (error.error === 'RATE_LIMIT_EXCEEDED') {
    // Show rate limit message
    showRateLimitAlert(error.details.resetIn);
  } else {
    // Show generic error
    showGenericError(error.message);
  }
};
```

---

## Best Practices

### 1. Connection Management
- Reconnect automatically on disconnection
- Handle connection timeouts gracefully
- Show connection status to users

### 2. Message Handling
- Store messages locally for offline access
- Implement optimistic updates for better UX
- Handle message ordering correctly

### 3. Performance Optimization
- Use pagination for large chat histories
- Implement message caching
- Lazy load older messages

### 4. User Experience
- Show typing indicators
- Display read receipts
- Handle online/offline status
- Provide message status indicators

### 5. Security Considerations
- Validate all user inputs
- Sanitize message content
- Implement proper authentication
- Handle file uploads securely

---

## API Reference Summary

| Method | Endpoint | Purpose | Authentication |
|--------|----------|---------|----------------|
| POST | `/api/chat/create` | Create chat room | JWT |
| POST | `/api/chat/join` | Join chat room | JWT |
| POST | `/api/chat/send-message` | Send message | JWT |
| GET | `/api/chat/messages/:chatId` | Get messages | JWT |
| POST | `/api/chat/mark-read` | Mark as read | JWT |
| PUT | `/api/chat/messages/:messageId` | Edit message | JWT |
| DELETE | `/api/chat/messages/:messageId` | Delete message | JWT |
| POST | `/api/chat/messages/:messageId/reaction` | Add reaction | JWT |
| GET | `/api/chat/user-chats` | Get user chats | JWT |

### WebSocket Events

| Event | Direction | Description |
|-------|-----------|-------------|
| join_room | Client → Server | Join chat room |
| leave_room | Client → Server | Leave chat room |
| send_message | Client → Server | Send message |
| new_message | Server → Client | Receive message |
| typing_start | Client → Server | Start typing |
| typing_stop | Client → Server | Stop typing |
| mark_read | Client → Server | Mark message read |
| message_read | Server → Client | Message was read |
| user_online | Server → Client | User came online |
| user_offline | Server → Client | User went offline |
| message_reaction | Server → Client | Reaction updated |
| message_edited | Server → Client | Message edited |
| message_deleted | Server → Client | Message deleted |

---

*This documentation provides everything needed to implement a complete doctor-client chat system with real-time messaging, file sharing, and comprehensive user experience features.*
