import { useState, useEffect, useCallback } from 'react';
import { BeakerIcon, ArrowLeft, Info } from 'lucide-react';
import { useLocation, useNavigate } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { BentoGrid } from '@/components/ui/bento-grid';
import { toast } from 'sonner';
import useAuthStore from '../../../store/authStore';
import cocktailService from '../../../services/cocktail.service';
import GlassSelector from './components/GlassSelector';
import IngredientRequirements from './components/IngredientRequirements';
import DrinkCustomizer from './components/DrinkCustomizer';

interface Ingredient {
  name: string;
  amount: number;
  unit: string;
}

interface Glass {
  id: string;
  name: string;
  sizeInMl: number;
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

  useEffect(() => {
    if (recipe) {
      if (recipe.defaultGlass) {
        setSelectedGlass(recipe.defaultGlass);
        setAmountToProduce(recipe.defaultGlass.sizeInMl);
      } else {
        setAmountToProduce(250);
      }
      setIngredients(recipe.ingredients || []);
    }
  }, [recipe]);

  useEffect(() => {
    if (recipe && amountToProduce) {
      checkFeasibility(recipe.id, getOrderConfig());
    }
  }, [recipe, amountToProduce, boost]);

  const getOrderConfig = () => ({
    amountOrderedInMl: amountToProduce || recipe?.defaultGlass?.sizeInMl || 250,
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

  const handleMakeDrink = useCallback(() => {
    if (!recipe) return;
    const orderConfig = getOrderConfig();
    orderDrink(recipe.id, orderConfig);
  }, [recipe, amountToProduce, boost, additionalIngredients, token]);

  // Handle redirects in useEffect to prevent infinite loops
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
        <div className="p-3 sm:p-4">
          {/* Bento Grid Layout */}
          <BentoGrid className="grid-cols-1 md:grid-cols-2 lg:grid-cols-3 auto-rows-[minmax(200px,auto)] gap-3 sm:gap-4 max-w-7xl mx-auto">
            {/* Hero Image - Large featured card */}
            {recipe.image && (
              <Card className="md:col-span-2 lg:col-span-2 md:row-span-2 overflow-hidden group">
                <CardContent className="p-0 h-full relative">
                  <div className="relative w-full h-full min-h-[300px] md:min-h-[400px]">
                    <img
                      className="object-cover absolute inset-0 w-full h-full transition-transform duration-500 group-hover:scale-105"
                      src={recipe.image}
                      alt={recipe.name}
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <h3 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white break-words flex-1">
                          {recipe.name}
                        </h3>
                        {recipe.alcoholic && (
                          <Badge
                            variant="destructive"
                            className="shrink-0 text-xs sm:text-sm"
                          >
                            Alcoholic
                          </Badge>
                        )}
                      </div>
                      {recipe.description && (
                        <p className="text-white/90 text-sm sm:text-base whitespace-normal break-words line-clamp-3">
                          {recipe.description}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Make Drink Button - Prominent action card */}
            <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20 hover:shadow-lg transition-shadow">
              <CardContent className="p-4 sm:p-6 h-full flex flex-col justify-center gap-3">
                <Button
                  type="button"
                  size="lg"
                  className="w-full h-14 sm:h-16 gap-2 sm:gap-3 text-base sm:text-lg font-bold shadow-lg hover:shadow-xl transition-all duration-200"
                  onClick={handleMakeDrink}
                  disabled={!canOrderDrink || loading}
                >
                  {loading && <Spinner className="w-5 h-5" />}
                  {!loading && <BeakerIcon className="w-5 h-5 sm:w-6 sm:h-6" />}
                  {loading ? 'Making...' : 'Make Drink'}
                </Button>
                {!canOrderDrink && !loading && (
                  <p className="text-sm sm:text-base text-error text-center mt-3 font-medium">
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
            <Card className="md:col-span-2 lg:col-span-1 hover:shadow-md transition-shadow">
              <CardContent className="p-4 sm:p-6">
                <GlassSelector
                  selectedGlass={selectedGlass}
                  defaultGlass={recipe.defaultGlass || null}
                  token={token}
                  setSelectedGlass={setSelectedGlass}
                  onGlassChange={(glass) => {
                    if (glass) {
                      setAmountToProduce(glass.sizeInMl);
                    }
                  }}
                />
              </CardContent>
            </Card>

            {/* Recipe Ingredients Card */}
            <Card className="md:col-span-1 hover:shadow-md transition-shadow">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center gap-2 mb-4">
                  <BeakerIcon className="w-5 h-5 text-primary" />
                  <h3 className="font-bold text-base sm:text-lg">Recipe</h3>
                </div>
                <ul className="space-y-2 text-sm sm:text-base">
                  {ingredients.slice(0, 5).map((item, index) => (
                    <li
                      key={index}
                      className="flex justify-between gap-2 whitespace-normal break-words"
                    >
                      <span className="font-medium">{item.name}</span>
                      <span className="text-muted-foreground">
                        {item.amount} {item.unit}
                      </span>
                    </li>
                  ))}
                  {ingredients.length > 5 && (
                    <li className="text-muted-foreground text-xs">
                      +{ingredients.length - 5} more...
                    </li>
                  )}
                </ul>
              </CardContent>
            </Card>

            {/* Required Ingredients Card */}
            {feasibilityResult?.requiredIngredients && (
              <Card className="md:col-span-1 hover:shadow-md transition-shadow">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Info className="w-5 h-5 text-primary" />
                    <h3 className="font-bold text-base sm:text-lg">
                      Available
                    </h3>
                  </div>
                  <IngredientRequirements
                    requiredIngredients={feasibilityResult.requiredIngredients}
                  />
                </CardContent>
              </Card>
            )}

            {/* Customizer section - Spans full width */}
            <div className="md:col-span-2 lg:col-span-3">
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
          </BentoGrid>
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
