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
}

module.exports = new DoctorController();
