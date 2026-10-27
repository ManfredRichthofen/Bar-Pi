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

export const CLIENT_FILTER_KEYS = [
  'automatic',
  'manual',
  'available',
  'alcoholic',
  'nonAlcoholic',
  'favorited',
  'fabricable',
];

export const DEFAULT_FILTERS = {
  ...Object.fromEntries(CLIENT_FILTER_KEYS.map((key) => [key, false])),
  collectionId: null,
};

export const countActiveFilters = (filters) =>
  Object.values(filters ?? {}).filter(Boolean).length;

export const hasActiveClientFilters = (filters) =>
  CLIENT_FILTER_KEYS.some((key) => filters?.[key]);

const isAlcoholic = (recipe) =>
  recipe.alcoholic ??
  recipe.ingredients?.some((ingredient) => ingredient.alcoholContent > 0) ??
  false;

/**
 * Filters one page of recipes by the client-side filters. The collection filter
 * is applied by the server and is not handled here.
 * @param {Array} recipes
 * @param {Object} filters
 * @param {Set<number>} fabricableRecipes - IDs of recipes confirmed makeable
 * @param {Set<number>} favoriteIds
 */
export const filterRecipes = (
  recipes,
  filters,
  fabricableRecipes = new Set(),
  favoriteIds = new Set(),
) => {
  if (!recipes?.length) return [];
  if (!hasActiveClientFilters(filters)) return recipes;

  const predicates = {
    automatic: isAutomatic,
    manual: requiresManual,
    available: isAvailable,
    alcoholic: isAlcoholic,
    nonAlcoholic: (recipe) => !isAlcoholic(recipe),
    favorited: (recipe) => favoriteIds.has(recipe.id),
    fabricable: (recipe) => fabricableRecipes.has(recipe.id),
  };
  const active = CLIENT_FILTER_KEYS.filter((key) => filters[key]);

  return recipes.filter(
    (recipe) => recipe && active.every((key) => predicates[key](recipe)),
  );
};
