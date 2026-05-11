# GET /api/doctors - Updated with ID Cards

## 📋 Endpoint Overview

**GET /api/doctors** - Get all doctors with ID cards included in response

**Updated:** Now includes `id_card_front` and `id_card_back` fields

---

## 🔐 Authentication & Permissions

### **✅ Required Permissions:**
- **Admin:** Full access to view all doctors
- **Supervisor:** Can view doctors with proper permissions
- **Doctor:** Can view other doctors (depending on permissions)
- **Client:** Can view approved doctors

---

## 📊 Updated Response Format

### **✅ Success Response (200):**
```json
{
  "success": true,
  "data": {
    "doctors": [
      {
        "_id": "69f5d9354a5388b8069aca9e",
        "name": "DrSarah Johnson",
        "email": "gabalmohamed202@gmail.com",
        "phone": "+201013358888",
        "address": "789MedicalCe  nter,   Alexandria,Egypt",
        "dateOfBirth": "1999-05-23T00:00:00.000Z",
        "region": "Cairo",
        "gender": "male",
        "role": "doctor",
        "specialization": "nutritionist",
        "emailVerified": true,
        "isBlocked": false,
        "isDeleted": false,
        "status": "approved",
        "isRecommended": false,
        "packages": [
          {
            "duration": 1,
            "price": 150,
            "_id": "69f5d9354a5388b8069aca9f"
          }
        ],
        "certificates": [
          {
            "filename": "Capture.PNG",
            "originalName": "Capture.PNG",
            "mimetype": "image/png",
            "size": 137638,
            "secure_url": "https://res.cloudinary.com/dfno4mybt/image/upload/v1777719604/fitness-app/file_wfhumo.png",
            "public_id": "fitness-app/file_wfhumo",
            "_id": "69f5d9354a5388b8069acaa2"
          }
        ],
        "short_bio": "Experienced physical therapist with 12 years of expertise in sports medicine and rehabilitation",
        "years_of_experience": 12,
        "weightHistory": [],
        "createdAt": "2026-05-02T11:00:05.611Z",
        "updatedAt": "2026-05-10T20:39:15.767Z",
        "lastLogin": "2026-05-07T23:05:13.921Z",
        "lockUntil": null,
        "profilePicture": {
          "filename": "scaled_56293.jpg",
          "originalName": "scaled_56293.jpg",
          "mimetype": "image/jpeg",
          "size": 107187,
          "secure_url": "https://res.cloudinary.com/dfno4mybt/image/upload/v1777743204/fitness-app/file_g5lmxr.jpg",
          "public_id": "fitness-app/file_g5lmxr"
        },
        "deletedAt": null,
        "deletedBy": null,
        "id_card_front": {                    // ✅ NOW INCLUDED!
          "filename": "Capture.PNG",
          "originalName": "Capture.PNG",
          "mimetype": "image/png",
          "size": 137638,
          "secure_url": "https://res.cloudinary.com/dfno4mybt/image/upload/v1777719604/fitness-app/id_front.png",
          "public_id": "fitness-app/id_front",
          "uploadedAt": "2026-05-02T11:00:05.000Z"
        },
        "id_card_back": {                     // ✅ NOW INCLUDED!
          "filename": "Capture.PNG",
          "originalName": "Capture.PNG",
          "mimetype": "image/png",
          "size": 137638,
          "secure_url": "https://res.cloudinary.com/dfno4mybt/image/upload/v1777719604/fitness-app/id_back.png",
          "public_id": "fitness-app/id_back",
          "uploadedAt": "2026-05-02T11:00:05.000Z"
        }
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 1,
      "totalDoctors": 1,
      "hasNext": false,
      "hasPrev": false
    }
  }
}
```

---

## 🎯 What's New

### **✅ Added Fields:**
```javascript
{
  "id_card_front": {                    // ✅ NEW! Front ID card
    "filename": "string",           // Generated filename
    "originalName": "string",         // Original uploaded filename
    "mimetype": "string",            // File MIME type
    "size": 137638,                  // File size in bytes
    "secure_url": "string",          // HTTPS secure URL
    "public_id": "string",           // Cloudinary public ID
    "uploadedAt": "string"            // Upload timestamp
  },
  "id_card_back": {                     // ✅ NEW! Back ID card
    "filename": "string",
    "originalName": "string",
    "mimetype": "string",
    "size": 137638,
    "secure_url": "string",
    "public_id": "string",
    "uploadedAt": "string"
  }
}
```

---

## 📊 Total Fields Returned

### **✅ Now Returns 29 fields:**
1. `_id` ✅
2. `name` ✅
3. `email` ✅
4. `phone` ✅
5. `address` ✅
6. `dateOfBirth` ✅
7. `region` ✅
8. `gender` ✅
9. `role` ✅
10. `specialization` ✅
11. `emailVerified` ✅
12. `isBlocked` ✅
13. `isDeleted` ✅
14. `status` ✅
15. `isRecommended` ✅
16. `packages` ✅
17. `certificates` ✅
18. `short_bio` ✅
19. `years_of_experience` ✅
20. `weightHistory` ✅
21. `createdAt` ✅
22. `updatedAt` ✅
23. `lastLogin` ✅
24. `lockUntil` ✅
25. `profilePicture` ✅
26. `deletedAt` ✅
27. `deletedBy` ✅
28. `id_card_front` ✅ (NEW!)
29. `id_card_back` ✅ (NEW!)

### **❌ Still Excluded (2 fields):**
- **`password`** - Never returned for security
- **`__v`** - Internal Mongoose field

---

## 🚀 Usage Examples

### **✅ Basic Request:**
```javascript
GET /api/doctors
Authorization: Bearer <token>
```

### **✅ With Filters:**
```javascript
GET /api/doctors?status=approved&specialization=nutritionist
Authorization: Bearer <token>
```

### **✅ Frontend Integration:**
```javascript
const getDoctors = async () => {
  try {
    const response = await fetch('/api/doctors', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    const result = await response.json();

    if (result.success) {
      console.log('Doctors with ID cards:', result.data.doctors);
      
      // Access ID cards
      result.data.doctors.forEach(doctor => {
        if (doctor.id_card_front) {
          console.log('Front ID card:', doctor.id_card_front.secure_url);
        }
        if (doctor.id_card_back) {
          console.log('Back ID card:', doctor.id_card_back.secure_url);
        }
      });
      
      return result.data;
    } else {
      throw new Error(result.error);
    }
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
};
```

---

## 🔍 ID Card Display Example

### **✅ Frontend Component:**
```javascript
const DoctorCard = ({ doctor }) => {
  return (
    <div className="doctor-card">
      <h3>{doctor.name}</h3>
      <p>{doctor.specialization}</p>
      
      {/* ID Cards Section */}
      <div className="id-cards">
        {doctor.id_card_front && (
          <div className="id-card">
            <h4>Front ID Card</h4>
            <img 
              src={doctor.id_card_front.secure_url} 
              alt="Front ID Card" 
              style={{ maxWidth: '200px' }}
            />
            <a 
              href={doctor.id_card_front.secure_url} 
              download={doctor.id_card_front.originalName}
              className="download-btn"
            >
              📥 Download Front
            </a>
          </div>
        )}
        
        {doctor.id_card_back && (
          <div className="id-card">
            <h4>Back ID Card</h4>
            <img 
              src={doctor.id_card_back.secure_url} 
              alt="Back ID Card" 
              style={{ maxWidth: '200px' }}
            />
            <a 
              href={doctor.id_card_back.secure_url} 
              download={doctor.id_card_back.originalName}
              className="download-btn"
            >
              📥 Download Back
            </a>
          </div>
        )}
      </div>
    </div>
  );
};
```

---

## 📋 Summary

### **✅ What Changed:**
- **Removed separate endpoint** - No more `/api/doctors/:id/id-cards`
- **Updated main endpoint** - `GET /api/doctors` now includes ID cards
- **Single API call** - Get everything including ID cards at once
- **Same security** - Password still excluded, ID cards now included

### **✅ Benefits:**
- **Simpler integration** - One endpoint for all doctor data
- **Complete information** - ID cards included with other data
- **Consistent response** - Same structure as before + ID cards
- **Better performance** - No need for separate API calls

---

## **🎯 The GET /api/doctors endpoint now returns ID card front and back in the same response!**

**Frontend developers get complete doctor data including ID cards in a single API call!**
