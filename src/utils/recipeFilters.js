/**
 * Utility functions for recipe filtering
 */

/**
 * Checks if an ingredient is automatic (is of type 'automated')
 * @param {Object} ingredient - The ingredient to check
 * @returns {boolean} - Whether the ingredient is automatic
 */
const isAutomaticIngredient = (ingredient) => {
  if (!ingredient) return false;
  return ingredient.type === 'automated';
};

/**
 * Checks if an ingredient requires manual input (is of type 'manual')
 * @param {Object} ingredient - The ingredient to check
 * @returns {boolean} - Whether the ingredient requires manual input
 */
const isManualIngredient = (ingredient) => {
  if (!ingredient) return false;
  return ingredient.type === 'manual';
};

/**
 * Checks if a recipe can be made automatically (has ONLY automatic ingredients)
 * @param {Object} recipe - The recipe to check
 * @returns {boolean} - Whether the recipe can be made automatically
 */
export const isAutomatic = (recipe) => {
  if (!recipe?.ingredients || !Array.isArray(recipe.ingredients)) return false;
  return recipe.ingredients.every(isAutomaticIngredient);
};

/**
 * Checks if a recipe requires manual ingredients (has at least one manual ingredient)
 * @param {Object} recipe - The recipe to check
 * @returns {boolean} - Whether the recipe requires manual ingredients
 */
export const requiresManual = (recipe) => {
  if (!recipe?.ingredients || !Array.isArray(recipe.ingredients)) return false;
  return recipe.ingredients.some(isManualIngredient);
};

/**
 * Checks if all automatic ingredients in a recipe are on pump
 * @param {Object} recipe - The recipe to check
 * @returns {boolean} - Whether all automatic ingredients are on pump
 */
const allAutomaticIngredientsOnPump = (recipe) => {
  if (!recipe?.ingredients || !Array.isArray(recipe.ingredients)) return false;
  return recipe.ingredients
    .filter(isAutomaticIngredient)
    .every(ingredient => ingredient.onPump);
};

/**
 * Checks if any automatic ingredients in a recipe are on pump
 * @param {Object} recipe - The recipe to check
 * @returns {boolean} - Whether any automatic ingredients are on pump
 */
const hasAutomaticIngredientsOnPump = (recipe) => {
  if (!recipe?.ingredients || !Array.isArray(recipe.ingredients)) return false;
  return recipe.ingredients
    .filter(isAutomaticIngredient)
    .some(ingredient => ingredient.onPump);
};

/**
 * Filters recipes based on the provided filters
 * @param {Array} recipes - Array of recipes to filter
 * @param {Object} filters - Filter options (automatic, manual, fabricable)
 * @param {Set} fabricableRecipes - Set of fabricable recipe IDs
 * @returns {Array} - Filtered array of recipes
 */
export const filterRecipes = (recipes, filters, fabricableRecipes) => {
  if (!recipes) return [];
  
  let filteredContent = [...recipes];
  
  // Apply automatic/manual filters if either is active
  if (filters.automatic || filters.manual) {
    filteredContent = filteredContent.filter((recipe) => {
      if (!recipe) return false;
      
      const canBeAutomatic = isAutomatic(recipe);
      const needsManual = requiresManual(recipe);
      
      // If both filters are active, show both types
      if (filters.automatic && filters.manual) {
        return canBeAutomatic || needsManual;
      }
      
      // If only automatic is active, show drinks that can be made automatically
      if (filters.automatic) {
        return canBeAutomatic;
      }
      
      // If only manual is active, show drinks that require manual ingredients AND are not fully automatic
      if (filters.manual) {
        return needsManual && !canBeAutomatic;
      }
      
      return true;
    });
  }

  // Apply fabricable filter if active
  if (filters.fabricable) {
    filteredContent = filteredContent.filter((recipe) => {
      if (!recipe) return false;

      const isFullyAutomaticOnPump = isAutomatic(recipe) && allAutomaticIngredientsOnPump(recipe);
      const hasPumpIngredientsAndManual = hasAutomaticIngredientsOnPump(recipe) && requiresManual(recipe);
      
      return isFullyAutomaticOnPump || hasPumpIngredientsAndManual;
    });
  }

  // Sort results: fabricable first, then by name
  filteredContent.sort((a, b) => {
    if (!a || !b) return 0;
    
    const aFabricable = fabricableRecipes.has(a.id);
    const bFabricable = fabricableRecipes.has(b.id);
    if (aFabricable !== bFabricable) {
      return bFabricable - aFabricable;
    }
    return a.name.localeCompare(b.name);
  });

  return filteredContent;
}; 