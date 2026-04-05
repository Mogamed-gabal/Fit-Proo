const Exercise = require('../models/Exercise');
const BodyPart = require('../models/BodyPart');
const { body, param, query } = require('express-validator');

class ExerciseController {
  /**
   * Import exercises from external API (Admin only)
   * POST /api/exercises/import
   */
  async importExercises(req, res, next) {
    try {
      // Check if user is admin
      if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          error: 'Access denied. Admin privileges required.'
        });
      }

      const fetch = require('node-fetch');
      const API_BASE_URL = 'https://edb-with-videos-and-images-by-ascendapi.p.rapidapi.com/api/v1/';

      console.log('🌐 Starting exercises import from external API...');

      // API headers
      const headers = {
        'x-rapidapi-key': '284faaa28cmsh4e6c577d3af80afp135006jsne1b23f584a56',
        'x-rapidapi-host': 'edb-with-videos-and-images-by-ascendapi.p.rapidapi.com',
        'Content-Type': 'application/json'
      };

      // Import body parts first
      console.log('🦴 Fetching body parts...');
      const bodyPartsResponse = await fetch(`${API_BASE_URL}bodyparts`, {
        method: 'GET',
        headers: headers
      });
      
      if (!bodyPartsResponse.ok) {
        throw new Error(`Failed to fetch body parts: ${bodyPartsResponse.status}`);
      }
      
      const bodyPartsData = await bodyPartsResponse.json();
      
      // Handle API response structure
      let bodyParts = [];
      if (bodyPartsData.data && Array.isArray(bodyPartsData.data)) {
        bodyParts = bodyPartsData.data;
      } else if (Array.isArray(bodyPartsData)) {
        bodyParts = bodyPartsData;
      } else {
        throw new Error('Invalid body parts API response structure');
      }
      
      console.log(`🦴 Found ${bodyParts.length} body parts`);

      // Normalize and save body parts
      const normalizedBodyParts = bodyParts.map(bodyPart => ({
        name: bodyPart.name ? bodyPart.name.toLowerCase().trim() : '',
        imageUrl: bodyPart.imageUrl ? bodyPart.imageUrl.trim() : ''
      }));

      // Filter out body parts with missing required fields
      const validBodyParts = normalizedBodyParts.filter(bodyPart => 
        bodyPart.name && bodyPart.imageUrl
      );

      // Use safe upsert to prevent duplicates
      console.log('💾 Saving body parts...');
      const bodyPartsResult = await BodyPart.safeUpsertMany(validBodyParts);
      console.log(`✅ Body parts saved: Inserted ${bodyPartsResult.upsertedCount || 0}, Modified ${bodyPartsResult.modifiedCount || 0}`);

      // Only fetch exercises (bodyParts and muscles can be derived)
      console.log('🏋 Fetching exercises...');
      const exercisesResponse = await fetch(`${API_BASE_URL}exercises`, {
        method: 'GET',
        headers: headers
      });
      
      if (!exercisesResponse.ok) {
        throw new Error(`Failed to fetch exercises: ${exercisesResponse.status}`);
      }
      
      const exercisesData = await exercisesResponse.json();
      
      // Handle the new API response structure
      let exercises = [];
      if (exercisesData.data && Array.isArray(exercisesData.data)) {
        exercises = exercisesData.data;
      } else if (Array.isArray(exercisesData)) {
        exercises = exercisesData;
      } else {
        throw new Error('Invalid API response structure');
      }
      
      console.log(`📊 Found ${exercises.length} exercises`);

      // Normalize and prepare exercises for storage
      const normalizedExercises = exercises.map(exercise => ({
        name: exercise.name ? exercise.name.toLowerCase().trim() : '',
        bodyPart: exercise.bodyParts && Array.isArray(exercise.bodyParts) ? 
          exercise.bodyParts[0]?.toLowerCase().trim() : '',
        target: exercise.targetMuscles && Array.isArray(exercise.targetMuscles) ? 
          exercise.targetMuscles[0]?.toLowerCase().trim() : '',
        equipment: exercise.equipments && Array.isArray(exercise.equipments) ? 
          exercise.equipments[0]?.toLowerCase().trim() : '',
        gifUrl: exercise.gifUrl ? exercise.gifUrl.trim() : '',
        imageUrl: exercise.imageUrl ? exercise.imageUrl.trim() : '',
        exerciseId: exercise.exerciseId ? exercise.exerciseId.trim() : '',
        exerciseType: exercise.exerciseType ? exercise.exerciseType.toLowerCase().trim() : 'strength',
        bodyParts: exercise.bodyParts && Array.isArray(exercise.bodyParts) ? 
          exercise.bodyParts.map(part => part.toLowerCase().trim()) : [],
        targetMuscles: exercise.targetMuscles && Array.isArray(exercise.targetMuscles) ? 
          exercise.targetMuscles.map(muscle => muscle.toLowerCase().trim()) : [],
        secondaryMuscles: exercise.secondaryMuscles && Array.isArray(exercise.secondaryMuscles) ? 
          exercise.secondaryMuscles.map(muscle => muscle.toLowerCase().trim()) : [],
        keywords: exercise.keywords && Array.isArray(exercise.keywords) ? 
          exercise.keywords.map(keyword => keyword.toLowerCase().trim()) : [],
        instructions: exercise.instructions && Array.isArray(exercise.instructions) ?
          exercise.instructions.map(instruction => instruction.trim()) : 
          (exercise.instructions ? [exercise.instructions.trim()] : [])
      }));

      // Filter out exercises with missing required fields
      const validExercises = normalizedExercises.filter(exercise => 
        exercise.name && exercise.bodyPart && exercise.target && exercise.equipment
      );

      console.log(`🔄 Normalized ${validExercises.length} valid exercises (removed ${normalizedExercises.length - validExercises.length} invalid)`);

      // Use safe upsert to prevent duplicates and data loss
      console.log('� Using safe upsert to import exercises...');
      const result = await Exercise.safeUpsertMany(validExercises);

      console.log('✅ Exercises import completed successfully!');
      console.log(`📊 Inserted: ${result.upsertedCount || 0}, Modified: ${result.modifiedCount || 0}`);

      res.status(200).json({
        success: true,
        message: 'Exercises and body parts imported successfully',
        data: {
          exercises: {
            imported: result.upsertedCount || 0,
            modified: result.modifiedCount || 0,
            total: validExercises.length
          },
          bodyParts: {
            imported: bodyPartsResult.upsertedCount || 0,
            modified: bodyPartsResult.modifiedCount || 0,
            total: validBodyParts.length
          }
        }
      });
    } catch (error) {
      console.error('❌ Error importing exercises:', error);
      next(error);
    }
  }

  /**
   * Get all body parts
   * GET /api/exercises/body-parts
   */
  async getBodyParts(req, res, next) {
    try {
      const bodyParts = await BodyPart.getAll();
      
      res.status(200).json({
        success: true,
        data: bodyParts
      });
    } catch (error) {
      console.error('❌ Error fetching body parts:', error);
      next(error);
    }
  }

  /**
   * Get all exercises with pagination and filtering
   * GET /api/exercises
   */
  async getAllExercises(req, res, next) {
    try {
      const {
        page = 1,
        limit = 20,
        bodyPart,
        target,
        search
      } = req.query;

      const pageNum = parseInt(page);
      const limitNum = parseInt(limit);
      const skip = (pageNum - 1) * limitNum;

      // Build query
      const query = {};

      if (bodyPart) {
        query.bodyPart = bodyPart.toLowerCase().trim();
      }

      if (target) {
        query.target = target.toLowerCase().trim();
      }

      if (search) {
        query.name = { $regex: search.toLowerCase().trim(), $options: 'i' };
      }

      console.log(`🔍 Searching exercises with query:`, query);

      // Execute query with pagination
      const [exercises, total] = await Promise.all([
        Exercise.find(query)
          .sort({ name: 1 })
          .skip(skip)
          .limit(limitNum)
          .lean(),
        Exercise.countDocuments(query)
      ]);

      const totalPages = Math.ceil(total / limitNum);

      console.log(`📊 Found ${total} exercises, returning ${exercises.length} for page ${pageNum}`);

      res.status(200).json({
        success: true,
        data: {
          exercises,
          pagination: {
            currentPage: pageNum,
            totalPages,
            totalExercises: total,
            hasNext: pageNum * limitNum < total,
            hasPrev: pageNum > 1
          }
        }
      });
    } catch (error) {
      console.error('❌ Get exercises error:', error);
      next(error);
    }
  }

  /**
   * Get all unique body parts
   * GET /api/exercises/body-parts
   */
  async getAllBodyParts(req, res, next) {
    try {
      console.log('📋 Fetching all unique body parts...');

      const bodyParts = await Exercise.getAllBodyParts();

      console.log(`📊 Found ${bodyParts.length} unique body parts`);

      res.status(200).json({
        success: true,
        data: {
          bodyParts,
          count: bodyParts.length
        }
      });
    } catch (error) {
      console.error('❌ Get body parts error:', error);
      next(error);
    }
  }

  /**
   * Get all unique muscles
   * GET /api/exercises/muscles
   */
  async getAllMuscles(req, res, next) {
    try {
      console.log('💪 Fetching all unique muscles...');

      const muscles = await Exercise.getAllMuscles();

      console.log(`📊 Found ${muscles.length} unique muscles`);

      res.status(200).json({
        success: true,
        data: {
          muscles,
          count: muscles.length
        }
      });
    } catch (error) {
      console.error('❌ Get muscles error:', error);
      next(error);
    }
  }

  /**
   * Get exercises by body part
   * GET /api/exercises/body-part/:bodyPart
   */
  async getExercisesByBodyPart(req, res, next) {
    try {
      const { bodyPart } = req.params;
      const { page = 1, limit = 20 } = req.query;

      const pageNum = parseInt(page);
      const limitNum = parseInt(limit);
      const skip = (pageNum - 1) * limitNum;

      console.log(`📋 Fetching exercises for body part: ${bodyPart}`);

      const [exercises, total] = await Promise.all([
        Exercise.findByBodyPart(bodyPart)
          .skip(skip)
          .limit(limitNum)
          .lean(),
        Exercise.countDocuments({ bodyPart: bodyPart.toLowerCase().trim() })
      ]);

      const totalPages = Math.ceil(total / limitNum);

      console.log(`📊 Found ${total} exercises for ${bodyPart}, returning ${exercises.length}`);

      res.status(200).json({
        success: true,
        data: {
          bodyPart,
          exercises,
          pagination: {
            currentPage: pageNum,
            totalPages,
            totalExercises: total,
            hasNext: pageNum * limitNum < total,
            hasPrev: pageNum > 1
          }
        }
      });
    } catch (error) {
      console.error('❌ Get exercises by body part error:', error);
      next(error);
    }
  }

  /**
   * Get exercises by target muscle
   * GET /api/exercises/muscle/:muscle
   */
  async getExercisesByMuscle(req, res, next) {
    try {
      const { muscle } = req.params;
      const { page = 1, limit = 20 } = req.query;

      const pageNum = parseInt(page);
      const limitNum = parseInt(limit);
      const skip = (pageNum - 1) * limitNum;

      console.log(`💪 Fetching exercises for target muscle: ${muscle}`);

      const [exercises, total] = await Promise.all([
        Exercise.findByTarget(muscle)
          .skip(skip)
          .limit(limitNum)
          .lean(),
        Exercise.countDocuments({ target: muscle.toLowerCase().trim() })
      ]);

      const totalPages = Math.ceil(total / limitNum);

      console.log(`📊 Found ${total} exercises for ${muscle}, returning ${exercises.length}`);

      res.status(200).json({
        success: true,
        data: {
          muscle,
          exercises,
          pagination: {
            currentPage: pageNum,
            totalPages,
            totalExercises: total,
            hasNext: pageNum * limitNum < total,
            hasPrev: pageNum > 1
          }
        }
      });
    } catch (error) {
      console.error('❌ Get exercises by muscle error:', error);
      next(error);
    }
  }

  /**
   * Search exercises by name
   * GET /api/exercises/search/:query
   */
  async searchExercises(req, res, next) {
    try {
      const { query } = req.params;
      const { page = 1, limit = 20 } = req.query;

      const pageNum = parseInt(page);
      const limitNum = parseInt(limit);
      const skip = (pageNum - 1) * limitNum;

      console.log(`🔍 Searching exercises with query: ${query}`);

      const [exercises, total] = await Promise.all([
        Exercise.searchByName(query)
          .skip(skip)
          .limit(limitNum)
          .lean(),
        Exercise.countDocuments({ name: { $regex: query.toLowerCase().trim(), $options: 'i' } })
      ]);

      const totalPages = Math.ceil(total / limitNum);

      console.log(`📊 Found ${total} exercises matching "${query}", returning ${exercises.length}`);

      res.status(200).json({
        success: true,
        data: {
          query,
          exercises,
          pagination: {
            currentPage: pageNum,
            totalPages,
            totalExercises: total,
            hasNext: pageNum * limitNum < total,
            hasPrev: pageNum > 1
          }
        }
      });
    } catch (error) {
      console.error('❌ Search exercises error:', error);
      next(error);
    }
  }

  /**
   * Get all unique body parts
   * GET /api/exercises/body-parts
   */
  async getBodyParts(req, res, next) {
    try {
      const bodyParts = await BodyPart.getAll();
      
      res.status(200).json({
        success: true,
        data: bodyParts
      });
    } catch (error) {
      console.error('❌ Error fetching body parts:', error);
      next(error);
    }
  }
}

module.exports = new ExerciseController();
