import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, AlertTriangle, Timer, X, Search, Square } from 'lucide-react';
import CocktailService from '../../services/cocktail.service';
import useCocktailProgressStore from '../../store/cocktailProgressStore';
import useAuthStore from '../../store/authStore';
import { useWebSocket } from '../../hooks/useWebSocket';

const SimpleOrderStatus = () => {
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
      <div className="min-h-screen bg-base-200 p-4 flex items-center justify-center">
        <div className="card bg-base-100 shadow-xl max-w-md w-full">
          <div className="card-body items-center text-center">
            <h2 className="card-title">No Active Order</h2>
            <p className="text-base-content/70">
              There is currently no cocktail being prepared
            </p>
            <div className="card-actions justify-center mt-4">
              <button
                className="btn"
                onClick={() => navigate('/simple/drinks')}
              >
                Order a Drink
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-200 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Recipe Card */}
        <div className="card bg-base-100 shadow-xl mb-6">
          <div className="card-body">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="card-title text-2xl mb-2">
                  {progress.recipe.name}
                </h2>
                <div className="flex items-center gap-2">
                  <div className={getStatusClass()}>{getStatusIcon()}</div>
                  <span className="badge badge-lg">
                    {progress.state.toLowerCase().replace(/_/g, ' ')}
                  </span>
                </div>
              </div>
              <div className="card-actions">
                <button
                  className="btn btn-circle btn-error btn-sm"
                  onClick={handleCancel}
                  disabled={
                    canceling ||
                    ['CANCELLED', 'FINISHED'].includes(progress.state)
                  }
                >
                  <Square size={18} />
                </button>
              </div>
            </div>

            {/* Progress Section */}
            <div className="divider" />

            <div>
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

            {/* Recipe Details */}
            {progress.recipe.ingredients && (
              <>
                <div className="divider">Ingredients</div>
                <div className="overflow-x-auto">
                  <table className="table table-zebra">
                    <tbody>
                      {progress.recipe.ingredients.map((ingredient, index) => (
                        <tr key={index}>
                          <td>{ingredient.name}</td>
                          <td className="text-right text-base-content/70">
                            {ingredient.amount} {ingredient.unit}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {progress.recipe.description && (
              <>
                <div className="divider">Description</div>
                <div className="prose max-w-none">
                  <p className="text-base-content/70">
                    {progress.recipe.description}
                  </p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex justify-center gap-2">
          <button
            className="btn btn-ghost btn-sm"
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
