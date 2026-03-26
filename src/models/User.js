const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [50, 'Name cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
password: {
  type: String,
  required: [true, 'Password is required'],
  minlength: [8, 'Password must be at least 8 characters'],
  validate: {
    validator: function(value) {
      // At least 1 uppercase, 1 lowercase, 1 number
      return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(value);
    },
  },
},

phone: {
  type: String,
  required: [true, 'Phone number is required'],
  validate: {
    validator: function(value) {
      // 🔒 SECURITY FIX: International phone format (E.164)
      return /^\+?[1-9]\d{1,14}$/.test(value);
    },
    message: 'Please enter a valid phone number in international format (+CountryCodeNumber)'
  }
},
  address: {
    type: String,
    required: function () {
      return ['client', 'doctor'].includes(this.role);
    },
    trim: true,
    maxlength: [200, 'Address cannot exceed 200 characters']
  },
  dateOfBirth: {
    type: Date,
    required: function () {
      return ['client', 'doctor'].includes(this.role);
    }
  },
  region: {
    type: String,
    required: function () {
      return ['client', 'doctor'].includes(this.role);
    },
    enum: [
      'Cairo', 'Giza', 'Alexandria', 'Dakahlia', 'Red Sea', 'Beheira', 'Fayoum',
      'Gharbia', 'Ismailia', 'Menofia', 'Minya', 'Qaliubiya', 'New Valley', 'Suez',
      'Aswan', 'Assiut', 'Beni Suef', 'Port Said', 'Damietta', 'Sharkia',
      'South Sinai', 'Kafr El Sheikh', 'Matrouh', 'Luxor', 'Qena', 'North Sinai', 'Sohag'
    ]
  },
  gender: {
    type: String,
    required: function () {
      return ['client', 'doctor'].includes(this.role);
    },
    enum: ['male', 'female', 'other']
  },
  role: {
    type: String,
    enum: ['client', 'doctor', 'admin', 'supervisor'],
    required: [true, 'Role is required']
  },
  specialization: {
    type: String,
    enum: ['doctor', 'nutritionist', 'therapist', 'coach'],
    required: function () {
      return this.role === 'doctor';
    }
  },
  emailVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationToken: String,
  emailVerificationExpires: Date,
  emailOtp: String,
  emailOtpExpires: Date,
  isBlocked: {
    type: Boolean,
    default: false
  },
  blockedAt: Date,
  blockedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: Date,
  deletedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: function() {
      return this.role === 'client' ? 'approved' : 'pending';
    }
  },
  packages: [{
    duration: {
      type: Number,
      enum: [1, 3, 6],
      required: true
    },
    price: {
      type: Number,
      required: true,
      min: [0, 'Price cannot be negative']
    }
  }],
  certificates: [{
    filename: String,
    originalName: String,
    mimetype: String,
    size: Number,
    secure_url: String,
    public_id: String
  }],
  profilePicture: {
    filename: String,
    originalName: String,
    mimetype: String,
    size: Number,
    secure_url: String,
    public_id: String
  },
  short_bio: {
    type: String,
    maxlength: [500, 'Short bio cannot exceed 500 characters']
  },
  years_of_experience: {
    type: Number,
    min: [0, 'Years of experience cannot be negative'],
    max: [70, 'Years of experience cannot exceed 70']
  },
  id_card_front: {
    filename: String,
    originalName: String,
    mimetype: String,
    size: Number,
    buffer: Buffer
  },
  id_card_back: {
    filename: String,
    originalName: String,
    mimetype: String,
    size: Number,
    buffer: Buffer
  },
height: {
    type: Number,
    min: [50, 'Height must be at least 50 cm'],
    max: [250, 'Height cannot exceed 250 cm'],
    required: function() {
      return this.role === 'client';
    }

  },
  goal: {
    type: String,
    enum: ['weight_loss', 'muscle_gain', 'fitness', 'health', 'performance'],
    required: function() {
      return this.role === 'client';
    }
  },
  weightHistory: [{
    value: {
      type: Number,
      required: true,
      min: [1, 'Weight must be at least 1 kg']
    },
    date: {
      type: Date,
      default: Date.now
    }
  }],
  lastLogin: Date,
  passwordResetOtp: String,
  passwordResetOtpExpires: Date,
  loginAttempts: {
    type: Number,
    default: 0
  },
  lockUntil: {
    type: Date
  },
  passwordResetOtpAttempts: {
    type: Number,
    default: 0
  },
}, {
  timestamps: true
});

// Virtual for automatic age calculation from dateOfBirth
userSchema.virtual('age').get(function() {
  if (!this.dateOfBirth) return null;
  const today = new Date();
  const birthDate = new Date(this.dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
});

// Ensure virtuals are included in JSON output
userSchema.set('toJSON', { virtuals: true });
userSchema.set('toObject', { virtuals: true });

// Exclude soft-deleted users by default
userSchema.pre(/^find/, function(next) {
  this.find({ isDeleted: { $ne: true } });
  next();
});

userSchema.pre('findOne', function(next) {
  this.where({ isDeleted: { $ne: true } });
  next();
});

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.toJSON = function() {
  const userObject = this.toObject();
  delete userObject.password;
  delete userObject.emailVerificationToken;
  delete userObject.emailVerificationExpires;
  delete userObject.emailOtp;
  delete userObject.emailOtpExpires;
  delete userObject.passwordResetOtp;
  delete userObject.passwordResetOtpExpires;
  delete userObject.loginAttempts;
  delete userObject.lockUntil;
  delete userObject.passwordResetOtpAttempts;
  delete userObject.id_card_front;
  delete userObject.id_card_back;
  delete userObject.blockedBy;
  delete userObject.deletedBy;
  
  // Keep certificates URLs but remove sensitive data
  if (userObject.certificates) {
    userObject.certificates = userObject.certificates.map(cert => ({
      filename: cert.filename,
      originalName: cert.originalName,
      mimetype: cert.mimetype,
      size: cert.size,
      secure_url: cert.secure_url
    }));
  }

  // Keep profile picture URL but remove sensitive data
  if (userObject.profilePicture) {
    userObject.profilePicture = {
      filename: userObject.profilePicture.filename,
      originalName: userObject.profilePicture.originalName,
      mimetype: userObject.profilePicture.mimetype,
      size: userObject.profilePicture.size,
      secure_url: userObject.profilePicture.secure_url
    };
  }
  
  return userObject;
};

// 🔒 PERFORMANCE FIX: Enhanced database indexes for performance and security
userSchema.index({ phone: 1 }, { unique: true, sparse: true });
userSchema.index({ role: 1 });
userSchema.index({ status: 1 });
userSchema.index({ isDeleted: 1 });
userSchema.index({ isBlocked: 1 });
userSchema.index({ emailVerified: 1 });
userSchema.index({ createdAt: -1 });
userSchema.index({ blockedAt: -1 });
userSchema.index({ deletedAt: -1 });

// 🔒 PERFORMANCE FIX: Compound indexes for common query patterns
userSchema.index({ role: 1, status: 1, createdAt: -1 });
userSchema.index({ role: 1, isDeleted: 1 });
userSchema.index({ isDeleted: 1, createdAt: -1 });
userSchema.index({ emailVerified: 1, status: 1 });
userSchema.index({ isBlocked: 1, blockedAt: -1 });
userSchema.index({ role: 1, emailVerified: 1 });

// 🔒 SECURITY FIX: Text search index for admin search functionality
userSchema.index({
  name: 'text',
  email: 'text'
});

// 🔒 SECURITY FIX: TTL index for OTP cleanup (automatic cleanup after 24 hours)
userSchema.index({ emailOtpExpires: 1 }, { expireAfterSeconds: 86400 });
userSchema.index({ passwordResetOtpExpires: 1 }, { expireAfterSeconds: 86400 });

// 🔒 SECURITY FIX: Index for lockout functionality
userSchema.index({ lockUntil: 1 });

// 🔒 PERFORMANCE FIX: Additional indexes for common queries
userSchema.index({ role: 1, isDeleted: 1, status: 1 });
userSchema.index({ region: 1, createdAt: -1 });
userSchema.index({ specialization: 1, role: 1 });
userSchema.index({ 'weightHistory.date': -1 });
userSchema.index({ createdAt: -1 });
userSchema.index({ updatedAt: -1 });

// 🔒 PERFORMANCE FIX: Compound indexes for common queries
userSchema.index({ role: 1, status: 1, isDeleted: 1 });
userSchema.index({ role: 1, specialization: 1, status: 1 });

module.exports = mongoose.model('User', userSchema);
