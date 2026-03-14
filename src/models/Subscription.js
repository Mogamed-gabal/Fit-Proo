const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Client ID is required']
  },
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Doctor ID is required']
  },
  duration: {
    type: Number,
    required: [true, 'Duration is required'],
    enum: [1, 3, 6],
    message: 'Duration must be 1, 3, or 6 months'
  },
  monthlyPrice: {
    type: Number,
    required: [true, 'Monthly price is required'],
    min: [0, 'Monthly price cannot be negative']
  },
  totalPrice: {
    type: Number,
    required: [true, 'Total price is required'],
    min: [0, 'Total price cannot be negative']
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed'],
    default: 'pending'
  },
  startDate: {
    type: Date,
    required: [true, 'Start date is required'],
    default: Date.now
  },
  endDate: {
    type: Date,
    required: [true, 'End date is required']
  },
  isActive: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

subscriptionSchema.pre('save', function(next) {
  if (this.isNew && this.startDate && this.duration) {
    const endDate = new Date(this.startDate);
    endDate.setMonth(endDate.getMonth() + this.duration);
    this.endDate = endDate;
  }
  next();
});

subscriptionSchema.methods.activate = function() {
  this.isActive = true;
  this.paymentStatus = 'paid';
  return this.save();
};

subscriptionSchema.methods.deactivate = function() {
  this.isActive = false;
  return this.save();
};

subscriptionSchema.virtual('isExpired').get(function() {
  return new Date() > this.endDate;
});

subscriptionSchema.set('toJSON', { virtuals: true });

// Reference validation middleware
subscriptionSchema.pre('save', async function(next) {
  if (this.isNew || this.isModified('clientId') || this.isModified('doctorId')) {
    const User = mongoose.model('User');
    
    // Validate client exists and is not deleted
    if (this.clientId) {
      const client = await User.findById(this.clientId);
      if (!client || client.isDeleted) {
        return next(new Error('Referenced client does not exist or is deleted'));
      }
    }
    
    // Validate doctor exists and is not deleted
    if (this.doctorId) {
      const doctor = await User.findById(this.doctorId);
      if (!doctor || doctor.isDeleted) {
        return next(new Error('Referenced doctor does not exist or is deleted'));
      }
    }
  }
  next();
});

// Database indexes for performance optimization
subscriptionSchema.index({ clientId: 1, createdAt: -1 });
subscriptionSchema.index({ doctorId: 1, createdAt: -1 });
subscriptionSchema.index({ isActive: 1 });
subscriptionSchema.index({ paymentStatus: 1 });
subscriptionSchema.index({ status: 1 });
subscriptionSchema.index({ createdAt: -1 });
subscriptionSchema.index({ endDate: 1 });

// Compound indexes for common queries
subscriptionSchema.index({ clientId: 1, isActive: 1 });
subscriptionSchema.index({ doctorId: 1, isActive: 1 });
subscriptionSchema.index({ clientId: 1, doctorId: 1 });
subscriptionSchema.index({ isActive: 1, paymentStatus: 1 });

module.exports = mongoose.model('Subscription', subscriptionSchema);
