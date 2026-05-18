# Bundle Group Chat Guide

## 📝 شرح إنشاء Chat Group بين Client و 2 Doctors جوه Bundle

---

## 🎯 الـ Endpoint:

```
POST /api/chat/create
```

---

## 📦 الـ Body اللي محتاج تبعتة:

```json
{
  "chatData": {
    "chatId": "unique_chat_id",
    "type": "GROUP",
    "title": "My Bundle Chat",
    "participants": [
      {
        "userId": "client_user_id",
        "role": "CLIENT"
      },
      {
        "userId": "doctor1_user_id",
        "role": "DOCTOR"
      },
      {
        "userId": "doctor2_user_id",
        "role": "DOCTOR"
      }
    ]
  },
  "subscriptionId": "bundle_subscription_id"
}
```

---

## 🔥 الشرح:

- **`chatId`**: ID فريد للـ chat (ممكن تبعت أي string فريد)
- **`type`**: لازم يكون `"GROUP"` عشان يبقى group chat
- **`title`**: اسم الـ chat (اختياري بس مفيد)
- **`participants`**: array فيه كل الـ participants:
  - **`userId`**: الـ user ID لكل participant
  - **`role`**: لازم يكون `"CLIENT"` للكلاينت و `"DOCTOR"` للدكاترة
- **`subscriptionId`**: الـ subscription ID للـ bundle (مهم جداً عشان يربط الـ chat بالـ bundle)

---

## 📌 مثال عملي:

```json
{
  "chatData": {
    "chatId": "bundle_chat_123456789",
    "type": "GROUP",
    "title": "Nutrition Bundle Chat",
    "participants": [
      {
        "userId": "6a060aa2fc1398b75f483be4",
        "role": "CLIENT"
      },
      {
        "userId": "69f5d9354a5388b8069aca9e",
        "role": "DOCTOR"
      },
      {
        "userId": "6a060cbd999475bfa49c16cd",
        "role": "DOCTOR"
      }
    ]
  },
  "subscriptionId": "bundle_subscription_id_here"
}
```

---

## ⚠️ ملاحظات مهمة:

- **`subscriptionId`**: لازم يكون subscription ID للـ bundle اللي الكلاينت اشترى فيه
- **`participants`**: لازم يكون فيه الكلاينت والدكاترة اللي جوه الـ bundle
- **`role`**: لازم تحدد الـ role صح لكل participant
- **`chatId`**: لازم يكون فريد، ممكن تستخدم timestamp أو UUID

---

## 🎯 Response Example:

```json
{
  "success": true,
  "data": {
    "success": true,
    "chat": {
      "chatId": "bundle_chat_123456789",
      "type": "GROUP",
      "title": "Nutrition Bundle Chat",
      "status": "ACTIVE",
      "participants": [...],
      "subscriptionBinding": {
        "subscriptionId": "bundle_subscription_id_here",
        "accessType": "BUNDLE",
        "allowedParticipantsSource": "BUNDLE_MEMBERS",
        "validatedAt": "2026-05-18T01:56:00.000Z",
        "isActive": true
      },
      "createdAt": "2026-05-18T01:56:00.000Z",
      "updatedAt": "2026-05-18T01:56:00.000Z"
    },
    "subscription": {
      "id": "bundle_subscription_id_here",
      "type": "BUNDLE",
      "accessType": "BUNDLE"
    }
  }
}
```

---

## 🚀 خطوات التنفيذ:

1. **احصل على الـ User IDs**:
   - Client User ID
   - Doctor 1 User ID
   - Doctor 2 User ID

2. **احصل على الـ Subscription ID**:
   - Bundle Subscription ID

3. **أرسل الـ Request**:
   - استخدم الـ endpoint المذكور
   - أرسل الـ body بالبيانات المطلوبة

4. **استقبل الـ Response**:
   - تأكد من نجاح العملية
   - احفظ الـ chatId للاستخدام المستقبلي

---

## 📚 Endpoints ذات صلة:

- **POST /api/chat/create** - إنشاء chat جديد
- **POST /api/chat/send-message** - إرسال رسالة
- **POST /api/chat/join** - الانضمام للـ chat
- **GET /api/chat/admin/all-chats** - عرض كل الـ chats (للأدمن)
