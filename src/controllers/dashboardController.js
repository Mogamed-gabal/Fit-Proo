const User = require('../models/User');
const Subscription = require('../models/Subscription');
const DietPlan = require('../models/DietPlan');
const WorkoutPlan = require('../models/WorkoutPlan');
const DietProgress = require('../models/DietProgress');
const ClientProgress = require('../models/ClientProgress');
const Chat = require('../models/Chat');

class DashboardController {
  /**
   * Get complete dashboard analytics
   * GET /api/dashboard/analytics
   */
  async getDashboardAnalytics(req, res, next) {
    try {
      const { period = '30d', startDate, endDate } = req.query;

      // Calculate date range
      const now = new Date();
      let dateFrom;

      if (startDate && endDate) {
        dateFrom = new Date(startDate);
        const dateTo = new Date(endDate);
      } else {
        dateFrom = new Date();
        const periodDays = {
          '7d': 7,
          '30d': 30,
          '90d': 90,
          '1y': 365
        }[period] || 30;
        dateFrom.setDate(now.getDate() - periodDays);
      }

      // Get all data in parallel
      const [
        usersDistribution,
        subscriptionsGrowth,
        featureUsage,
        activityTrends,
        totalUsers,
        topDoctors
      ] = await Promise.all([
        this._getUsersDistributionData(),
        this._getSubscriptionsGrowthData(dateFrom),
        this._getFeatureUsageData(dateFrom),
        this._getActivityTrendsData(dateFrom),
        this._getTotalUsersData(),
        this._getTopDoctorsData(dateFrom)
      ]);

      res.status(200).json({
        success: true,
        data: {
          usersDistribution,
          subscriptionsGrowth,
          featureUsage,
          activityTrends,
          totalUsers,
          topDoctors,
          period,
          dateRange: {
            from: dateFrom,
            to: now
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get users distribution
   * GET /api/dashboard/users-distribution
   */
  async getUsersDistribution(req, res, next) {
    try {
      const data = await this._getUsersDistributionData();
      
      res.status(200).json({
        success: true,
        data
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get subscriptions growth
   * GET /api/dashboard/subscriptions-growth
   */
  async getSubscriptionsGrowth(req, res, next) {
    try {
      const { period = '30d' } = req.query;
      const dateFrom = this._getDateFromPeriod(period);
      
      const data = await this._getSubscriptionsGrowthData(dateFrom);
      
      res.status(200).json({
        success: true,
        data
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get diet vs workout usage
   * GET /api/dashboard/feature-usage
   */
  async getFeatureUsage(req, res, next) {
    try {
      const { period = '30d' } = req.query;
      const dateFrom = this._getDateFromPeriod(period);
      
      const data = await this._getFeatureUsageData(dateFrom);
      
      res.status(200).json({
        success: true,
        data
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get activity trends
   * GET /api/dashboard/activity-trends
   */
  async getActivityTrends(req, res, next) {
    try {
      const { period = '30d' } = req.query;
      const dateFrom = this._getDateFromPeriod(period);
      
      const data = await this._getActivityTrendsData(dateFrom);
      
      res.status(200).json({
        success: true,
        data
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get total users
   * GET /api/dashboard/total-users
   */
  async getTotalUsers(req, res, next) {
    try {
      const data = await this._getTotalUsersData();
      
      res.status(200).json({
        success: true,
        data
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get top doctors
   * GET /api/dashboard/top-doctors
   */
  async getTopDoctors(req, res, next) {
    try {
      const { period = '30d', limit = 10 } = req.query;
      const dateFrom = this._getDateFromPeriod(period);
      
      const data = await this._getTopDoctorsData(dateFrom, parseInt(limit));
      
      res.status(200).json({
        success: true,
        data
      });
    } catch (error) {
      next(error);
    }
  }

  // Helper methods for data aggregation

  async _getUsersDistributionData() {
    const distribution = await User.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 },
          active: {
            $sum: {
              $cond: [{ $eq: ['$status', 'approved'] }, 1, 0]
            }
          },
          inactive: {
            $sum: {
              $cond: [{ $ne: ['$status', 'approved'] }, 1, 0]
            }
          }
        }
      },
      {
        $project: {
          role: '$_id',
          total: '$count',
          active: '$active',
          inactive: '$inactive',
          percentage: {
            $multiply: [
              { $divide: ['$count', { $sum: '$count' }] },
              100
            ]
          }
        }
      }
    ]);

    // Calculate total users
    const totalUsers = await User.countDocuments();

    return {
      total: totalUsers,
      distribution,
      chartData: distribution.map(item => ({
        role: item.role,
        value: item.total,
        active: item.active,
        inactive: item.inactive,
        percentage: Math.round(item.percentage)
      }))
    };
  }

  async _getSubscriptionsGrowthData(dateFrom) {
    const subscriptions = await Subscription.aggregate([
      {
        $match: {
          createdAt: { $gte: dateFrom }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          count: { $sum: 1 },
          revenue: { $sum: '$amount' }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
      }
    ]);

    // Format for chart
    const chartData = subscriptions.map(item => ({
      date: `${item._id.year}-${String(item._id.month).padStart(2, '0')}-${String(item._id.day).padStart(2, '0')}`,
      subscriptions: item.count,
      revenue: item.revenue
    }));

    const totalSubscriptions = await Subscription.countDocuments({
      createdAt: { $gte: dateFrom }
    });

    return {
      total: totalSubscriptions,
      growth: chartData,
      chartData: chartData
    };
  }

  async _getFeatureUsageData(dateFrom) {
    const [dietPlans, workoutPlans] = await Promise.all([
      DietPlan.countDocuments({ createdAt: { $gte: dateFrom } }),
      WorkoutPlan.countDocuments({ createdAt: { $gte: dateFrom } })
    ]);

    const total = dietPlans + workoutPlans;

    return {
      dietPlans: dietPlans,
      workoutPlans: workoutPlans,
      total,
      chartData: [
        { feature: 'Diet Plans', usage: dietPlans, percentage: total > 0 ? Math.round((dietPlans / total) * 100) : 0 },
        { feature: 'Workout Plans', usage: workoutPlans, percentage: total > 0 ? Math.round((workoutPlans / total) * 100) : 0 }
      ]
    };
  }

  async _getActivityTrendsData(dateFrom) {
    const days = Math.ceil((new Date() - dateFrom) / (1000 * 60 * 60 * 24));
    const trends = [];

    for (let i = 0; i < Math.min(days, 30); i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const startOfDay = new Date(date.setHours(0, 0, 0, 0));
      const endOfDay = new Date(date.setHours(23, 59, 59, 999));

      const [logins, messages, planUpdates] = await Promise.all([
        User.countDocuments({ lastLogin: { $gte: startOfDay, $lte: endOfDay } }),
        Chat.countDocuments({ createdAt: { $gte: startOfDay, $lte: endOfDay } }),
        DietPlan.countDocuments({ updatedAt: { $gte: startOfDay, $lte: endOfDay } }) +
        WorkoutPlan.countDocuments({ updatedAt: { $gte: startOfDay, $lte: endOfDay } })
      ]);

      trends.push({
        date: startOfDay.toISOString().split('T')[0],
        logins,
        messages,
        planUpdates,
        totalActivity: logins + messages + planUpdates
      });
    }

    return {
      trends: trends.reverse(),
      chartData: trends.reverse()
    };
  }

  async _getTotalUsersData() {
    const [total, active, inactive] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ status: 'approved' }),
      User.countDocuments({ status: { $ne: 'approved' } })
    ]);

    const [clients, doctors, supervisors, admins] = await Promise.all([
      User.countDocuments({ role: 'client' }),
      User.countDocuments({ role: 'doctor' }),
      User.countDocuments({ role: 'supervisor' }),
      User.countDocuments({ role: 'admin' })
    ]);

    return {
      total,
      active,
      inactive,
      byRole: {
        clients,
        doctors,
        supervisors,
        admins
      },
      chartData: [
        { category: 'Total Users', value: total },
        { category: 'Active Users', value: active },
        { category: 'Inactive Users', value: inactive }
      ]
    };
  }

  async _getTopDoctorsData(dateFrom, limit = 10) {
    const topDoctors = await User.aggregate([
      {
        $match: {
          role: 'doctor',
          status: 'approved'
        }
      },
      {
        $lookup: {
          from: 'dietplans',
          localField: '_id',
          foreignField: 'doctorId',
          as: 'dietPlans'
        }
      },
      {
        $lookup: {
          from: 'workoutplans',
          localField: '_id',
          foreignField: 'doctorId',
          as: 'workoutPlans'
        }
      },
      {
        $project: {
          name: 1,
          email: 1,
          totalPlans: {
            $add: [
              { $size: '$dietPlans' },
              { $size: '$workoutPlans' }
            ]
          },
          dietPlans: { $size: '$dietPlans' },
          workoutPlans: { $size: '$workoutPlans' },
          rating: 1
        }
      },
      {
        $sort: { totalPlans: -1 }
      },
      {
        $limit: limit
      }
    ]);

    return {
      doctors: topDoctors,
      chartData: topDoctors.map((doctor, index) => ({
        rank: index + 1,
        name: doctor.name,
        email: doctor.email,
        totalPlans: doctor.totalPlans,
        dietPlans: doctor.dietPlans,
        workoutPlans: doctor.workoutPlans,
        rating: doctor.rating || 0
      }))
    };
  }

  _getDateFromPeriod(period) {
    const now = new Date();
    const dateFrom = new Date();
    const periodDays = {
      '7d': 7,
      '30d': 30,
      '90d': 90,
      '1y': 365
    }[period] || 30;
    dateFrom.setDate(now.getDate() - periodDays);
    return dateFrom;
  }
}

module.exports = new DashboardController();
