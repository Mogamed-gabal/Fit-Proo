const User = require('../models/User');
const { body, param, query } = require('express-validator');

// Import related models for dependency checking
let Subscription, DietPlan, WorkoutPlan;
try {
  Subscription = require('../models/Subscription');
} catch (e) {
  // Subscription model not available
}
try {
  DietPlan = require('../models/DietPlan');
} catch (e) {
  // DietPlan model not available
}
try {
  WorkoutPlan = require('../models/WorkoutPlan');
} catch (e) {
  // WorkoutPlan model not available
}

class UserController {
  /**
   * Get all users with role = 'client'
   * GET /api/users
   */
  async getUsers(req, res, next) {
    try {
      const {
        page = 1,
        limit = 20,
        search
      } = req.query;

      const pageNum = parseInt(page);
      const limitNum = parseInt(limit);
      const skip = (pageNum - 1) * limitNum;

      // Build query
      const query = { role: 'client' };

      if (search) {
        const searchRegex = new RegExp(search.toLowerCase().trim(), 'i');
        query.$or = [
          { name: searchRegex },
          { email: searchRegex }
        ];
      }

      // Get users with pagination
      const [users, total] = await Promise.all([
        User.find(query)
          .select('-password')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limitNum)
          .lean(),
        User.countDocuments(query)
      ]);

      res.status(200).json({
        success: true,
        data: {
          users,
          pagination: {
            currentPage: pageNum,
            totalPages: Math.ceil(total / limitNum),
            totalUsers: total,
            hasNext: pageNum * limitNum < total,
            hasPrev: pageNum > 1
          }
        }
      });
    } catch (error) {
      console.error('❌ Get users error:', error);
      next(error);
    }
  }

  /**
   * Get user by ID
   * GET /api/users/:id
   */
  async getUserById(req, res, next) {
    try {
      const { id } = req.params;

      const user = await User.findOne({ _id: id, role: 'client' })
        .select('-password')
        .lean();

      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      res.status(200).json({
        success: true,
        data: user
      });
    } catch (error) {
      console.error('❌ Get user by ID error:', error);
      next(error);
    }
  }

  /**
   * Update user status (activate/deactivate)
   * PATCH /api/users/:id/status
   */
  async updateUserStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { isActive } = req.body;

      const user = await User.findOneAndUpdate(
        { _id: id, role: 'client' },
        { isActive },
        { new: true }
      ).select('-password');

      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      res.status(200).json({
        success: true,
        message: 'User status updated successfully',
        data: user
      });
    } catch (error) {
      console.error('❌ Update user status error:', error);
      next(error);
    }
  }

  /**
   * Delete user
   * DELETE /api/users/:id
   */
  async deleteUser(req, res, next) {
    try {
      const { id } = req.params;

      const user = await User.findOneAndDelete({ _id: id, role: 'client' });

      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      res.status(200).json({
        success: true,
        message: 'User deleted successfully'
      });
    } catch (error) {
      console.error('❌ Delete user error:', error);
      next(error);
    }
  }

  /**
   * Get user statistics
   * GET /api/users/stats
   */
  async getUserStats(req, res, next) {
    try {
      const [
        totalUsers,
        activeUsers,
        inactiveUsers,
        recentUsers
      ] = await Promise.all([
        User.countDocuments({ role: 'client' }),
        User.countDocuments({ role: 'client', isActive: true }),
        User.countDocuments({ role: 'client', isActive: false }),
        User.countDocuments({ 
          role: 'client', 
          createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
        })
      ]);

      res.status(200).json({
        success: true,
        data: {
          totalUsers,
          activeUsers,
          inactiveUsers,
          recentUsers
        }
      });
    } catch (error) {
      console.error('❌ Get user stats error:', error);
      next(error);
    }
  }

  /**
   * Get all deleted users (admin/supervisor with permissions)
   * GET /api/users/deleted
   */
  async getDeletedUsers(req, res, next) {
    try {
      const {
        page = 1,
        limit = 20,
        search,
        role,
        deletedFrom,
        deletedTo
      } = req.query;

      const pageNum = parseInt(page);
      const limitNum = parseInt(limit);
      const skip = (pageNum - 1) * limitNum;

      // Validate limit
      if (limitNum > 100) {
        return res.status(400).json({
          success: false,
          error: 'Limit cannot exceed 100'
        });
      }

      // Build query for deleted users
      const query = { isDeleted: true };

      if (search) {
        const searchRegex = new RegExp(search.toLowerCase().trim(), 'i');
        query.$or = [
          { name: searchRegex },
          { email: searchRegex }
        ];
      }

      if (role) {
        query.role = role;
      }

      // Date range filter for deletion
      if (deletedFrom || deletedTo) {
        query.deletedAt = {};
        if (deletedFrom) {
          query.deletedAt.$gte = new Date(deletedFrom);
        }
        if (deletedTo) {
          query.deletedAt.$lte = new Date(deletedTo);
        }
      }

      // Get deleted users with pagination
      const [users, total] = await Promise.all([
        User.find(query)
          .select('-password')
          .sort({ deletedAt: -1 })
          .skip(skip)
          .limit(limitNum)
          .lean(),
        User.countDocuments(query)
      ]);

      // Calculate statistics
      const stats = await User.aggregate([
        { $match: query },
        {
          $group: {
            _id: null,
            totalDeleted: { $sum: 1 },
            deletedByRole: {
              $push: {
                role: '$role',
                count: 1
              }
            },
            avgDeletedDuration: {
              $avg: {
                $subtract: [new Date(), '$deletedAt']
              }
            }
          }
        }
      ]);

      // Group by role statistics
      const roleStats = await User.aggregate([
        { $match: query },
        {
          $group: {
            _id: '$role',
            count: { $sum: 1 },
            oldestDeletion: { $min: '$deletedAt' },
            newestDeletion: { $max: '$deletedAt' }
          }
        },
        { $sort: { count: -1 } }
      ]);

      res.status(200).json({
        success: true,
        data: {
          users,
          pagination: {
            currentPage: pageNum,
            totalPages: Math.ceil(total / limitNum),
            totalUsers: total,
            hasNext: pageNum < Math.ceil(total / limitNum),
            hasPrev: pageNum > 1
          },
          statistics: {
            totalDeleted: total,
            roleStatistics: roleStats,
            overallStats: stats[0] || {
              totalDeleted: 0,
              avgDeletedDuration: 0
            }
          },
          filters: {
            search: search || null,
            role: role || null,
            deletedFrom: deletedFrom || null,
            deletedTo: deletedTo || null
          }
        }
      });
    } catch (error) {
      console.error('❌ Get deleted users error:', error);
      next(error);
    }
  }

  /**
   * Permanently delete a user (admin/supervisor with permissions)
   * DELETE /api/users/:userId/permanent
   */
  async permanentDeleteUser(req, res, next) {
    try {
      const { userId } = req.params;
      const { reason } = req.body;

      // Find the user (must be already soft-deleted)
      const user = await User.findOne({ 
        _id: userId, 
        isDeleted: true 
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'Deleted user not found or user is not marked as deleted'
        });
      }

      // Store user info for audit before deletion
      const userInfo = {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        deletedAt: user.deletedAt,
        deletedBy: user.deletedBy
      };

      // Check if user has related data that should be cleaned up
      const relatedDataChecks = [
        // Check for subscriptions
        Subscription && Subscription.countDocuments({ 
          $or: [{ clientId: userId }, { doctorId: userId }] 
        }),
        // Check for diet plans
        DietPlan && DietPlan.countDocuments({ doctorId: userId }),
        // Check for workout plans
        WorkoutPlan && WorkoutPlan.countDocuments({ 
          $or: [{ clientId: userId }, { doctorId: userId }] 
        })
      ];

      const relatedDataCounts = await Promise.all(relatedDataChecks);
      const hasRelatedData = relatedDataCounts.some(count => count > 0);

      if (hasRelatedData) {
        return res.status(400).json({
          success: false,
          error: 'Cannot permanently delete user. User has related data (subscriptions, diet plans, etc.)',
          relatedData: {
            subscriptions: relatedDataCounts[0] || 0,
            dietPlans: relatedDataCounts[1] || 0,
            workoutPlans: relatedDataCounts[2] || 0
          }
        });
      }

      // Permanently delete the user
      await User.findByIdAndDelete(userId);

      // Log the permanent deletion for audit
      console.log(`🗑️ User permanently deleted:`, {
        deletedBy: req.user.userId,
        deletedUser: userInfo,
        reason: reason || 'Permanent deletion by admin/supervisor',
        timestamp: new Date()
      });

      res.status(200).json({
        success: true,
        message: 'User permanently deleted successfully',
        data: {
          deletedUser: userInfo,
          deletedBy: {
            id: req.user.userId,
            name: req.user.name,
            email: req.user.email,
            role: req.user.role
          },
          deletedAt: new Date(),
          reason: reason || 'Permanent deletion by admin/supervisor'
        }
      });
    } catch (error) {
      console.error('❌ Permanent delete user error:', error);
      next(error);
    }
  }
}

module.exports = new UserController();
