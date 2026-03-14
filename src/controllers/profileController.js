const User = require('../models/User');
const { withTransaction } = require('../utils/transactionHelper');

class ProfileController {
  async addWeightEntry(req, res) {
    try {
      const { weight } = req.body;
      const userId = req.user.userId;

      if (!weight || typeof weight !== 'number' || weight <= 0) {
        return res.status(400).json({
          success: false,
          error: 'Weight must be a positive number'
        });
      }

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      if (user.role !== 'client') {
        return res.status(403).json({
          success: false,
          error: 'Only clients can add weight entries'
        });
      }

      if (user.isBlocked) {
        return res.status(403).json({
          success: false,
          error: 'Account is blocked'
        });
      }

      if (!user.weightHistory) {
        user.weightHistory = [];
      }

      user.weightHistory.push({
        value: weight,
        date: new Date()
      });

      await user.save();

      res.status(200).json({
        success: true,
        message: 'Weight entry added successfully',
        data: {
          weight: user.weightHistory[user.weightHistory.length - 1]
        }
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }

  async getWeightHistory(req, res) {
    try {
      const userId = req.user.userId;

      const user = await User.findById(userId).select('weightHistory role');
      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      if (user.role !== 'client') {
        return res.status(403).json({
          success: false,
          error: 'Only clients can view weight history'
        });
      }

      const weightHistory = user.weightHistory || [];

      weightHistory.sort((a, b) => b.date - a.date);

      res.status(200).json({
        success: true,
        data: {
          weightHistory
        }
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }

  async getProfile(req, res) {
    try {
      const userId = req.user.userId;

      const user = await User.findById(userId)
        .select('-password -emailVerificationToken -passwordResetToken -passwordResetExpires -certificates');
      
      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      res.status(200).json({
        success: true,
        data: {
          user: user.toJSON()
        }
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }

  async updateProfile(req, res) {
    try {
      const userId = req.user.userId;
      
      // Field whitelist - prevent unauthorized field updates
      const allowedFields = ['name', 'phone', 'address', 'age', 'height', 'goal'];
      const updates = {};

      for (const field of allowedFields) {
        if (req.body[field] !== undefined) {
          updates[field] = req.body[field];
        }
      }

      // Explicitly remove any sensitive fields that might be in request
      delete req.body.role;
      delete req.body.isBlocked;
      delete req.body.status;
      delete req.body.emailVerified;
      delete req.body.isDeleted;
      delete req.body.blockedBy;
      delete req.body.deletedBy;

      if (Object.keys(updates).length === 0) {
        return res.status(400).json({
          success: false,
          error: 'No valid fields to update'
        });
      }

      // Use transaction for profile update
      const user = await withTransaction(async (session) => {
        const updatedUser = await User.findByIdAndUpdate(
          userId,
          updates,
          { session, new: true, runValidators: true }
        ).select('-password -emailVerificationToken -passwordResetToken -passwordResetExpires -certificates');

        if (!updatedUser) {
          throw new Error('User not found');
        }

        return updatedUser;
      });

      res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
        data: {
          user: user.toJSON()
        }
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }
}

module.exports = new ProfileController();
