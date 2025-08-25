import React, { useState, useEffect } from 'react';
import { BeakerIcon, ArrowLeft, Info, AlertTriangle } from 'lucide-react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import cocktailService from '../../services/cocktail.service';
import SimpleGlassSelector from '../../components/simple-mode/order/simpleGlassSelector';
import SimpleIngredientRequirements from '../../components/simple-mode/order/simpleIngredientRequirements';
import SimpleDrinkCustomizer from '../../components/simple-mode/order/simpleDrinkCustomizer';

const SimpleOrder = () => {
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [feasibilityResult, setFeasibilityResult] = useState(null);
  const [amountToProduce, setAmountToProduce] = useState(null);
  const token = useAuthStore((state) => state.token);
  const location = useLocation();
  const navigate = useNavigate();
  const recipe = location.state?.recipe;
  const [selectedGlass, setSelectedGlass] = useState(null);
  const [boost, setBoost] = useState(100);
  const [ingredients, setIngredients] = useState([]);
  const [additionalIngredients, setAdditionalIngredients] = useState([]);

  const showToast = (message, type = 'info') => {
    const toast = document.getElementById('toast-container');
    if (toast) {
      const alert = document.createElement('div');
      alert.className = `alert ${type === 'error' ? 'alert-error' : type === 'success' ? 'alert-success' : 'alert-info'} whitespace-normal break-words`;
      alert.innerHTML = `<span class="text-sm">${message}</span>`;
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
    amountOrderedInMl: amountToProduce || recipe.defaultGlass?.sizeInMl || 250,
    customisations: {
      boost: parseInt(boost) || 100,
      additionalIngredients: additionalIngredients || [],
    },
    productionStepReplacements: [],
    ingredientGroupReplacements: [],
    useAutomaticIngredients: true,
    skipMissingIngredients: false,
  });

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
      console.error('Feasibility check failed:', error.response?.data || error);
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
      navigate('/simple/order-status');
    } catch (error) {
      if (error.response?.data?.message) {
        console.error('Order failed:', error.response.data);
        if (
          error.response.data.message.includes('pumps are currently occupied')
        ) {
          showToast(
            'Some pumps are currently occupied - please wait for the current drink to finish',
            'error',
          );
        } else {
          showToast(error.response.data.message, 'error');
        }
      } else {
        console.error('Order failed:', error);
        showToast('Failed to order drink', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleMakeDrink = () => {
    const orderConfig = getOrderConfig();
    orderDrink(recipe.id, orderConfig);
  };

  const handleGlassChange = (glass) => {
    setSelectedGlass(glass);
    if (glass) {
      setAmountToProduce(glass.sizeInMl);
    }
  };

  if (!token) return <Navigate to="/login" />;
  if (!recipe) return <Navigate to="/drinks" />;

  const canOrderDrink = feasibilityResult?.feasible && !loading && !checking;

  const hasBoostableIngredients = feasibilityResult?.requiredIngredients?.some(
    (item) =>
      item.ingredient.type === 'automated' &&
      item.ingredient.alcoholContent > 0,
  );

  return (
    <div className="min-h-screen bg-base-100 flex flex-col">
      {/* Toast Container */}
      <div
        id="toast-container"
        className="toast toast-end z-50 w-[min(400px,90vw)] p-4"
      ></div>

      {/* Header */}
      <div className="sticky top-0 z-20 bg-base-100/95 backdrop-blur-md border-b border-base-200 shadow-sm">
        <div className="px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate('/simple/drinks')}
            className="btn btn-ghost btn-sm p-3 hover:bg-base-200 rounded-xl transition-all duration-200"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-bold truncate flex-1 mx-3 text-center">Order Drink</h1>
          <div className="w-10"></div> {/* Spacer for centering */}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-6">
          {/* Main drink info card */}
          <div className="card bg-base-200/50">
            <div className="card-body p-4">
              {recipe.image && (
                <div className="relative aspect-[4/3] w-full mb-4 rounded-xl overflow-hidden">
                  <img
                    className="rounded-xl object-cover absolute inset-0 w-full h-full"
                    src={recipe.image}
                    alt={recipe.name}
                    loading="lazy"
                  />
                </div>
              )}

              <div className="flex items-center justify-between gap-2 mb-3">
                <h3 className="text-xl font-bold break-words flex-1">
                  {recipe.name}
                </h3>
                {recipe.alcoholic && (
                  <div className="badge badge-error shrink-0">Alcoholic</div>
                )}
              </div>

              {recipe.description && (
                <p className="text-base-content/70 text-sm whitespace-normal break-words">
                  {recipe.description}
                </p>
              )}
            </div>
          </div>

          {/* Glass selector and ingredients */}
          <div className="card bg-base-200/50">
            <div className="card-body p-4">
              <SimpleGlassSelector
                selectedGlass={selectedGlass}
                defaultGlass={recipe.defaultGlass}
                token={token}
                setSelectedGlass={setSelectedGlass}
              />

              <div className="space-y-4 mt-6">
                <div className="collapse collapse-arrow bg-base-100">
                  <input type="checkbox" defaultChecked />
                  <div className="collapse-title font-bold break-words flex items-center gap-2">
                    <BeakerIcon className="w-4 h-4" />
                    Recipe Ingredients
                  </div>
                  <div className="collapse-content">
                    <ul className="list-disc list-inside text-sm space-y-1 mt-2">
                      {ingredients.map((item, index) => (
                        <li
                          key={index}
                          className="whitespace-normal break-words"
                        >
                          {item.name}: {item.amount} {item.unit}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {feasibilityResult?.requiredIngredients && (
                  <div className="collapse collapse-arrow bg-base-100">
                    <input type="checkbox" defaultChecked />
                    <div className="collapse-title font-bold break-words flex items-center gap-2">
                      <Info className="w-4 h-4" />
                      Required Ingredients
                    </div>
                    <div className="collapse-content">
                      <SimpleIngredientRequirements
                        requiredIngredients={
                          feasibilityResult.requiredIngredients
                        }
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Customizer section */}
          <SimpleDrinkCustomizer
            disableBoosting={!hasBoostableIngredients}
            customisations={{
              boost,
              additionalIngredients,
            }}
            onCustomisationsChange={(newCustomisations) => {
              setBoost(newCustomisations.boost);
              setAdditionalIngredients(newCustomisations.additionalIngredients);
            }}
            availableIngredients={
              feasibilityResult?.requiredIngredients?.map(
                (item) => item.ingredient,
              ) || []
            }
          />
        </div>
      </div>

      {/* Fixed bottom action buttons */}
      <div className="bg-base-100/95 backdrop-blur-md border-t border-base-200 p-4 shadow-lg">
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            className="btn btn-primary flex-1 h-14 gap-3 text-base font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
            onClick={handleMakeDrink}
            disabled={!canOrderDrink || loading}
          >
            {loading && <span className="loading loading-spinner"></span>}
            {!loading && <BeakerIcon size={20} className="mr-2" />}
            {loading ? 'Making your drink...' : 'Make Drink'}
          </button>
          <button
            className="btn btn-ghost flex-1 h-14 text-base font-semibold"
            onClick={() => navigate('/simple/drinks')}
          >
            Back
          </button>
        </div>
      </div>
    </div>
  );
};

export default SimpleOrder;
