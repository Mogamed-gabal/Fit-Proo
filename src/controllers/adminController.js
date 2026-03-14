const User = require('../models/User');
const { blockUserWithSubscriptionHandling, softDeleteUserWithCleanup, withTransaction } = require('../utils/transactionHelper');
const { auditBlockUser, auditUnblockUser, auditSoftDeleteUser } = require('../middlewares/auditMiddleware');

/**
 * Get all users (excluding soft deleted) with pagination
 */
const getAllUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Validate limit
    if (limit > 100) {
      return res.status(400).json({
        success: false,
        error: 'Limit cannot exceed 100'
      });
    }

    // Build query with filters
    const query = { isDeleted: false };
    
    // Add role filter if provided
    if (req.query.role) {
      query.role = req.query.role;
    }
    
    // Add status filter if provided
    if (req.query.status) {
      query.status = req.query.status;
    }

    const users = await User.find(query)
      .select('-password -emailVerificationToken -passwordResetToken -passwordResetExpires -certificates')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        users,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get user by ID
 */
const getUserById = async (req, res) => {
  try {
    // Target user is provided by middleware
    const targetUser = req.targetUser;

    res.status(200).json({
      success: true,
      data: {
        user: targetUser.toJSON()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Block user (admin or supervisor)
 */
const blockUser = async (req, res) => {
  // Apply audit middleware
  auditBlockUser(req, res, async () => {
    try {
      // Target user is provided by middleware
      const targetUser = req.targetUser;
      const { reason } = req.body; // Capture block reason

      if (targetUser.isBlocked) {
        return res.status(400).json({
          success: false,
          error: 'User is already blocked'
        });
      }

      // Use transaction helper for user blocking with subscription handling
      const result = await blockUserWithSubscriptionHandling(targetUser._id, req.user.userId);

      res.status(200).json({
        success: true,
        message: 'User blocked successfully',
        data: {
          user: result.user
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });
};

/**
 * Unblock user (admin or supervisor)
 */
const unblockUser = async (req, res) => {
  // Apply audit middleware
  auditUnblockUser(req, res, async () => {
    try {
      // Target user is provided by middleware
      const targetUser = req.targetUser;
      const { reason } = req.body; // Capture unblock reason

      if (!targetUser.isBlocked) {
        return res.status(400).json({
          success: false,
          error: 'User is not blocked'
        });
      }

      
      // ❌ Disabled transaction بسبب إن السيرفر مش Replica Set
      const result = await withTransaction(async (session) => {
        const user = await User.findById(targetUser._id).session(session);
        if (!user) {
          throw new Error('User not found');
        }

        user.isBlocked = false;
        user.blockedAt = undefined;
        user.blockedBy = undefined;
        await user.save({ session });

        return user;
      });
      
      res.status(200).json({
        success: true,
        message: 'User unblocked successfully',
        data: {
          user: result
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });
};

/**
 * Soft delete user (admin or super_admin)
 */
const softDeleteUser = async (req, res) => {
  // Apply audit middleware
  auditSoftDeleteUser(req, res, async () => {
    try {
      const targetUser = req.targetUser;
      const { reason } = req.body; // Capture deletion reason

      /*
      // ================= OLD LOGIC =================
      // Using helper function with cleanup
      const result = await softDeleteUserWithCleanup(
        targetUser._id,
        req.user.userId
      );

      res.status(200).json({
        success: true,
        message: 'User deleted successfully',
        data: {
          user: result.user,
          subscriptionsDeactivated: result.subscriptionsDeactivated,
          tokensRevoked: result.tokensRevoked
        }
      });
      */

      // ================= NEW TRANSACTION VERSION =================

      const result = await withTransaction(async (session) => {

        const User = require('../models/User');
        const Subscription = require('../models/Subscription');
        const RefreshToken = require('../models/RefreshToken');

        const user = await User.findById(targetUser._id).session(session);

        if (!user) {
          throw new Error('User not found');
        }

        // Soft delete user
        user.isDeleted = true;
        user.deletedAt = new Date();
        user.deletedBy = req.user.userId;

        await user.save({ session });

        // Deactivate subscriptions
        await Subscription.updateMany(
          { clientId: user._id, isActive: true },
          {
            isActive: false,
            status: 'cancelled',
            deactivationReason: 'User deleted'
          },
        { session }
      );

      // Revoke tokens
      await RefreshToken.updateMany(
        { user: user._id, isRevoked: false },
        {
          isRevoked: true,
          revokedAt: new Date(),
          revocationReason: 'User deleted'
        },
        { session }
      );

      return {
        user,
        subscriptionsDeactivated: true,
        tokensRevoked: true
      };
    });

    res.status(200).json({
      success: true,
      message: 'User deleted successfully',
      data: result
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
    });
  }

/**
 * Create admin (only super_admin)
 */
const createAdmin = async (req, res) => {
  try {
    const { name, email, password, phone, address } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ 
      email: email.toLowerCase(), 
      isDeleted: false 
    }).select('_id');

    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'User with this email already exists'
      });
    }

    // Create admin user
    const admin = new User({
      name,
      email: email.toLowerCase(),
      password,
      phone,
      address,
      role: 'admin',
      emailVerified: true, // Auto-verify admin accounts
      status: 'approved'
    });

    await admin.save();

    res.status(201).json({
      success: true,
      message: 'Admin created successfully',
      data: {
        user: admin.toJSON()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Delete admin (only super_admin)
 */
const deleteAdmin = async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Use transaction for admin deletion
    const result = await withTransaction(async (session) => {
      const targetUser = await User.findOne({ _id: userId, isDeleted: false }).session(session);
      if (!targetUser) {
        throw new Error('Admin not found');
      }

      if (targetUser.role !== 'admin') {
        throw new Error('Target user is not an admin');
      }

      // Check current super admin count
      const currentSuperAdminCount = await User.countDocuments({ 
        role: 'super_admin', 
        isDeleted: false 
      }).session(session);

      // Cannot delete if it would reduce super_admin count below 2
      if (targetUser.role === 'super_admin' && !isValidSuperAdminCount(currentSuperAdminCount, -1)) {
        throw new Error('Cannot delete super admin. Minimum 2 super admins required.');
      }

      // Soft delete the admin
      targetUser.isDeleted = true;
      targetUser.deletedAt = new Date();
      targetUser.deletedBy = req.user.userId;
      await targetUser.save({ session });

      return targetUser;
    });

    res.status(200).json({
      success: true,
      message: 'Admin deleted successfully',
      data: {
        user: result.toJSON()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Create supervisor (only admin)
 */
const createSupervisor = async (req, res) => {
  try {
    const { name, email, password, phone, address } = req.body;

    const existingUser = await User.findOne({
      email: email.toLowerCase(),
      isDeleted: false
    }).select('_id');

    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'User with this email already exists'
      });
    }

    const supervisor = new User({
      name,
      email: email.toLowerCase(),
      password,
      phone,
      address,
      role: 'supervisor',
      emailVerified: true,
      status: 'approved'
    });

    await supervisor.save();

    res.status(201).json({
      success: true,
      message: 'Supervisor created successfully',
      data: {
        user: supervisor.toJSON()
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};


/**
 * Delete supervisor (WITHOUT TRANSACTION FOR NOW)
 * 🔴 Transaction commented to avoid MongoDB replica set error in dev
 * 🔥 Uncomment when deploying to production with replica set
 */

const deleteSupervisor = async (req, res) => {
  try {

    const targetUser = req.targetUser;

    if (targetUser.role !== 'supervisor') {
      return res.status(400).json({
        success: false,
        error: 'Target user is not a supervisor'
      });
    }

    // ==============================
    // 🔴 TRANSACTION VERSION (COMMENTED)
    // ==============================
    /*
    const result = await withTransaction(async (session) => {

      const user = await User.findById(targetUser._id).session(session);
      if (!user) {
        throw new Error('Supervisor not found');
      }

      user.isDeleted = true;
      user.deletedAt = new Date();
      user.deletedBy = req.user.userId;

      await user.save({ session });

      return user;
    });
    */

    // ==============================
    // ✅ SAFE VERSION (WORKING NOW)
    // ==============================

    const user = await User.findById(targetUser._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Supervisor not found'
      });
    }

    user.isDeleted = true;
    user.deletedAt = new Date();
    user.deletedBy = req.user.userId;

    await user.save();

    const result = user;

    res.status(200).json({
      success: true,
      message: 'Supervisor deleted successfully',
      data: {
        user: result.toJSON()
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get all supervisors with pagination
 * 🔴 Transaction disabled (not needed for read)
 */

const getAllSupervisors = async (req, res) => {
  try {

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const query = {
      role: 'supervisor',
      isDeleted: false
    };

    /*
    🔴 Transaction Version (Not needed for read)
    const result = await withTransaction(async (session) => {
      const supervisors = await User.find(query)
        .session(session)
        .skip(skip)
        .limit(limit);

      const total = await User.countDocuments(query).session(session);

      return { supervisors, total };
    });
    */

    // ✅ Safe Version (Live)
    const supervisors = await User.find(query)
      .select('-password -tokens')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        users: supervisors,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
/**
 * Get all blocked users
 * 🔴 Transaction disabled (read operation)
 */

const getBlockedUsers = async (req, res) => {
  try {

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const query = {
      isBlocked: true,
      isDeleted: false
    };

    /*
    🔴 Transaction Version (Not required for read)
    const result = await withTransaction(async (session) => {
      const users = await User.find(query)
        .session(session)
        .skip(skip)
        .limit(limit);

      const total = await User.countDocuments(query).session(session);

      return { users, total };
    });
    */

    // ✅ Safe Version
    const users = await User.find(query)
      .select('-password -tokens')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        users,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
module.exports = {
  getAllUsers,
  getUserById,
  blockUser,
  unblockUser,
  softDeleteUser,
  createSupervisor,
  deleteSupervisor,
  getAllSupervisors,
  getBlockedUsers
};
