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
      <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8 bg-base-100">
        <h2 className="text-2xl font-bold mb-4">No Active Order</h2>
        <p className="text-base-content/70 mb-8 text-center">
          There is currently no cocktail being prepared
        </p>
        <button
          className="btn btn-primary btn-lg w-full max-w-md"
          onClick={() => navigate('/simple/drinks')}
        >
          Order a Drink
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-100">
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-8">
        {/* Status Section */}
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold mb-4">{progress.recipe.name}</h2>
            <div className="flex items-center gap-3">
              <div className={getStatusClass()}>{getStatusIcon()}</div>
              <span className="badge badge-lg capitalize">
                {progress.state.toLowerCase().replace(/_/g, ' ')}
              </span>
            </div>
          </div>
          <button
            className="btn btn-circle btn-lg btn-error"
            onClick={handleCancel}
            disabled={canceling || ['CANCELLED', 'FINISHED'].includes(progress.state)}
          >
            <Square size={24} />
          </button>
        </div>

        {/* Progress Bar */}
        <div>
          <div className="flex justify-between mb-3">
            <span className="text-base-content/70 text-lg">Progress</span>
            <span className="font-medium text-lg">{progress.progress}%</span>
          </div>
          <progress
            className={`progress progress-${getStatusClass().replace('text-', '')} w-full h-4`}
            value={progress.progress}
            max="100"
          />
        </div>

        {/* Manual Ingredient Add Confirmation */}
        {progress.state === 'MANUAL_INGREDIENT_ADD' && (
          <div className="py-4">
            <div className="bg-warning/20 rounded-lg p-6">
              <div className="flex items-start gap-4">
                <AlertTriangle size={28} className="text-warning shrink-0" />
                <div className="flex-1">
                  <h3 className="font-bold text-xl mb-4">Manual Ingredients Required</h3>
                  <div>
                    {progress.currentIngredientsToAddManually?.length > 0 ? (
                      <ul className="space-y-2 mb-4">
                        {progress.currentIngredientsToAddManually.map((item, index) => (
                          <li key={index} className="text-lg flex justify-between">
                            <span>{item.ingredient.name}</span>
                            <span className="font-medium">
                              {item.amount} {item.ingredient.unit}
                            </span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-lg mb-4">Required ingredients will be listed here</p>
                    )}
                    <p className="text-base opacity-75">Please add these ingredients and confirm when ready.</p>
                  </div>
                  <button
                    className="btn btn-warning btn-lg w-full mt-6"
                    onClick={handleConfirmManualAdd}
                    disabled={confirming}
                  >
                    {confirming ? 'Confirming...' : 'Confirm Added'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Recipe Details */}
        {progress.recipe.ingredients && (
          <div className="border-t border-base-300 pt-6">
            <h3 className="font-bold text-xl mb-4">Ingredients</h3>
            <div className="space-y-3">
              {progress.recipe.ingredients.map((ingredient, index) => (
                <div key={index} className="flex justify-between py-2 text-lg">
                  <span className="font-medium">{ingredient.name}</span>
                  <span className="text-base-content/70">
                    {ingredient.amount} {ingredient.unit}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {progress.recipe.description && (
          <div className="border-t border-base-300 pt-6">
            <h3 className="font-bold text-xl mb-4">Description</h3>
            <p className="text-base-content/70 leading-relaxed text-lg">
              {progress.recipe.description}
            </p>
          </div>
        )}

        {/* Navigation */}
        <div className="py-6">
          <button
            className="btn btn-neutral btn-lg w-full"
            onClick={() => navigate('/simple/drinks')}
          >
            Back to Drinks
          </button>
        </div>
      </div>
    </div>
  );
};

export default SimpleOrderStatus;
