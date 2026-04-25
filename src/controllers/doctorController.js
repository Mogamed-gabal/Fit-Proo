const User = require('../models/User');
const { body, param, query } = require('express-validator');

class DoctorController {
  /**
   * Get all doctors with filters and search
   * GET /api/doctors
   */
  async getDoctors(req, res, next) {
    try {
      const {
        page = 1,
        limit = 20,
        status,
        specialization,
        search
      } = req.query;

      const pageNum = parseInt(page);
      const limitNum = parseInt(limit);
      const skip = (pageNum - 1) * limitNum;

      // Build query
      const query = { role: 'doctor', isDeleted: { $ne: true } };

      // Status filtering
      if (status) {
        switch (status.toLowerCase()) {
          case 'approved':
            query.status = 'approved';
            break;
          case 'pending':
            query.status = 'pending';
            break;
          case 'rejected':
            query.status = 'rejected';
            break;
          case 'blocked':
            query.isBlocked = true;
            break;
          case 'deleted':
            query.isDeleted = true;
            break;
        }
      }

      // Specialization filtering
      if (specialization) {
        query.specialization = specialization.toLowerCase().trim();
      }

      // Search by doctor name - enhanced with text search
      if (search) {
        const normalizedSearch = search.trim();
        
        // Try text search first (if index exists)
        try {
          query.$text = { $search: normalizedSearch };
        } catch (textSearchError) {
          // Fallback to regex if text search fails
          const searchRegex = new RegExp(normalizedSearch, 'i');
          query.$or = [
            { name: searchRegex },
            { email: searchRegex },
            { short_bio: searchRegex }
          ];
        }
      }

      // Get doctors with pagination
      const [doctors, total] = await Promise.all([
        User.find(query)
          .select('-password -id_card_front -id_card_back -__v')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limitNum)
          .lean(),
        User.countDocuments(query)
      ]);

      res.status(200).json({
        success: true,
        data: {
          doctors,
          pagination: {
            currentPage: pageNum,
            totalPages: Math.ceil(total / limitNum),
            totalDoctors: total,
            hasNext: pageNum * limitNum < total,
            hasPrev: pageNum > 1
          }
        }
      });
    } catch (error) {
      console.error('❌ Get doctors error:', error);
      next(error);
    }
  }

  /**
   * Get doctor by ID
   * GET /api/doctors/:doctorId
   */
  async getDoctorById(req, res, next) {
    try {
      const { doctorId } = req.params;

      const doctor = await User.findOne({ 
        _id: doctorId, 
        role: 'doctor', 
        isDeleted: { $ne: true } 
      })
        .select('-password -id_card_front -id_card_back -__v')
        .lean();

      if (!doctor) {
        return res.status(404).json({
          success: false,
          error: 'Doctor not found'
        });
      }

      res.status(200).json({
        success: true,
        data: doctor
      });
    } catch (error) {
      console.error('❌ Get doctor by ID error:', error);
      next(error);
    }
  }

  /**
   * Get doctors by specialization
   * GET /api/doctors/specialization/:specialization
   */
  async getDoctorsBySpecialization(req, res, next) {
    try {
      const { specialization } = req.params;
      const { page = 1, limit = 20 } = req.query;

      const pageNum = parseInt(page);
      const limitNum = parseInt(limit);
      const skip = (pageNum - 1) * limitNum;

      const query = { 
        role: 'doctor', 
        specialization: specialization.toLowerCase().trim(),
        isDeleted: { $ne: true }
      };

      const [doctors, total] = await Promise.all([
        User.find(query)
          .select('-password -id_card_front -id_card_back -__v')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limitNum)
          .lean(),
        User.countDocuments(query)
      ]);

      res.status(200).json({
        success: true,
        data: {
          doctors,
          pagination: {
            currentPage: pageNum,
            totalPages: Math.ceil(total / limitNum),
            totalDoctors: total,
            hasNext: pageNum * limitNum < total,
            hasPrev: pageNum > 1
          }
        }
      });
    } catch (error) {
      console.error('❌ Get doctors by specialization error:', error);
      next(error);
    }
  }

  /**
   * Approve doctor
   * PATCH /api/doctors/:doctorId/approve
   */
  async approveDoctor(req, res, next) {
    try {
      const { doctorId } = req.params;
      const { reason } = req.body;

      const doctor = await User.findOneAndUpdate(
        { 
          _id: doctorId, 
          role: 'doctor', 
          isDeleted: { $ne: true } 
        },
        { 
          status: 'approved',
          approvedAt: new Date(),
          approvedBy: req.user.userId,
          approvalReason: reason || 'Doctor approved by admin'
        },
        { new: true }
      )
      .select('-password -id_card_front -id_card_back -__v');

      if (!doctor) {
        return res.status(404).json({
          success: false,
          error: 'Doctor not found'
        });
      }

      res.status(200).json({
        success: true,
        message: 'Doctor approved successfully',
        data: doctor
      });
    } catch (error) {
      console.error('❌ Approve doctor error:', error);
      next(error);
    }
  }

  /**
   * Reject doctor
   * PATCH /api/doctors/:doctorId/reject
   */
  async rejectDoctor(req, res, next) {
    try {
      const { doctorId } = req.params;
      const { reason } = req.body;

      const doctor = await User.findOneAndUpdate(
        { 
          _id: doctorId, 
          role: 'doctor', 
          isDeleted: { $ne: true } 
        },
        { 
          status: 'rejected',
          rejectedAt: new Date(),
          rejectedBy: req.user.userId,
          rejectionReason: reason || 'Doctor rejected by admin'
        },
        { new: true }
      )
      .select('-password -id_card_front -id_card_back -__v');

      if (!doctor) {
        return res.status(404).json({
          success: false,
          error: 'Doctor not found'
        });
      }

      res.status(200).json({
        success: true,
        message: 'Doctor rejected successfully',
        data: doctor
      });
    } catch (error) {
      console.error('❌ Reject doctor error:', error);
      next(error);
    }
  }

  /**
   * Restore doctor (after soft delete)
   * PATCH /api/doctors/:doctorId/restore
   */
  async restoreDoctor(req, res, next) {
    try {
      const { doctorId } = req.params;

      const doctor = await User.findOneAndUpdate(
        { 
          _id: doctorId, 
          role: 'doctor', 
          isDeleted: true 
        },
        { 
          isDeleted: false,
          deletedAt: null,
          deletedBy: null,
          restoredAt: new Date(),
          restoredBy: req.user.userId
        },
        { new: true }
      )
      .select('-password -id_card_front -id_card_back -__v');

      if (!doctor) {
        return res.status(404).json({
          success: false,
          error: 'Doctor not found or not deleted'
        });
      }

      res.status(200).json({
        success: true,
        message: 'Doctor restored successfully',
        data: doctor
      });
    } catch (error) {
      console.error('❌ Restore doctor error:', error);
      next(error);
    }
  }

  /**
   * Get doctor statistics
   * GET /api/doctors/stats
   */
  async getDoctorStats(req, res, next) {
    try {
      const [
        totalDoctors,
        approvedDoctors,
        pendingDoctors,
        rejectedDoctors,
        blockedDoctors,
        recentDoctors
      ] = await Promise.all([
        User.countDocuments({ role: 'doctor', isDeleted: { $ne: true } }),
        User.countDocuments({ role: 'doctor', status: 'approved', isDeleted: { $ne: true } }),
        User.countDocuments({ role: 'doctor', status: 'pending', isDeleted: { $ne: true } }),
        User.countDocuments({ role: 'doctor', status: 'rejected', isDeleted: { $ne: true } }),
        User.countDocuments({ role: 'doctor', isBlocked: true, isDeleted: { $ne: true } }),
        User.countDocuments({ 
          role: 'doctor', 
          createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
          isDeleted: { $ne: true }
        })
      ]);

      res.status(200).json({
        success: true,
        data: {
          totalDoctors,
          approvedDoctors,
          pendingDoctors,
          rejectedDoctors,
          blockedDoctors,
          recentDoctors
        }
      });
    } catch (error) {
      console.error('❌ Get doctor stats error:', error);
      next(error);
    }
  }

  /**
   * Recommend a doctor (admin/supervisor with permissions)
   * POST /api/doctors/:doctorId/recommend
   */
  async recommendDoctor(req, res, next) {
    try {
      const { doctorId } = req.params;
      const { reason } = req.body;

      // Find the doctor
      const doctor = await User.findOne({ 
        _id: doctorId, 
        role: 'doctor',
        isDeleted: { $ne: true }
      });

      if (!doctor) {
        return res.status(404).json({
          success: false,
          error: 'Doctor not found'
        });
      }

      if (doctor.status !== 'approved') {
        return res.status(400).json({
          success: false,
          error: 'Cannot recommend a doctor that is not approved'
        });
      }

      if (doctor.isBlocked) {
        return res.status(400).json({
          success: false,
          error: 'Cannot recommend a blocked doctor'
        });
      }

      if (doctor.isRecommended) {
        return res.status(400).json({
          success: false,
          error: 'Doctor is already recommended'
        });
      }

      // Update doctor with recommendation
      doctor.isRecommended = true;
      doctor.recommendedAt = new Date();
      doctor.recommendedBy = req.user.userId;
      doctor.recommendationReason = reason || 'Recommended by admin for exceptional service';

      await doctor.save();

      // Log the recommendation
      console.log(`⭐ Doctor recommended:`, {
        doctorId: doctor._id,
        doctorName: doctor.name,
        recommendedBy: req.user.userId,
        recommendedAt: new Date(),
        reason: reason || 'Recommended by admin for exceptional service'
      });

      res.status(200).json({
        success: true,
        message: 'Doctor recommended successfully',
        data: {
          doctor: {
            id: doctor._id,
            name: doctor.name,
            email: doctor.email,
            specialization: doctor.specialization,
            isRecommended: true,
            recommendedAt: doctor.recommendedAt,
            recommendationReason: doctor.recommendationReason
          },
          recommendedBy: {
            id: req.user.userId,
            name: req.user.name,
            email: req.user.email,
            role: req.user.role
          },
          recommendedAt: doctor.recommendedAt,
          reason: doctor.recommendationReason
        }
      });
    } catch (error) {
      console.error('❌ Recommend doctor error:', error);
      next(error);
    }
  }

  /**
   * Unrecommend a doctor (admin/supervisor with permissions)
   * DELETE /api/doctors/:doctorId/recommend
   */
  async unrecommendDoctor(req, res, next) {
    try {
      const { doctorId } = req.params;
      const { reason } = req.body;

      // Find the doctor
      const doctor = await User.findOne({ 
        _id: doctorId, 
        role: 'doctor',
        isDeleted: { $ne: true }
      });

      if (!doctor) {
        return res.status(404).json({
          success: false,
          error: 'Doctor not found'
        });
      }

      if (!doctor.isRecommended) {
        return res.status(400).json({
          success: false,
          error: 'Doctor is not currently recommended'
        });
      }

      // Store recommendation info for audit before removal
      const previousRecommendation = {
        recommendedAt: doctor.recommendedAt,
        recommendedBy: doctor.recommendedBy,
        reason: doctor.recommendationReason
      };

      // Remove recommendation
      doctor.isRecommended = false;
      doctor.recommendedAt = undefined;
      doctor.recommendedBy = undefined;
      doctor.recommendationReason = undefined;

      await doctor.save();

      // Log the unrecommendation
      console.log(`❌ Doctor unrecommended:`, {
        doctorId: doctor._id,
        doctorName: doctor.name,
        unrecommendedBy: req.user.userId,
        unrecommendedAt: new Date(),
        reason: reason || 'Recommendation removed by admin',
        previousRecommendation
      });

      res.status(200).json({
        success: true,
        message: 'Doctor recommendation removed successfully',
        data: {
          doctor: {
            id: doctor._id,
            name: doctor.name,
            email: doctor.email,
            specialization: doctor.specialization,
            isRecommended: false
          },
          unrecommendedBy: {
            id: req.user.userId,
            name: req.user.name,
            email: req.user.email,
            role: req.user.role
          },
          unrecommendedAt: new Date(),
          reason: reason || 'Recommendation removed by admin',
          previousRecommendation
        }
      });
    } catch (error) {
      console.error('❌ Unrecommend doctor error:', error);
      next(error);
    }
  }

  /**
   * Get recommended doctors
   * GET /api/doctors/recommended
   */
  async getRecommendedDoctors(req, res, next) {
    try {
      const {
        page = 1,
        limit = 20,
        specialization,
        search
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

      // Build query for recommended doctors
      const query = {
        role: 'doctor',
        isRecommended: true,
        isDeleted: { $ne: true },
        status: 'approved',
        isBlocked: { $ne: true }
      };

      // Specialization filtering
      if (specialization) {
        query.specialization = specialization.toLowerCase().trim();
      }

      // Search functionality
      if (search) {
        const searchRegex = new RegExp(search.toLowerCase().trim(), 'i');
        query.$or = [
          { name: searchRegex },
          { email: searchRegex },
          { short_bio: searchRegex }
        ];
      }

      // Get recommended doctors with pagination
      const [doctors, total] = await Promise.all([
        User.find(query)
          .select('-password -id_card_front -id_card_back')
          .sort({ recommendedAt: -1 })
          .skip(skip)
          .limit(limitNum)
          .populate('recommendedBy', 'name email')
          .lean(),
        User.countDocuments(query)
      ]);

      // Calculate recommendation statistics
      const stats = await User.aggregate([
        { $match: query },
        {
          $group: {
            _id: null,
            totalRecommended: { $sum: 1 },
            bySpecialization: {
              $push: {
                specialization: '$specialization',
                count: 1
              }
            },
            avgRecommendationAge: {
              $avg: {
                $subtract: [new Date(), '$recommendedAt']
              }
            }
          }
        }
      ]);

      // Group by specialization statistics
      const specializationStats = await User.aggregate([
        { $match: query },
        {
          $group: {
            _id: '$specialization',
            count: { $sum: 1 },
            oldestRecommendation: { $min: '$recommendedAt' },
            newestRecommendation: { $max: '$recommendedAt' }
          }
        },
        { $sort: { count: -1 } }
      ]);

      res.status(200).json({
        success: true,
        data: {
          doctors,
          pagination: {
            currentPage: pageNum,
            totalPages: Math.ceil(total / limitNum),
            totalDoctors: total,
            hasNext: pageNum < Math.ceil(total / limitNum),
            hasPrev: pageNum > 1
          },
          statistics: {
            totalRecommended: total,
            specializationStatistics: specializationStats,
            overallStats: stats[0] || {
              totalRecommended: 0,
              avgRecommendationAge: 0
            }
          },
          filters: {
            specialization: specialization || null,
            search: search || null
          }
        }
      });
    } catch (error) {
      console.error('❌ Get recommended doctors error:', error);
      next(error);
    }
  }
}

module.exports = new DoctorController();
