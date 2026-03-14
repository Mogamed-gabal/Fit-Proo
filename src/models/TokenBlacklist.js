const mongoose = require('mongoose');

// 🔒 SECURITY FIX: Token blacklist model for JWT logout functionality
const tokenBlacklistSchema = new mongoose.Schema({
  jti: {
    type: String,
    required: true,
    unique: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  blacklisted: {
    type: Boolean,
    default: true
  },
  blacklistedAt: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date,
    required: true
  }
}, {
  timestamps: true
});

// 🔒 PERFORMANCE FIX: Add indexes for common queries (removed duplicates from schema)
tokenBlacklistSchema.index({ jti: 1 });
tokenBlacklistSchema.index({ userId: 1 });
tokenBlacklistSchema.index({ blacklisted: 1 });
tokenBlacklistSchema.index({ blacklistedAt: 1 });
tokenBlacklistSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 86400 });
tokenBlacklistSchema.index({ userId: 1, blacklisted: 1 });
tokenBlacklistSchema.index({ blacklistedAt: 1, expiresAt: 1 });

// 🔒 SECURITY FIX: Static method to check if token is blacklisted
tokenBlacklistSchema.statics.isTokenBlacklisted = async function(jti) {
  const token = await this.findOne({
    jti,
    blacklisted: true,
    expiresAt: { $gt: new Date() }
  });
  
  return !!token;
};

// 🔒 SECURITY FIX: Static method to cleanup expired tokens
tokenBlacklistSchema.statics.cleanupExpired = async function() {
  const result = await this.deleteMany({
    expiresAt: { $lt: new Date() }
  });
  
  return result.deletedCount;
};

// 🔒 SECURITY FIX: Static method to blacklist multiple tokens
tokenBlacklistSchema.statics.blacklistTokens = async function(tokenIds, userId) {
  const tokens = tokenIds.map(jti => ({
    jti,
    userId,
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
  }));
  
  return await this.insertMany(tokens, { ordered: false });
};

const TokenBlacklist = mongoose.model('TokenBlacklist', tokenBlacklistSchema);

module.exports = TokenBlacklist;
