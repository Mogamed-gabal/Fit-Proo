const mongoose = require('mongoose');

// Body Part schema for fitness application
const bodyPartSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Body part name is required'],
    trim: true,
    unique: true,
    maxlength: [50, 'Body part name cannot exceed 50 characters']
  },
  imageUrl: {
    type: String,
    required: [true, 'Image URL is required'],
    trim: true,
    maxlength: [500, 'Image URL cannot exceed 500 characters']
  }
}, { 
  timestamps: true
});

// Indexes for performance
bodyPartSchema.index({ name: 1 });

// Static method to get all body parts
bodyPartSchema.statics.getAll = function() {
  return this.find().sort({ name: 1 });
};

// Static method to find body part by name
bodyPartSchema.statics.findByName = function(name) {
  return this.findOne({ name: name.toLowerCase().trim() });
};

// Static method for safe upsert of body parts
bodyPartSchema.statics.safeUpsertMany = function(bodyParts) {
  const operations = bodyParts.map(bodyPart => ({
    updateOne: {
      filter: { name: bodyPart.name.toLowerCase().trim() },
      update: { $set: bodyPart },
      upsert: true
    }
  }));
  
  return this.bulkWrite(operations);
};

module.exports = mongoose.model('BodyPart', bodyPartSchema);
