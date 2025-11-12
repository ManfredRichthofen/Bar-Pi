import React, { useState, useEffect } from 'react';
import { BeakerIcon, XCircle, PlayCircle } from 'lucide-react';
import { Navigate, useLocation, useNavigate } from '@tanstack/react-router';
import useAuthStore from '../../../store/authStore';
import cocktailService from '../../../services/cocktail.service';
import DrinkCustomizer from '../../../components/order/DrinkCustomizer';
import glassService from '../../../services/glass.service';
import IngredientRequirements from '../../../components/order/IngredientRequirements';
import GlassSelector from '../../../components/order/GlassSelector';
import ingredientService from '../../../services/ingredient.service';

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

  // Toast
  const showToast = (message, type = 'info') => {
    const toast = document.getElementById('toast-container');
    if (toast) {
      const alert = document.createElement('div');
      alert.className = `alert ${type === 'error' ? 'alert-error' : type === 'success' ? 'alert-success' : 'alert-info'}`;
      alert.innerHTML = `<span>${message}</span>`;
      toast.appendChild(alert);
      setTimeout(() => alert.remove(), 3000);
    }
  };

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
      showToast('Failed to check drink feasibility', 'error');
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
        showToast('This drink cannot be made at the moment', 'error');
        return;
      }

      if (!areAllIngredientsAvailable(isFeasible.requiredIngredients)) {
        showToast('Some ingredients are missing or insufficient', 'error');
        return;
      }

      await cocktailService.order(recipeId, orderConfig, false, token);
      showToast('Drink ordered successfully', 'success');
      navigate({ to: '/drinks' });
    } catch (error) {
      showToast('Failed to order drink', 'error');
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
      showToast('Order cancelled', 'success');
    } catch (error) {
      showToast('Failed to cancel order', 'error');
    }
  };

  const continueProduction = async () => {
    try {
      await cocktailService.continueProduction(token);
      showToast('Production continued', 'success');
    } catch (error) {
      showToast('Failed to continue production', 'error');
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
    <>
      {/* Toast container */}
      <div id="toast-container" className="toast toast-end z-50"></div>

      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 pt-20 sm:pt-24 min-h-screen">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl sm:text-2xl font-bold">Drink Production</h2>
        </div>

        <div className="card bg-base-100 shadow-xl mb-4 sm:mb-6">
          <div className="card-body p-3 sm:p-6">
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
                  <button
                    className={`btn btn-primary flex-1 sm:flex-none ${loading ? 'loading' : ''}`}
                    onClick={handleMakeDrink}
                    disabled={!canOrderDrink}
                  >
                    <BeakerIcon size={16} />
                    {feasibilityResult
                      ? `Make Drink (${feasibilityResult.totalAmountInMl}ml)`
                      : 'Make Drink'}
                  </button>
                  <button
                    className="btn btn-ghost flex-1 sm:flex-none"
                    onClick={() => navigate({ to: '/drinks' })}
                  >
                    Back to Drinks
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

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
          <div className="card bg-base-100 shadow-xl mb-6">
            <div className="card-body flex items-center justify-center">
              <span className="loading loading-spinner loading-lg"></span>
            </div>
          </div>
        ) : (
          feasibilityResult && (
            <>
              <div className="card bg-base-100 shadow-xl mb-6">
                <div className="card-body">
                  <h4 className="text-xl font-bold">
                    Feasibility Check Result
                  </h4>
                  <div
                    className={`alert ${feasibilityResult.feasible ? 'alert-success' : 'alert-error'}`}
                  >
                    <div>
                      {feasibilityResult.feasible ? (
                        <>
                          <span>Drink can be made</span>
                          <span className="text-sm">
                            Total amount: {feasibilityResult.totalAmountInMl}ml
                          </span>
                        </>
                      ) : (
                        <span>{feasibilityResult.reason}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

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
                          <div className="card bg-base-100 shadow-xl mb-6">
                            <div className="card-body">
                              <h5 className="text-lg font-bold">
                                Automated Ingredients
                              </h5>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {ingredients.automated.map((item, index) => (
                                  <div key={index} className="card bg-base-200">
                                    <div className="card-body p-4">
                                      <div className="flex justify-between items-center">
                                        <div>
                                          <p className="font-semibold">
                                            {item.ingredient.name}
                                          </p>
                                          <div className="text-sm opacity-70">
                                            Required: {item.amountRequired}
                                            {item.ingredient.unit}
                                            {item.amountMissing > 0 && (
                                              <div className="text-error">
                                                Missing: {item.amountMissing}
                                                {item.ingredient.unit}
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Manual Ingredients Section. This needs to pull from all ingredients  */}
                        {ingredients.manual.length > 0 && (
                          <div className="card bg-base-100 shadow-xl mb-6">
                            <div className="card-body">
                              <h5 className="text-lg font-bold">
                                Manual Ingredients
                              </h5>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {ingredients.manual.map((item, index) => (
                                  <div key={index} className="card bg-base-200">
                                    <div className="card-body p-4">
                                      <div className="flex justify-between items-center">
                                        <div>
                                          <p className="font-semibold">
                                            {item.ingredient.name}
                                          </p>
                                          <p className="text-sm opacity-70">
                                            {item.amount}
                                            {item.ingredient.unit}
                                          </p>
                                        </div>
                                        <div
                                          className={`badge ${
                                            item.ingredient.inBar
                                              ? 'badge-success'
                                              : 'badge-error'
                                          }`}
                                        >
                                          {item.ingredient.inBar
                                            ? 'In Bar'
                                            : 'Not In Bar'}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}

                        {ingredients.notInBar.length > 0 && (
                          <div className="alert alert-warning">
                            <div>
                              <h6 className="font-bold">Missing Ingredients</h6>
                              <p>
                                The following ingredients are not available in
                                the bar:
                              </p>
                              <ul className="mt-2 list-disc list-inside">
                                {ingredients.notInBar.map((item, index) => (
                                  <li key={index}>
                                    {item.ingredient.name} ({item.amount}
                                    {item.ingredient.unit})
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
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
    </>
  );
};

export default Order;
