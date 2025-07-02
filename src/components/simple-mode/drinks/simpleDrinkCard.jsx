import React from 'react';

const SimpleDrinkCard = ({ recipe, onCardClick }) => {
  return (
    <div
      className="card bg-base-100 shadow-sm hover:shadow-md cursor-pointer transition-all duration-300 hover:-translate-y-0.5 overflow-hidden border border-base-200 w-full p-2 sm:p-2.5 md:p-3"
      onClick={() => onCardClick(recipe)}
    >
      <div className="flex flex-col">
        {/* Image section - fixed aspect ratio */}
        <figure className="relative w-full aspect-[16/9] rounded-lg overflow-hidden shadow-sm bg-base-200 flex-shrink-0 mb-2">
          {recipe.image ? (
            <img
              src={recipe.image}
              alt={recipe.name}
              className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
            />
          ) : (
            <div className="w-full h-full bg-base-200 flex items-center justify-center">
              <span className="text-base-content/40 text-xs">No image</span>
            </div>
          )}
        </figure>

        {/* Content section - with consistent bottom margin */}
        <div className="flex flex-col flex-shrink-0">
          <div className="flex items-start gap-2 mb-1">
            <h3 className="text-xs sm:text-sm md:text-base font-medium text-base-content/90 leading-tight flex-1 min-w-0 line-clamp-2">
              {recipe.name}
            </h3>
            {recipe.alcoholic && (
              <div className="badge badge-error badge-xs sm:badge-sm whitespace-nowrap shrink-0 flex-shrink-0">
                21+
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimpleDrinkCard;
