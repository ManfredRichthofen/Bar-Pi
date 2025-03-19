import React from 'react';

const SimpleDrinkCard = ({ recipe, onCardClick }) => {
  return (
    <div 
      className="card bg-base-100 shadow-sm hover:shadow-md cursor-pointer transition-all duration-300 hover:-translate-y-0.5 h-full overflow-hidden border border-base-200"
      onClick={() => onCardClick(recipe)}
    >
      <div className="flex flex-col h-full gap-1.5 p-2 sm:p-3">
        <figure className="relative w-full aspect-[16/9] rounded-lg overflow-hidden shadow-sm bg-base-200">
          {recipe.image ? (
            <img
              src={recipe.image}
              alt={recipe.name}
              className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
            />
          ) : (
            <div className="w-full h-[112px] bg-base-200 flex items-center justify-center">
              <span className="text-base-content/40 text-xs">No image</span>
            </div>
          )}
        </figure>

        <div className="flex items-start justify-between gap-1.5">
          <h3 className="text-sm sm:text-base font-medium break-words flex-1 text-base-content/90">{recipe.name}</h3>
          {recipe.alcoholic && (
            <div className="badge badge-error badge-sm whitespace-nowrap shrink-0">21+</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SimpleDrinkCard;
