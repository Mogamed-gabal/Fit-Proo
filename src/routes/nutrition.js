const express = require('express');
const router = express.Router();
const nutritionController = require('../controllers/nutritionController');
const { body } = require('express-validator');

/**
 * Calculate nutrition for ingredients
 * POST /api/nutrition/calculate
 */
router.post('/calculate',
  [
    body('ingredients')
      .isArray({ min: 1 })
      .withMessage('Ingredients array is required and must contain at least one item'),
    
    body('ingredients.*.name')
      .notEmpty()
      .withMessage('Ingredient name is required'),
    
    body('ingredients.*.quantity')
      .isNumeric()
      .withMessage('Ingredient quantity must be a number')
      .isFloat({ min: 0.1 })
      .withMessage('Ingredient quantity must be at least 0.1')
  ],
  nutritionController.calculateNutrition.bind(nutritionController)
);

module.exports = router;
