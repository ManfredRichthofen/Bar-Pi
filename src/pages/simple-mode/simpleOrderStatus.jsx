import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, AlertTriangle, Timer, Square } from 'lucide-react';
import CocktailService from '../../services/cocktail.service';
import useCocktailProgressStore from '../../store/cocktailProgressStore';
import useAuthStore from '../../store/authStore';
import { useWebSocket } from '../../hooks/useWebSocket';

const SimpleOrderStatus = () => {
  const [confirming, setConfirming] = useState(false);
  const [canceling, setCanceling] = useState(false);
  const navigate = useNavigate();

  const progress = useCocktailProgressStore((state) => state.progress);
  const token = useAuthStore((state) => state.token);

  useWebSocket(token);

  const handleCancel = async () => {
    if (!token) return;

    setCanceling(true);
    try {
      await CocktailService.cancelCocktail(token);
    } catch (error) {
      console.error('Failed to cancel cocktail:', error);
    } finally {
      setCanceling(false);
    }
  };

  const handleConfirmManualAdd = async () => {
    if (!token) return;

    setConfirming(true);
    try {
      await CocktailService.continueProduction(token);
    } catch (error) {
      console.error('Failed to confirm manual ingredient add:', error);
    } finally {
      setConfirming(false);
    }
  };

  const getStatusIcon = () => {
    if (!progress) return <Check size={24} />;

    switch (progress.state) {
      case 'FINISHED':
        return <Check size={24} />;
      case 'CANCELLED':
        return <Square size={24} />;
      case 'MANUAL_ACTION_REQUIRED':
      case 'MANUAL_INGREDIENT_ADD':
        return <AlertTriangle size={24} />;
      default:
        return <Timer size={24} />;
    }
  };

  const getStatusClass = () => {
    if (!progress) return 'text-info';

    switch (progress.state) {
      case 'FINISHED':
        return 'text-success';
      case 'CANCELLED':
        return 'text-error';
      case 'MANUAL_ACTION_REQUIRED':
      case 'MANUAL_INGREDIENT_ADD':
        return 'text-warning';
      default:
        return 'text-success';
    }
  };

  if (!progress) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-base-100">
        <div className="w-full max-w-sm px-4">
          <h2 className="text-xl font-bold mb-2 text-center">No Active Order</h2>
          <p className="text-base-content/70 mb-3 text-center text-sm">
            There is currently no cocktail being prepared
          </p>
          <button
            className="btn btn-primary w-full"
            onClick={() => navigate('/simple/drinks')}
          >
            Order a Drink
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-100 px-1 sm:px-2 py-2 overflow-x-hidden">
      <div className="max-w-7xl mx-auto grid gap-2">
        {/* Top Section - Status and Progress in a row */}
        <div className="grid md:grid-cols-[2fr,1fr] gap-2">
          {/* Status Section - More compact */}
          <div className="bg-base-200 p-2 rounded-lg flex items-center justify-between gap-2">
            <div className="min-w-0 flex-1">
              <h2 className="text-lg sm:text-xl font-bold truncate mb-0.5">{progress.recipe.name}</h2>
              <div className="flex items-center gap-1.5 flex-wrap">
                <div className={getStatusClass()}>{getStatusIcon()}</div>
                <span className="badge badge-md sm:badge-lg capitalize">
                  {progress.state.toLowerCase().replace(/_/g, ' ')}
                </span>
              </div>
            </div>
            <button
              className="btn btn-circle btn-error btn-md sm:btn-lg shrink-0 ml-1"
              onClick={handleCancel}
              disabled={canceling || ['CANCELLED', 'FINISHED'].includes(progress.state)}
            >
              <Square size={20} />
            </button>
          </div>

          {/* Progress Bar - More compact */}
          <div className="bg-base-200 p-2 rounded-lg flex flex-col justify-center">
            <div className="flex justify-between mb-1.5">
              <span className="text-base-content/70 text-sm sm:text-base">Progress</span>
              <span className="font-medium text-sm sm:text-base">{progress.progress}%</span>
            </div>
            <progress
              className={`progress progress-${getStatusClass().replace('text-', '')} w-full h-2.5`}
              value={progress.progress}
              max="100"
            />
          </div>
        </div>

        {/* Main Content Section - 3 columns on extra large screens */}
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-2">
          {/* Manual Ingredient Add Confirmation - Takes full width when present */}
          {progress.state === 'MANUAL_INGREDIENT_ADD' && (
            <div className="md:col-span-2 xl:col-span-3">
              <div className="bg-warning/20 rounded-lg p-2">
                <div className="flex gap-2">
                  <AlertTriangle size={20} className="text-warning shrink-0" />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-lg mb-1.5">Manual Ingredients Required</h3>
                    <div>
                      {progress.currentIngredientsToAddManually?.length > 0 ? (
                        <ul className="space-y-0.5 mb-2">
                          {progress.currentIngredientsToAddManually.map((item, index) => (
                            <li key={index} className="text-sm sm:text-base flex justify-between flex-wrap gap-1">
                              <span>{item.ingredient.name}</span>
                              <span className="font-medium">
                                {item.amount} {item.ingredient.unit}
                              </span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm sm:text-base mb-2">Required ingredients will be listed here</p>
                      )}
                      <p className="text-sm opacity-75">Please add these ingredients and confirm when ready.</p>
                      <button
                        className="btn btn-warning btn-md sm:btn-lg w-full mt-2"
                        onClick={handleConfirmManualAdd}
                        disabled={confirming}
                      >
                        {confirming ? 'Confirming...' : 'Confirm Added'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Ingredients List */}
          <div className="bg-base-200 p-2 rounded-lg">
            <h3 className="font-bold text-lg mb-1.5">Ingredients</h3>
            {progress.recipe.ingredients && (
              <div className="grid gap-0.5">
                {progress.recipe.ingredients.map((ingredient, index) => (
                  <div key={index} className="flex justify-between text-sm sm:text-base flex-wrap gap-1">
                    <span className="font-medium">{ingredient.name}</span>
                    <span className="text-base-content/70">
                      {ingredient.amount} {ingredient.unit}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Description - Can span 2 columns on xl screens if no manual ingredients */}
          {progress.recipe.description && (
            <div className={`bg-base-200 p-2 rounded-lg ${!progress.state === 'MANUAL_INGREDIENT_ADD' ? 'xl:col-span-2' : ''}`}>
              <h3 className="font-bold text-lg mb-1.5">Description</h3>
              <p className="text-base-content/70 text-sm sm:text-base leading-relaxed">
                {progress.recipe.description}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SimpleOrderStatus;
