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
        setAmountToProduce(250);
      }
      setIngredients(recipe.ingredients || []);
    }
  }, [recipe]);

  useEffect(() => {
    if (recipe && amountToProduce) {
      checkFeasibility(recipe.id, getOrderConfig());
    }
  }, [recipe, amountToProduce]);

  const getOrderConfig = () => ({
    amountOrderedInMl: amountToProduce || recipe.defaultGlass?.sizeInMl || 250,
    customisations: {
      boost: boost || 100,
      additionalIngredients: [],
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
        if (
          error.response.data.message.includes('pumps are currently occupied')
        ) {
          showToast(
            'Machine is busy - please wait for current drink to finish',
            'error',
          );
        } else {
          showToast(error.response.data.message, 'error');
        }
      } else {
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

  return (
    <div className="max-w-3xl mx-auto px-3 py-4 pt-20 min-h-screen">
      <div id="toast-container" className="toast toast-end z-50"></div>

      <div className="card bg-base-100 shadow-xl mb-4">
        <div className="card-body">
          <div className="flex flex-col gap-4">
            {recipe.image && (
              <img
                className="w-full rounded-lg object-cover max-h-[200px]"
                src={recipe.image}
                alt={recipe.name}
              />
            )}

            <div>
              <h3 className="text-xl font-bold mb-2">{recipe.name}</h3>
              {recipe.description && (
                <p className="mb-4 text-base-content/70">
                  {recipe.description}
                </p>
              )}

              <SimpleGlassSelector
                selectedGlass={selectedGlass}
                defaultGlass={recipe.defaultGlass}
                token={token}
                setSelectedGlass={setSelectedGlass}
              />

              <div className="mt-4">
                <h4 className="font-bold mb-2">Recipe Ingredients:</h4>
                <ul className="list-disc list-inside">
                  {ingredients.map((item, index) => (
                    <li key={index}>
                      {item.name}: {item.amount} {item.unit}
                    </li>
                  ))}
                </ul>
              </div>

              {feasibilityResult?.requiredIngredients && (
                <SimpleIngredientRequirements
                  requiredIngredients={feasibilityResult.requiredIngredients}
                />
              )}

              {recipe.alcoholic && (
                <div className="mt-4">
                  <div className="badge badge-error">Alcoholic</div>
                </div>
              )}

              <div className="flex gap-2 mt-4">
                <button
                  className="btn btn-primary flex-1"
                  onClick={handleMakeDrink}
                  disabled={!canOrderDrink || loading}
                >
                  {loading && <span className="loading loading-spinner"></span>}
                  {!loading && <BeakerIcon size={16} className="mr-2" />}
                  {loading ? 'Making your drink...' : 'Make Drink'}
                </button>
                <button
                  className="btn btn-ghost flex-1"
                  onClick={() => navigate('/simple/drinks')}
                >
                  Back
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <SimpleDrinkCustomizer
        disableBoosting={!feasibilityResult?.hasBoostableIngredients}
        customizations={{ boost }}
        onCustomizationsChange={(newCustomizations) => {
          setBoost(newCustomizations.boost);
        }}
        availableIngredients={feasibilityResult?.requiredIngredients || []}
      />
    </div>
  );
};

export default SimpleOrder;
