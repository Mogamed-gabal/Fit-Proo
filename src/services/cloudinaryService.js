/**
 * 🔒 CLOUDINARY SERVICE
 * Reusable upload helper for Cloudinary
 */

const cloudinary = require('../config/cloudinary');

/**
 * Upload image to Cloudinary
 * @param {string|Buffer} filePath - File path or buffer
 * @param {Object} options - Upload options
 * @returns {Promise<Object>} Upload result with secure_url and public_id
 */
const uploadImage = async (filePath, options = {}) => {
  try {
    const uploadOptions = {
      folder: 'fitness-app',
      resource_type: 'auto',
      use_filename: true,
      unique_filename: true,
      overwrite: true,
      ...options
    };

    let result;

    if (Buffer.isBuffer(filePath)) {
      // Handle buffer upload
      result = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(uploadOptions, (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve({
              secure_url: result.secure_url,
              public_id: result.public_id
            });
          }
        });
        
        stream.end(filePath);
      });
    } else {
      // Handle file path upload
      result = await cloudinary.uploader.upload(filePath, uploadOptions);
      return {
        secure_url: result.secure_url,
        public_id: result.public_id
      };
    }

    return result;
  } catch (error) {
    console.error('❌ [CLOUDINARY] Upload error:', error.message);
    throw new Error(`Failed to upload image: ${error.message}`);
  }
};

module.exports = {
  uploadImage
};
