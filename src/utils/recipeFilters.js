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
 * Checks if a recipe is available (all ingredients are on pumps or in the bar)
 * @param {Object} recipe - The recipe to check
 * @returns {boolean} - Whether the recipe is available
 */
export const isAvailable = (recipe) => {
  if (!recipe?.ingredients || !Array.isArray(recipe.ingredients)) return false;

  // Check that ALL ingredients are available (on pumps or in bar)
  // AND that there are no missing amounts
  return recipe.ingredients.every((ingredient) => {
    const isOnPump = ingredient.onPump === true;
    const isInBar = ingredient.inBar === true;

    // Check for missing amounts in various possible formats
    const amountMissing =
      ingredient.amountMissing || ingredient.missingAmount || 0;
    const hasNoMissingAmount = amountMissing <= 0;

    return (isOnPump || isInBar) && hasNoMissingAmount;
  });
};

/**
 * Filters recipes based on the provided filters
 * @param {Array} recipes - Array of recipes to filter
 * @param {Object} filters - Filter options (automatic, manual, available)
 * @param {Set} fabricableRecipes - Set of fabricable recipe IDs (unused but kept for compatibility)
 * @returns {Array} - Filtered array of recipes
 */
export const filterRecipes = (recipes, filters, fabricableRecipes) => {
  if (!recipes?.length) return [];

  // Early return if no filters are active
  if (!filters.automatic && !filters.manual && !filters.available) {
    return recipes;
  }

  // Filter recipes based on active filters
  return recipes
    .filter((recipe) => {
      if (!recipe) return false;

      const recipeIsAutomatic = isAutomatic(recipe);
      const recipeRequiresManual = requiresManual(recipe);
      const recipeIsAvailable = isAvailable(recipe);

      // Apply filters - all active filters must be satisfied
      const activeFilters = [];

      if (filters.automatic) activeFilters.push(recipeIsAutomatic);
      if (filters.manual) activeFilters.push(recipeRequiresManual);
      if (filters.available) activeFilters.push(recipeIsAvailable);

      // If no filters are active, show all recipes
      if (activeFilters.length === 0) return true;

      // All active filters must be true (AND logic)
      return activeFilters.every((filter) => filter === true);
    })
    .sort((a, b) => {
      // Sort by name for consistent ordering
      return a.name.localeCompare(b.name);
    });
};
