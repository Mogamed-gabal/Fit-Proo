const User = require('../models/User');
const mongoose = require('mongoose');
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

      // Create audit log for client deletion
      const AuditLog = require('../models/AuditLog');
      await AuditLog.createLog({
        adminId: req.user.userId,
        actionType: 'delete_client',
        targetId: user._id,
        targetType: 'Client',
        details: {
          reason: 'Client deletion by admin/supervisor',
          changes: {
            oldValues: {
              id: user._id,
              name: user.name,
              email: user.email,
              role: user.role,
              isActive: user.isActive
            },
            newValues: null // Client is deleted
          },
          metadata: {
            userName: user.name,
            userEmail: user.email,
            deletedBy: {
              id: req.user.userId,
              name: req.user.name,
              email: req.user.email
            }
          }
        },
        result: 'success',
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });

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
   * Get all blocked users AND deleted supervisors (admin/supervisor with permissions)
   * GET /api/users/deleted
   * Returns: Users with isBlocked=true + supervisors with isDeleted=true
   */
  async getDeletedUsers(req, res, next) {
    try {
      const {
        page = 1,
        limit = 20,
        search,
        role,
        blockedFrom,
        blockedTo
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

      // Build query for blocked users AND deleted supervisors
      const query = {
        $or: [
          { isBlocked: true },
          { role: 'supervisor', $or: [{ isDeleted: true }, { isDeleted: "true" }] }
        ]
      };

      if (search) {
        const searchRegex = new RegExp(search.toLowerCase().trim(), 'i');
        query.$and = [
          query.$or,
          {
            $or: [
              { name: searchRegex },
              { email: searchRegex }
            ]
          }
        ];
        delete query.$or; // Remove the original $or since we moved it to $and
      }

      if (role) {
        query.$and = query.$and || [];
        query.$and.push({ role: role });
      }

      // Date range filter for blocking and deletion
      if (blockedFrom || blockedTo) {
        const dateQuery = {
          $or: [
            { blockedAt: {} },
            { deletedAt: {} }
          ]
        };
        
        if (blockedFrom) {
          dateQuery.$or[0].blockedAt.$gte = new Date(blockedFrom);
          dateQuery.$or[1].deletedAt.$gte = new Date(blockedFrom);
        }
        if (blockedTo) {
          dateQuery.$or[0].blockedAt.$lte = new Date(blockedTo);
          dateQuery.$or[1].deletedAt.$lte = new Date(blockedTo);
        }
        
        query.$and = query.$and || [];
        query.$and.push(dateQuery);
      }

      // Get blocked users and deleted supervisors with pagination using aggregation
      const aggregationPipeline = [
        { $match: query },
        {
          $addFields: {
            sortDate: {
              $ifNull: ['$blockedAt', '$deletedAt']
            }
          }
        },
        { $sort: { sortDate: -1 } },
        { $skip: skip },
        { $limit: limitNum },
        { $project: { password: 0 } }
      ];

      const countPipeline = [
        { $match: query },
        { $count: 'total' }
      ];

      const [users, countResult] = await Promise.all([
        User.aggregate(aggregationPipeline),
        User.aggregate(countPipeline)
      ]);

      const total = countResult[0]?.total || 0;

      // Calculate statistics
      const stats = await User.aggregate([
        { $match: query },
        {
          $group: {
            _id: null,
            totalBlocked: { $sum: 1 },
            blockedByRole: {
              $push: {
                role: '$role',
                count: 1
              }
            },
            avgBlockedDuration: {
              $avg: {
                $subtract: [
                  new Date(), 
                  { $ifNull: ['$blockedAt', '$deletedAt'] }
                ]
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
            oldestBlocking: { 
              $min: { $ifNull: ['$blockedAt', '$deletedAt'] }
            },
            newestBlocking: { 
              $max: { $ifNull: ['$blockedAt', '$deletedAt'] }
            }
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
            totalRecords: total,
            blockedUsers: users.filter(u => u.isBlocked).length,
            deletedSupervisors: users.filter(u => u.role === 'supervisor' && u.isDeleted).length,
            roleStatistics: roleStats,
            overallStats: stats[0] || {
              totalBlocked: 0,
              avgBlockedDuration: 0
            }
          },
          filters: {
            search: search || null,
            role: role || null,
            blockedFrom: blockedFrom || null,
            blockedTo: blockedTo || null
          }
        }
      });
    } catch (error) {
      console.error('❌ Get blocked users and deleted supervisors error:', error);
      next(error);
    }
  };

  /**
   * Restore deleted user (admin/supervisor with permissions)
   * POST /api/users/:userId/restore
   */
  async restoreUser(req, res, next) {
    try {
      const { userId } = req.params;
      const { reason } = req.body;

      // Validate ObjectId format
      if (!userId.match(/^[0-9a-fA-F]{24}$/)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid user ID format. User ID must be a 24-character hex string',
          providedId: userId,
          idLength: userId.length
        });
      }

      // Find the deleted user (handle both boolean and string isDeleted)
      console.log(`🔍 Restore: Looking for user with ID: ${userId}`);
      
      // Test individual queries first
      const userBoolean = await User.findOne({ _id: userId, isDeleted: true });
      const userString = await User.findOne({ _id: userId, isDeleted: "true" });
      
      console.log(`🔍 Restore: Boolean query result:`, userBoolean ? 'YES' : 'NO');
      console.log(`🔍 Restore: String query result:`, userString ? 'YES' : 'NO');
      
      const user = await User.findOne({ 
        _id: userId, 
        $or: [
          { isDeleted: true },
          { isDeleted: "true" }
        ]
      });

      console.log(`👤 Restore: Combined query result:`, user ? 'YES' : 'NO');
      
      // Also try the exact ObjectId format
      const mongoose = require('mongoose');
      const userWithObjectId = await User.findOne({ 
        _id: new mongoose.Types.ObjectId(userId), 
        $or: [
          { isDeleted: true },
          { isDeleted: "true" }
        ]
      });
      console.log(`👤 Restore: ObjectId query result:`, userWithObjectId ? 'YES' : 'NO');
      
      // Use ObjectId query result if regular query failed
      const finalUser = user || userWithObjectId;
      
      if (!finalUser) {
        // Check if user exists at all
        const anyUser = await User.findOne({ _id: userId });
        console.log(`🔍 Restore: Any user with this ID:`, anyUser ? 'YES' : 'NO');
        
        if (anyUser) {
          console.log(`📊 Restore: User details:`, {
            _id: anyUser._id,
            name: anyUser.name,
            email: anyUser.email,
            role: anyUser.role,
            isDeleted: anyUser.isDeleted,
            isDeletedType: typeof anyUser.isDeleted,
            deletedAt: anyUser.deletedAt
          });
        }
        
        // Get ALL deleted users (both boolean and string)
        const allDeletedUsers = await User.find({ 
          $or: [
            { isDeleted: true },
            { isDeleted: "true" }
          ]
        })
          .select('_id name email role isDeleted deletedAt deletedBy')
          .lean();
        console.log(`👥 Restore: All deleted users:`, JSON.stringify(allDeletedUsers, null, 2));
        
        // Also check specifically for supervisors
        const deletedSupervisors = await User.find({ 
          role: 'supervisor',
          $or: [
            { isDeleted: true },
            { isDeleted: "true" }
          ]
        })
          .select('_id name email role isDeleted deletedAt deletedBy')
          .lean();
        console.log(`👨‍💼 Restore: Deleted supervisors:`, JSON.stringify(deletedSupervisors, null, 2));
        
        return res.status(404).json({
          success: false,
          error: 'Deleted user not found or user is not marked as deleted',
          debug: {
            searchedId: userId,
            anyUserExists: !!anyUser,
            userRole: anyUser?.role,
            isDeletedValue: anyUser?.isDeleted,
            isDeletedType: typeof anyUser?.isDeleted,
            deletedUsersCount: allDeletedUsers.length,
            deletedUserIds: allDeletedUsers.map(u => u._id),
            allDeletedUsers: allDeletedUsers,
            deletedSupervisorsCount: deletedSupervisors.length,
            deletedSupervisorIds: deletedSupervisors.map(u => u._id),
            deletedSupervisors: deletedSupervisors
          }
        });
      }

      // Store old values for audit
      const oldValues = {
        isDeleted: finalUser.isDeleted,
        deletedAt: finalUser.deletedAt,
        deletedBy: finalUser.deletedBy,
        restoredAt: finalUser.restoredAt,
        restoredBy: finalUser.restoredBy
      };

      // Restore the user
      finalUser.isDeleted = false;
      finalUser.deletedAt = null;
      finalUser.deletedBy = null;
      finalUser.restoredAt = new Date();
      finalUser.restoredBy = req.user.userId;

      await finalUser.save();

      // Create audit log for user restoration
      const AuditLog = require('../models/AuditLog');
      await AuditLog.createLog({
        adminId: req.user.userId,
        actionType: 'restore_user',
        targetId: finalUser._id,
        targetType: finalUser.role === 'supervisor' ? 'Supervisor' : 'User',
        details: {
          reason: reason || 'User restoration by admin/supervisor',
          changes: {
            oldValues: oldValues,
            newValues: {
              isDeleted: finalUser.isDeleted,
              deletedAt: finalUser.deletedAt,
              deletedBy: finalUser.deletedBy,
              restoredAt: finalUser.restoredAt,
              restoredBy: finalUser.restoredBy
            }
          },
          metadata: {
            userName: finalUser.name,
            userEmail: finalUser.email,
            userRole: finalUser.role,
            restoredBy: {
              id: req.user.userId,
              name: req.user.name,
              email: req.user.email
            }
          }
        },
        result: 'success',
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });

      console.log(`🔄 User restored:`, {
        restoredBy: req.user.userId,
        restoredUser: {
          id: finalUser._id,
          name: finalUser.name,
          email: finalUser.email,
          role: finalUser.role
        },
        reason: reason || 'User restoration by admin/supervisor',
        timestamp: new Date()
      });

      res.status(200).json({
        success: true,
        message: 'User restored successfully',
        data: {
          user: {
            _id: finalUser._id,
            name: finalUser.name,
            email: finalUser.email,
            role: finalUser.role,
            status: finalUser.status,
            isDeleted: false,
            restoredAt: finalUser.restoredAt,
            restoredBy: {
              id: req.user.userId,
              name: req.user.name,
              email: req.user.email,
              role: req.user.role
            }
          },
          reason: reason || 'User restoration by admin/supervisor'
        }
      });
    } catch (error) {
      console.error('❌ Restore user error:', error);
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

      // Validate ObjectId format
      if (!userId.match(/^[0-9a-fA-F]{24}$/)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid user ID format. User ID must be a 24-character hex string',
          providedId: userId,
          idLength: userId.length
        });
      }

      // Find the user (must be already soft-deleted) - works for both users and supervisors
      console.log(`🔍 Permanent Delete: Looking for user with ID: ${userId}`);
      
      const user = await User.findOne({ 
        _id: userId, 
        $or: [
          { isDeleted: true },
          { isDeleted: "true" }
        ]
      });

      console.log(`👤 Permanent Delete: Found deleted user:`, user ? 'YES' : 'NO');

      if (!user) {
        // Check if user exists at all
        const anyUser = await User.findOne({ _id: userId });
        console.log(`🔍 Permanent Delete: Any user with this ID:`, anyUser ? 'YES' : 'NO');
        
        if (anyUser) {
          console.log(`📊 Permanent Delete: User details:`, {
            _id: anyUser._id,
            name: anyUser.name,
            email: anyUser.email,
            role: anyUser.role,
            isDeleted: anyUser.isDeleted,
            isDeletedType: typeof anyUser.isDeleted,
            deletedAt: anyUser.deletedAt
          });
        }

        return res.status(404).json({
          success: false,
          error: 'Deleted user/supervisor not found or not marked as deleted',
          debug: {
            searchedId: userId,
            anyUserExists: !!anyUser,
            userRole: anyUser?.role,
            isDeletedValue: anyUser?.isDeleted,
            isDeletedType: typeof anyUser?.isDeleted
          }
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

      // Create audit log for permanent user deletion
      const AuditLog = require('../models/AuditLog');
      await AuditLog.createLog({
        adminId: req.user.userId,
        actionType: 'permanent_delete_user',
        targetId: userInfo.id,
        targetType: userInfo.role === 'supervisor' ? 'Supervisor' : 'User',
        details: {
          reason: reason || 'Permanent deletion by admin/supervisor',
          changes: {
            oldValues: userInfo,
            newValues: null // User is permanently deleted
          },
          metadata: {
            userName: userInfo.name,
            userEmail: userInfo.email,
            userRole: userInfo.role,
            deletedBy: {
              id: req.user.userId,
              name: req.user.name,
              email: req.user.email
            },
            relatedData: {
              subscriptions: relatedDataCounts[0] || 0,
              dietPlans: relatedDataCounts[1] || 0,
              workoutPlans: relatedDataCounts[2] || 0
            }
          }
        },
        result: 'success',
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });

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
