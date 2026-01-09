import React, { useState, useEffect } from 'react';
import { BeakerIcon, XCircle, PlayCircle } from 'lucide-react';
import { Navigate, useLocation, useNavigate } from '@tanstack/react-router';
import useAuthStore from '../../../store/authStore';
import cocktailService from '../../../services/cocktail.service';
import DrinkCustomizer from './components/DrinkCustomizer';
import glassService from '../../../services/glass.service';
import IngredientRequirements from './components/IngredientRequirements';
import GlassSelector from './components/GlassSelector';
import ingredientService from '../../../services/ingredient.service';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';

const Order = () => {
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [feasibilityResult, setFeasibilityResult] = useState(null);
  const [amountToProduce, setAmountToProduce] = useState(null);
  const token = useAuthStore((state) => state.token);
  const location = useLocation();
  const navigate = useNavigate();
  const recipe = location.state?.recipe;
  const [customizations, setCustomizations] = useState({
    boost: 100,
    additionalIngredients: [],
  });
  const [selectedGlass, setSelectedGlass] = useState(null);

  useEffect(() => {
    if (recipe) {
      if (recipe.defaultGlass) {
        setSelectedGlass(recipe.defaultGlass);
        setAmountToProduce(recipe.defaultGlass.sizeInMl);
      } else {
        setSelectedGlass(null);
        setAmountToProduce(250);
      }
      checkFeasibility(recipe.id, getOrderConfig());
    }
  }, [recipe]);

  const getOrderConfig = () => {
    return {
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
  };

  const checkFeasibility = async (recipeId, orderConfig) => {
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
    } catch (error) {
      toast.error('Failed to check drink feasibility');
      return false;
    } finally {
      setChecking(false);
    }
  };

  const areAllIngredientsAvailable = (requiredIngredients) => {
    if (!requiredIngredients) return false;
    return !requiredIngredients.some((item) => item.amountMissing > 0);
  };

  const orderDrink = async (recipeId, orderConfig) => {
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
      navigate({ to: '/drinks' });
    } catch (error) {
      toast.error('Failed to order drink');
    } finally {
      setLoading(false);
    }
  };

  const handleMakeDrink = () => {
    const orderConfig = getOrderConfig();
    orderDrink(recipe.id, orderConfig);
  };

  const cancelOrder = async () => {
    try {
      await cocktailService.cancelCocktail(token);
      toast.success('Order cancelled');
    } catch (error) {
      toast.error('Failed to cancel order');
    }
  };

  const continueProduction = async () => {
    try {
      await cocktailService.continueProduction(token);
      toast.success('Production continued');
    } catch (error) {
      toast.error('Failed to continue production');
    }
  };

  const handleGlassChange = (glass) => {
    setSelectedGlass(glass);
    if (glass) {
      setAmountToProduce(glass.sizeInMl);
    }
  };

  const handleCustomAmountChange = (value) => {
    setAmountToProduce(value);
  };

  if (!token) return <Navigate to="/login" />;
  if (!recipe) return <Navigate to="/drinks" />;

  const canOrderDrink =
    feasibilityResult?.feasible &&
    !loading &&
    !checking &&
    areAllIngredientsAvailable(feasibilityResult?.requiredIngredients);

  const organizeIngredients = (requiredIngredients) => {
    return {
      inBar: requiredIngredients.filter((item) => item.ingredient.inBar),
      notInBar: requiredIngredients.filter((item) => !item.ingredient.inBar),
      automated: requiredIngredients.filter(
        (item) => item.ingredient.type === 'automated',
      ),
      manual: requiredIngredients.filter(
        (item) => item.ingredient.type === 'manual',
      ),
    };
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 sm:py-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl sm:text-3xl font-bold">Drink Production</h2>
        </div>

        <Card className="mb-6">
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              {recipe.image && (
                <div className="w-full lg:w-1/3">
                  <figure>
                    <img
                      className="w-full rounded-lg object-cover max-h-[200px] sm:max-h-[300px] lg:max-h-none"
                      src={recipe.image}
                      alt={recipe.name}
                    />
                  </figure>
                </div>
              )}

              <div className="flex-1 min-w-0">
                <h3 className="text-lg sm:text-xl font-bold mb-2">
                  {recipe.name}
                </h3>
                {recipe.description && (
                  <p className="mb-3 sm:mb-4 text-base-content/70 text-sm">
                    {recipe.description}
                  </p>
                )}

                <GlassSelector
                  selectedGlass={selectedGlass}
                  customAmount={amountToProduce}
                  onGlassChange={handleGlassChange}
                  onCustomAmountChange={handleCustomAmountChange}
                  defaultGlass={recipe.defaultGlass}
                  token={token}
                />

                <div className="flex flex-wrap gap-2 mt-4">
                  <Button
                    onClick={handleMakeDrink}
                    disabled={!canOrderDrink || loading}
                    className="flex-1 sm:flex-none"
                  >
                    <BeakerIcon className="mr-2 h-4 w-4" />
                    {feasibilityResult
                      ? `Make Drink (${feasibilityResult.totalAmountInMl}ml)`
                      : 'Make Drink'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => navigate({ to: '/drinks' })}
                    className="flex-1 sm:flex-none"
                  >
                    Back to Drinks
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <DrinkCustomizer
          disableBoosting={
            !ingredientService.hasBoostableIngredients(
              feasibilityResult?.requiredIngredients,
            )
          }
          customizations={customizations}
          onCustomizationsChange={setCustomizations}
          availableIngredients={
            feasibilityResult?.requiredIngredients
              ?.map((item) => item.ingredient)
              ?.filter((ing) => ing.type === 'automated') || []
          }
        />

        {checking ? (
          <Card className="mb-6">
            <CardContent className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin" />
            </CardContent>
          </Card>
        ) : (
          feasibilityResult && (
            <>
              <Card className="mb-6">
                <CardContent className="pt-6">
                  <h4 className="text-xl font-bold mb-4">
                    Feasibility Check Result
                  </h4>
                  <Alert
                    variant={
                      feasibilityResult.feasible ? 'default' : 'destructive'
                    }
                  >
                    <AlertDescription>
                      {feasibilityResult.feasible ? (
                        <div className="space-y-1">
                          <div className="font-medium">Drink can be made</div>
                          <div className="text-sm">
                            Total amount: {feasibilityResult.totalAmountInMl}ml
                          </div>
                        </div>
                      ) : (
                        <div>{feasibilityResult.reason}</div>
                      )}
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>

              {feasibilityResult.requiredIngredients?.length > 0 && (
                <>
                  <IngredientRequirements
                    requiredIngredients={feasibilityResult.requiredIngredients}
                  />

                  {(() => {
                    const ingredients = organizeIngredients(
                      feasibilityResult.requiredIngredients,
                    );
                    return (
                      <div className="space-y-4">
                        {ingredients.automated.length > 0 && (
                          <Card className="mb-6">
                            <CardContent className="pt-6">
                              <h5 className="text-lg font-bold mb-4">
                                Automated Ingredients
                              </h5>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {ingredients.automated.map((item, index) => (
                                  <Card key={index} className="bg-muted">
                                    <CardContent className="p-4">
                                      <div className="flex justify-between items-center">
                                        <div>
                                          <p className="font-semibold">
                                            {item.ingredient.name}
                                          </p>
                                          <div className="text-sm text-muted-foreground">
                                            Required: {item.amountRequired}
                                            {item.ingredient.unit}
                                            {item.amountMissing > 0 && (
                                              <div className="text-destructive">
                                                Missing: {item.amountMissing}
                                                {item.ingredient.unit}
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    </CardContent>
                                  </Card>
                                ))}
                              </div>
                            </CardContent>
                          </Card>
                        )}

                        {ingredients.manual.length > 0 && (
                          <Card className="mb-6">
                            <CardContent className="pt-6">
                              <h5 className="text-lg font-bold mb-4">
                                Manual Ingredients
                              </h5>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {ingredients.manual.map((item, index) => (
                                  <Card key={index} className="bg-muted">
                                    <CardContent className="p-4">
                                      <div className="flex justify-between items-center">
                                        <div>
                                          <p className="font-semibold">
                                            {item.ingredient.name}
                                          </p>
                                          <p className="text-sm text-muted-foreground">
                                            {item.amount}
                                            {item.ingredient.unit}
                                          </p>
                                        </div>
                                        <Badge
                                          variant={
                                            item.ingredient.inBar
                                              ? 'default'
                                              : 'destructive'
                                          }
                                        >
                                          {item.ingredient.inBar
                                            ? 'In Bar'
                                            : 'Not In Bar'}
                                        </Badge>
                                      </div>
                                    </CardContent>
                                  </Card>
                                ))}
                              </div>
                            </CardContent>
                          </Card>
                        )}

                        {ingredients.notInBar.length > 0 && (
                          <Alert variant="destructive">
                            <AlertDescription>
                              <h6 className="font-bold mb-2">
                                Missing Ingredients
                              </h6>
                              <p className="mb-2">
                                The following ingredients are not available in
                                the bar:
                              </p>
                              <ul className="mt-2 list-disc list-inside space-y-1">
                                {ingredients.notInBar.map((item, index) => (
                                  <li key={index}>
                                    {item.ingredient.name} ({item.amount}
                                    {item.ingredient.unit})
                                  </li>
                                ))}
                              </ul>
                            </AlertDescription>
                          </Alert>
                        )}
                      </div>
                    );
                  })()}
                </>
              )}
            </>
          )
        )}
      </div>
    </div>
  );
};

export default Order;
