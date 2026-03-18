const NodeCache = require('node-cache');

// Cache configuration
const userCache = new NodeCache({
  stdTTL: 300, // 5 minutes
  checkperiod: 120, // Check for expired keys every 2 minutes
  useClones: false // Return references for better performance
});

const profileCacheService = {
  // Cache user profile data
  cacheUserProfile: (userId, userData) => {
    const cacheKey = `user_profile_${userId}`;
    userCache.set(cacheKey, userData);
  },

  // Get cached user profile
  getCachedUserProfile: (userId) => {
    const cacheKey = `user_profile_${userId}`;
    return userCache.get(cacheKey);
  },

  // Invalidate user profile cache
  invalidateUserProfileCache: (userId) => {
    const cacheKey = `user_profile_${userId}`;
    userCache.del(cacheKey);
  },

  // Cache weight history with pagination
  cacheWeightHistory: (userId, page, limit, data) => {
    const cacheKey = `weight_history_${userId}_${page}_${limit}`;
    userCache.set(cacheKey, data);
  },

  // Get cached weight history
  getCachedWeightHistory: (userId, page, limit) => {
    const cacheKey = `weight_history_${userId}_${page}_${limit}`;
    return userCache.get(cacheKey);
  },

  // Invalidate weight history cache
  invalidateWeightHistoryCache: (userId) => {
    // Invalidate all weight history cache entries for this user
    const keys = userCache.keys();
    const weightHistoryKeys = keys.filter(key => key.startsWith(`weight_history_${userId}_`));
    userCache.del(weightHistoryKeys);
  },

  // Cache doctor certificates
  cacheDoctorCertificates: (userId, certificates) => {
    const cacheKey = `doctor_certificates_${userId}`;
    userCache.set(cacheKey, certificates);
  },

  // Get cached doctor certificates
  getCachedDoctorCertificates: (userId) => {
    const cacheKey = `doctor_certificates_${userId}`;
    return userCache.get(cacheKey);
  },

  // Invalidate doctor certificates cache
  invalidateDoctorCertificatesCache: (userId) => {
    const cacheKey = `doctor_certificates_${userId}`;
    userCache.del(cacheKey);
  },

  // Cache doctor packages
  cacheDoctorPackages: (userId, packages) => {
    const cacheKey = `doctor_packages_${userId}`;
    userCache.set(cacheKey, packages);
  },

  // Get cached doctor packages
  getCachedDoctorPackages: (userId) => {
    const cacheKey = `doctor_packages_${userId}`;
    return userCache.get(cacheKey);
  },

  // Invalidate doctor packages cache
  invalidateDoctorPackagesCache: (userId) => {
    const cacheKey = `doctor_packages_${userId}`;
    userCache.del(cacheKey);
  },

  // Clear all cache for a user (useful for profile updates)
  clearUserCache: (userId) => {
    const keys = userCache.keys();
    const userKeys = keys.filter(key => key.includes(userId));
    userCache.del(userKeys);
  },

  // Get cache statistics
  getCacheStats: () => {
    return userCache.getStats();
  },

  // Flush all cache (useful for maintenance)
  flushAll: () => {
    userCache.flushAll();
  }
};

module.exports = profileCacheService;
