import React from 'react';
import { toast } from 'sonner';
import cocktailService from '../services/cocktail.service';

export const areAllIngredientsAvailable = (requiredIngredients) => {
  if (!requiredIngredients) return false;
  return !requiredIngredients.some((item) => item.amountMissing > 0);
};

export const checkFeasibility = async (
  recipeId,
  orderConfig,
  token,
  setChecking,
  setFeasibilityResult
) => {
  setChecking(true);
  try {
    const result = await cocktailService.checkFeasibility(
      recipeId,
      orderConfig,
      false,
      token
    );
    setFeasibilityResult(result);
    return result;
  } catch (error) {
    console.error('Feasibility check failed:', error.response?.data || error);
    toast.error('Failed to check drink feasibility');
    return false;
  } finally {
    setChecking(false);
  }
};

export const orderDrink = async (
  recipeId,
  orderConfig,
  token,
  setLoading,
  navigate,
  successRoute
) => {
  setLoading(true);
  try {
    const isFeasible = await checkFeasibility(
      recipeId,
      orderConfig,
      token,
      setLoading,
      () => {}
    );
    
    if (!isFeasible?.feasible) {
      toast.error('This drink cannot be made at the moment');
      return;
    }

    if (!areAllIngredientsAvailable(isFeasible.requiredIngredients)) {
      toast.error('Some ingredients are missing or insufficient');
      return;
    }

    await cocktailService.order(recipeId, orderConfig, false, token);
    toast.success('Drink ordered successfully');
    navigate({ to: successRoute });
  } catch (error) {
    if (error.response?.data?.message) {
      console.error('Order failed:', error.response.data);
      if (error.response.data.message.includes('pumps are currently occupied')) {
        toast.error(
          'Some pumps are currently occupied - please wait for the current drink to finish'
        );
      } else {
        toast.error(error.response.data.message);
      }
    } else {
      toast.error('Failed to order drink');
    }
  } finally {
    setLoading(false);
  }
};

export const createSimpleOrderConfig = (
  amountToProduce,
  boost,
  additionalIngredients
) => ({
  amountOrderedInMl: amountToProduce || 250,
  customisations: {
    boost: parseInt(boost.toString()) || 100,
    additionalIngredients: additionalIngredients || [],
  },
  productionStepReplacements: [],
  ingredientGroupReplacements: [],
  useAutomaticIngredients: true,
  skipMissingIngredients: false,
});

export const createAdvancedOrderConfig = (
  amountToProduce,
  customizations
) => {
  const config = {
    amountOrderedInMl: amountToProduce || 250,
    customisations: {
      boost: customizations.boost,
      additionalIngredients: customizations.additionalIngredients
        .filter((ing) => ing.amount > 0)
        .map((ing) => ({
          ingredientId: ing.ingredient.id,
          amount: ing.amount,
        })),
    },
    productionStepReplacements: [],
  };
  console.log('Generated order config:', config);
  return config;
};

export const useDebouncedFeasibilityCheck = (deps, checkFn, delay = 300) => {
  const timeoutRef = React.useRef(null);

  React.useEffect(() => {
    if (deps.every(Boolean)) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        checkFn();
      }, delay);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, deps);

  return timeoutRef;
};
