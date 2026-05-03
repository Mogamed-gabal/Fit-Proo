# Client & Doctor Chat System Guide

## 📋 Overview

This guide explains the chat system for **Clients and Doctors**, covering both the regular chat functionality and enhanced access control features. Learn when and how to use each system effectively.

---

## 🎯 Who This Guide Is For

### **👥 Clients**
- Patients seeking medical advice
- Users with active subscriptions
- Free tier users (limited messaging)

### **👨‍⚕️ Doctors**
- Medical professionals providing consultations
- Nutritionists, therapists, and coaches
- Users with verified professional accounts

---

## 🚀 QUICK START

### **For New Clients**
```bash
# 1. Create your first chat
POST /api/chat/create
{
  "chatData": {
    "chatId": "chat_drjohn_client123",
    "type": "ONE_TO_ONE",
    "participants": [{"userId": "your_id"}, {"userId": "doctor_id"}]
  }
}

# 2. Send your first message
POST /api/chat/send-message
{
  "chatId": "chat_drjohn_client123",
  "content": "Hello Dr. John, I need help with my diet plan",
  "type": "TEXT"
}
```

### **For New Doctors**
```bash
# 1. View your client chats
GET /api/chat/my-chats?participantRole=client

# 2. Respond to client messages
POST /api/chat/send-message
{
  "chatId": "chat_drjohn_client123",
  "content": "Hello! I'd be happy to help with your diet plan.",
  "type": "TEXT"
}
```

---

## 📱 REGULAR CHAT SYSTEM (Daily Use)

### **🎯 Purpose: Everyday Communication**
This is your **primary chat system** for daily doctor-client communication.

### **🔑 Core Features**

#### **1. Chat Management**
```http
POST /api/chat/create
Authorization: Bearer <your_token>
Content-Type: application/json

{
  "chatData": {
    "chatId": "unique_chat_id",
    "type": "ONE_TO_ONE",
    "participants": [
      {"userId": "client_id"},
      {"userId": "doctor_id"}
    ]
  },
  "subscriptionId": "sub_12345"  // Required for paid users
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "chat": {
      "chatId": "unique_chat_id",
      "type": "ONE_TO_ONE",
      "status": "ACTIVE",
      "participants": [...],
      "createdAt": "2024-04-26T10:00:00Z"
    },
    "access": {
      "canSendMessage": true,
      "remainingMessages": 12,
      "accessType": "SUBSCRIPTION_BASED"
    }
  }
}
```

#### **2. Sending Messages**
```http
POST /api/chat/send-message
Authorization: Bearer <your_token>
Content-Type: application/json

{
  "chatId": "unique_chat_id",
  "content": "Your message here",
  "type": "TEXT"
}
```

**Message Types:**
- `TEXT` - Regular text messages
- `IMAGE` - Image attachments
- `FILE` - Document attachments

#### **3. File & Image Sharing**
```http
# Upload Image
POST /api/chat/upload-image
Content-Type: multipart/form-data

image: [file]
chatId: unique_chat_id
messageType: IMAGE

# Upload File  
POST /api/chat/upload-file
Content-Type: multipart/form-data

file: [file]
chatId: unique_chat_id
messageType: FILE
```

**Supported Files:**
- **Images**: JPG, PNG, GIF, WebP (max 25MB)
- **Documents**: PDF, DOC, DOCX, TXT (max 25MB)
- **Medical**: X-rays, reports, prescriptions

#### **4. Viewing Chat Messages**
```http
GET /api/chat/:chatId/messages?page=1&limit=50
Authorization: Bearer <your_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "messages": [
      {
        "messageId": "msg_123",
        "senderId": "user_456",
        "content": "Hello Dr. John",
        "type": "TEXT",
        "timestamp": "2024-04-26T15:30:00Z",
        "isRead": true,
        "attachment": null
      }
    ],
    "page": 1,
    "limit": 50,
    "unreadCount": 2
  }
}
```

#### **5. Managing Your Chats**
```http
# Get all your chats
GET /api/chat/my-chats?page=1&limit=20

# Get specific chat info
GET /api/chat/:chatId

# Get chat statistics
GET /api/chat/:chatId/statistics

# Get your chat statistics
GET /api/chat/my-statistics
```

---

## 🔒 ENHANCED CHAT ACCESS (Security & Validation)

### **🎯 Purpose: Access Control & Testing**
This system **works automatically** in the background to secure your chat access. You typically **don't call these directly**, but it's good to understand what they do.

### **🔍 When Enhanced System Activates**

#### **Automatic Scenarios:**
1. **Every message send** → Validates your access
2. **Chat creation** → Checks subscription status  
3. **File uploads** → Verifies permissions
4. **Rate limiting** → Prevents spam

#### **Manual Testing Scenarios:**
```http
# Test if you can access a chat (for debugging)
POST /api/chat-access/enhanced/check-access
{
  "userId": "your_id",
  "chatId": "chat_123"
}

# Test if you can send messages
POST /api/chat-access/enhanced/check-send
{
  "userId": "your_id", 
  "chatId": "chat_123",
  "messageContext": {
    "messageType": "TEXT"
  }
}
```

### **🛡️ Security Features**

#### **1. Access Validation**
```json
{
  "allowed": true,
  "reason": "SUBSCRIPTION_BASED_ACCESS",
  "accessType": "DOCTOR_BASED",
  "subscription": {
    "id": "sub_123",
    "planType": "DOCTOR_BASED",
    "isActive": true,
    "features": ["chat_access", "unlimited_messages"]
  },
  "rateLimit": {
    "allowed": true,
    "remaining": 95,
    "resetTime": "2024-04-27T00:00:00Z"
  }
}
```

#### **2. Rate Limiting**
- **Free Users**: 15 messages/month
- **Paid Users**: Based on subscription plan
- **Rate Limits**: Prevent spam and abuse
- **Automatic Reset**: Monthly counter reset

#### **3. Subscription Validation**
```json
{
  "subscriptionStatus": "ACTIVE",
  "accessType": "DOCTOR_BASED",
  "canAccess": true,
  "restrictions": {
    "maxMessages": "unlimited",
    "fileUploadLimit": "25MB",
    "chatTypes": ["ONE_TO_ONE"]
  }
}
```

---

## 📊 MESSAGING TIERS & LIMITS

### **🆓 Free Tier (Clients Only)**
```json
{
  "tier": "FREE",
  "messagesPerMonth": 15,
  "features": [
    "TEXT messages",
    "Basic chat access",
    "Monthly reset"
  ],
  "limitations": [
    "No file uploads",
    "No image sharing", 
    "Limited to 15 messages"
  ]
}
```

### **💎 Paid Tiers (Subscription-Based)**
```json
{
  "tier": "DOCTOR_BASED",
  "features": [
    "Unlimited messages",
    "File uploads (25MB)",
    "Image sharing",
    "Priority support",
    "Chat history"
  ],
  "accessTypes": [
    "DOCTOR_BASED",
    "BUNDLE_BASED", 
    "COUPON_BASED"
  ]
}
```

---

## 🎯 WHEN TO USE EACH SYSTEM

### **✅ Use REGULAR CHAT SYSTEM For:**

#### **Daily Communication:**
- **Client**: "Dr. John, I have a question about my diet"
- **Doctor**: "Let me review your meal plan"
- **File sharing**: Medical reports, lab results
- **Image sharing**: X-rays, progress photos

#### **Chat Management:**
- Creating new doctor-client conversations
- Viewing message history
- Managing multiple client chats
- Checking chat statistics

#### **Examples:**
```bash
# Daily use cases
POST /api/chat/send-message          # Send messages
GET /api/chat/my-chats               # View your chats
POST /api/chat/upload-image          # Share medical images
GET /api/chat/:chatId/messages      # Read conversation
```

### **🔧 Use ENHANCED CHAT ACCESS For:**

#### **Troubleshooting:**
- "Why can't I send messages?"
- "Is my subscription active?"
- "Am I rate limited?"
- "Can I access this chat?"

#### **Development/Testing:**
- Testing new features
- Debugging access issues
- Validating permissions
- Performance testing

#### **Examples:**
```bash
# Testing/Debugging use cases
POST /api/chat-access/enhanced/check-access  # Test access
POST /api/chat-access/enhanced/check-send    # Test sending
POST /api/chat-access/enhanced/validate-chat # Validate chat
```

---

## 🚨 COMMON SCENARIOS & SOLUTIONS

### **Scenario 1: Client Can't Send Messages**
```bash
# Step 1: Check your access
POST /api/chat-access/enhanced/check-access
{
  "userId": "client_id",
  "chatId": "chat_123"
}

# Step 2: If blocked, check why
# Response might show:
{
  "allowed": false,
  "reason": "FREE_MESSAGES_EXHAUSTED",
  "suggestion": "Upgrade to subscription for unlimited messages"
}

# Step 3: Use regular chat to subscribe
POST /api/subscription/create
{
  "planType": "DOCTOR_BASED",
  "doctorId": "doctor_123"
}
```

### **Scenario 2: Doctor Can't Access Chat**
```bash
# Step 1: Validate chat exists
POST /api/chat-access/enhanced/validate-chat
{
  "userId": "doctor_id", 
  "chatId": "chat_123"
}

# Step 2: Check subscription binding
GET /api/chat/:chatId

# Step 3: If issue persists, contact admin
POST /api/support/ticket
{
  "issue": "Chat access problem",
  "chatId": "chat_123"
}
```

### **Scenario 3: File Upload Fails**
```bash
# Step 1: Check file size limits (25MB max)
# Step 2: Check file type (allowed: PDF, JPG, PNG, etc.)
# Step 3: Verify subscription allows uploads
POST /api/chat-access/enhanced/check-send
{
  "userId": "your_id",
  "chatId": "chat_123",
  "messageContext": {
    "messageType": "FILE",
    "fileSize": 15000000  // 15MB
  }
}
```

---

## 📱 MOBILE APP INTEGRATION

### **WebSocket Connection**
```javascript
// Connect to chat
const socket = io('/chat', {
  auth: {
    token: 'your_jwt_token'
  }
});

// Join chat room
socket.emit('join-chat', {
  chatId: 'chat_123'
});

// Listen for messages
socket.on('new-message', (message) => {
  console.log('New message:', message);
});

// Send message via socket
socket.emit('send-message', {
  chatId: 'chat_123',
  content: 'Hello!',
  type: 'TEXT'
});
```

### **Real-time Features**
- **Live messaging**: Instant message delivery
- **Typing indicators**: See when someone is typing
- **Read receipts**: Know when messages are read
- **Online status**: See who's available

---

## 🔐 SECURITY & PRIVACY

### **🛡️ Your Data Protection**
- **End-to-end encryption**: Messages encrypted in transit
- **Secure storage**: Files stored on Cloudinary
- **Access control**: Only participants can view chats
- **Audit logging**: All access is logged

### **🔒 Privacy Features**
- **Message deletion**: Remove sensitive messages
- **Chat blocking**: Block unwanted contacts
- **Report abuse**: Report inappropriate behavior
- **Data export**: Download your chat history

---

## 📞 SUPPORT & HELP

### **🆘 Common Issues**
| Issue | Solution | Enhanced API |
|-------|----------|--------------|
| Can't send messages | Check subscription/limits | `check-send` |
| Chat not found | Verify chat ID | `validate-chat` |
| Access denied | Check permissions | `check-access` |
| File upload fails | Check size/type | `check-send` |

### **📧 Contact Support**
```bash
# Create support ticket
POST /api/support/ticket
{
  "type": "CHAT_ACCESS",
  "description": "Cannot send messages to Dr. John",
  "chatId": "chat_123",
  "urgency": "HIGH"
}
```

### **📚 Self-Service Resources**
- **FAQ**: Common chat issues
- **Video Tutorials**: How to use features
- **Documentation**: Complete API reference
- **Community Forum**: User discussions

---

## 🎯 BEST PRACTICES

### **For Clients:**
1. **Be specific** in your medical questions
2. **Share relevant files** (reports, images)
3. **Respect doctor's time** - be concise
4. **Follow up** on recommendations
5. **Keep chat professional** and medical-focused

### **For Doctors:**
1. **Respond promptly** to client messages
2. **Provide clear** medical advice
3. **Request necessary** medical documents
4. **Maintain professional** communication
5. **Document important** conversations

### **For Both:**
1. **Check message limits** regularly
2. **Backup important** conversations
3. **Report technical issues** quickly
4. **Keep app updated** for latest features
5. **Use strong passwords** and 2FA

---

## 🔄 VERSION HISTORY

| Version | Date | Changes | Impact |
|---------|------|---------|--------|
| 1.0.0 | 2024-04-26 | Initial guide | All users |
| 1.1.0 | 2024-04-27 | Added mobile examples | App users |
| 1.2.0 | 2024-04-28 | Enhanced troubleshooting | Support team |

---

**Last Updated**: April 26, 2024  
**Target Audience**: Clients & Doctors  
**Next Review**: May 26, 2024

---

*This guide covers all chat features you'll need for daily doctor-client communication. The enhanced access system works automatically to keep your conversations secure and reliable.*
