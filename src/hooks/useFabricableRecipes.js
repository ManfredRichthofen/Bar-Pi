import { useCallback, useRef, useState } from 'react';
import CocktailService from '../services/cocktail.service.js';

const DEFAULT_BATCH_SIZE = 50;

function buildDefaultOrderConfig(recipe) {
  return {
    amountOrderedInMl: recipe.defaultGlass?.sizeInMl || 250,
    customisations: {
      boost: 100,
      additionalIngredients: [],
    },
    productionStepReplacements: [],
    ingredientGroupReplacements: [],
    useAutomaticIngredients: true,
    skipMissingIngredients: false,
    allowManualIngredients: true,
    allowAutomaticIngredients: true,
    checkMissingIngredients: true,
  };
}

/**
 * Evaluates feasibility the same way Simple drinks historically did:
 * feasible + no missing amounts + no unpumped automated ingredients.
 */
async function isRecipeFabricable(recipe, token) {
  const result = await CocktailService.checkFeasibility(
    recipe.id,
    buildDefaultOrderConfig(recipe),
    false,
    token,
  );

  const hasMissingIngredients = result?.requiredIngredients?.some(
    (item) => item.amountMissing > 0,
  );

  const hasUnpumpedAutomaticIngredients = result?.requiredIngredients?.some(
    (item) => item.ingredient.type === 'automated' && !item.ingredient.onPump,
  );

  return Boolean(
    result?.feasible &&
      !hasMissingIngredients &&
      !hasUnpumpedAutomaticIngredients,
  );
}

/**
 * Shared fabricability Set + batched checker for drinks browsers.
 *
 * @param {object} options
 * @param {string|null} options.token
 * @param {(err: unknown) => void} [options.onUnauthorized] - called on 401
 * @param {number} [options.batchSize]
 */
export function useFabricableRecipes({
  token,
  onUnauthorized,
  batchSize = DEFAULT_BATCH_SIZE,
} = {}) {
  const [fabricableRecipes, setFabricableRecipes] = useState(() => new Set());
  const fabricableRecipesRef = useRef(fabricableRecipes);
  fabricableRecipesRef.current = fabricableRecipes;
  const onUnauthorizedRef = useRef(onUnauthorized);
  onUnauthorizedRef.current = onUnauthorized;

  const checkFabricability = useCallback(
    async (recipes) => {
      if (!token || !recipes?.length) return fabricableRecipesRef.current;

      const fabricableSet = new Set(fabricableRecipesRef.current);

      for (let i = 0; i < recipes.length; i += batchSize) {
        const batch = recipes.slice(i, i + batchSize);
        const results = await Promise.allSettled(
          batch.map(async (recipe) => {
            if (fabricableSet.has(recipe.id)) {
              return { id: recipe.id, feasible: true };
            }

            try {
              const feasible = await isRecipeFabricable(recipe, token);
              return { id: recipe.id, feasible };
            } catch (err) {
              if (err?.response?.status === 401) {
                onUnauthorizedRef.current?.(err);
                return { id: recipe.id, feasible: false };
              }
              console.error(
                `Failed to check fabricability for recipe ${recipe.id}:`,
                err,
              );
              return { id: recipe.id, feasible: false };
            }
          }),
        );

        results.forEach((result) => {
          if (result.status === 'fulfilled' && result.value.feasible) {
            fabricableSet.add(result.value.id);
          }
        });

        // Update after each batch so the UI can show progress
        setFabricableRecipes(new Set(fabricableSet));
      }

      return fabricableSet;
    },
    [token, batchSize],
  );

  return {
    fabricableRecipes,
    setFabricableRecipes,
    checkFabricability,
  };
}

export default useFabricableRecipes;
