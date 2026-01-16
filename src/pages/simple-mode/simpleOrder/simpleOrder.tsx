import { useLocation, useNavigate } from '@tanstack/react-router';
import { ArrowLeft, BeakerIcon, Info } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import cocktailService from '../../../services/cocktail.service';
import useAuthStore from '../../../store/authStore';
import DrinkCustomizer from './components/DrinkCustomizer';
import GlassSelector from './components/GlassSelector';
import IngredientRequirements from './components/IngredientRequirements';

interface Ingredient {
  name: string;
  amount: number;
  unit: string;
}

interface Glass {
  id: string;
  name: string;
  size: number;
  sizeInMl?: number;
  description?: string;
}

interface Recipe {
  id: string;
  name: string;
  description?: string;
  image?: string;
  alcoholic: boolean;
  defaultGlass?: Glass;
  ingredients: Ingredient[];
}

const SimpleOrder = () => {
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [feasibilityResult, setFeasibilityResult] = useState<any>(null);
  const [amountToProduce, setAmountToProduce] = useState<number | null>(null);
  const [hasOrdered, setHasOrdered] = useState(false);
  const token = useAuthStore((state) => state.token);
  const location = useLocation();
  const navigate = useNavigate();
  const recipe = (location.state as any)?.recipe as Recipe | undefined;
  const [selectedGlass, setSelectedGlass] = useState<Glass | null>(null);
  const [boost, setBoost] = useState(100);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [additionalIngredients, setAdditionalIngredients] = useState<any[]>([]);
  const feasibilityCheckTimeout = useRef<NodeJS.Timeout | null>(null);

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (recipe) {
      setIngredients(recipe.ingredients || []);
    }
  }, [recipe]);

  useEffect(() => {
    if (recipe && amountToProduce) {
      // Clear existing timeout
      if (feasibilityCheckTimeout.current) {
        clearTimeout(feasibilityCheckTimeout.current);
      }

      // Debounce feasibility check to prevent slider jumping
      feasibilityCheckTimeout.current = setTimeout(() => {
        checkFeasibility(recipe.id, getOrderConfig());
      }, 300);
    }

    return () => {
      if (feasibilityCheckTimeout.current) {
        clearTimeout(feasibilityCheckTimeout.current);
      }
    };
  }, [recipe, amountToProduce, boost]);

  const getOrderConfig = () => ({
    amountOrderedInMl:
      amountToProduce ||
      (recipe?.defaultGlass as any)?.size ||
      recipe?.defaultGlass?.sizeInMl ||
      250,
    customisations: {
      boost: parseInt(boost.toString()) || 100,
      additionalIngredients: additionalIngredients || [],
    },
    productionStepReplacements: [],
    ingredientGroupReplacements: [],
    useAutomaticIngredients: true,
    skipMissingIngredients: false,
  });

  const checkFeasibility = async (recipeId: string, orderConfig: any) => {
    setChecking(true);
    try {
      const result = await cocktailService.checkFeasibility(
        recipeId,
        orderConfig,
        false,
        token,
      );
      setFeasibilityResult(result);
      return result;
    } catch (error: any) {
      console.error('Feasibility check failed:', error.response?.data || error);
      toast.error('Failed to check drink feasibility');
      return false;
    } finally {
      setChecking(false);
    }
  };

  const areAllIngredientsAvailable = (requiredIngredients: any[]) => {
    if (!requiredIngredients) return false;
    return !requiredIngredients.some((item) => item.amountMissing > 0);
  };

  const orderDrink = async (recipeId: string, orderConfig: any) => {
    setLoading(true);
    try {
      const isFeasible = await checkFeasibility(recipeId, orderConfig);
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

      // Set flag to prevent redirect
      setHasOrdered(true);

      // Navigate to order status page
      navigate({ to: '/simple/order-status' });
    } catch (error: any) {
      if (error.response?.data?.message) {
        console.error('Order failed:', error.response.data);
        if (
          error.response.data.message.includes('pumps are currently occupied')
        ) {
          toast.error(
            'Some pumps are currently occupied - please wait for the current drink to finish',
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

  const handleMakeDrink = useCallback(() => {
    if (!recipe) return;
    const orderConfig = getOrderConfig();
    orderDrink(recipe.id, orderConfig);
  }, [recipe, amountToProduce, boost, additionalIngredients, token]);

  // Handle redirects in useEffect to prevent infinite loops tanstack router is weird
  useEffect(() => {
    if (hasOrdered) return; // Don't redirect after successful order

    if (!token) {
      navigate({ to: '/login' });
    } else if (!recipe) {
      navigate({ to: '/drinks' });
    }
  }, [token, recipe, navigate, hasOrdered]);

  if (!token || !recipe) return null;

  const canOrderDrink =
    feasibilityResult?.feasible &&
    selectedGlass !== null &&
    !loading &&
    !checking &&
    areAllIngredientsAvailable(feasibilityResult?.requiredIngredients || []);

  // Debug logging
  console.log('canOrderDrink debug:', {
    feasible: feasibilityResult?.feasible,
    selectedGlass: selectedGlass,
    loading,
    checking,
    ingredientsAvailable: areAllIngredientsAvailable(
      feasibilityResult?.requiredIngredients || [],
    ),
    canOrderDrink,
  });

  const hasBoostableIngredients = feasibilityResult?.requiredIngredients?.some(
    (item: any) =>
      item.ingredient.type === 'automated' &&
      item.ingredient.alcoholContent > 0,
  );

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-md border-b border-border shadow-sm pt-2">
        <div className="px-3 sm:px-4 py-3 sm:py-4 flex items-center justify-between">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="rounded-xl transition-all duration-200"
            onClick={() => navigate({ to: '/simple/drinks' })}
          >
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          </Button>
          <h1 className="text-base sm:text-lg font-bold truncate flex-1 mx-2 sm:mx-3 text-center">
            Order Drink
          </h1>
          <div className="w-8 sm:w-10" /> {/* Spacer for centering */}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-3 sm:p-4 lg:p-6 max-w-7xl mx-auto">
          {/* Bento Grid Layout - Responsive for phone, tablet, and desktop */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 sm:gap-4 lg:gap-5 auto-rows-[minmax(140px,auto)]">
            {/* Make Drink Button - Hero card */}
            <Card className="sm:col-span-2 lg:col-span-5 lg:row-span-2 bg-gradient-to-br from-primary/10 via-primary/5 to-background border-primary/20 hover:shadow-lg hover:border-primary/30 transition-all duration-300">
              <CardContent className="p-5 sm:p-6 lg:p-8 h-full flex flex-col justify-center gap-4">
                <div className="flex items-center gap-2 mb-2">
                  <BeakerIcon className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                  <h3 className="font-bold text-lg sm:text-xl lg:text-2xl truncate flex-1">
                    {recipe.name}
                  </h3>
                  {recipe.alcoholic && (
                    <Badge variant="destructive" className="shrink-0 text-xs">
                      21+
                    </Badge>
                  )}
                </div>
                {recipe.description && (
                  <p className="text-sm sm:text-base text-muted-foreground line-clamp-2 sm:line-clamp-3">
                    {recipe.description}
                  </p>
                )}
                <Button
                  type="button"
                  size="lg"
                  className="w-full h-12 sm:h-14 lg:h-16 gap-2 sm:gap-3 text-base sm:text-lg font-bold shadow-lg hover:shadow-xl transition-all duration-200"
                  onClick={handleMakeDrink}
                  disabled={!canOrderDrink || loading}
                >
                  {loading && <Spinner className="w-5 h-5" />}
                  {!loading && <BeakerIcon className="w-5 h-5 sm:w-6 sm:h-6" />}
                  {loading ? 'Making...' : 'Make Drink'}
                </Button>
                {!canOrderDrink && !loading && !checking && (
                  <p className="text-sm text-error text-center font-medium">
                    {feasibilityResult?.requiredIngredients?.some(
                      (item: any) => item.amountMissing > 0,
                    )
                      ? '⚠️ Missing ingredients'
                      : '🥃 Select a glass to continue'}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Glass Selector Card */}
            <Card className="sm:col-span-1 lg:col-span-4 lg:row-span-2 hover:shadow-md hover:border-primary/20 transition-all duration-300">
              <CardContent className="p-4 sm:p-5 lg:p-6 h-full">
                <GlassSelector
                  selectedGlass={selectedGlass}
                  defaultGlass={recipe.defaultGlass || null}
                  token={token}
                  setSelectedGlass={setSelectedGlass}
                  onGlassChange={(glass) => {
                    if (glass) {
                      setAmountToProduce(glass.size || glass.sizeInMl || 250);
                    }
                  }}
                />
              </CardContent>
            </Card>

            {/* Recipe Ingredients Card - Tall card on desktop */}
            <Card className="sm:col-span-1 lg:col-span-3 lg:row-span-3 hover:shadow-md hover:border-primary/20 transition-all duration-300">
              <CardContent className="p-4 sm:p-5 lg:p-6 h-full flex flex-col">
                <div className="flex items-center gap-2 mb-4">
                  <BeakerIcon className="w-5 h-5 text-primary" />
                  <h3 className="font-bold text-base sm:text-lg">Recipe</h3>
                </div>
                <ul className="space-y-2 text-sm sm:text-base flex-1 overflow-y-auto max-h-[400px] lg:max-h-none">
                  {ingredients.map((item, index) => (
                    <li
                      key={index}
                      className="flex justify-between gap-2 whitespace-normal break-words py-1.5 border-b border-border/50 last:border-0"
                    >
                      <span className="font-medium">{item.name}</span>
                      <span className="text-muted-foreground shrink-0">
                        {item.amount} {item.unit}
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Required Ingredients Card - Wide card */}
            {feasibilityResult?.requiredIngredients && (
              <Card className="sm:col-span-2 lg:col-span-9 hover:shadow-md hover:border-primary/20 transition-all duration-300">
                <CardContent className="p-4 sm:p-5 lg:p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Info className="w-5 h-5 text-primary" />
                    <h3 className="font-bold text-base sm:text-lg">
                      Ingredient Availability
                    </h3>
                  </div>
                  <IngredientRequirements
                    requiredIngredients={feasibilityResult.requiredIngredients}
                  />
                </CardContent>
              </Card>
            )}

            {/* Customizer section - Full width */}
            <div className="sm:col-span-2 lg:col-span-12">
              <DrinkCustomizer
                disableBoosting={!hasBoostableIngredients}
                customisations={{
                  boost,
                  additionalIngredients,
                }}
                onCustomisationsChange={(newCustomisations) => {
                  setBoost(newCustomisations.boost);
                  setAdditionalIngredients(
                    newCustomisations.additionalIngredients,
                  );
                }}
                availableIngredients={
                  feasibilityResult?.requiredIngredients?.map(
                    (item: any) => item.ingredient,
                  ) || []
                }
              />
            </div>
          </div>
        </div>
      </div>

      {/* Fixed bottom back button */}
      <div className="bg-background/95 backdrop-blur-md border-t border-border p-3 sm:p-4 shadow-lg">
        <Button
          type="button"
          variant="ghost"
          size="lg"
          className="w-full h-12 sm:h-14 text-sm sm:text-base font-semibold"
          onClick={() => navigate({ to: '/simple/drinks' })}
        >
          Back to Drinks
        </Button>
      </div>
    </div>
  );
};

export default SimpleOrder;
