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
   * Restore any deleted user (regardless of role)
   * POST /api/users/:userId/restore
   * Works for: client, doctor, supervisor, admin - any role
   */
  async restoreUser(req, res, next) {
    try {
      console.log('🔍 restoreUser called for user:', req.params.userId);
      
      const { userId } = req.params;
      const { reason } = req.body || {};
      const restoredBy = req.user.id;

      // Validate user ID
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid user ID'
        });
      }

      console.log('🔍 Step 1: Searching User table for ID:', userId);
      console.log('🔍 ID type:', typeof userId);
      console.log('🔍 ID validity:', mongoose.Types.ObjectId.isValid(userId));
      
      // Use direct MongoDB query since Mongoose has issues
      console.log('🔍 Using direct MongoDB query (Mongoose has connection issues)');
      const db = mongoose.connection.db;
      const userDoc = await db.collection('users').findOne({ 
        _id: new mongoose.Types.ObjectId(userId) 
      });
      
      if (!userDoc) {
        console.log('❌ User with ID', userId, 'not found in database');
        return res.status(404).json({
          success: false,
          error: 'User not found in database'
        });
      }

      console.log('🔍 ✅ User found in database!');
      console.log('🔍 User ID (from DB):', userDoc._id);
      console.log('🔍 User name:', userDoc.name);
      console.log('🔍 User email:', userDoc.email);
      console.log('🔍 User role:', userDoc.role);
      console.log('🔍 User isDeleted status:', userDoc.isDeleted);
      console.log('🔍 User isDeleted type:', typeof userDoc.isDeleted);
      console.log('🔍 User status:', userDoc.status);
      console.log('🔍 User deletedAt:', userDoc.deletedAt);
      console.log('🔍 User deletedBy:', userDoc.deletedBy);

      // Check if user has isDeleted=true
      if (userDoc.isDeleted !== true) {
        console.log('❌ User isDeleted is not true (value:', userDoc.isDeleted, ')');
        console.log('❌ User isDeleted type:', typeof userDoc.isDeleted);
        return res.status(400).json({
          success: false,
          error: 'User isDeleted is not true - cannot restore',
          debug: {
            isDeletedValue: userDoc.isDeleted,
            isDeletedType: typeof userDoc.isDeleted
          }
        });
      }

      console.log('✅ User found with isDeleted=true in database');
      console.log('✅ Proceeding with restore for user:', userDoc.name, 'with role:', userDoc.role);

      // RESTORE THE USER - Change isDeleted from true to false using direct MongoDB
      console.log('🔍 Step 2: Updating database - changing isDeleted from true to false...');
      
      const updateResult = await db.collection('users').updateOne(
        { _id: new mongoose.Types.ObjectId(userId) },
        {
          $set: {
            isDeleted: false,  // ← This is the key change!
            deletedAt: null,
            deletedBy: null,
            status: 'approved',
            updatedAt: new Date()
          }
        }
      );

      console.log('✅ User updated successfully in database!');
      console.log('🔍 Update result:', updateResult);
      console.log('🔍 Restored user role:', userDoc.role);
      console.log('🔍 User email:', userDoc.email);

      res.status(200).json({
        success: true,
        message: 'User restored successfully',
        data: {
          user: {
            _id: userDoc._id,
            name: userDoc.name,
            email: userDoc.email,
            role: userDoc.role,
            status: userDoc.status,
            isDeleted: false,  // After restoration
            restoredAt: new Date(),
            restoredBy: {
              _id: req.user._id,
              name: req.user.name,
              email: req.user.email,
              role: req.user.role
            }
          }
        }
      });

    } catch (error) {
      console.error('❌ Restore user error:', error);
      next(error);
    }
  }

  /**
   * Get all soft-deleted users (any role)
   * GET /api/users/soft-deleted
   * Returns: All users with isDeleted=true regardless of role
   */
  async getSoftDeletedUsers(req, res, next) {
    try {
      console.log('🔍 getSoftDeletedUsers called - SOFT DELETED ENDPOINT');
      console.log('🔍 Request URL:', req.originalUrl);
      console.log('🔍 Request method:', req.method);
      
      const {
        page = 1,
        limit = 20,
        role,
        sortBy = 'deletedAt',
        sortOrder = 'desc',
        search
      } = req.query;

      // Validate inputs
      const pageNum = parseInt(page) || 1;
      const limitNum = parseInt(limit) || 20;
      
      if (pageNum < 1 || limitNum < 1 || limitNum > 100) {
        return res.status(400).json({
          success: false,
          error: 'Invalid pagination parameters'
        });
      }

      // Build query for ALL soft-deleted users
      const query = { isDeleted: true };
      console.log('🔍 Building query for soft-deleted users:', JSON.stringify(query));

      // Add role filter if specified
      if (role && role !== 'all') {
        if (!['client', 'doctor', 'supervisor', 'admin'].includes(role)) {
          return res.status(400).json({
            success: false,
            error: 'Invalid role. Must be one of: client, doctor, supervisor, admin'
          });
        }
        query.role = role;
        console.log('🔍 Added role filter:', role);
      }

      // Add search functionality
      if (search) {
        const searchRegex = new RegExp(search.toLowerCase().trim(), 'i');
        query.$or = [
          { name: searchRegex },
          { email: searchRegex }
        ];
        console.log('🔍 Added search filter:', search);
      }

      // Build sort object
      const sort = {};
      const sortField = sortBy || 'deletedAt';
      sort[sortField] = sortOrder === 'desc' ? -1 : 1;
      console.log('🔍 Sort object:', JSON.stringify(sort));

      // Calculate skip for pagination
      const skip = (pageNum - 1) * limitNum;
      console.log('🔍 Pagination - page:', pageNum, 'limit:', limitNum, 'skip:', skip);

      // Get soft-deleted users with pagination
      console.log('🔍 Executing query:', JSON.stringify(query));
      
      // Build the match condition properly
      const matchCondition = { isDeleted: true };
      
      // Add role filter if specified
      if (role && role !== 'all') {
        matchCondition.role = role;
        console.log('🔍 Added role filter to aggregation:', role);
      }
      
      // Add search filter if specified
      if (search) {
        const searchRegex = new RegExp(search.toLowerCase().trim(), 'i');
        matchCondition.$or = [
          { name: searchRegex },
          { email: searchRegex }
        ];
        console.log('🔍 Added search filter to aggregation:', search);
      }
      
      console.log('🔍 Final aggregation match condition:', JSON.stringify(matchCondition));

      // Use aggregation to ensure proper filtering
      const aggregationPipeline = [
        { $match: matchCondition },
        { $sort: sort },
        { $skip: skip },
        { $limit: limitNum },
        {
          $lookup: {
            from: 'users',
            localField: 'deletedBy',
            foreignField: '_id',
            as: 'deletedBy',
            pipeline: [
              { $project: { name: 1, email: 1, role: 1 } }
            ]
          }
        },
        { $unwind: { path: '$deletedBy', preserveNullAndEmptyArrays: true } },
        {
          $project: {
            password: 0,
            emailVerificationToken: 0,
            emailOtp: 0,
            emailOtpExpires: 0
          }
        }
      ];

      const softDeletedUsers = await User.aggregate(aggregationPipeline);

      console.log('🔍 Found soft-deleted users count:', softDeletedUsers.length);
      console.log('🔍 Sample result check:');
      if (softDeletedUsers.length > 0) {
        console.log('🔍 First user isDeleted:', softDeletedUsers[0].isDeleted);
        console.log('🔍 First user deletedAt:', softDeletedUsers[0].deletedAt);
      }

      // Get total count for pagination using aggregation
      const countPipeline = [
        { $match: matchCondition },
        { $count: 'total' }
      ];
      const countResult = await User.aggregate(countPipeline);
      const totalSoftDeletedUsers = countResult[0]?.total || 0;
      console.log('🔍 Total soft-deleted users in DB:', totalSoftDeletedUsers);

      // Get count by role (for statistics, use base isDeleted filter)
      const deletedByRole = await User.aggregate([
        { $match: { isDeleted: true } },
        { $group: { _id: '$role', count: { $sum: 1 } } }
      ]);
      console.log('🔍 Soft-deleted users by role:', deletedByRole);

      // Verify all results are actually soft-deleted
      const allActuallyDeleted = softDeletedUsers.every(user => {
        return user.isDeleted === true && user.deletedAt !== null;
      });
      console.log('🔍 All users actually soft-deleted:', allActuallyDeleted);

      res.status(200).json({
        success: true,
        data: {
          users: softDeletedUsers,
          pagination: {
            currentPage: pageNum,
            totalPages: Math.ceil(totalSoftDeletedUsers / limitNum),
            totalUsers: totalSoftDeletedUsers,
            itemsPerPage: limitNum,
            hasNext: pageNum < Math.ceil(totalSoftDeletedUsers / limitNum),
            hasPrev: pageNum > 1
          },
          statistics: {
            totalSoftDeleted: totalSoftDeletedUsers,
            deletedByRole: deletedByRole.reduce((acc, item) => {
              acc[item._id] = item.count;
              return acc;
            }, {})
          },
          filters: {
            role: role || 'all',
            sortBy: sortField,
            sortOrder: sortOrder || 'desc',
            search: search || ''
          }
        }
      });
    } catch (error) {
      console.error('❌ Get soft-deleted users error:', error);
      next(error);
    }
  }

  /**
   * Debug endpoint to compare query methods for finding users
   * GET /debug/user/:id
   */
  async debugUserQuery(req, res, next) {
    try {
      const { id } = req.params;
      console.log('🔍 Debug: Comparing query methods for ID:', id);

      // Method 1: Simple findById (what restore endpoint uses)
      console.log('\n🔍 Method 1: User.findById()');
      const user1 = await User.findById(id);
      console.log('Result:', !!user1);
      if (user1) {
        console.log('User found:', user1.name, 'isDeleted:', user1.isDeleted);
      }

      // Method 2: Aggregation pipeline (what soft-deleted endpoint uses)
      console.log('\n🔍 Method 2: Aggregation pipeline (like soft-deleted endpoint)');
      const aggregationPipeline = [
        { $match: { _id: new mongoose.Types.ObjectId(id) } },
        { $match: { isDeleted: true } },
        {
          $lookup: {
            from: 'users',
            localField: 'deletedBy',
            foreignField: '_id',
            as: 'deletedBy',
            pipeline: [
              { $project: { name: 1, email: 1, role: 1 } }
            ]
          }
        },
        { $unwind: { path: '$deletedBy', preserveNullAndEmptyArrays: true } }
      ];
      
      const user2 = await User.aggregate(aggregationPipeline);
      console.log('Result:', user2.length);
      if (user2.length > 0) {
        console.log('User found:', user2[0].name, 'isDeleted:', user2[0].isDeleted);
      }

      // Method 3: Simple findOne with isDeleted filter
      console.log('\n🔍 Method 3: User.findOne() with isDeleted: true');
      const user3 = await User.findOne({ _id: id, isDeleted: true });
      console.log('Result:', !!user3);
      if (user3) {
        console.log('User found:', user3.name, 'isDeleted:', user3.isDeleted);
      }

      // Method 4: Direct MongoDB query
      console.log('\n🔍 Method 4: Direct MongoDB query');
      const db = mongoose.connection.db;
      const user4 = await db.collection('users').findOne({ 
        _id: new mongoose.Types.ObjectId(id) 
      });
      console.log('Result:', !!user4);
      if (user4) {
        console.log('User found:', user4.name, 'isDeleted:', user4.isDeleted);
      }

      // Method 5: Count all users to verify database connection
      console.log('\n🔍 Method 5: Count all users');
      const totalUsers = await User.countDocuments();
      console.log('Total users in User model:', totalUsers);
      
      const totalUsersDirect = await db.collection('users').countDocuments();
      console.log('Total users in direct DB:', totalUsersDirect);

      // Return comparison results
      res.json({
        success: true,
        debug: {
          id: id,
          methods: {
            findById: {
              found: !!user1,
              user: user1 ? {
                name: user1.name,
                email: user1.email,
                isDeleted: user1.isDeleted,
                role: user1.role
              } : null
            },
            aggregation: {
              found: user2.length > 0,
              user: user2.length > 0 ? {
                name: user2[0].name,
                email: user2[0].email,
                isDeleted: user2[0].isDeleted,
                role: user2[0].role
              } : null
            },
            findOne: {
              found: !!user3,
              user: user3 ? {
                name: user3.name,
                email: user3.email,
                isDeleted: user3.isDeleted,
                role: user3.role
              } : null
            },
            directMongo: {
              found: !!user4,
              user: user4 ? {
                name: user4.name,
                email: user4.email,
                isDeleted: user4.isDeleted,
                role: user4.role
              } : null
            }
          },
          counts: {
            userModel: totalUsers,
            directDB: totalUsersDirect
          }
        }
      });

    } catch (error) {
      console.error('❌ Debug query error:', error);
      next(error);
    }
  }

  /**
   * Permanently delete any user (regardless of role)
   * DELETE /api/users/:userId/permanent
   * Works for: client, doctor, supervisor, admin - ANY role
   */
  async permanentDeleteUser(req, res, next) {
    try {
      console.log('🔍 permanentDeleteUser called for user:', req.params.userId);
      
      const { userId } = req.params;
      const { reason } = req.body || {};
      const deletedBy = req.user.id;

      // Validate user ID
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid user ID'
        });
      }

      console.log('🔍 Step 1: Finding user for permanent deletion...');
      
      // Use direct MongoDB query since Mongoose has issues
      console.log('🔍 Using direct MongoDB query for permanent deletion');
      const db = mongoose.connection.db;
      const userDoc = await db.collection('users').findOne({ 
        _id: new mongoose.Types.ObjectId(userId) 
      });
      
      if (!userDoc) {
        console.log('❌ User with ID', userId, 'not found in database');
        return res.status(404).json({
          success: false,
          error: 'User not found in database'
        });
      }

      console.log('🔍 ✅ User found in database!');
      console.log('🔍 User name:', userDoc.name);
      console.log('🔍 User email:', userDoc.email);
      console.log('🔍 User role:', userDoc.role);
      console.log('🔍 User isDeleted status:', userDoc.isDeleted);

      // Store user info for audit trail before deletion
      const userInfo = {
        id: userDoc._id,
        name: userDoc.name,
        email: userDoc.email,
        role: userDoc.role,
        status: userDoc.status,
        isDeleted: userDoc.isDeleted,
        deletedAt: userDoc.deletedAt,
        deletedBy: userDoc.deletedBy
      };

      console.log('✅ Proceeding with permanent deletion for user:', userDoc.name, 'with role:', userDoc.role);

      // PERMANENTLY DELETE THE USER using direct MongoDB
      console.log('🔍 Step 2: Permanently deleting user from database...');
      
      const deleteResult = await db.collection('users').deleteOne({
        _id: new mongoose.Types.ObjectId(userId)
      });

      console.log('✅ User permanently deleted from database!');
      console.log('🔍 Delete result:', deleteResult);
      console.log('🔍 Permanently deleted user role:', userDoc.role);
      console.log('🔍 User email:', userDoc.email);

      // Create audit log for permanent user deletion
      try {
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
                email: req.user.email,
                role: req.user.role
              }
            }
          },
          result: 'success',
          ipAddress: req.ip,
          userAgent: req.get('User-Agent')
        });
        console.log('🔍 Audit log created for permanent user deletion');
      } catch (auditError) {
        console.error('❌ Failed to create audit log:', auditError);
        // Continue even if audit fails
      }

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
            _id: req.user._id,
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

};

module.exports = new UserController();
