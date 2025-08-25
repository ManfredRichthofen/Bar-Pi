import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Beaker, ArrowLeft, Clock, Info } from 'lucide-react';

const SimpleDrinkDetail = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const recipe = location.state?.recipe;

  // Redirect if no recipe data
  if (!recipe) {
    navigate('/simple/drinks');
    return null;
  }

  const handleMakeDrink = () => {
    navigate('/simple/order', { state: { recipe } });
  };

  const handleBack = () => {
    navigate('/simple/drinks');
  };

  return (
    <div className="min-h-screen bg-base-100 flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-base-100/95 backdrop-blur-md border-b border-base-200 shadow-sm">
        <div className="px-4 py-4 flex items-center justify-between">
          <button
            onClick={handleBack}
            className="btn btn-ghost btn-sm p-3 hover:bg-base-200 rounded-xl transition-all duration-200"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-bold truncate flex-1 mx-3 text-center">{recipe.name}</h1>
          {recipe.alcoholic && (
            <div className="badge badge-error badge-sm shrink-0">21+</div>
          )}
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-6">
          {/* Image */}
          <figure className="relative aspect-[4/3] rounded-xl overflow-hidden shadow-lg bg-base-200">
            {recipe.image ? (
              <img
                src={recipe.image}
                alt={recipe.name}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-base-200 to-base-300 flex items-center justify-center">
                <div className="text-center">
                  <Info className="w-12 h-12 text-base-content/40 mx-auto mb-2" />
                  <span className="text-base-content/60 font-medium">No image available</span>
                </div>
              </div>
            )}
          </figure>

          {/* Description */}
          {recipe.description && (
            <div className="card bg-base-200/50">
              <div className="card-body p-4">
                <h2 className="text-base font-semibold mb-3 text-base-content/90 flex items-center gap-2">
                  <Info className="w-4 h-4" />
                  Description
                </h2>
                <p className="text-base-content/70 text-sm leading-relaxed">
                  {recipe.description}
                </p>
              </div>
            </div>
          )}

          {/* Ingredients */}
          <div className="card bg-base-200/50">
            <div className="card-body p-4">
              <h2 className="text-base font-semibold mb-4 text-base-content/90 flex items-center gap-2">
                <Beaker className="w-4 h-4" />
                Ingredients
              </h2>
              <ul className="space-y-3">
                {recipe.ingredients.map((ingredient, index) => (
                  <li
                    key={index}
                    className="flex items-center gap-4 p-3 bg-base-100 rounded-lg shadow-sm"
                  >
                    <span className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center text-sm font-semibold shrink-0">
                      {index + 1}
                    </span>
                    <span className="flex-1 font-medium text-base-content/90">{ingredient.name}</span>
                    <span className="text-base-content/70 font-semibold shrink-0">
                      {ingredient.amount} {ingredient.unit}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Additional Info */}
          <div className="card bg-base-200/50">
            <div className="card-body p-4">
              <h2 className="text-base font-semibold mb-3 text-base-content/90 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Preparation
              </h2>
              <div className="space-y-2 text-sm text-base-content/70">
                <div className="flex items-center justify-between">
                  <span>Type:</span>
                  <span className="font-medium">
                    {recipe.alcoholic ? 'Alcoholic' : 'Non-alcoholic'}
                  </span>
                </div>
                {recipe.defaultGlass && (
                  <div className="flex items-center justify-between">
                    <span>Glass:</span>
                    <span className="font-medium">
                      {recipe.defaultGlass.name} ({recipe.defaultGlass.sizeInMl}ml)
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Fixed bottom action button */}
      <div className="bg-base-100/95 backdrop-blur-md border-t border-base-200 p-4 shadow-lg">
        <button
          onClick={handleMakeDrink}
          className="btn btn-primary w-full h-14 gap-3 text-base font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
        >
          <Beaker className="w-5 h-5" />
          Make Drink
        </button>
      </div>
    </div>
  );
};

export default SimpleDrinkDetail; 