# Admin & Supervisor Chat System Guide

## 📋 Overview

This guide explains the chat system components and management features available to **Admins** and **Supervisors** for monitoring, managing, and overseeing user communications.

---

## 🎯 Key Responsibilities

### **Admin Responsibilities**
- Monitor all user chats across the platform
- Access chat statistics and analytics
- Manage chat-related user issues
- Review chat content for compliance
- Export chat data for reports

### **Supervisor Responsibilities**
- Monitor chat activities within assigned scope
- Review chat logs for quality assurance
- Handle escalated chat issues
- Generate activity reports
- Ensure chat system compliance

---

## 🛠️ Available Chat Endpoints

### **📊 Chat Statistics & Analytics**

#### Get All Chats (System Overview)
```http
GET /api/chat/admin/all-chats
Authorization: Bearer <admin_token>
Permissions: VIEW_ALL_CHATS
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Results per page (default: 20, max: 100)
- `status` (optional): Filter by chat status (`ACTIVE`, `SUSPENDED`, `CLOSED`)
- `search` (optional): Search by participant name or email (max 100 chars)
- `participantRole` (optional): Filter by participant role (`client`, `doctor`, `nutritionist`, `therapist`, `coach`)
- `specialization` (optional): Filter by doctor specialization (max 50 chars)
- `chatType` (optional): Filter by chat type (`ONE_TO_ONE`, `GROUP`)

**Response:**
```json
{
  "success": true,
  "data": {
    "chats": [
      {
        "chatId": "chat_123",
        "type": "ONE_TO_ONE",
        "status": "ACTIVE",
        "participants": [
          {
            "userId": "user_456",
            "user": {
              "name": "Dr. John Smith",
              "email": "john@doctor.com",
              "role": "doctor",
              "specialization": "nutritionist"
            }
          },
          {
            "userId": "user_789",
            "user": {
              "name": "Jane Doe",
              "email": "jane@client.com",
              "role": "client"
            }
          }
        ],
        "createdAt": "2024-04-26T10:00:00Z",
        "updatedAt": "2024-04-26T15:30:00Z",
        "participantNames": ["Dr. John Smith", "Jane Doe"],
        "participantRoles": ["doctor", "client"],
        "hasDoctor": true,
        "hasClient": true
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 150,
      "pages": 8,
      "hasNext": true,
      "hasPrev": false
    },
    "filters": {
      "applied": {
        "status": "ACTIVE",
        "search": "john",
        "participantRole": null,
        "specialization": null,
        "chatType": null
      },
      "available": {
        "statuses": ["ACTIVE", "SUSPENDED", "CLOSED"],
        "participantRoles": ["client", "doctor", "nutritionist", "therapist", "coach"],
        "chatTypes": ["ONE_TO_ONE", "GROUP"]
      }
    }
  }
}
```

---

## 🔍 Search & Filter Examples

### **Search by Client/Doctor Name**
```http
GET /api/chat/admin/all-chats?search=john
Authorization: Bearer <admin_token>
```
*Finds all chats where any participant's name contains "john"*

### **Filter by Doctor Specialization**
```http
GET /api/chat/admin/all-chats?specialization=nutritionist
Authorization: Bearer <admin_token>
```
*Finds all chats with nutritionist participants*

### **Filter by Participant Role**
```http
GET /api/chat/admin/all-chats?participantRole=doctor
Authorization: Bearer <admin_token>
```
*Finds all chats that include at least one doctor*

### **Combined Filters**
```http
GET /api/chat/admin/all-chats?search=jane&participantRole=client&status=ACTIVE
Authorization: Bearer <admin_token>
```
*Finds active chats with clients named "jane"*

### **Filter by Chat Type**
```http
GET /api/chat/admin/all-chats?chatType=ONE_TO_ONE
Authorization: Bearer <admin_token>
```
*Finds all one-to-one chats (excludes group chats)*

#### Get Chat Statistics
```http
GET /api/chat/admin/:chatId/statistics
Authorization: Bearer <admin_token>
Permissions: VIEW_ALL_CHATS
```

**Response:**
```json
{
  "success": true,
  "data": {
    "chatId": "chat_123",
    "totalMessages": 45,
    "participantStats": {
      "user_1": { "messageCount": 23, "lastMessage": "2024-04-26T15:30:00Z" },
      "user_2": { "messageCount": 22, "lastMessage": "2024-04-26T15:25:00Z" }
    },
    "messageTypes": {
      "TEXT": 40,
      "IMAGE": 3,
      "FILE": 2
    },
    "activityTimeline": [...],
    "averageResponseTime": "2.5 minutes"
  }
}
```

---

### **📝 Chat Content Monitoring**

#### Get Chat Messages
```http
GET /api/chat/admin/:chatId/messages
Authorization: Bearer <admin_token>
Permissions: VIEW_ALL_CHATS
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Messages per page (default: 50, max: 100)
- `before` (optional): Get messages before this date (ISO 8601)
- `after` (optional): Get messages after this date (ISO 8601)

**Response:**
```json
{
  "success": true,
  "data": {
    "messages": [
      {
        "messageId": "msg_456",
        "senderId": "user_123",
        "content": "Hello, how can I help you?",
        "type": "TEXT",
        "timestamp": "2024-04-26T15:30:00Z",
        "isRead": true,
        "attachment": null
      },
      {
        "messageId": "msg_457",
        "senderId": "user_456",
        "content": "I need help with my workout plan",
        "type": "TEXT",
        "timestamp": "2024-04-26T15:31:00Z",
        "isRead": false,
        "attachment": null
      }
    ],
    "page": 1,
    "limit": 50
  }
}
```

---

## 🔍 Chat Access & Permissions

### **Permission System**

| Permission | Description | Admin | Supervisor |
|------------|-------------|-------|-------------|
| `VIEW_ALL_CHATS` | View all chats and messages | ✅ | ✅ |
| `MANAGE_CHAT_ACCESS` | Manage chat access permissions | ✅ | ❌ |
| `VIEW_CHAT_STATISTICS` | Access chat analytics | ✅ | ✅ |
| `EXPORT_CHAT_DATA` | Export chat data | ✅ | ❌ |

### **Access Control Features**

#### **Free Messaging Management**
- Users get **15 free messages per month**
- Automatic monthly reset on 1st day
- Admins can monitor free usage statistics
- Supervisors can view usage reports

#### **Subscription-Based Chat Access**
- Doctor-client chats require active subscription
- Bundle subscriptions support multiple users
- Coupon-based access for specific users
- Real-time access validation

---

## 📈 Chat Analytics & Monitoring

### **Key Metrics Available**

#### **User Engagement Metrics**
- Total messages sent/received
- Average response time
- Chat frequency patterns
- User activity timeline

#### **System Performance Metrics**
- Chat creation rates
- Message delivery success rates
- File attachment statistics
- Peak usage hours

#### **Compliance Metrics**
- Message content analysis
- Attachment type distribution
- User access pattern monitoring
- Suspicious activity detection

### **Monitoring Dashboard Features**

#### **Real-time Statistics**
```javascript
// Sample real-time stats endpoint
GET /api/chat/admin/realtime-stats
{
  "activeChats": 127,
  "messagesToday": 892,
  "averageResponseTime": "1.8 minutes",
  "usersOnline": 45,
  "systemHealth": "optimal"
}
```

#### **Usage Reports**
```javascript
// Sample usage report
GET /api/chat/admin/usage-report?period=weekly
{
  "period": "weekly",
  "totalUsers": 234,
  "activeUsers": 189,
  "totalMessages": 5672,
  "averageMessagesPerUser": 30.1,
  "topActiveUsers": [...],
  "peakActivityDay": "Wednesday"
}
```

---

## 🚨 Chat Security & Compliance

### **Content Monitoring**

#### **Automated Content Analysis**
- Message content scanning
- Attachment type validation
- Suspicious pattern detection
- Automated flagging system

#### **Manual Review Features**
- Admin message review queue
- Content moderation tools
- User suspension capabilities
- Detailed audit trails

### **Data Privacy & Security**

#### **User Privacy Protection**
- Message encryption (in transit and at rest)
- Secure file storage (Cloudinary)
- GDPR compliance features
- Data retention policies

#### **Access Logging**
- All admin chat access logged
- Message viewing tracked
- Export activities monitored
- Audit trail maintenance

---

## 🛠️ Troubleshooting Common Issues

### **Chat Access Issues**

#### **User Cannot Access Chat**
```bash
# Check user's subscription status
GET /api/subscriptions/user/:userId

# Check free message usage
GET /api/chat-access/free-usage/:userId

# Verify chat permissions
GET /api/permissions/user/:userId
```

#### **Chat Not Loading**
```bash
# Check chat status
GET /api/chat/:chatId/status

# Verify participant access
GET /api/chat/:chatId/participants

# Check system health
GET /api/chat/admin/system-health
```

### **Message Delivery Issues**

#### **Messages Not Sending**
```bash
# Check rate limits
GET /api/chat-access/rate-limit/:userId

# Verify user access
GET /api/chat-access/check/:userId/:chatId

# Check message queue
GET /api/chat/admin/message-queue
```

---

## 📊 Reporting & Data Export

### **Export Features**

#### **Chat History Export**
```http
GET /api/chat/admin/export/:chatId
Authorization: Bearer <admin_token>
Permissions: EXPORT_CHAT_DATA
```

**Export Options:**
- Format: JSON, CSV, PDF
- Date range filtering
- Message type filtering
- Participant filtering

#### **Analytics Reports**
```http
GET /api/chat/admin/reports/analytics
Authorization: Bearer <admin_token>
Permissions: VIEW_CHAT_STATISTICS
```

**Report Types:**
- Daily/Weekly/Monthly activity
- User engagement metrics
- System performance reports
- Compliance summaries

---

## 🔧 Best Practices for Admins/Supervisors

### **Monitoring Guidelines**

#### **Regular Checks**
- **Daily**: Review active chat count and system health
- **Weekly**: Analyze usage patterns and peak times
- **Monthly**: Review compliance reports and user feedback

#### **Alert Monitoring**
- Set up alerts for unusual activity spikes
- Monitor failed message delivery rates
- Track user complaints about chat issues
- Watch for system performance degradation

### **User Management**

#### **Chat Access Issues**
- Verify subscription status before granting access
- Check free message limits for non-paying users
- Review chat history for context on user complaints
- Document all access decisions for audit trail

#### **Content Moderation**
- Regular review of flagged messages
- Consistent application of content policies
- Clear documentation of moderation actions
- Escalation procedures for serious violations

### **Data Management**

#### **Retention Policies**
- Regular cleanup of old chat data
- Secure archiving of important conversations
- Compliance with data retention requirements
- Proper documentation of data deletions

---

## 🚀 Advanced Features

### **AI-Powered Analytics**
- Sentiment analysis on chat messages
- Predictive user behavior modeling
- Automated quality scoring
- Trend identification

### **Integration Capabilities**
- CRM system integration
- Email notification system
- SMS chat notifications
- Third-party analytics platforms

### **Custom Workflows**
- Automated escalation procedures
- Custom alert rules
- Integration with ticket systems
- Automated report generation

---

## 📞 Support & Escalation

### **Technical Support**
- System administrator: `admin@company.com`
- Emergency contact: `emergency@company.com`
- Documentation: `/docs/chat-system`
- API reference: `/api/chat/docs`

### **Escalation Procedures**
1. **Level 1**: Standard admin handling
2. **Level 2**: Supervisor escalation
3. **Level 3**: System administrator
4. **Level 4**: Emergency response team

### **Emergency Procedures**
- System outage response
- Data breach protocols
- User safety concerns
- Legal compliance issues

---

## 📚 Additional Resources

### **Documentation**
- [Chat System Architecture](./complete-chat-explanation.md)
- [Free Messaging System](./free-messaging-system.md)
- [Doctor-Client Chat](./doctor-client-chat.md)
- [API Reference](../api-docs/chat-api.md)

### **Training Materials**
- Admin dashboard tutorial
- Chat monitoring best practices
- Compliance guidelines
- Troubleshooting guide

### **Contact Information**
- **Development Team**: `dev@company.com`
- **Product Manager**: `pm@company.com`
- **Security Team**: `security@company.com`

---

## 🔄 Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0.0 | 2024-04-26 | Initial documentation | System |
| 1.1.0 | 2024-04-27 | Added troubleshooting section | Admin Team |
| 1.2.0 | 2024-04-28 | Updated API endpoints | Development |

---

**Last Updated**: April 26, 2024  
**Document Version**: 1.0.0  
**Next Review**: May 26, 2024

---

*This document is confidential and intended for authorized administrative personnel only.*
