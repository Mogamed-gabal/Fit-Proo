const mongoose = require('mongoose');

const refreshTokenSchema = new mongoose.Schema({
  token: {
    type: String,
    required: true,
    unique: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  expiresAt: {
    type: Date,
    required: true
  },
  isRevoked: {
    type: Boolean,
    default: false
  },
  revokedAt: Date,
  userAgent: String,
  ipAddress: String
}, {
  timestamps: true
});

// Reference validation middleware
refreshTokenSchema.pre('save', async function(next) {
  if (this.isNew || this.isModified('user')) {
    const User = mongoose.model('User');
    
    // Validate user exists and is not deleted
    if (this.user) {
      const user = await User.findById(this.user);
      if (!user || user.isDeleted) {
        return next(new Error('Referenced user does not exist or is deleted'));
      }
    }
  }
  next();
});

// 🔒 PERFORMANCE FIX: Add indexes for common queries (removed duplicates from schema)
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 86400 });
refreshTokenSchema.index({ user: 1, createdAt: -1 });
refreshTokenSchema.index({ isRevoked: 1 });
refreshTokenSchema.index({ user: 1, isRevoked: 1 });

refreshTokenSchema.methods.revoke = function() {
  this.isRevoked = true;
  this.revokedAt = new Date();
  return this.save();
};

module.exports = mongoose.model('RefreshToken', refreshTokenSchema);
