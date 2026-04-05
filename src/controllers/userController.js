const User = require('../models/User');
const { body, param, query } = require('express-validator');

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
}

module.exports = new UserController();
