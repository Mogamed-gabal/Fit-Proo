const Bundle = require('../models/Bundle');
const User = require('../models/User');

/**
 * Create a new bundle
 */
const createBundle = async (req, res) => {
  try {
    const { name, doctors, price } = req.body;

    // Validate doctors exist and are actually doctors
    const doctorUsers = await User.find({ 
      _id: { $in: doctors },
      role: 'doctor'
    });

    if (doctorUsers.length !== doctors.length) {
      return res.status(400).json({
        success: false,
        error: 'All specified users must be doctors'
      });
    }

    const bundle = new Bundle({
      name,
      doctors: doctors.map(doctorId => ({ doctorId })),
      price,
      createdBy: req.user.userId
    });

    await bundle.save();
    await bundle.populate('doctors.doctorId', 'name email');

    res.status(201).json({
      success: true,
      data: bundle
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get all bundles
 */
const getAllBundles = async (req, res) => {
  try {
    let query = {};
    
    // Clients only see active bundles
    if (req.user.role === 'client') {
      query.isActive = true;
    }

    const bundles = await Bundle.find(query)
      .populate('doctors.doctorId', 'name email')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: bundles
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Update a bundle
 */
const updateBundle = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, doctors, price } = req.body;

    let updateData = {};
    
    if (name) updateData.name = name;
    if (price !== undefined) updateData.price = price;
    if (doctors) {
      // Validate doctors exist and are actually doctors
      const doctorUsers = await User.find({ 
        _id: { $in: doctors },
        role: 'doctor'
      });

      if (doctorUsers.length !== doctors.length) {
        return res.status(400).json({
          success: false,
          error: 'All specified users must be doctors'
        });
      }

      updateData.doctors = doctors.map(doctorId => ({ doctorId }));
    }

    const bundle = await Bundle.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    )
      .populate('doctors.doctorId', 'name email')
      .populate('createdBy', 'name email');

    if (!bundle) {
      return res.status(404).json({
        success: false,
        error: 'Bundle not found'
      });
    }

    res.status(200).json({
      success: true,
      data: bundle
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Deactivate a bundle
 */
const deactivateBundle = async (req, res) => {
  try {
    const { id } = req.params;

    const bundle = await Bundle.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    )
      .populate('doctors.doctorId', 'name email')
      .populate('createdBy', 'name email');

    if (!bundle) {
      return res.status(404).json({
        success: false,
        error: 'Bundle not found'
      });
    }

    res.status(200).json({
      success: true,
      data: bundle
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

module.exports = {
  createBundle,
  getAllBundles,
  updateBundle,
  deactivateBundle
};
