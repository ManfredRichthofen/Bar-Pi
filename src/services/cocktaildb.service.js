import axios from 'axios';

const COCKTAILDB_API_BASE = 'https://www.thecocktaildb.com/api/json/v1/1';

class CocktailDBService {
  /**
   * Search cocktails by name
   * @param {string} searchTerm - The search term
   * @returns {Promise<Array>} Array of cocktail results
   */
  async searchCocktails(searchTerm) {
    try {
      const response = await axios.get(`${COCKTAILDB_API_BASE}/search.php`, {
        params: { s: searchTerm },
      });
      return response.data.drinks || [];
    } catch (error) {
      console.error('Failed to search cocktails:', error);
      throw error;
    }
  }

  /**
   * Get cocktail by ID
   * @param {string} id - The cocktail ID
   * @returns {Promise<Object>} Cocktail details
   */
  async getCocktailById(id) {
    try {
      const response = await axios.get(`${COCKTAILDB_API_BASE}/lookup.php`, {
        params: { i: id },
      });
      return response.data.drinks?.[0] || null;
    } catch (error) {
      console.error('Failed to get cocktail:', error);
      throw error;
    }
  }

  /**
   * Get random cocktail
   * @returns {Promise<Object>} Random cocktail
   */
  async getRandomCocktail() {
    try {
      const response = await axios.get(`${COCKTAILDB_API_BASE}/random.php`);
      return response.data.drinks?.[0] || null;
    } catch (error) {
      console.error('Failed to get random cocktail:', error);
      throw error;
    }
  }

  /**
   * Convert CocktailDB cocktail to internal recipe format
   * @param {Object} cocktail - CocktailDB cocktail object
   * @returns {Object} Recipe in internal format
   */
  convertToRecipeFormat(cocktail) {
    if (!cocktail) return null;

    // Extract ingredients and measurements
    const ingredients = [];
    for (let i = 1; i <= 15; i++) {
      const ingredient = cocktail[`strIngredient${i}`];
      const measure = cocktail[`strMeasure${i}`];
      
      if (ingredient && ingredient.trim()) {
        ingredients.push({
          name: ingredient.trim(),
          measure: measure ? measure.trim() : '',
        });
      }
    }

    return {
      name: cocktail.strDrink,
      description: cocktail.strInstructions || '',
      category: cocktail.strCategory,
      alcoholic: cocktail.strAlcoholic === 'Alcoholic',
      glass: cocktail.strGlass,
      imageUrl: cocktail.strDrinkThumb,
      ingredients: ingredients,
      instructions: cocktail.strInstructions,
      tags: cocktail.strTags ? cocktail.strTags.split(',').map(t => t.trim()) : [],
      cocktailDbId: cocktail.idDrink,
      dateModified: cocktail.strModified,
    };
  }

  /**
   * Download image from URL as blob
   * @param {string} imageUrl - The image URL
   * @returns {Promise<Blob>} Image blob
   */
  async downloadImage(imageUrl) {
    try {
      const response = await axios.get(imageUrl, {
        responseType: 'blob',
      });
      return response.data;
    } catch (error) {
      console.error('Failed to download image:', error);
      throw error;
    }
  }

  /**
   * Parse measurement string to amount and unit
   * @param {string} measure - Measurement string (e.g., "1 oz", "2 cl", "1/2 tsp")
   * @returns {Object} { amount: number, unit: string }
   */
  parseMeasurement(measure) {
    if (!measure || measure.trim() === '') {
      return { amount: 30, unit: 'milliliter' };
    }

    const cleaned = measure.trim().toLowerCase();
    

    const unitMapping = {

      'tsp': 'teaspoons',
      'teaspoon': 'teaspoons',
      'teaspoons': 'teaspoons',
      'tbsp': 'tablespoons',
      'tablespoon': 'tablespoons',
      'tablespoons': 'tablespoons',
      'piece': 'pieces',
      'pieces': 'pieces',
      'g': 'grams',
      'gram': 'grams',
      'grams': 'grams',
      
      'oz': 'milliliter',
      'cl': 'milliliter',
      'ml': 'milliliter',
      'milliliter': 'milliliter',
      'shot': 'milliliter',
      'jigger': 'milliliter',
      'dash': 'milliliter',
      'splash': 'milliliter',
      'cup': 'milliliter',
    };
    
    const mlConversions = {
      'oz': 30,
      'cl': 10,
      'ml': 1,
      'milliliter': 1,
      'shot': 45,
      'jigger': 45,
      'dash': 1,
      'splash': 5,
      'cup': 240,
    };


    const match = cleaned.match(/(\d+(?:\/\d+)?(?:\.\d+)?)\s*([a-z]+)?/);
    
    if (match) {
      let amount = match[1];
      let unit = match[2] || 'ml';
      

      if (amount.includes('/')) {
        const [num, den] = amount.split('/').map(Number);
        amount = num / den;
      } else {
        amount = parseFloat(amount);
      }
      

      const mappedUnit = unitMapping[unit] || 'milliliter';
      

      if (mappedUnit === 'milliliter' && mlConversions[unit]) {
        amount = amount * mlConversions[unit];
      }
      
      return { amount: Math.round(amount * 100) / 100, unit: mappedUnit };
    }
    

    return { amount: 30, unit: 'milliliter' };
  }
}

export default new CocktailDBService();
