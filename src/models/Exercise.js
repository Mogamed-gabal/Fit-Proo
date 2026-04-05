const mongoose = require('mongoose');

// Exercise schema for fitness application
const exerciseSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Exercise name is required'],
    trim: true,
    maxlength: [100, 'Exercise name cannot exceed 100 characters']
  },
  bodyPart: {
    type: String,
    required: [true, 'Body part is required'],
    trim: true,
    maxlength: [50, 'Body part cannot exceed 50 characters']
  },
  target: {
    type: String,
    required: [true, 'Target muscle is required'],
    trim: true,
    maxlength: [50, 'Target muscle cannot exceed 50 characters']
  },
  equipment: {
    type: String,
    required: [true, 'Equipment is required'],
    trim: true,
    maxlength: [100, 'Equipment cannot exceed 100 characters']
  },
  gifUrl: {
    type: String,
    required: [true, 'GIF URL is required'],
    trim: true,
    maxlength: [500, 'GIF URL cannot exceed 500 characters']
  },
  secondaryMuscles: [{
    type: String,
    trim: true,
    maxlength: [50, 'Secondary muscle cannot exceed 50 characters']
  }],
  instructions: [{
    type: String,
    trim: true,
    maxlength: [500, 'Instruction step cannot exceed 500 characters']
  }]
}, { 
  timestamps: true
});

// Indexes for performance
exerciseSchema.index({ name: 1 });
exerciseSchema.index({ bodyPart: 1 });
exerciseSchema.index({ target: 1 });
exerciseSchema.index({ bodyPart: 1, target: 1 });
exerciseSchema.index({ name: 1, target: 1 }, { unique: true }); // Prevent duplicates

// Static method to find exercises by body part
exerciseSchema.statics.findByBodyPart = function(bodyPart) {
  return this.find({ bodyPart: bodyPart.toLowerCase().trim() }).sort({ name: 1 });
};

// Static method to find exercises by target muscle
exerciseSchema.statics.findByTarget = function(target) {
  return this.find({ target: target.toLowerCase().trim() }).sort({ name: 1 });
};

// Static method to search exercises by name
exerciseSchema.statics.searchByName = function(query) {
  const searchRegex = new RegExp(query.toLowerCase().trim(), 'i');
  return this.find({ name: searchRegex }).sort({ name: 1 });
};

// Static method to get all unique body parts
exerciseSchema.statics.getAllBodyParts = function() {
  return this.distinct('bodyPart').sort();
};

// Static method to get all unique muscles
exerciseSchema.statics.getAllMuscles = function() {
  return this.distinct('target').sort();
};

// Static method for safe upsert of exercises
exerciseSchema.statics.safeUpsertMany = function(exercises) {
  const operations = exercises.map(exercise => ({
    updateOne: {
      filter: { name: exercise.name, target: exercise.target },
      update: { $setOnInsert: exercise },
      upsert: true
    }
  }));
  
  return this.bulkWrite(operations);
};

module.exports = mongoose.model('Exercise', exerciseSchema);
