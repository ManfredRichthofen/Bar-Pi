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
      <div className="min-h-screen p-4 flex items-center justify-center">
        <div className="card bg-base-100 shadow-xl max-w-md w-full">
          <div className="card-body items-center text-center">
            <h2 className="card-title text-2xl mb-4">No Active Order</h2>
            <p className="text-base-content/70 mb-6">
              There is currently no cocktail being prepared
            </p>
            <button
              className="btn btn-primary"
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
    <div className="min-h-screen p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Status Card */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="card-title text-2xl mb-4">{progress.recipe.name}</h2>
                <div className="flex items-center gap-3">
                  <div className={getStatusClass()}>{getStatusIcon()}</div>
                  <span className="badge badge-lg capitalize">
                    {progress.state.toLowerCase().replace(/_/g, ' ')}
                  </span>
                </div>
              </div>
              <button
                className="btn btn-circle btn-sm btn-error"
                onClick={handleCancel}
                disabled={canceling || ['CANCELLED', 'FINISHED'].includes(progress.state)}
              >
                <Square size={16} />
              </button>
            </div>

            {/* Progress Bar */}
            <div className="mt-6">
              <div className="flex justify-between mb-2">
                <span className="text-base-content/70">Progress</span>
                <span className="font-medium">{progress.progress}%</span>
              </div>
              <progress
                className={`progress progress-${getStatusClass().replace('text-', '')} w-full`}
                value={progress.progress}
                max="100"
              />
            </div>

            {/* Manual Ingredient Add Confirmation */}
            {progress.state === 'MANUAL_INGREDIENT_ADD' && (
              <div className="mt-6">
                <div className="alert alert-warning shadow-lg">
                  <AlertTriangle size={24} />
                  <div className="flex-1">
                    <h3 className="font-bold text-lg mb-2">Manual Ingredients Required</h3>
                    <div>
                      {progress.currentIngredientsToAddManually?.length > 0 ? (
                        <ul className="list-disc list-inside space-y-1">
                          {progress.currentIngredientsToAddManually.map((item, index) => (
                            <li key={index} className="text-base">
                              {item.ingredient.name} ({item.amount} {item.ingredient.unit})
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p>Required ingredients will be listed here</p>
                      )}
                      <p className="mt-4 text-sm opacity-75">Please add these ingredients and confirm when ready.</p>
                    </div>
                  </div>
                  <button
                    className="btn btn-warning"
                    onClick={handleConfirmManualAdd}
                    disabled={confirming}
                  >
                    {confirming ? 'Confirming...' : 'Confirm Added'}
                  </button>
                </div>
              </div>
            )}

            {/* Recipe Details */}
            {progress.recipe.ingredients && (
              <div className="mt-6">
                <h3 className="font-bold text-lg mb-4">Ingredients</h3>
                <div className="overflow-x-auto">
                  <table className="table table-zebra w-full">
                    <tbody>
                      {progress.recipe.ingredients.map((ingredient, index) => (
                        <tr key={index}>
                          <td className="font-medium">{ingredient.name}</td>
                          <td className="text-right text-base-content/70">
                            {ingredient.amount} {ingredient.unit}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {progress.recipe.description && (
              <div className="mt-6">
                <h3 className="font-bold text-lg mb-4">Description</h3>
                <p className="text-base-content/70 leading-relaxed">
                  {progress.recipe.description}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex justify-center">
          <button
            className="btn btn-ghost"
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
