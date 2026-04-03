const https = require('https');

class NutritionController {
  constructor() {
    this.apiKey = 'gGEMsgYtVy1Zt3dfNvDD6iobpxmpN98PqacsXd4S';
    this.baseUrl = 'api.nal.usda.gov';
    this.cache = new Map(); // Simple in-memory cache
  }

  /**
   * Calculate nutrition for ingredients using USDA API
   * POST /api/nutrition/calculate
   */
  async calculateNutrition(req, res, next) {
    try {
      const { ingredients } = req.body;

      if (!ingredients || !Array.isArray(ingredients)) {
        return res.status(400).json({
          success: false,
          error: 'Ingredients array is required'
        });
      }

      const results = [];
      let totals = { calories: 0, protein: 0, carbs: 0, fat: 0 };

      for (const ingredient of ingredients) {
        if (!ingredient.name || !ingredient.quantity) {
          continue; // Skip invalid items
        }

        const normalizedIngredient = ingredient.name.toLowerCase().trim();
        const quantity = parseFloat(ingredient.quantity);

        // Check cache first
        const cacheKey = `${normalizedIngredient}_${quantity}`;
        if (this.cache.has(cacheKey)) {
          const cachedResult = this.cache.get(cacheKey);
          results.push(cachedResult);
          this.addToTotals(totals, cachedResult);
          continue;
        }

        try {
          const nutritionData = await this.getIngredientNutrition(normalizedIngredient, quantity);
          results.push(nutritionData);
          this.addToTotals(totals, nutritionData);

          // Cache the result
          this.cache.set(cacheKey, nutritionData);
        } catch (error) {
          console.error(`Error processing ${normalizedIngredient}:`, error.message);
          // Add default values for failed ingredients
          const defaultData = {
            name: ingredient.name,
            quantity: quantity,
            calories: 0,
            protein: 0,
            carbs: 0,
            fat: 0
          };
          results.push(defaultData);
        }
      }

      // Round totals to 2 decimal places
      totals = this.roundNutrients(totals);

      res.status(200).json({
        success: true,
        data: {
          results,
          totals
        }
      });
    } catch (error) {
      console.error('Nutrition calculation error:', error);
      next(error);
    }
  }

  /**
   * Get nutrition data for a single ingredient
   */
  async getIngredientNutrition(ingredientName, quantity) {
    console.log(`🍽️ Getting nutrition for: ${ingredientName} (${quantity}g)`);
    
    // Search for the ingredient
    const searchResponse = await this.searchFood(ingredientName);
    
    if (!searchResponse.foods || searchResponse.foods.length === 0) {
      throw new Error(`No results found for ingredient: ${ingredientName}`);
    }

    // Select the best food from the results
    const food = this.selectBestFood(searchResponse.foods);
    const fdcId = food.fdcId;
    
    console.log(`🔍 Selected food: ${food.description || food.name} (FDC ID: ${fdcId})`);
    console.log(`📊 Food details: dataType=${food.dataType}, foodNutrients=${food.foodNutrients?.length || 0}`);

    // Get detailed nutrition information
    const detailsResponse = await this.getFoodDetails(fdcId);
    
    console.log(`🔍 Details response: dataType=${detailsResponse.dataType}, labelNutrients=${!!detailsResponse.labelNutrients}, foodNutrients=${detailsResponse.foodNutrients?.length || 0}`);
    
    // Extract nutrition values
    const nutrition = this.extractNutrition(detailsResponse, quantity);
    
    return {
      name: ingredientName,
      quantity: quantity,
      ...nutrition
    };
  }

  /**
   * Select the best food from search results
   */
  selectBestFood(foods) {
    console.log(`🔍 Selecting best food from ${foods.length} results`);
    
    // Priority 1: Branded food (has labelNutrients)
    const brandedFood = foods.find(food => food.dataType === 'Branded');
    if (brandedFood) {
      console.log('🏷️ Selected Branded food:', brandedFood.description || brandedFood.name);
      return brandedFood;
    }
    
    // Priority 2: Food with most nutrients
    const foodWithMostNutrients = foods.reduce((best, current) => {
      const bestNutrients = best.foodNutrients?.length || 0;
      const currentNutrients = current.foodNutrients?.length || 0;
      return currentNutrients > bestNutrients ? current : best;
    }, foods[0]);
    
    console.log(`🥘 Selected food with most nutrients: ${foodWithMostNutrients.foodNutrients?.length || 0} nutrients`);
    return foodWithMostNutrients;
  }

  /**
   * Search for food using USDA API
   */
  async searchFood(query) {
    return new Promise((resolve, reject) => {
      const params = new URLSearchParams({
        api_key: this.apiKey,
        query: query,
        pageSize: 5,
        dataType: ['Foundation', 'SR Legacy', 'Survey (FNDDS)', 'Branded']
      });

      const path = `/fdc/v1/foods/search?${params.toString()}`;
      
      const options = {
        hostname: this.baseUrl,
        path: path,
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      };

      const req = https.request(options, (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          try {
            const jsonData = JSON.parse(data);
            resolve(jsonData);
          } catch (error) {
            reject(error);
          }
        });
      });

      req.on('error', (error) => {
        reject(error);
      });

      req.end();
    });
  }

  /**
   * Get detailed food information
   */
  async getFoodDetails(fdcId) {
    return new Promise((resolve, reject) => {
      const params = new URLSearchParams({
        api_key: this.apiKey
      });

      const path = `/fdc/v1/food/${fdcId}?${params.toString()}`;
      
      const options = {
        hostname: this.baseUrl,
        path: path,
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      };

      const req = https.request(options, (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          try {
            const jsonData = JSON.parse(data);
            resolve(jsonData);
          } catch (error) {
            reject(error);
          }
        });
      });

      req.on('error', (error) => {
        reject(error);
      });

      req.end();
    });
  }

  /**
   * Extract nutrition values from USDA response
   */
  extractNutrition(food, quantity) {
    let nutrition = { calories: 0, protein: 0, carbs: 0, fat: 0 };

    // Enhanced debug logging
    console.log('🔍 Food structure:', {
      dataType: food.dataType,
      hasLabelNutrients: !!food.labelNutrients,
      hasFoodNutrients: !!food.foodNutrients,
      foodNutrientsLength: food.foodNutrients?.length,
      servingSize: food.servingSize,
      servingSizeUnit: food.servingSizeUnit
    });

    // Determine base amount (servingSize or 100g)
    let baseAmount = 100; // Default for standard foods
    
    // Check if it's a branded food with serving size
    if (food.servingSize && food.servingSizeUnit === 'g') {
      baseAmount = food.servingSize;
      console.log('🍽️ Using servingSize as base amount:', baseAmount);
    } else {
      console.log('📊 Using default base amount (100g)');
    }

    // Priority 1: use labelNutrients if available (more accurate)
    if (food.labelNutrients) {
      console.log('🏷️ Using labelNutrients (Branded food)');
      nutrition = this.extractFromLabelNutrients(food.labelNutrients, baseAmount, quantity);
    } else {
      console.log('🥘 Using foodNutrients (Foundation/SR Legacy)');
      nutrition = this.extractFromFoodNutrients(food.foodNutrients, baseAmount, quantity);
    }

    console.log('🧮 Extracted nutrition:', nutrition);
    return this.roundNutrients(nutrition);
  }

  /**
   * Extract nutrition from labelNutrients (preferred method)
   */
  extractFromLabelNutrients(labelNutrients, baseAmount, quantity) {
    const nutrition = { calories: 0, protein: 0, carbs: 0, fat: 0 };

    console.log('🏷️ LabelNutrients structure:', {
      hasCalories: !!labelNutrients.calories,
      hasProtein: !!labelNutrients.protein,
      hasCarbohydrates: !!labelNutrients.carbohydrates,
      hasFat: !!labelNutrients.fat
    });

    // Extract each nutrient if available using optional chaining
    if (labelNutrients.calories?.value) {
      nutrition.calories = this.calculateNutrientValue(labelNutrients.calories.value, baseAmount, quantity);
      console.log('🔥 Calories extracted:', labelNutrients.calories.value);
    }

    if (labelNutrients.protein?.value) {
      nutrition.protein = this.calculateNutrientValue(labelNutrients.protein.value, baseAmount, quantity);
      console.log('🥩 Protein extracted:', labelNutrients.protein.value);
    }

    if (labelNutrients.carbohydrates?.value) {
      nutrition.carbs = this.calculateNutrientValue(labelNutrients.carbohydrates.value, baseAmount, quantity);
      console.log('🌾 Carbs extracted:', labelNutrients.carbohydrates.value);
    }

    if (labelNutrients.fat?.value) {
      nutrition.fat = this.calculateNutrientValue(labelNutrients.fat.value, baseAmount, quantity);
      console.log('🧈 Fat extracted:', labelNutrients.fat.value);
    }

    return nutrition;
  }

  /**
   * Extract nutrition from foodNutrients array (enhanced for Foundation/SR Legacy)
   */
  extractFromFoodNutrients(foodNutrients, baseAmount, quantity) {
    const nutrition = { calories: 0, protein: 0, carbs: 0, fat: 0 };

    if (!foodNutrients || !Array.isArray(foodNutrients)) {
      console.log('❌ No foodNutrients array found');
      return nutrition;
    }

    console.log(`🥘 Processing ${foodNutrients.length} foodNutrients`);

    for (const nutrient of foodNutrients) {
      // Handle both full structure and abridged structure
      const nutrientId = nutrient.nutrient?.id || nutrient.nutrientId;
      const nutrientName = nutrient.nutrient?.name || nutrient.nutrientName;
      const value = nutrient.amount || nutrient.value || 0;

      console.log(`🔍 Processing nutrient: ID=${nutrientId}, Name=${nutrientName}, Value=${value}`);

      // Priority 1: Use nutrient ID (most accurate)
      if (nutrientId === 1008) { // Energy (calories)
        nutrition.calories = this.calculateNutrientValue(value, baseAmount, quantity);
        console.log('🔥 Calories found via ID 1008:', value);
      } else if (nutrientId === 1003) { // Protein
        nutrition.protein = this.calculateNutrientValue(value, baseAmount, quantity);
        console.log('🥩 Protein found via ID 1003:', value);
      } else if (nutrientId === 1005) { // Carbohydrate by difference
        nutrition.carbs = this.calculateNutrientValue(value, baseAmount, quantity);
        console.log('🌾 Carbs found via ID 1005:', value);
      } else if (nutrientId === 1004) { // Total lipid (fat)
        nutrition.fat = this.calculateNutrientValue(value, baseAmount, quantity);
        console.log('🧈 Fat found via ID 1004:', value);
      }
      // Priority 2: Fallback to name matching (less reliable but needed)
      else if (nutrientName && value > 0) {
        const name = nutrientName.toLowerCase();
        if (name.includes('energy') && nutrition.calories === 0) {
          nutrition.calories = this.calculateNutrientValue(value, baseAmount, quantity);
          console.log('🔥 Calories found via name:', nutrientName);
        } else if (name.includes('protein') && nutrition.protein === 0) {
          nutrition.protein = this.calculateNutrientValue(value, baseAmount, quantity);
          console.log('🥩 Protein found via name:', nutrientName);
        } else if (name.includes('carbohydrate') && nutrition.carbs === 0) {
          nutrition.carbs = this.calculateNutrientValue(value, baseAmount, quantity);
          console.log('🌾 Carbs found via name:', nutrientName);
        } else if (name.includes('fat') && !name.includes('fatty acid') && nutrition.fat === 0) {
          nutrition.fat = this.calculateNutrientValue(value, baseAmount, quantity);
          console.log('🧈 Fat found via name:', nutrientName);
        }
      }
    }

    console.log('🧮 Final nutrition from foodNutrients:', nutrition);
    return nutrition;
  }

  /**
   * Calculate nutrient value for specific quantity
   */
  calculateNutrientValue(nutrientValue, baseAmount, quantity) {
    if (!nutrientValue || !baseAmount || !quantity) {
      console.log('❌ Invalid calculation:', { nutrientValue, baseAmount, quantity });
      return 0;
    }

    const result = (nutrientValue / baseAmount) * quantity;
    console.log(`🧮 Calculation: (${nutrientValue} / ${baseAmount}) * ${quantity} = ${result}`);
    return result;
  }

  /**
   * Round nutrient values to 2 decimal places
   */
  roundNutrients(nutrition) {
    return {
      calories: Math.round((nutrition.calories + Number.EPSILON) * 100) / 100,
      protein: Math.round((nutrition.protein + Number.EPSILON) * 100) / 100,
      carbs: Math.round((nutrition.carbs + Number.EPSILON) * 100) / 100,
      fat: Math.round((nutrition.fat + Number.EPSILON) * 100) / 100
    };
  }

  /**
   * Add nutrition values to totals
   */
  addToTotals(totals, nutrition) {
    totals.calories += nutrition.calories;
    totals.protein += nutrition.protein;
    totals.carbs += nutrition.carbs;
    totals.fat += nutrition.fat;
  }

  /**
   * Reusable function for diet plan integration
   */
  async calculateIngredientsNutrition(ingredients) {
    const results = [];
    let totals = { calories: 0, protein: 0, carbs: 0, fat: 0 };

    for (const ingredient of ingredients) {
      try {
        const nutritionData = await this.getIngredientNutrition(
          ingredient.name.toLowerCase().trim(),
          parseFloat(ingredient.quantity)
        );
        results.push(nutritionData);
        this.addToTotals(totals, nutritionData);
      } catch (error) {
        console.error(`Error calculating nutrition for ${ingredient.name}:`, error.message);
        // Add default values
        results.push({
          name: ingredient.name,
          quantity: parseFloat(ingredient.quantity),
          calories: 0,
          protein: 0,
          carbs: 0,
          fat: 0
        });
      }
    }

    return {
      results,
      totals: this.roundNutrients(totals)
    };
  }

  /**
   * Clear cache (for testing or memory management)
   */
  clearCache() {
    this.cache.clear();
  }

  /**
   * Get cache size (for monitoring)
   */
  getCacheSize() {
    return this.cache.size;
  }
}

module.exports = new NutritionController();
