# Free Messaging System Documentation

## Overview

The Free Messaging System allows users to send messages without an active subscription. It serves as a trial feature to let users experience the chat service before committing to a paid subscription.

---

## How It Works

### Free Message Limits
- **15 free messages per user** per month
- **Monthly reset** on the 1st day of each month
- **Global tracking** across all chat conversations

### Access Priority
1. **Active Subscription** (highest priority)
2. **Grace Period** (after subscription expires)
3. **Free Usage** (fallback option)

---

## API Implementation

### Create Free Chat Room

#### Endpoint
```
POST /api/chat/create
```

#### Request Body
```json
{
  "chatData": {
    "chatId": "free_consultation_123",
    "type": "ONE_TO_ONE",
    "title": "Free Consultation",
    "participants": [
      {
        "userId": "client_id_here",
        "role": "CLIENT"
      },
      {
        "userId": "doctor_id_here", 
        "role": "DOCTOR"
      }
    ]
  },
  "subscriptionId": null
}
```

#### Response
```json
{
  "success": true,
  "data": {
    "chat": {
      "chatId": "free_consultation_123",
      "subscriptionBinding": {
        "accessType": "FREE",
        "allowedParticipantsSource": "FREE_USERS",
        "isActive": true
      }
    }
  }
}
```

---

## Message Sending

### Send Free Message
Use the same endpoint as regular messaging:
```
POST /api/chat/send-message
```

The system automatically:
1. Checks if user has free messages remaining
2. Increments the free message counter
3. Allows or blocks based on remaining limit

### Error When Limit Reached
```json
{
  "success": false,
  "error": "FREE_MESSAGES_EXHAUSTED",
  "message": "You have used all your free messages for this month",
  "details": {
    "limit": 15,
    "used": 15,
    "remaining": 0,
    "resetDate": "2024-02-01T00:00:00.000Z"
  }
}
```

---

## Check Free Message Status

### Get Remaining Free Messages
```javascript
// The system tracks this automatically
// You can check user's free message status via access response

{
  "hasAccess": true,
  "reason": "FREE_USAGE",
  "isUsingFreeMessage": true,
  "remainingFreeMessages": 12,
  "subscriptionStatus": "FREE_USAGE"
}
```

---

## Frontend Integration

### Creating Free Chat
```javascript
const createFreeChat = async (clientId, doctorId) => {
  const response = await fetch('/api/chat/create', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      chatData: {
        chatId: `free_${Date.now()}`,
        type: 'ONE_TO_ONE',
        title: 'Free Consultation',
        participants: [
          { userId: clientId, role: 'CLIENT' },
          { userId: doctorId, role: 'DOCTOR' }
        ]
      },
      subscriptionId: null // No subscription required
    })
  });
  
  return response.json();
};
```

### Handle Free Message Limits
```javascript
const sendMessage = async (chatId, content) => {
  try {
    const response = await fetch('/api/chat/send-message', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ chatId, content })
    });
    
    const data = await response.json();
    
    if (!data.success && data.error === 'FREE_MESSAGES_EXHAUSTED') {
      // Show upgrade prompt
      showUpgradePrompt(data.details);
      return;
    }
    
    // Handle successful message
    return data;
  } catch (error) {
    console.error('Error sending message:', error);
  }
};
```

---

## User Experience Flow

### New User Journey
1. **Registration** → User gets 15 free messages
2. **First Chat** → Can message any doctor freely
3. **Message Counter** → Shows remaining free messages
4. **Limit Reached** → Prompt to subscribe
5. **Subscription** → Unlimited messaging

### Message Counter Display
```javascript
// Show user their free message status
const displayFreeMessageStatus = (remaining, total) => {
  if (remaining > 0) {
    return `${remaining} of ${total} free messages remaining`;
  } else {
    return 'All free messages used. Subscribe to continue messaging.';
  }
};
```

---

## Technical Details

### Database Schema

#### UserMessageUsage Model
```javascript
{
  userId: ObjectId,
  totalMessagesSent: Number,
  freeMessagesUsed: Number,
  currentPeriodStart: Date,
  currentPeriodEnd: Date,
  lastMessageAt: Date
}
```

### Configuration
```javascript
FREE_USAGE: {
  GLOBAL_MESSAGE_LIMIT: 15,    // 15 free messages
  RESET_PERIOD: 'monthly',     // Reset monthly
  PRIORITY: 3                  // Lowest priority
}
```

---

## Best Practices

### For Frontend Development
1. **Show remaining messages** - Always display free message count
2. **Clear upgrade prompts** - When limit reached, guide to subscription
3. **Smooth transitions** - Handle free to paid messaging seamlessly
4. **Reset notifications** - Inform users when monthly limit resets

### For User Experience
1. **Welcome message** - Explain free message allowance
2. **Progress indicators** - Visual representation of usage
3. **Upgrade benefits** - Highlight advantages of subscription
4. **Emergency access** - Allow critical messages even at limit

---

## Error Handling

### Common Errors

#### FREE_MESSAGES_EXHAUSTED
```json
{
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

#### ACCESS_DENIED (No Free Messages)
```json
{
  "error": "ACCESS_DENIED",
  "message": "No free messages remaining",
  "details": {
    "reason": "FREE_MESSAGES_EXHAUSTED",
    "suggestion": "Subscribe to continue messaging"
  }
}
```

---

## Testing Scenarios

### Test Cases
1. **New user** → Should have 15 free messages
2. **Send 15 messages** → Should block 16th message
3. **Monthly reset** → Should reset to 15 on 1st of month
4. **Mixed access** → Should handle free → subscription transition

### Sample Test
```javascript
// Test free message limit
const testFreeMessageLimit = async () => {
  for (let i = 1; i <= 16; i++) {
    const result = await sendMessage(chatId, `Message ${i}`);
    
    if (i <= 15) {
      console.log(`Message ${i}: Success`);
    } else {
      console.log(`Message ${i}: Should fail - ${result.error}`);
    }
  }
};
```

---

## Migration to Paid

### Upgrade Process
1. **User subscribes** → System detects active subscription
2. **Access priority changes** → Subscription takes over free access
3. **Unlimited messaging** → No more message limits
4. **Free counter resets** → Ready for next free period if needed

### Grace Period
- **After subscription expires** → 7-day grace period
- **Keep messaging** → Continue unlimited messaging
- **Back to free** → After grace period, return to 15 free messages

---

## Summary

The Free Messaging System provides:
- ✅ **15 free messages per month** for trial users
- ✅ **Automatic monthly reset** 
- ✅ **Seamless upgrade** to paid subscriptions
- ✅ **Grace period** after subscription ends
- ✅ **Clear error handling** for limit reached
- ✅ **Easy frontend integration** with existing chat APIs

Perfect for:
- 🎯 **User acquisition** - Try before you buy
- 🎯 **Lead conversion** - Free to paid funnel
- 🎯 **Emergency access** - Critical communications
- 🎯 **User onboarding** - Smooth introduction to service
