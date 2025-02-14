import React, { useState, useEffect } from 'react';
import { BeakerIcon } from 'lucide-react';
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
    <div className="max-w-7xl mx-auto px-3 py-4 pb-4 min-h-screen">
      <div
        id="toast-container"
        className="toast toast-end z-50 w-[min(400px,90vw)] p-4"
      ></div>

      <div className="grid grid-cols-1 lg:grid-cols-[2fr,1fr] gap-6 mb-16">
        <div className="space-y-6">
          {/* Main drink info card */}
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body p-4 sm:p-8">
              {recipe.image && (
                <div className="relative aspect-video w-full">
                  <img
                    className="rounded-lg object-cover absolute inset-0 w-full h-full"
                    src={recipe.image}
                    alt={recipe.name}
                  />
                </div>
              )}

              <div className="flex items-center justify-between gap-2 mt-4">
                <h3 className="text-xl font-bold break-words flex-1">
                  {recipe.name}
                </h3>
                {recipe.alcoholic && (
                  <div className="badge badge-error shrink-0">Alcoholic</div>
                )}
              </div>

              {recipe.description && (
                <p className="text-base-content/70 text-sm sm:text-base whitespace-normal break-words">
                  {recipe.description}
                </p>
              )}
            </div>
          </div>

          {/* Glass selector and ingredients */}
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body p-4 sm:p-8">
              <SimpleGlassSelector
                selectedGlass={selectedGlass}
                defaultGlass={recipe.defaultGlass}
                token={token}
                setSelectedGlass={setSelectedGlass}
              />

              <div className="grid gap-4 mt-4">
                <div className="collapse collapse-arrow bg-base-200">
                  <input type="checkbox" defaultChecked />
                  <div className="collapse-title font-bold break-words">
                    Recipe Ingredients
                  </div>
                  <div className="collapse-content">
                    <ul className="list-disc list-inside text-sm sm:text-base space-y-1">
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
                  <div className="collapse collapse-arrow bg-base-200">
                    <input type="checkbox" defaultChecked />
                    <div className="collapse-title font-bold break-words">
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

              <div className="flex flex-col sm:flex-row gap-2 mt-6">
                <button
                  className="btn btn-primary w-full sm:flex-1"
                  onClick={handleMakeDrink}
                  disabled={!canOrderDrink || loading}
                >
                  {loading && <span className="loading loading-spinner"></span>}
                  {!loading && <BeakerIcon size={16} className="mr-2" />}
                  {loading ? 'Making your drink...' : 'Make Drink'}
                </button>
                <button
                  className="btn btn-ghost w-full sm:flex-1"
                  onClick={() => navigate('/simple/drinks')}
                >
                  Back
                </button>
              </div>
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
  );
};

export default SimpleOrder;
