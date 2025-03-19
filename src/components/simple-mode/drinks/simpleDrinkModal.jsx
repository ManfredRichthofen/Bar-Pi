import React from 'react';
import { X, Beaker } from 'lucide-react';

const SimpleDrinkModal = ({ recipe, isOpen, onClose, onMakeDrink }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-base-100 rounded-xl shadow-2xl w-full max-w-4xl p-4 sm:p-6 relative">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-2 top-2 btn btn-ghost btn-sm p-1 hover:bg-base-200 rounded-full"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {/* Left Column - Image and Title */}
          <div className="space-y-3 sm:space-y-4">
            {/* Image */}
            <figure className="relative aspect-[16/9] sm:aspect-[3/2] rounded-lg overflow-hidden shadow-md">
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

            {/* Title and Badge */}
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-lg sm:text-xl font-bold">{recipe.name}</h2>
              {recipe.alcoholic && (
                <div className="badge badge-error badge-lg">21+</div>
              )}
            </div>

            {/* Description */}
            {recipe.description && (
              <div>
                <h3 className="text-sm font-semibold mb-1.5 sm:mb-2 text-base-content/80">Description</h3>
                <p className="text-base-content/70 text-sm leading-relaxed">
                  {recipe.description}
                </p>
              </div>
            )}
          </div>

          {/* Right Column - Ingredients and Action */}
          <div className="space-y-3 sm:space-y-4">
            {/* Ingredients */}
            <div>
              <h3 className="text-sm font-semibold mb-2 sm:mb-3 text-base-content/80">Ingredients</h3>
              <ul className="space-y-1.5 sm:space-y-2">
                {recipe.ingredients.map((ingredient, index) => (
                  <li key={index} className="text-sm text-base-content/70 flex items-center gap-2">
                    <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-base-200 flex items-center justify-center text-xs font-medium">
                      {index + 1}
                    </span>
                    <span>{ingredient.name}</span>
                    <span className="text-base-content/50">•</span>
                    <span className="text-base-content/60">{ingredient.amount} {ingredient.unit}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Make Drink Button */}
            <button
              onClick={onMakeDrink}
              className="btn btn-primary w-full gap-2 mt-auto"
            >
              <Beaker className="w-4 h-4" />
              Make Drink
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimpleDrinkModal; 