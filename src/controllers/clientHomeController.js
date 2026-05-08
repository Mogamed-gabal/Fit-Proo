const User = require('../models/User');
const Bundle = require('../models/Bundle');

// Simple in-memory cache (5 minutes TTL)
let specializationCache = {
  data: null,
  timestamp: null,
  ttl: 5 * 60 * 1000 // 5 minutes in milliseconds
};

// Cache helper function
const getValidSpecializations = async () => {
  const now = Date.now();
  
  // Return cached data if still valid
  if (specializationCache.data && 
      specializationCache.timestamp && 
      (now - specializationCache.timestamp) < specializationCache.ttl) {
    return specializationCache.data;
  }

  const validSpecializations = await User.distinct('specialization', {
    role: 'doctor',
    isActive: true,
    specialization: { $exists: true, $ne: null }
  });

  // Update cache
  specializationCache.data = validSpecializations;
  specializationCache.timestamp = now;
  
  return validSpecializations;
};

/**
 * Get all doctors
 */
const getAllDoctors = async (req, res) => {
  try {
    const { page = 1, limit = 10, specialization, search, sortBy = 'name' } = req.query;

    // Build filter
    const filter = { role: 'doctor', isActive: true };
    
    if (specialization) {
      filter.specialization = specialization;
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { specialization: { $regex: search, $options: 'i' } }
      ];
    }

    // Build sort
    let sort = {};
    switch (sortBy) {
      case 'name':
        sort = { name: 1 };
        break;
      case 'specialization':
        sort = { specialization: 1, name: 1 };
        break;
      case 'createdAt':
        sort = { createdAt: -1 };
        break;
      default:
        sort = { name: 1 };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [doctors, total] = await Promise.all([
      User.find(filter)
        .select('name email phone specialization profileImage bio experienceYears createdAt')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      User.countDocuments(filter)
    ]);

    const totalPages = Math.ceil(total / parseInt(limit));

    res.status(200).json({
      success: true,
      data: {
        doctors,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalItems: total,
          itemsPerPage: parseInt(limit),
          hasNext: parseInt(page) < totalPages,
          hasPrev: parseInt(page) > 1
        },
        filters: {
          specialization,
          search,
          sortBy
        }
      }
    });
  } catch (error) {
    console.error('Error in clientHomeController:', error);
    
    // Production-safe error response
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    res.status(500).json({
      success: false,
      error: isDevelopment ? error.message : 'Internal server error',
      ...(isDevelopment && { stack: error.stack })
    });
  }
};

/**
 * Get all specializations
 */
const getAllSpecializations = async (req, res) => {
  try {
    // Get unique specializations from cache or database
    const specializations = await getValidSpecializations();

    // Count doctors per specialization
    const specializationCounts = await User.aggregate([
      {
        $match: {
          role: 'doctor',
          isActive: true,
          specialization: { $exists: true, $ne: null }
        }
      },
      {
        $group: {
          _id: '$specialization',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    const result = specializations.map(spec => {
      const countData = specializationCounts.find(item => item._id === spec);
      return {
        name: spec,
        doctorCount: countData ? countData.count : 0
      };
    });

    res.status(200).json({
      success: true,
      data: {
        specializations: result,
        total: result.length
      }
    });
  } catch (error) {
    console.error('Error in clientHomeController:', error);
    
    // Production-safe error response
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    res.status(500).json({
      success: false,
      error: isDevelopment ? error.message : 'Internal server error',
      ...(isDevelopment && { stack: error.stack })
    });
  }
};

/**
 * Get doctor details by ID
 */
const getDoctorById = async (req, res) => {
  try {
    const { id } = req.params;

    const doctor = await User.findOne({
      _id: id,
      role: 'doctor',
      isActive: true
    })
    .select('name email phone specialization profileImage bio experienceYears education certifications createdAt')
    .lean();

    if (!doctor) {
      return res.status(404).json({
        success: false,
        error: 'Doctor not found'
      });
    }

    // Get doctor's bundles
    const bundles = await Bundle.find({
      'doctors.doctorId': id,
      isActive: true
    })
    .populate('doctors.doctorId', 'name email specialization')
    .populate('createdBy', 'name email')
    .sort({ createdAt: -1 })
    .lean();

    // Get doctor statistics
    const stats = await Bundle.aggregate([
      {
        $match: {
          'doctors.doctorId': doctor._id,
          isActive: true
        }
      },
      {
        $group: {
          _id: '$doctors.doctorId',
          totalBundles: { $sum: 1 },
          avgOneMonthPrice: { $avg: '$pricing.oneMonth' },
          avgThreeMonthsPrice: { $avg: '$pricing.threeMonths' },
          avgSixMonthsPrice: { $avg: '$pricing.sixMonths' }
        }
      }
    ]);

    const doctorStats = stats.length > 0 ? stats[0] : {
      totalBundles: 0,
      avgOneMonthPrice: 0,
      avgThreeMonthsPrice: 0,
      avgSixMonthsPrice: 0
    };

    res.status(200).json({
      success: true,
      data: {
        doctor: {
          ...doctor,
          stats: {
            totalBundles: doctorStats.totalBundles,
            averagePricing: {
              oneMonth: Math.round(doctorStats.avgOneMonthPrice * 100) / 100,
              threeMonths: Math.round(doctorStats.avgThreeMonthsPrice * 100) / 100,
              sixMonths: Math.round(doctorStats.avgSixMonthsPrice * 100) / 100
            }
          },
          bundles
        }
      }
    });
  } catch (error) {
    console.error('Error in clientHomeController:', error);
    
    // Production-safe error response
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    res.status(500).json({
      success: false,
      error: isDevelopment ? error.message : 'Internal server error',
      ...(isDevelopment && { stack: error.stack })
    });
  }
};

/**
 * Get specialization details with doctors
 */
const getSpecializationDetails = async (req, res) => {
  try {
    const { specialization } = req.params;
    const { page = 1, limit = 10, sortBy = 'name' } = req.query;

    // Validate specialization exists
    const validSpecializations = await User.distinct('specialization', {
      role: 'doctor',
      isActive: true
    });

    if (!validSpecializations.includes(specialization)) {
      return res.status(404).json({
        success: false,
        error: 'Specialization not found'
      });
    }

    // Build filter
    const filter = {
      role: 'doctor',
      specialization: specialization,
      isActive: true
    };

    // Build sort
    let sort = {};
    switch (sortBy) {
      case 'name':
        sort = { name: 1 };
        break;
      case 'experience':
        sort = { experienceYears: -1, name: 1 };
        break;
      case 'createdAt':
        sort = { createdAt: -1 };
        break;
      default:
        sort = { name: 1 };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [doctors, total] = await Promise.all([
      User.find(filter)
        .select('name email phone specialization profileImage bio experienceYears createdAt')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      User.countDocuments(filter)
    ]);

    const totalPages = Math.ceil(total / parseInt(limit));

    // Get bundles for this specialization
    const specializationBundles = await Bundle.aggregate([
      {
        $match: {
          isActive: true
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'doctors.doctorId',
          foreignField: '_id',
          as: 'doctorDetails'
        }
      },
      {
        $match: {
          'doctorDetails.specialization': specialization
        }
      },
      {
        $project: {
          name: 1,
          pricing: 1,
          doctors: 1,
          isActive: 1,
          createdBy: 1,
          createdAt: 1
        }
      },
      {
        $sort: { createdAt: -1 }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        specialization,
        doctors,
        bundles: specializationBundles,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalItems: total,
          itemsPerPage: parseInt(limit),
          hasNext: parseInt(page) < totalPages,
          hasPrev: parseInt(page) > 1
        },
        stats: {
          totalDoctors: total,
          totalBundles: specializationBundles.length
        }
      }
    });
  } catch (error) {
    console.error('Error in clientHomeController:', error);
    
    // Production-safe error response
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    res.status(500).json({
      success: false,
      error: isDevelopment ? error.message : 'Internal server error',
      ...(isDevelopment && { stack: error.stack })
    });
  }
};

/**
 * Get doctors by specializations (filter endpoint)
 */
const getDoctorsBySpecializations = async (req, res) => {
  try {
    const { specializations, page = 1, limit = 10, sortBy = 'name' } = req.query;

    // Validate specializations parameter
    if (!specializations) {
      return res.status(400).json({
        success: false,
        error: 'Specializations parameter is required'
      });
    }

    // Parse specializations (can be comma-separated)
    const specializationArray = Array.isArray(specializations) 
      ? specializations 
      : specializations.split(',').map(s => s.trim());

    // Get valid specializations from cache
    const validSpecializations = await getValidSpecializations();

    // Use Set for O(1) lookups instead of Array.includes()
    const validSpecSet = new Set(validSpecializations);
    const existingSpecializations = specializationArray.filter(spec => 
      validSpecSet.has(spec)
    );
    const nonExistentSpecializations = specializationArray.filter(spec => 
      !validSpecSet.has(spec)
    );

    // Build filter for existing specializations
    let filter = { 
      role: 'doctor', 
      isActive: true 
    };

    if (existingSpecializations.length > 0) {
      filter.specialization = { $in: existingSpecializations };
    } else {
      // If no valid specializations, return empty result with info
      return res.status(200).json({
        success: true,
        data: {
          doctors: [],
          pagination: {
            currentPage: parseInt(page),
            totalPages: 0,
            totalItems: 0,
            itemsPerPage: parseInt(limit),
            hasNext: false,
            hasPrev: false
          },
          filters: {
            specializations: specializationArray,
            sortBy
          },
          warnings: {
            nonExistentSpecializations: nonExistentSpecializations,
            message: `The following specializations do not exist: ${nonExistentSpecializations.join(', ')}`
          }
        }
      });
    }

    // Build sort
    let sort = {};
    switch (sortBy) {
      case 'name':
        sort = { name: 1 };
        break;
      case 'specialization':
        sort = { specialization: 1, name: 1 };
        break;
      case 'experience':
        sort = { experienceYears: -1, name: 1 };
        break;
      case 'createdAt':
        sort = { createdAt: -1 };
        break;
      default:
        sort = { name: 1 };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [doctors, total] = await Promise.all([
      User.find(filter)
        .select('name email phone specialization profileImage bio experienceYears createdAt')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      User.countDocuments(filter)
    ]);

    const totalPages = Math.ceil(total / parseInt(limit));

    // Group doctors by specialization for response
    const doctorsBySpecialization = doctors.reduce((acc, doctor) => {
      if (!acc[doctor.specialization]) {
        acc[doctor.specialization] = [];
      }
      acc[doctor.specialization].push(doctor);
      return acc;
    }, {});

    const response = {
      success: true,
      data: {
        doctors,
        doctorsBySpecialization,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalItems: total,
          itemsPerPage: parseInt(limit),
          hasNext: parseInt(page) < totalPages,
          hasPrev: parseInt(page) > 1
        },
        filters: {
          requestedSpecializations: specializationArray,
          existingSpecializations,
          sortBy
        },
        stats: {
          totalDoctors: total,
          specializationCounts: existingSpecializations.map(spec => ({
            name: spec,
            count: doctorsBySpecialization[spec] ? doctorsBySpecialization[spec].length : 0
          }))
        }
      }
    };

    // Add warnings if there were non-existent specializations
    if (nonExistentSpecializations.length > 0) {
      response.data.warnings = {
        nonExistentSpecializations,
        message: `The following specializations do not exist: ${nonExistentSpecializations.join(', ')}`
      };
    }

    res.status(200).json(response);
  } catch (error) {
    console.error('Error in clientHomeController:', error);
    
    // Production-safe error response
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    res.status(500).json({
      success: false,
      error: isDevelopment ? error.message : 'Internal server error',
      ...(isDevelopment && { stack: error.stack })
    });
  }
};

module.exports = {
  getAllDoctors,
  getAllSpecializations,
  getDoctorById,
  getSpecializationDetails,
  getDoctorsBySpecializations
};
