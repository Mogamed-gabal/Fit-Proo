const express = require('express');
const router = express.Router();
const exerciseController = require('../controllers/exerciseController');

/**
 * Import exercises from external API
 * POST /api/exercises/import
 */
router.post('/import', exerciseController.importExercises);

/**
 * Get all exercises with pagination and filtering
 * GET /api/exercises
 * Query params: page, limit, bodyPart, target, search
 */
router.get('/', exerciseController.getAllExercises);

/**
 * Get all unique body parts
 * GET /api/exercises/body-parts
 */
router.get('/body-parts', exerciseController.getAllBodyParts);

/**
 * Get all unique muscles
 * GET /api/exercises/muscles
 */
router.get('/muscles', exerciseController.getAllMuscles);

/**
 * Get exercises by body part
 * GET /api/exercises/body-part/:bodyPart
 * Query params: page, limit
 */
router.get('/body-part/:bodyPart', exerciseController.getExercisesByBodyPart);

/**
 * Get exercises by target muscle
 * GET /api/exercises/muscle/:muscle
 * Query params: page, limit
 */
router.get('/muscle/:muscle', exerciseController.getExercisesByMuscle);

/**
 * Search exercises by name
 * GET /api/exercises/search/:query
 * Query params: page, limit
 */
router.get('/search/:query', exerciseController.searchExercises);

module.exports = router;
