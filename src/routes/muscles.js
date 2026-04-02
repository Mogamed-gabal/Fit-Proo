const express = require('express');
const router = express.Router();
const musclesController = require('../controllers/musclesController');
const { query } = require('express-validator');

/**
 * Get muscles by body part
 * GET /api/muscles/by-bodypart
 */
router.get('/by-bodypart',
  [
    query('bodyPart')
      .trim()
      .notEmpty()
      .withMessage('bodyPart query parameter is required')
  ],
  musclesController.getMusclesByBodyPart.bind(musclesController)
);

module.exports = router;
