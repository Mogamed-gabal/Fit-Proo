const User = require('../models/User');
const { withTransaction } = require('../utils/transactionHelper');
const { uploadImage } = require('../services/cloudinaryService');

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

  async getWeightHistoryPaginated(req, res) {
    try {
      const userId = req.user.userId;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const skip = (page - 1) * limit;

      // Validate pagination parameters
      if (page < 1 || limit < 1 || limit > 100) {
        return res.status(400).json({
          success: false,
          error: 'Invalid pagination parameters. Page must be >= 1, limit must be between 1 and 100'
        });
      }

      const user = await User.findById(userId).select('weightHistory');
      
      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      const weightHistory = user.weightHistory || [];
      const total = weightHistory.length;
      const totalPages = Math.ceil(total / limit);

      // Get paginated results (most recent first)
      const paginatedHistory = weightHistory
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(skip, skip + limit);

      res.status(200).json({
        success: true,
        data: {
          weightHistory: paginatedHistory,
          pagination: {
            currentPage: page,
            totalPages,
            totalEntries: total,
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1
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
      const user = await User.findById(userId);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      // Role-based field whitelist
      let allowedFields = [];
      
      if (user.role === 'client') {
        allowedFields = ['phone', 'region'];
      } else if (user.role === 'doctor') {
        allowedFields = ['name', 'phone', 'address', 'height', 'goal'];
      } else {
        allowedFields = ['name', 'phone', 'address', 'height', 'goal'];
      }

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
      delete req.body.age; // Age is virtual, should not be updated directly

      if (Object.keys(updates).length === 0) {
        return res.status(400).json({
          success: false,
          error: 'No valid fields to update'
        });
      }

      // Use transaction for profile update
      const updatedUser = await withTransaction(async (session) => {
        const user = await User.findByIdAndUpdate(
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
          user: updatedUser.toJSON()
        }
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }

  async updateProfilePicture(req, res) {
    try {
      const userId = req.user.userId;
      
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: 'No file uploaded'
        });
      }

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      // Upload new image to Cloudinary
      const uploadResult = await uploadImage(req.file.buffer);

      // Delete old image from Cloudinary if it exists
      if (user.profilePicture && user.profilePicture.public_id) {
        // TODO: Implement Cloudinary deletion
        // await cloudinary.uploader.destroy(user.profilePicture.public_id);
      }

      // Update with new image (handles both new upload and replace)
      user.profilePicture = {
        filename: req.file.originalname,
        originalName: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        secure_url: uploadResult.secure_url,
        public_id: uploadResult.public_id
      };

      await user.save();

      res.status(200).json({
        success: true,
        message: 'Profile picture updated successfully',
        data: {
          profilePicture: user.profilePicture
        }
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }

  async deleteProfilePicture(req, res) {
    try {
      const userId = req.user.userId;

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      if (!user.profilePicture) {
        return res.status(404).json({
          success: false,
          error: 'No profile picture to delete'
        });
      }

      // TODO: Delete image from Cloudinary using user.profilePicture.public_id

      // Remove profile picture from user document
      user.profilePicture = undefined;
      await user.save();

      res.status(200).json({
        success: true,
        message: 'Profile picture deleted successfully'
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }

  async addCertificate(req, res) {
    try {
      const userId = req.user.userId;
      
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: 'No certificate file uploaded'
        });
      }

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      if (user.role !== 'doctor') {
        return res.status(403).json({
          success: false,
          error: 'Only doctors can add certificates'
        });
      }

      // Add certificate to user's certificates array
      const uploadResult = await uploadImage(req.file.buffer);
      const newCertificate = {
        filename: req.file.originalname,
        originalName: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        secure_url: uploadResult.secure_url,
        public_id: uploadResult.public_id
      };

      user.certificates.push(newCertificate);
      await user.save();

      res.status(200).json({
        success: true,
        message: 'Certificate added successfully',
        data: {
          certificate: {
            filename: newCertificate.filename,
            originalName: newCertificate.originalName,
            mimetype: newCertificate.mimetype,
            size: newCertificate.size,
            secure_url: newCertificate.secure_url
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

  async deleteCertificate(req, res) {
    try {
      const userId = req.user.userId;
      const { certificateId } = req.params;

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      if (user.role !== 'doctor') {
        return res.status(403).json({
          success: false,
          error: 'Only doctors can delete certificates'
        });
      }

      if (!user.certificates || user.certificates.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'No certificates found'
        });
      }

      // Check if this is the last certificate
      if (user.certificates.length === 1) {
        return res.status(400).json({
          success: false,
          error: 'Cannot delete the last certificate. At least one certificate must remain.'
        });
      }

      // Remove certificate by index (certificateId is actually the index)
      const certificateIndex = parseInt(certificateId);
      if (certificateIndex < 0 || certificateIndex >= user.certificates.length) {
        return res.status(404).json({
          success: false,
          error: 'Certificate not found'
        });
      }

      // TODO: Delete certificate from Cloudinary using user.certificates[certificateIndex].public_id

      user.certificates.splice(certificateIndex, 1);
      await user.save();

      res.status(200).json({
        success: true,
        message: 'Certificate deleted successfully'
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }

  async updatePackages(req, res) {
    try {
      const userId = req.user.userId;
      const { packages } = req.body;

      if (!packages || !Array.isArray(packages)) {
        return res.status(400).json({
          success: false,
          error: 'Packages must be an array'
        });
      }

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      if (user.role !== 'doctor') {
        return res.status(403).json({
          success: false,
          error: 'Only doctors can update packages'
        });
      }

      // Validate packages structure
      for (const pkg of packages) {
        if (!pkg.duration || !pkg.price || pkg.price < 0) {
          return res.status(400).json({
            success: false,
            error: 'Each package must have duration and valid price'
          });
        }
      }

      user.packages = packages;
      await user.save();

      res.status(200).json({
        success: true,
        message: 'Packages updated successfully',
        data: {
          packages: user.packages
        }
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }

  async updateBio(req, res) {
    try {
      const userId = req.user.userId;
      const { short_bio } = req.body;

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      if (user.role !== 'doctor') {
        return res.status(403).json({
          success: false,
          error: 'Only doctors can update bio'
        });
      }

      user.short_bio = short_bio;
      await user.save();

      res.status(200).json({
        success: true,
        message: 'Bio updated successfully',
        data: {
          short_bio: user.short_bio
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
