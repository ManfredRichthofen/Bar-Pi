import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, AlertTriangle, Timer, Square, ArrowLeft, Info } from 'lucide-react';
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
      <div className="min-h-screen bg-base-100 flex flex-col">
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="w-full max-w-sm text-center">
            <div className="text-base-content/40 mb-6">
              <Timer className="w-16 h-16 mx-auto" />
            </div>
            <h2 className="text-xl font-bold mb-3">
              No Active Order
            </h2>
            <p className="text-base-content/70 mb-6 text-sm">
              There is currently no cocktail being prepared
            </p>
            <button
              className="btn btn-primary w-full h-12 text-base font-semibold"
              onClick={() => navigate('/simple/drinks')}
            >
              Order a Drink
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-100 flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-base-100/95 backdrop-blur-md border-b border-base-200 shadow-sm">
        <div className="px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate('/simple/drinks')}
            className="btn btn-ghost btn-sm p-3 hover:bg-base-200 rounded-xl transition-all duration-200"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-bold truncate flex-1 mx-3 text-center">Order Status</h1>
          <div className="w-10"></div> {/* Spacer for centering */}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-4">
          {/* Status and Progress */}
          <div className="card bg-base-200/50">
            <div className="card-body p-4">
              <div className="flex items-center justify-between gap-3 mb-4">
                <div className="min-w-0 flex-1">
                  <h2 className="text-lg font-bold truncate mb-1">
                    {progress.recipe.name}
                  </h2>
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className={getStatusClass()}>{getStatusIcon()}</div>
                    <span className="badge badge-md capitalize">
                      {progress.state.toLowerCase().replace(/_/g, ' ')}
                    </span>
                  </div>
                </div>
                <button
                  className="btn btn-circle btn-error btn-md shrink-0"
                  onClick={handleCancel}
                  disabled={
                    canceling || ['CANCELLED', 'FINISHED'].includes(progress.state)
                  }
                >
                  <Square size={20} />
                </button>
              </div>

              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-base-content/70">Progress</span>
                  <span className="font-semibold">{progress.progress}%</span>
                </div>
                <progress
                  className={`progress progress-${getStatusClass().replace('text-', '')} w-full h-3`}
                  value={progress.progress}
                  max="100"
                />
              </div>
            </div>
          </div>

          {/* Manual Ingredient Add Confirmation */}
          {progress.state === 'MANUAL_INGREDIENT_ADD' && (
            <div className="card bg-warning/20 border-warning/30">
              <div className="card-body p-4">
                <div className="flex gap-3">
                  <AlertTriangle size={24} className="text-warning shrink-0 mt-1" />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-lg mb-3">
                      Manual Ingredients Required
                    </h3>
                    <div>
                      {progress.currentIngredientsToAddManually?.length > 0 ? (
                        <ul className="space-y-2 mb-4">
                          {progress.currentIngredientsToAddManually.map(
                            (item, index) => (
                              <li
                                key={index}
                                className="flex justify-between items-center p-3 bg-base-100 rounded-lg"
                              >
                                <span className="font-medium">{item.ingredient.name}</span>
                                <span className="text-sm text-base-content/70">
                                  {item.amount} {item.ingredient.unit}
                                </span>
                              </li>
                            ),
                          )}
                        </ul>
                      ) : (
                        <p className="text-sm mb-4">
                          Required ingredients will be listed here
                        </p>
                      )}
                      <p className="text-sm opacity-75 mb-4">
                        Please add these ingredients and confirm when ready.
                      </p>
                      <button
                        className="btn btn-warning w-full h-12 text-base font-semibold"
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

          {/* Recipe Information */}
          <div className="grid gap-4">
            {/* Ingredients List */}
            <div className="card bg-base-200/50">
              <div className="card-body p-4">
                <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                  <Info className="w-4 h-4" />
                  Ingredients
                </h3>
                {progress.recipe.ingredients && (
                  <div className="space-y-2">
                    {progress.recipe.ingredients.map((ingredient, index) => (
                      <div
                        key={index}
                        className="flex justify-between items-center p-3 bg-base-100 rounded-lg"
                      >
                        <span className="font-medium">{ingredient.name}</span>
                        <span className="text-sm text-base-content/70">
                          {ingredient.amount} {ingredient.unit}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Description */}
            {progress.recipe.description && (
              <div className="card bg-base-200/50">
                <div className="card-body p-4">
                  <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                    <Info className="w-4 h-4" />
                    Description
                  </h3>
                  <p className="text-base-content/70 text-sm leading-relaxed">
                    {progress.recipe.description}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimpleOrderStatus;
