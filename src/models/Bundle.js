const mongoose = require('mongoose');

const bundleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  doctors: [{
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  }],
  price: {
    type: Number,
    required: true,
    min: 0.01
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Validation: Exactly 2 doctors required
bundleSchema.pre('save', function(next) {
  if (this.doctors.length !== 2) {
    return next(new Error('Bundle must contain exactly 2 doctors'));
  }
  
  // Check for duplicate doctor IDs
  const doctorIds = this.doctors.map(d => d.doctorId.toString());
  const uniqueDoctorIds = [...new Set(doctorIds)];
  
  if (doctorIds.length !== uniqueDoctorIds.length) {
    return next(new Error('Duplicate doctor IDs are not allowed'));
  }
  
  next();
});

// Validation for updates
bundleSchema.pre(['findOneAndUpdate', 'updateOne', 'updateMany'], function(next) {
  const update = this.getUpdate();
  
  if (update.doctors) {
    if (update.doctors.length !== 2) {
      return next(new Error('Bundle must contain exactly 2 doctors'));
    }
    
    // Check for duplicate doctor IDs
    const doctorIds = update.doctors.map(d => d.doctorId.toString());
    const uniqueDoctorIds = [...new Set(doctorIds)];
    
    if (doctorIds.length !== uniqueDoctorIds.length) {
      return next(new Error('Duplicate doctor IDs are not allowed'));
    }
  }
  
  next();
});

module.exports = mongoose.model('Bundle', bundleSchema);
