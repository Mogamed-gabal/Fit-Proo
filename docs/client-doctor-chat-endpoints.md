# Client-Doctor Chat Endpoints Documentation

## 📋 Overview

This document provides a comprehensive guide to all chat-related endpoints between a client and a doctor, from the moment a client opens a chat with a doctor until the conversation ends.

**Base URL:** `/api/chat`

---

## 🔐 Authentication

**All endpoints require authentication:**
```javascript
Authorization: Bearer <token>
```

---

## 🎯 Chat Flow Overview

### **Phase 1: Chat Initialization**
1. Client checks if they have an active subscription with the doctor
2. Client creates or joins a chat with the doctor
3. Client connects to the chat via WebSocket

### **Phase 2: Active Chat**
1. Client sends messages (text, images, files)
2. Doctor receives messages in real-time
3. Doctor responds to messages
4. Both parties can edit, delete, react to messages
5. Typing indicators and read receipts

### **Phase 3: Chat Management**
1. View chat history
2. Get chat statistics
3. Mark messages as read
4. Upload files/images

### **Phase 4: Chat Termination**
1. Chat can be suspended or closed
2. Messages remain accessible
3. Statistics are preserved

---

## 📊 Available Endpoints

---

## **Phase 1: Chat Initialization**

### **1. Create a New Chat**
**POST /api/chat/create**

**Description:** Creates a new chat between a client and a doctor. This is typically called when a client wants to start a conversation with a doctor for the first time.

**Request Body:**
```json
{
  "chatData": {
    "chatId": "unique-chat-id",
    "type": "ONE_TO_ONE",
    "participants": [
      {
        "userId": "client_id",
        "role": "CLIENT"
      },
      {
        "userId": "doctor_id",
        "role": "DOCTOR"
      }
    ]
  },
  "subscriptionId": "subscription_id" // Optional but recommended
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "chat": {
      "chatId": "unique-chat-id",
      "type": "ONE_TO_ONE",
      "participants": [...],
      "status": "ACTIVE",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

**Validation:**
- `chatId` must be a unique string
- `type` must be either `ONE_TO_ONE` or `GROUP`
- `participants` must be an array with at least 2 users
- All participant IDs must be valid MongoDB Object IDs

---

### **2. Join Existing Chat (HTTP)**
**POST /api/chat/join**

**Description:** Allows a user to join an existing chat. This is used when reconnecting to a chat after disconnection.

**Request Body:**
```json
{
  "chatId": "unique-chat-id"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "chat": {
      "chatId": "unique-chat-id",
      "participants": [...],
      "status": "ACTIVE"
    },
    "messages": [...]
  }
}
```

---

### **3. Get User's Chats**
**GET /api/chat/my-chats**

**Description:** Retrieves all chats that the current user is a participant in.

**Query Parameters:**
- `page` (optional, default: 1) - Page number
- `limit` (optional, default: 10, max: 100) - Items per page
- `type` (optional) - Filter by chat type (`ONE_TO_ONE`, `GROUP`)

**Response:**
```json
{
  "success": true,
  "data": {
    "chats": [
      {
        "chatId": "unique-chat-id",
        "type": "ONE_TO_ONE",
        "participants": [
          {
            "userId": "doctor_id",
            "name": "Dr. Sarah Johnson",
            "role": "DOCTOR",
            "profilePicture": "https://..."
          }
        ],
        "lastMessage": {
          "content": "Hello!",
          "senderId": "client_id",
          "timestamp": "2024-01-01T00:00:00.000Z"
        },
        "unreadCount": 2,
        "status": "ACTIVE"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalChats": 50,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

---

## **Phase 2: Active Chat - Sending Messages**

### **4. Send Text Message**
**POST /api/chat/send-message**

**Description:** Sends a text message to a chat. This is the primary method for sending messages.

**Request Body:**
```json
{
  "chatId": "unique-chat-id",
  "content": "Hello doctor!",
  "type": "TEXT",
  "attachment": null
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": {
      "messageId": "unique-message-id",
      "chatId": "unique-chat-id",
      "senderId": "client_id",
      "content": "Hello doctor!",
      "type": "TEXT",
      "timestamp": "2024-01-01T00:00:00.000Z",
      "readBy": [],
      "reactions": []
    }
  }
}
```

**Validation:**
- `content` must be 1-4000 characters
- `type` must be `TEXT`, `IMAGE`, or `FILE`
- `attachment` is optional

**Error Responses:**
- `403` - Access denied (user not in chat or chat locked)
- `429` - Rate limit exceeded

---

### **5. Upload Image and Send**
**POST /api/chat/upload-image**

**Description:** Uploads an image and sends it as a message. Supports JPEG, PNG, GIF, WebP.

**Request:**
- `Content-Type: multipart/form-data`
- `image` file (max 25MB)
- `chatId` in form data
- `messageType` (optional, default: `IMAGE`)

**Response:**
```json
{
  "success": true,
  "data": {
    "message": {
      "messageId": "unique-message-id",
      "chatId": "unique-chat-id",
      "senderId": "client_id",
      "content": "",
      "type": "IMAGE",
      "attachment": {
        "url": "https://res.cloudinary.com/...",
        "name": "image.jpg",
        "size": 1024000,
        "mimeType": "image/jpeg"
      },
      "timestamp": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

**Supported Image Formats:**
- JPEG, JPG
- PNG
- GIF
- WebP

---

### **6. Upload File and Send**
**POST /api/chat/upload-file**

**Description:** Uploads a file (PDF, document, audio, video) and sends it as a message.

**Request:**
- `Content-Type: multipart/form-data`
- `file` (max 25MB)
- `chatId` in form data
- `messageType` (optional, default: `FILE`)

**Response:**
```json
{
  "success": true,
  "data": {
    "message": {
      "messageId": "unique-message-id",
      "chatId": "unique-chat-id",
      "senderId": "client_id",
      "content": "",
      "type": "FILE",
      "attachment": {
        "url": "https://res.cloudinary.com/...",
        "name": "document.pdf",
        "size": 2048000,
        "mimeType": "application/pdf"
      },
      "timestamp": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

**Supported File Formats:**
- **Documents:** PDF, DOC, DOCX, TXT
- **Audio:** MP3, WAV, M4A
- **Video:** MP4, MOV, AVI

---

## **Phase 2: Active Chat - Receiving Messages**

### **7. Get Chat Messages**
**GET /api/chat/:chatId/messages**

**Description:** Retrieves messages from a specific chat with pagination support.

**Path Parameters:**
- `chatId` - The unique chat ID

**Query Parameters:**
- `page` (optional, default: 1) - Page number
- `limit` (optional, default: 10, max: 100) - Items per page
- `before` (optional) - ISO 8601 date - get messages before this date
- `after` (optional) - ISO 8601 date - get messages after this date
- `markAsRead` (optional, default: false) - Mark messages as read automatically

**Response:**
```json
{
  "success": true,
  "data": {
    "messages": [
      {
        "messageId": "unique-message-id",
        "chatId": "unique-chat-id",
        "senderId": "doctor_id",
        "senderName": "Dr. Sarah Johnson",
        "senderRole": "doctor",
        "content": "Hello! How can I help you?",
        "type": "TEXT",
        "attachment": null,
        "timestamp": "2024-01-01T00:00:00.000Z",
        "readBy": ["client_id"],
        "reactions": [],
        "isEdited": false,
        "isDeleted": false
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 10,
      "totalMessages": 100,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

---

## **Phase 2: Active Chat - Message Actions**

### **8. Edit Message**
**PUT /api/chat/message/:messageId**

**Description:** Edits an existing message. Only the sender can edit their own messages.

**Path Parameters:**
- `messageId` - The unique message ID

**Request Body:**
```json
{
  "content": "Updated message content"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": {
      "messageId": "unique-message-id",
      "content": "Updated message content",
      "isEdited": true,
      "editedAt": "2024-01-01T01:00:00.000Z"
    }
  }
}
```

**Validation:**
- `content` must be 1-4000 characters
- Only message sender can edit
- Cannot edit deleted messages

---

### **9. Delete Message**
**DELETE /api/chat/message/:messageId**

**Description:** Deletes a message. Only the sender can delete their own messages.

**Path Parameters:**
- `messageId` - The unique message ID

**Response:**
```json
{
  "success": true,
  "data": {
    "messageId": "unique-message-id",
    "isDeleted": true,
    "deletedAt": "2024-01-01T01:00:00.000Z"
  }
}
```

**Note:** Messages are soft deleted and can be recovered by admins.

---

### **10. Add Reaction to Message**
**POST /api/chat/message/:messageId/reaction**

**Description:** Adds a reaction emoji to a message.

**Path Parameters:**
- `messageId` - The unique message ID

**Request Body:**
```json
{
  "reactionType": "LIKE"
}
```

**Supported Reactions:**
- `LIKE` - 👍
- `LOVE` - ❤️
- `LAUGH` - 😂
- `ANGRY` - 😠
- `SAD` - 😢

**Response:**
```json
{
  "success": true,
  "data": {
    "messageId": "unique-message-id",
    "reactions": [
      {
        "userId": "client_id",
        "reactionType": "LIKE",
        "timestamp": "2024-01-01T01:00:00.000Z"
      }
    ]
  }
}
```

---

### **11. Remove Reaction from Message**
**DELETE /api/chat/message/:messageId/reaction**

**Description:** Removes a reaction from a message.

**Path Parameters:**
- `messageId` - The unique message ID

**Response:**
```json
{
  "success": true,
  "data": {
    "messageId": "unique-message-id",
    "reactions": []
  }
}
```

---

### **12. Mark Message as Read**
**POST /api/chat/mark-read**

**Description:** Marks a specific message as read for the current user.

**Request Body:**
```json
{
  "messageId": "unique-message-id"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "messageId": "unique-message-id",
    "readBy": ["client_id", "doctor_id"]
  }
}
```

---

## **Phase 3: Chat Management**

### **13. Get Chat Statistics**
**GET /api/chat/:chatId/statistics**

**Description:** Retrieves statistics for a specific chat.

**Path Parameters:**
- `chatId` - The unique chat ID

**Response:**
```json
{
  "success": true,
  "data": {
    "chatId": "unique-chat-id",
    "totalMessages": 150,
    "totalParticipants": 2,
    "messagesByType": {
      "TEXT": 120,
      "IMAGE": 20,
      "FILE": 10
    },
    "messagesByUser": [
      {
        "userId": "client_id",
        "name": "John Doe",
        "messageCount": 80
      },
      {
        "userId": "doctor_id",
        "name": "Dr. Sarah Johnson",
        "messageCount": 70
      }
    ],
    "unreadCount": {
      "client_id": 0,
      "doctor_id": 5
    },
    "createdAt": "2024-01-01T00:00:00.000Z",
    "lastActivity": "2024-01-01T12:00:00.000Z"
  }
}
```

---

### **14. Get User Chat Statistics**
**GET /api/chat/my-statistics**

**Description:** Retrieves overall chat statistics for the current user.

**Response:**
```json
{
  "success": true,
  "data": {
    "userId": "client_id",
    "totalChats": 5,
    "totalMessages": 500,
    "unreadMessages": 10,
    "activeChats": 3,
    "closedChats": 2,
    "topContacts": [
      {
        "userId": "doctor_id",
        "name": "Dr. Sarah Johnson",
        "messageCount": 200
      }
    ]
  }
}
```

---

## **Phase 4: Enhanced Chat Access (Optional)**

### **15. Check Chat Access (Enhanced)**
**POST /api/chat/enhanced/check-access**

**Description:** Enhanced access check with database validation. Used to verify if a user can access a specific chat.

**Request Body:**
```json
{
  "userId": "client_id",
  "chatId": "unique-chat-id"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "hasAccess": true,
    "accessType": "PARTICIPANT",
    "chatStatus": "ACTIVE",
    "subscriptionValid": true,
    "reason": "User is a participant in this chat"
  }
}
```

---

### **16. Check Send Message Permission (Enhanced)**
**POST /api/chat/enhanced/check-send**

**Description:** Enhanced check to verify if a user can send messages to a specific chat.

**Request Body:**
```json
{
  "userId": "client_id",
  "chatId": "unique-chat-id"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "canSend": true,
    "reason": "User has permission to send messages",
    "rateLimit": {
      "remaining": 95,
      "resetAt": "2024-01-01T01:00:00.000Z"
    }
  }
}
```

---

### **17. Create Bound Chat with Subscription**
**POST /api/chat/enhanced/create-chat**

**Description:** Creates a chat bound to a specific subscription with validation.

**Request Body:**
```json
{
  "userId": "client_id",
  "subscriptionId": "subscription_id",
  "chatData": {
    "chatId": "unique-chat-id",
    "type": "ONE_TO_ONE",
    "participants": [
      {
        "userId": "client_id",
        "role": "CLIENT"
      },
      {
        "userId": "doctor_id",
        "role": "DOCTOR"
      }
    ]
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "chat": {
      "chatId": "unique-chat-id",
      "type": "ONE_TO_ONE",
      "participants": [...],
      "subscriptionBinding": {
        "subscriptionId": "subscription_id",
        "boundAt": "2024-01-01T00:00:00.000Z"
      },
      "status": "ACTIVE"
    }
  }
}
```

---

## **Phase 5: Admin Endpoints (Optional)**

### **18. Get All Chats (Admin)**
**GET /api/chat/admin/all-chats**

**Description:** Retrieves all chats in the system (admin only).

**Query Parameters:**
- `page` (optional, default: 1) - Page number
- `limit` (optional, default: 10, max: 100) - Items per page
- `status` (optional) - Filter by status (`ACTIVE`, `SUSPENDED`, `CLOSED`)
- `search` (optional) - Search term
- `participantRole` (optional) - Filter by participant role
- `specialization` (optional) - Filter by doctor specialization
- `chatType` (optional) - Filter by chat type

**Response:**
```json
{
  "success": true,
  "data": {
    "chats": [...],
    "pagination": {
      "currentPage": 1,
      "totalPages": 10,
      "totalChats": 100
    }
  }
}
```

**Permission:** Requires `VIEW_ALL_CHATS` permission or admin role.

---

### **19. View Chat Messages (Admin)**
**GET /api/chat/admin/:chatId/messages**

**Description:** Admin view of chat messages (admin only).

**Path Parameters:**
- `chatId` - The unique chat ID

**Query Parameters:**
- `page` (optional, default: 1) - Page number
- `limit` (optional, default: 10, max: 100) - Items per page
- `before` (optional) - ISO 8601 date
- `after` (optional) - ISO 8601 date

**Response:**
```json
{
  "success": true,
  "data": {
    "messages": [...],
    "pagination": {...}
  }
}
```

**Permission:** Requires `VIEW_ALL_CHATS` permission or admin role.

---

### **20. Get Chat Statistics (Admin)**
**GET /api/chat/admin/:chatId/statistics**

**Description:** Admin view of chat statistics (admin only).

**Path Parameters:**
- `chatId` - The unique chat ID

**Response:**
```json
{
  "success": true,
  "data": {
    "chatId": "unique-chat-id",
    "totalMessages": 150,
    "totalParticipants": 2,
    "messagesByType": {...},
    "messagesByUser": [...],
    "unreadCount": {...}
  }
}
```

**Permission:** Requires `VIEW_ALL_CHATS` permission or admin role.

---

## 🔌 WebSocket Events (Real-time)

### **Connection**
```javascript
// Client connects
socket = io('http://localhost:5000', {
  auth: { token: 'jwt_token' }
});

// Server emits
socket.on('connected', (data) => {
  console.log('Connected:', data);
});
```

### **Join Chat**
```javascript
// Client joins chat
socket.emit('join_chat', { chatId: 'unique-chat-id' });

// Server emits
socket.on('chat_joined', (data) => {
  console.log('Joined chat:', data);
});
```

### **Send Message**
```javascript
// Client sends message
socket.emit('send_message', {
  chatId: 'unique-chat-id',
  content: 'Hello!',
  type: 'TEXT'
});

// Server emits to all participants
socket.on('new_message', (message) => {
  console.log('New message:', message);
});
```

### **Typing Indicator**
```javascript
// Client starts typing
socket.emit('typing_start', { chatId: 'unique-chat-id' });

// Server emits to other participants
socket.on('user_typing', (data) => {
  console.log('User typing:', data.userId);
});

// Client stops typing
socket.emit('typing_stop', { chatId: 'unique-chat-id' });

// Server emits
socket.on('user_stopped_typing', (data) => {
  console.log('User stopped typing:', data.userId);
});
```

### **Message Read**
```javascript
// Client marks message as read
socket.emit('message_read', { 
  chatId: 'unique-chat-id',
  messageId: 'unique-message-id'
});

// Server emits to sender
socket.on('message_read_receipt', (data) => {
  console.log('Message read by:', data.userId);
});
```

### **Message Edited**
```javascript
// Server emits to all participants
socket.on('message_edited', (message) => {
  console.log('Message edited:', message);
});
```

### **Message Deleted**
```javascript
// Server emits to all participants
socket.on('message_deleted', (data) => {
  console.log('Message deleted:', data.messageId);
});
```

### **Reaction Added**
```javascript
// Server emits to all participants
socket.on('reaction_added', (data) => {
  console.log('Reaction added:', data);
});
```

### **Reaction Removed**
```javascript
// Server emits to all participants
socket.on('reaction_removed', (data) => {
  console.log('Reaction removed:', data);
});
```

### **Chat Status Changed**
```javascript
// Server emits to all participants
socket.on('chat_status_changed', (data) => {
  console.log('Chat status:', data.status);
});
```

### **User Joined/Left**
```javascript
// Server emits to all participants
socket.on('user_joined', (data) => {
  console.log('User joined:', data.userId);
});

socket.on('user_left', (data) => {
  console.log('User left:', data.userId);
});
```

---

## 📋 Complete Chat Flow Example

### **Step 1: Client Creates Chat**
```javascript
POST /api/chat/create
{
  "chatData": {
    "chatId": "chat-123",
    "type": "ONE_TO_ONE",
    "participants": [
      { "userId": "client_id", "role": "client" },
      { "userId": "doctor_id", "role": "doctor" }
    ]
  },
  "subscriptionId": "sub-123"
}
```

### **Step 2: Client Connects via WebSocket**
```javascript
socket = io('http://localhost:5000', {
  auth: { token: 'jwt_token' }
});

socket.emit('join_chat', { chatId: 'chat-123' });
```

### **Step 3: Client Sends Message**
```javascript
socket.emit('send_message', {
  chatId: 'chat-123',
  content: 'Hello doctor!',
  type: 'TEXT'
});
```

### **Step 4: Doctor Receives Message**
```javascript
socket.on('new_message', (message) => {
  console.log('Received:', message.content);
});
```

### **Step 5: Doctor Responds**
```javascript
socket.emit('send_message', {
  chatId: 'chat-123',
  content: 'Hello! How can I help?',
  type: 'TEXT'
});
```

### **Step 6: Client Uploads Image**
```javascript
POST /api/chat/upload-image
FormData:
- image: file
- chatId: "chat-123"
```

### **Step 7: Client Marks Message as Read**
```javascript
socket.emit('message_read', {
  chatId: 'chat-123',
  messageId: 'msg-123'
});
```

### **Step 8: Client Adds Reaction**
```javascript
POST /api/chat/message/msg-123/reaction
{
  "reactionType": "LIKE"
}
```

### **Step 9: Client Edits Message**
```javascript
PUT /api/chat/message/msg-123
{
  "content": "Updated message"
}
```

### **Step 10: Client Views Chat History**
```javascript
GET /api/chat/chat-123/messages?page=1&limit=20
```

### **Step 11: Client Views Chat Statistics**
```javascript
GET /api/chat/chat-123/statistics
```

---

## 🎯 Key Features

### **✅ Real-time Communication:**
- WebSocket support for instant messaging
- Typing indicators
- Read receipts
- Online/offline status

### **✅ Rich Media Support:**
- Text messages (1-4000 characters)
- Image uploads (JPEG, PNG, GIF, WebP)
- File uploads (PDF, DOC, DOCX, TXT, MP3, WAV, MP4)
- Max file size: 25MB

### **✅ Message Actions:**
- Edit messages
- Delete messages (soft delete)
- Add/remove reactions
- Mark as read

### **✅ Chat Management:**
- Pagination support
- Search and filtering
- Chat statistics
- User statistics

### **✅ Security:**
- Authentication required
- Access control
- Rate limiting
- Subscription validation

### **✅ Admin Features:**
- View all chats
- Monitor conversations
- Access chat statistics
- View deleted messages

---

## 📋 Summary

**✅ HTTP Endpoints (20 total):**

**Phase 1: Chat Initialization (3)**
1. `POST /api/chat/create` - Create new chat
2. `POST /api/chat/join` - Join existing chat
3. `GET /api/chat/my-chats` - Get user's chats

**Phase 2: Active Chat - Sending (3)**
4. `POST /api/chat/send-message` - Send text message
5. `POST /api/chat/upload-image` - Upload image
6. `POST /api/chat/upload-file` - Upload file

**Phase 2: Active Chat - Receiving (1)**
7. `GET /api/chat/:chatId/messages` - Get chat messages

**Phase 2: Active Chat - Actions (5)**
8. `PUT /api/chat/message/:messageId` - Edit message
9. `DELETE /api/chat/message/:messageId` - Delete message
10. `POST /api/chat/message/:messageId/reaction` - Add reaction
11. `DELETE /api/chat/message/:messageId/reaction` - Remove reaction
12. `POST /api/chat/mark-read` - Mark as read

**Phase 3: Chat Management (2)**
13. `GET /api/chat/:chatId/statistics` - Chat statistics
14. `GET /api/chat/my-statistics` - User statistics

**Phase 4: Enhanced Access (3)**
15. `POST /api/chat/enhanced/check-access` - Check access
16. `POST /api/chat/enhanced/check-send` - Check send permission
17. `POST /api/chat/enhanced/create-chat` - Create bound chat

**Phase 5: Admin (3)**
18. `GET /api/chat/admin/all-chats` - Get all chats
19. `GET /api/chat/admin/:chatId/messages` - View messages
20. `GET /api/chat/admin/:chatId/statistics` - View statistics

**✅ WebSocket Events (10+):**
- `join_chat` / `chat_joined`
- `send_message` / `new_message`
- `typing_start` / `user_typing`
- `typing_stop` / `user_stopped_typing`
- `message_read` / `message_read_receipt`
- `message_edited`
- `message_deleted`
- `reaction_added`
- `reaction_removed`
- `chat_status_changed`
- `user_joined` / `user_left`

---

## 🎯 This documentation covers the complete chat flow from initialization to termination, including all HTTP endpoints and WebSocket events needed for a seamless client-doctor chat experience!
