import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Beaker, ArrowLeft } from 'lucide-react';

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
      <div className="bg-base-100 border-b border-base-200 px-3 py-3 flex items-center justify-between">
        <button
          onClick={handleBack}
          className="btn btn-ghost btn-sm p-2 hover:bg-base-200 rounded-lg"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-bold truncate flex-1 mx-3">{recipe.name}</h1>
        {recipe.alcoholic && (
          <div className="badge badge-error badge-sm shrink-0">21+</div>
        )}
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-3 space-y-4">
          {/* Image */}
          <figure className="relative aspect-[16/9] rounded-lg overflow-hidden shadow-md">
            {recipe.image ? (
              <img
                src={recipe.image}
                alt={recipe.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-base-200 flex items-center justify-center">
                <span className="text-base-content/60">No image</span>
              </div>
            )}
          </figure>

          {/* Description */}
          {recipe.description && (
            <div>
              <h2 className="text-sm font-semibold mb-2 text-base-content/80">
                Description
              </h2>
              <p className="text-base-content/70 text-sm leading-relaxed">
                {recipe.description}
              </p>
            </div>
          )}

          {/* Ingredients */}
          <div>
            <h2 className="text-sm font-semibold mb-3 text-base-content/80">
              Ingredients
            </h2>
            <ul className="space-y-2">
              {recipe.ingredients.map((ingredient, index) => (
                <li
                  key={index}
                  className="text-sm text-base-content/70 flex items-center gap-3 p-3 bg-base-200/50 rounded-lg"
                >
                  <span className="w-6 h-6 rounded-full bg-base-200 flex items-center justify-center text-xs font-medium shrink-0">
                    {index + 1}
                  </span>
                  <span className="flex-1">{ingredient.name}</span>
                  <span className="text-base-content/60 font-medium shrink-0">
                    {ingredient.amount} {ingredient.unit}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Fixed bottom action button */}
      <div className="bg-base-100 border-t border-base-200 p-3">
        <button
          onClick={handleMakeDrink}
          className="btn btn-primary w-full gap-2"
        >
          <Beaker className="w-4 h-4" />
          Make Drink
        </button>
      </div>
    </div>
  );
};

export default SimpleDrinkDetail; 