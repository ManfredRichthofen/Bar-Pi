import React from 'react';

const SimpleDrinkCard = ({ recipe, onCardClick }) => {
  return (
    <div
      className="card bg-base-100 shadow-sm hover:shadow-lg cursor-pointer transition-all duration-300 hover:-translate-y-1 active:scale-95 overflow-hidden border border-base-200 w-full h-full"
      onClick={() => onCardClick(recipe)}
    >
      <div className="flex flex-col h-full">
        {/* Image section - fixed aspect ratio */}
        <figure className="relative w-full aspect-[4/3] rounded-t-lg overflow-hidden bg-base-200 flex-shrink-0">
          {recipe.image ? (
            <img
              src={recipe.image}
              alt={recipe.name}
              className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-base-200 to-base-300 flex items-center justify-center">
              <span className="text-base-content/40 text-sm font-medium">No image</span>
            </div>
          )}
        </figure>

        {/* Content section */}
        <div className="flex flex-col flex-1 p-3">
          <div className="flex items-start gap-2 mb-2">
            <h3 className="text-sm font-semibold text-base-content/90 leading-tight flex-1 min-w-0 line-clamp-2">
              {recipe.name}
            </h3>
            {recipe.alcoholic && (
              <div className="badge badge-error badge-sm whitespace-nowrap shrink-0 flex-shrink-0 text-xs">
                21+
              </div>
            )}
          </div>
          
          {/* Optional: Add a subtle indicator for fabricable drinks */}
          <div className="mt-auto pt-2">
            <div className="flex items-center gap-1 text-xs text-base-content/60">
              <div className="w-2 h-2 rounded-full bg-success/60"></div>
              <span>Available</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimpleDrinkCard;
