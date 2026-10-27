import { useLocation, useNavigate } from '@tanstack/react-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { getGlassSizeMl } from '../pages/Shared/order/glassUtils';
import type {
  FeasibilityResult,
  Glass,
  Ingredient,
  OrderCustomizations,
  OrderFlowMode,
  Recipe,
} from '../pages/Shared/order/types';
import ingredientService from '../services/ingredient.service';
import useAuthStore from '../store/authStore';
import {
  areAllIngredientsAvailable,
  checkFeasibility,
  createAdvancedOrderConfig,
  createSimpleOrderConfig,
  orderDrink,
} from '../utils/orderUtils';

export interface UseOrderFlowOptions {
  mode: OrderFlowMode;
  /** Route after a successful order (e.g. `/drinks` or `/simple/order-status`). */
  successRoute: string;
  /** Redirect when recipe is missing. Default `/drinks`. */
  missingRecipeRoute?: string;
  /** Simple mode: prevent post-order redirect away from success. */
  preventRedirectAfterOrder?: boolean;
  /** Simple mode: scroll window to top on mount. */
  scrollToTop?: boolean;
  /** Advanced mode: load full ingredient catalog for customizer. */
  fetchAvailableIngredients?: boolean;
}

export function useOrderFlow({
  mode,
  successRoute,
  missingRecipeRoute = mode === 'simple' ? '/simple/drinks' : '/drinks',
  preventRedirectAfterOrder = mode === 'simple',
  scrollToTop = mode === 'simple',
  fetchAvailableIngredients = mode === 'advanced',
}: UseOrderFlowOptions) {
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [feasibilityResult, setFeasibilityResult] =
    useState<FeasibilityResult | null>(null);
  const [amountToProduce, setAmountToProduce] = useState<number | null>(null);
  const [hasOrdered, setHasOrdered] = useState(false);
  const [selectedGlass, setSelectedGlass] = useState<Glass | null>(null);
  const [customizations, setCustomizations] = useState<OrderCustomizations>({
    boost: 100,
    additionalIngredients: [],
  });
  const [availableIngredients, setAvailableIngredients] = useState<
    Ingredient[]
  >([]);
  const [recipeIngredients, setRecipeIngredients] = useState<
    NonNullable<Recipe['ingredients']>
  >([]);

  const token = useAuthStore((state) => state.token);
  const location = useLocation();
  const navigate = useNavigate();
  const recipe = (location.state as { recipe?: Recipe } | undefined)?.recipe;
  const feasibilityCheckTimeout = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  useEffect(() => {
    if (scrollToTop) {
      window.scrollTo(0, 0);
    }
  }, [scrollToTop]);

  useEffect(() => {
    if (!recipe) return;

    if (recipe.ingredients) {
      setRecipeIngredients(recipe.ingredients);
    }

    // Advanced seeds amount from default glass; Simple waits for GlassSelector
    if (mode === 'advanced') {
      if (recipe.defaultGlass) {
        setSelectedGlass(recipe.defaultGlass);
        setAmountToProduce(getGlassSizeMl(recipe.defaultGlass));
      } else {
        setSelectedGlass(null);
        setAmountToProduce(250);
      }
    }
  }, [recipe, mode]);

  const getOrderConfig = useCallback(() => {
    const amount =
      amountToProduce || getGlassSizeMl(recipe?.defaultGlass) || 250;

    if (mode === 'simple') {
      return createSimpleOrderConfig(
        amount,
        customizations.boost,
        customizations.additionalIngredients,
      );
    }

    return createAdvancedOrderConfig(amount, customizations);
  }, [amountToProduce, customizations, mode, recipe?.defaultGlass]);

  useEffect(() => {
    const shouldCheck =
      mode === 'advanced'
        ? !!(recipe && amountToProduce && selectedGlass && token)
        : !!(recipe && amountToProduce);

    if (!shouldCheck) return;

    if (feasibilityCheckTimeout.current) {
      clearTimeout(feasibilityCheckTimeout.current);
    }

    feasibilityCheckTimeout.current = setTimeout(() => {
      void checkFeasibility(
        recipe!.id,
        getOrderConfig(),
        token,
        setChecking,
        setFeasibilityResult,
      );
    }, 300);

    return () => {
      if (feasibilityCheckTimeout.current) {
        clearTimeout(feasibilityCheckTimeout.current);
      }
    };
  }, [
    recipe,
    amountToProduce,
    selectedGlass,
    customizations.boost,
    customizations.additionalIngredients,
    token,
    mode,
    getOrderConfig,
  ]);

  useEffect(() => {
    if (preventRedirectAfterOrder && hasOrdered) return;

    if (!token) {
      void navigate({ to: '/login' });
    } else if (!recipe) {
      void navigate({ to: missingRecipeRoute });
    }
  }, [
    token,
    recipe,
    navigate,
    hasOrdered,
    preventRedirectAfterOrder,
    missingRecipeRoute,
  ]);

  useEffect(() => {
    if (!fetchAvailableIngredients || !token) return;

    const fetchIngredients = async () => {
      try {
        const ingredients = (await ingredientService.getIngredients(
          token,
        )) as Ingredient[];
        setAvailableIngredients(ingredients);
      } catch (error) {
        console.error('Failed to fetch ingredients:', error);
      }
    };

    void fetchIngredients();
  }, [token, fetchAvailableIngredients]);

  const handleGlassChange = useCallback((glass: Glass | null) => {
    setSelectedGlass(glass);
    if (glass) {
      setAmountToProduce(getGlassSizeMl(glass));
    }
  }, []);

  const handleMakeDrink = useCallback(() => {
    if (!recipe) return;
    const orderConfig = getOrderConfig();
    void orderDrink(
      recipe.id,
      orderConfig,
      token,
      setLoading,
      navigate,
      successRoute,
      // Mark ordered before route change so the missing-recipe effect
      // does not bounce away from the success page mid-navigation.
      () => {
        if (preventRedirectAfterOrder) {
          setHasOrdered(true);
        }
      },
    );
  }, [
    recipe,
    getOrderConfig,
    token,
    navigate,
    successRoute,
    preventRedirectAfterOrder,
  ]);

  const canOrderDrink =
    !!feasibilityResult?.feasible &&
    selectedGlass !== null &&
    !loading &&
    !checking &&
    areAllIngredientsAvailable(feasibilityResult?.requiredIngredients || []);

  const hasBoostableIngredients =
    mode === 'advanced'
      ? ingredientService.hasBoostableIngredients(
          feasibilityResult?.requiredIngredients,
        )
      : !!feasibilityResult?.requiredIngredients?.some(
          (item) =>
            item.ingredient.type === 'automated' &&
            (item.ingredient.alcoholContent ?? 0) > 0,
        );

  /** Ingredients offered in the customizer — mode-specific sources. */
  const customizerIngredients: Ingredient[] =
    mode === 'advanced'
      ? availableIngredients.filter((ing) => ing.type === 'automated')
      : feasibilityResult?.requiredIngredients?.map(
          (item) => item.ingredient,
        ) || [];

  return {
    token,
    recipe,
    loading,
    checking,
    feasibilityResult,
    amountToProduce,
    setAmountToProduce,
    selectedGlass,
    setSelectedGlass,
    customizations,
    setCustomizations,
    boost: customizations.boost,
    additionalIngredients: customizations.additionalIngredients,
    setBoost: (boost: number) =>
      setCustomizations((prev) => ({ ...prev, boost })),
    setAdditionalIngredients: (
      additionalIngredients: OrderCustomizations['additionalIngredients'],
    ) => setCustomizations((prev) => ({ ...prev, additionalIngredients })),
    availableIngredients,
    customizerIngredients,
    recipeIngredients,
    canOrderDrink,
    hasBoostableIngredients,
    handleGlassChange,
    handleMakeDrink,
    navigate,
    hasOrdered,
  };
}
