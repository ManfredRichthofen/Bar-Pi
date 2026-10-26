import type { Ingredient, RequiredIngredient } from './types';

export function isAutomatedIngredient(ingredient: Ingredient | undefined) {
  return ingredient?.type === 'automated';
}

export function isManualIngredient(ingredient: Ingredient | undefined) {
  return (
    !!ingredient &&
    (ingredient.type === 'manual' ||
      ingredient.type === 'group' ||
      ingredient.type === 'ingredient')
  );
}

export function organizeRequiredIngredients(
  requiredIngredients: RequiredIngredient[] = [],
) {
  const insufficient = requiredIngredients.filter((x) => x.amountMissing > 0);
  const automated = requiredIngredients.filter(
    (x) => x.ingredient?.type === 'automated',
  );
  const manual = requiredIngredients.filter(
    (x) => x.ingredient?.type === 'manual',
  );
  const inBar = requiredIngredients.filter((x) => x.ingredient?.inBar);
  const notInBar = requiredIngredients.filter((x) => !x.ingredient?.inBar);

  const fulfilledCount = requiredIngredients.length - insufficient.length;
  const fulfillmentPercentage =
    requiredIngredients.length > 0
      ? (fulfilledCount / requiredIngredients.length) * 100
      : 0;

  return {
    insufficient,
    automated,
    manual,
    inBar,
    notInBar,
    isFulfilled: insufficient.length === 0,
    fulfilledCount,
    fulfillmentPercentage,
  };
}

export function getBoostLabel(value: number) {
  if (value === 100) return 'Normal';
  if (value === 0) return 'No Alcohol';
  if (value === 200) return 'Double';
  return `${value > 100 ? '+' : ''}${value - 100}%`;
}
