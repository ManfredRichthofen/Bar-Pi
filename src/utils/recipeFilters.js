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
    .every((ingredient) => ingredient.onPump);
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
    .some((ingredient) => ingredient.onPump);
};

/**
 * Filters recipes based on the provided filters
 * @param {Array} recipes - Array of recipes to filter
 * @param {Object} filters - Filter options (automatic, manual, fabricable)
 * @param {Set} fabricableRecipes - Set of fabricable recipe IDs
 * @returns {Array} - Filtered array of recipes
 */
export const filterRecipes = (recipes, filters, fabricableRecipes) => {
  if (!recipes?.length) return [];

  // Early return if no filters are active
  if (!filters.automatic && !filters.manual && !filters.fabricable) {
    return recipes;
  }

  // Pre-compute recipe properties to avoid repeated calculations
  const recipeProperties = recipes.map((recipe) => ({
    recipe,
    isAutomatic: isAutomatic(recipe),
    requiresManual: requiresManual(recipe),
    isFullyAutomaticOnPump:
      isAutomatic(recipe) && allAutomaticIngredientsOnPump(recipe),
    hasPumpIngredientsAndManual:
      hasAutomaticIngredientsOnPump(recipe) && requiresManual(recipe),
    isFabricable: fabricableRecipes.has(recipe.id),
  }));

  // Filter recipes based on active filters
  const filteredContent = recipeProperties
    .filter(
      ({
        recipe,
        isAutomatic,
        requiresManual,
        isFullyAutomaticOnPump,
        hasPumpIngredientsAndManual,
      }) => {
        if (!recipe) return false;

        // Apply automatic/manual filters
        if (filters.automatic || filters.manual) {
          if (filters.automatic && filters.manual) {
            return isAutomatic || requiresManual;
          }
          if (filters.automatic) {
            return isAutomatic;
          }
          if (filters.manual) {
            return requiresManual && !isAutomatic;
          }
        }

        // Apply fabricable filter
        if (filters.fabricable) {
          return fabricableRecipes.has(recipe.id);
        }

        return true;
      },
    )
    .map(({ recipe, isFabricable }) => ({ recipe, isFabricable }));

  // Sort results: fabricable first, then by name
  return filteredContent
    .filter(({ recipe, isFabricable }) => {
      // If multiple filters are active, apply all of them
      const activeFilters = Object.entries(filters).filter(
        ([_, value]) => value,
      );

      if (activeFilters.length <= 1) return true;

      // Check each active filter
      return activeFilters.every(([filterName]) => {
        switch (filterName) {
          case 'automatic':
            return isAutomatic(recipe);
          case 'manual':
            return requiresManual(recipe) && !isAutomatic(recipe);
          case 'fabricable':
            return fabricableRecipes.has(recipe.id);
          default:
            return true;
        }
      });
    })
    .sort((a, b) => {
      if (a.isFabricable !== b.isFabricable) {
        return b.isFabricable - a.isFabricable;
      }
      return a.recipe.name.localeCompare(b.recipe.name);
    })
    .map(({ recipe }) => recipe);
};
