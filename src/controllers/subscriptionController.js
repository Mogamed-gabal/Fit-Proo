const User = require('../models/User');
const Subscription = require('../models/Subscription');
const { createSubscriptionWithUpdates } = require('../utils/transactionHelper');

class SubscriptionController {
  async createSubscription(req, res) {
    try {
      const { doctorId, duration } = req.body;
      const clientId = req.user.userId;

      if (![1, 3, 6].includes(duration)) {
        return res.status(400).json({
          success: false,
          error: 'Duration must be 1, 3, or 6 months'
        });
      }

      const client = await User.findById(clientId);
      if (!client) {
        return res.status(404).json({
          success: false,
          error: 'Client not found'
        });
      }

      if (client.role !== 'client') {
        return res.status(403).json({
          success: false,
          error: 'Only clients can create subscriptions'
        });
      }

      if (client.isBlocked) {
        return res.status(403).json({
          success: false,
          error: 'Client account is blocked'
        });
      }

      if (!client.emailVerified) {
        return res.status(403).json({
          success: false,
          error: 'Client email must be verified'
        });
      }

      const doctor = await User.findById(doctorId);
      if (!doctor) {
        return res.status(404).json({
          success: false,
          error: 'Doctor not found'
        });
      }

      if (doctor.role !== 'doctor') {
        return res.status(400).json({
          success: false,
          error: 'User is not a doctor'
        });
      }

      if (doctor.status !== 'approved') {
        return res.status(403).json({
          success: false,
          error: 'Doctor is not approved'
        });
      }

      if (doctor.isBlocked) {
        return res.status(403).json({
          success: false,
          error: 'Doctor account is blocked'
        });
      }

      if (!doctor.packages || !Array.isArray(doctor.packages) || doctor.packages.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Doctor has not configured pricing packages'
        });
      }

      const selectedPackage = doctor.packages.find(pkg => pkg.duration === duration);
      if (!selectedPackage) {
        return res.status(400).json({
          success: false,
          error: `Doctor does not offer ${duration}-month package`
        });
      }

      if (!selectedPackage.price || selectedPackage.price <= 0) {
        return res.status(400).json({
          success: false,
          error: `Invalid price for ${duration}-month package`
        });
      }

      const existingSubscription = await Subscription.findOne({
        clientId,
        doctorId,
        isActive: true,
        endDate: { $gt: new Date() }
      });

      if (existingSubscription) {
        return res.status(400).json({
          success: false,
          error: 'Active subscription already exists for this doctor'
        });
      }

      const monthlyPrice = Number(selectedPackage.price);
      const totalPrice = monthlyPrice * duration;

      const subscriptionData = {
        clientId,
        doctorId,
        duration,
        monthlyPrice,
        totalPrice,
        paymentStatus: 'pending',
        startDate: new Date()
      };

      const subscription = await createSubscriptionWithUpdates(subscriptionData);

      res.status(201).json({
        success: true,
        message: 'Subscription created successfully. Please complete payment to activate.',
        data: {
          subscription: await Subscription.findById(subscription._id)
            .populate('clientId', 'name email')
            .populate('doctorId', 'name email')
        }
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }

  async confirmPayment(req, res) {
    try {
      const { subscriptionId } = req.params;
      const userId = req.user.userId;

      const subscription = await Subscription.findById(subscriptionId)
        .populate('clientId', 'name email')
        .populate('doctorId', 'name email');

      if (!subscription) {
        return res.status(404).json({
          success: false,
          error: 'Subscription not found'
        });
      }

      if (subscription.clientId._id.toString() !== userId) {
        return res.status(403).json({
          success: false,
          error: 'Not authorized to confirm payment for this subscription'
        });
      }

      if (subscription.paymentStatus === 'paid') {
        return res.status(400).json({
          success: false,
          error: 'Subscription already paid'
        });
      }

      if (subscription.paymentStatus === 'failed') {
        return res.status(400).json({
          success: false,
          error: 'Subscription payment failed. Please create a new subscription.'
        });
      }

      if (new Date() > subscription.endDate) {
        return res.status(400).json({
          success: false,
          error: 'Subscription has expired'
        });
      }

      await subscription.activate();

      res.status(200).json({
        success: true,
        message: 'Payment confirmed. Subscription is now active.',
        data: {
          subscription
        }
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }

  async failPayment(req, res) {
    try {
      const { subscriptionId } = req.params;
      const userId = req.user.userId;

      const subscription = await Subscription.findById(subscriptionId);

      if (!subscription) {
        return res.status(404).json({
          success: false,
          error: 'Subscription not found'
        });
      }

      if (subscription.clientId.toString() !== userId) {
        return res.status(403).json({
          success: false,
          error: 'Not authorized to fail payment for this subscription'
        });
      }

      if (subscription.paymentStatus !== 'pending') {
        return res.status(400).json({
          success: false,
          error: 'Cannot fail payment for this subscription'
        });
      }

      subscription.paymentStatus = 'failed';
      await subscription.save();

      res.status(200).json({
        success: true,
        message: 'Payment failed for subscription',
        data: {
          subscription
        }
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }

  async getClientSubscriptions(req, res) {
    try {
      const clientId = req.user.userId;
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

      // Build query
      const query = { clientId };
      
      // Add status filter if provided
      if (req.query.status) {
        query.status = req.query.status;
      }
      
      // Add active filter if provided
      if (req.query.isActive !== undefined) {
        query.isActive = req.query.isActive === 'true';
      }

      const subscriptions = await Subscription.find(query)
        .populate('doctorId', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const total = await Subscription.countDocuments(query);

      res.status(200).json({
        success: true,
        data: {
          subscriptions,
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
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }

  async getDoctorSubscriptions(req, res) {
    try {
      const doctorId = req.user.userId;
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

      // Build query
      const query = { doctorId };
      
      // Add status filter if provided
      if (req.query.status) {
        query.status = req.query.status;
      }
      
      // Add active filter if provided
      if (req.query.isActive !== undefined) {
        query.isActive = req.query.isActive === 'true';
      }

      const subscriptions = await Subscription.find(query)
        .populate('clientId', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const total = await Subscription.countDocuments(query);

      res.status(200).json({
        success: true,
        data: {
          subscriptions,
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
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }

  async cancelSubscription(req, res) {
    try {
      const { subscriptionId } = req.params;
      const userId = req.user.userId;

      const subscription = await Subscription.findById(subscriptionId);

      if (!subscription) {
        return res.status(404).json({
          success: false,
          error: 'Subscription not found'
        });
      }

      if (subscription.clientId.toString() !== userId && subscription.doctorId.toString() !== userId) {
        return res.status(403).json({
          success: false,
          error: 'Not authorized to cancel this subscription'
        });
      }

      if (!subscription.isActive) {
        return res.status(400).json({
          success: false,
          error: 'Subscription is not active'
        });
      }

      await subscription.deactivate();

      res.status(200).json({
        success: true,
        message: 'Subscription cancelled successfully',
        data: {
          subscription
        }
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }

  async getAllSubscriptions(req, res) {
    try {
      // Only admin can access this endpoint
      if (req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          error: 'Access denied. Admin privileges required.'
        });
      }

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

      // Build query
      const query = {};
      
      // Add filters if provided
      if (req.query.paymentStatus) {
        query.paymentStatus = req.query.paymentStatus;
      }
      
      if (req.query.isActive !== undefined) {
        query.isActive = req.query.isActive === 'true';
      }

      if (req.query.duration) {
        query.duration = parseInt(req.query.duration);
      }

      if (req.query.clientId) {
        query.clientId = req.query.clientId;
      }

      if (req.query.doctorId) {
        query.doctorId = req.query.doctorId;
      }

      // Date range filters
      if (req.query.dateFrom || req.query.dateTo) {
        query.createdAt = {};
        if (req.query.dateFrom) {
          query.createdAt.$gte = new Date(req.query.dateFrom);
        }
        if (req.query.dateTo) {
          query.createdAt.$lte = new Date(req.query.dateTo);
        }
      }

      // End date filter for expired/expiring subscriptions
      if (req.query.endDateFrom || req.query.endDateTo) {
        query.endDate = {};
        if (req.query.endDateFrom) {
          query.endDate.$gte = new Date(req.query.endDateFrom);
        }
        if (req.query.endDateTo) {
          query.endDate.$lte = new Date(req.query.endDateTo);
        }
      }

      const subscriptions = await Subscription.find(query)
        .populate('clientId', 'name email role isBlocked')
        .populate('doctorId', 'name email role status isBlocked')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const total = await Subscription.countDocuments(query);

      // Calculate statistics
      const stats = await Subscription.aggregate([
        { $match: query },
        {
          $group: {
            _id: null,
            totalSubscriptions: { $sum: 1 },
            activeSubscriptions: { $sum: { $cond: ['$isActive', 1, 0] } },
            paidSubscriptions: { $sum: { $cond: [{ $eq: ['$paymentStatus', 'paid'] }, 1, 0] } },
            pendingSubscriptions: { $sum: { $cond: [{ $eq: ['$paymentStatus', 'pending'] }, 1, 0] } },
            failedSubscriptions: { $sum: { $cond: [{ $eq: ['$paymentStatus', 'failed'] }, 1, 0] } },
            totalRevenue: { $sum: { $cond: [{ $eq: ['$paymentStatus', 'paid'] }, '$totalPrice', 0] } },
            avgDuration: { $avg: '$duration' }
          }
        }
      ]);

      res.status(200).json({
        success: true,
        data: {
          subscriptions,
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit),
            hasNext: page < Math.ceil(total / limit),
            hasPrev: page > 1
          },
          statistics: stats[0] || {
            totalSubscriptions: 0,
            activeSubscriptions: 0,
            paidSubscriptions: 0,
            pendingSubscriptions: 0,
            failedSubscriptions: 0,
            totalRevenue: 0,
            avgDuration: 0
          },
          filters: {
            paymentStatus: req.query.paymentStatus || null,
            isActive: req.query.isActive !== undefined ? req.query.isActive === 'true' : null,
            duration: req.query.duration ? parseInt(req.query.duration) : null,
            clientId: req.query.clientId || null,
            doctorId: req.query.doctorId || null,
            dateFrom: req.query.dateFrom || null,
            dateTo: req.query.dateTo || null,
            endDateFrom: req.query.endDateFrom || null,
            endDateTo: req.query.endDateTo || null
          }
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  }

module.exports = new SubscriptionController();
