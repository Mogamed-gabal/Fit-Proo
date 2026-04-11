/**
 * MongoDB Transaction Helper
 * Provides transaction support for multi-collection operations
 */

const mongoose = require('mongoose');

/**
 * Execute a function within a MongoDB transaction
 * @param {Function} operation - Function to execute within transaction
 * @param {Object} options - Transaction options
 * @returns {Promise} - Result of the operation
 */
const withTransaction = async (operation, options = {}) => {
  const session = await mongoose.startSession();
  session.startTransaction(options);

  try {
    const result = await operation(session);
    await session.commitTransaction();
    return result;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

/**
 * Create user with OTP in transaction
 * @param {Object} userData - User data to create
 * @param {Function} emailService - Email service function
 * @returns {Promise} - Created user
 */
// ==========================================================
// TEMPORARY FUNCTION FOR STANDALONE MONGO - USE NOW
// ==========================================================
const createUserWithVerification = async (userData, emailService) => {
  const User = mongoose.model('User');
  
  // Create user
  const createdUser = await User.create(userData);

  try {
    await emailService.sendVerificationEmail(createdUser);
  } catch (emailError) {
    console.error('Email service failed, but user was created:', emailError.message);
  }

  // إضافة الملفات للـ document نفسه بدل تحويله لـ object
  createdUser.certificates = userData.certificates || [];
  createdUser.id_card_front = userData.id_card_front || null;
  createdUser.id_card_back = userData.id_card_back || null;

  return createdUser;
};

/**
 * Create subscription with user updates in transaction
 * @param {Object} subscriptionData - Subscription data
 * @returns {Promise} - Created subscription
 */
const createSubscriptionWithUpdates = async (subscriptionData) => {
  return withTransaction(async (session) => {
    const Subscription = mongoose.model('Subscription');
    const User = mongoose.model('User');
    
    // Validate referenced users exist
    const client = await User.findById(subscriptionData.clientId).session(session);
    const doctor = await User.findById(subscriptionData.doctorId).session(session);
    
    if (!client) {
      throw new Error('Client not found');
    }
    
    if (!doctor) {
      throw new Error('Doctor not found');
    }

    // Check for existing active subscription
    const existingSubscription = await Subscription.findOne({
      clientId: subscriptionData.clientId,
      doctorId: subscriptionData.doctorId,
      isActive: true
    }).session(session);

    if (existingSubscription) {
      throw new Error('Active subscription already exists for this client-doctor pair');
    }

    // Create subscription
    const subscription = await Subscription.create([subscriptionData], { session });
    const createdSubscription = subscription[0];

    return createdSubscription;
  });
};

/**
 * Soft delete user with related data cleanup in transaction
 * @param {String} userId - User ID to delete
 * @param {String} deletedBy - User ID performing deletion
 * @returns {Promise} - Deletion result
 */
const softDeleteUserWithCleanup = async (userId, deletedBy) => {
  return withTransaction(async (session) => {
    const User = mongoose.model('User');
    const Subscription = mongoose.model('Subscription');
    const RefreshToken = mongoose.model('RefreshToken');
    
    // Get user to delete
    const user = await User.findById(userId).session(session);
    if (!user) {
      throw new Error('User not found');
    }

    if (user.isDeleted) {
      throw new Error('User already deleted');
    }

    // Soft delete user
    user.isDeleted = true;
    user.deletedAt = new Date();
    user.deletedBy = deletedBy;
    await user.save({ session });

    // Deactivate all user's subscriptions
    await Subscription.updateMany(
      { clientId: userId, isActive: true },
      { 
        isActive: false,
        status: 'cancelled',
        deactivationReason: 'User deleted'
      },
      { session }
    );

    // Revoke all user's refresh tokens
    await RefreshToken.updateMany(
      { user: userId, isRevoked: false },
      { 
        isRevoked: true,
        revokedAt: new Date(),
        revocationReason: 'User deleted'
      },
      { session }
    );

    // If user is a doctor, deactivate subscriptions where they are the doctor
    if (user.role === 'doctor') {
      await Subscription.updateMany(
        { doctorId: userId, isActive: true },
        { 
          isActive: false,
          status: 'cancelled',
          deactivationReason: 'Doctor deleted'
        },
        { session }
      );
    }

    return {
      user: user.toJSON(),
      subscriptionsDeactivated: true,
      tokensRevoked: true
    };
  });
};

/**
 * Block user with subscription handling in transaction
 * @param {String} userId - User ID to block
 * @param {String} blockedBy - User ID performing blocking
 * @param {String} reason - Reason for blocking
 * @returns {Promise} - Blocking result
 */
 const blockUserWithSubscriptionHandling = async (userId, blockedBy, reason = null) => {
   return withTransaction(async (session) => {
     const User = mongoose.model('User');
     const Subscription = mongoose.model('Subscription');
    
    // Get user to block
     const user = await User.findById(userId).session(session);
     if (!user) {
       throw new Error('User not found');
     }

     if (user.isBlocked) {
       throw new Error('User already blocked');
     }

     // Block user
    user.isBlocked = true;
    user.blockedAt = new Date();
    user.blockedBy = blockedBy;
    user.blockReason = reason;
    await user.save({ session });

    // Deactivate all user's active subscriptions
    await Subscription.updateMany(
      { clientId: userId, isActive: true },
      { 
        isActive: false,
        status: 'suspended',
        deactivationReason: 'User blocked'
      },
      { session }
    );

    return {
      user: user.toJSON(),
      subscriptionsDeactivated: true
    };
  });
};

module.exports = {
  withTransaction,
  createUserWithVerification,
  createSubscriptionWithUpdates,
  softDeleteUserWithCleanup,
  blockUserWithSubscriptionHandling
};
