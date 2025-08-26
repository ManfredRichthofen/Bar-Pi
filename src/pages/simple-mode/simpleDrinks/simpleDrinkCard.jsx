import React from 'react';

const SimpleDrinkCard = ({ recipe, onCardClick }) => {
  // Determine recipe characteristics
  const isAutomatic = recipe?.ingredients?.every(ingredient => ingredient.type === 'automated') || false;
  const isManual = recipe?.ingredients?.some(ingredient => ingredient.type === 'manual') || false;
  const isAvailable = recipe?.ingredients?.every(ingredient => {
    const isOnPump = ingredient.onPump === true;
    const isInBar = ingredient.inBar === true;
    const hasNoMissingAmount = !ingredient.amountMissing || ingredient.amountMissing <= 0;
    return (isOnPump || isInBar) && hasNoMissingAmount;
  }) || false;
  
  // Special case: automatic AND available (all automated ingredients on pumps with no missing amounts)
  const isAutomaticAndAvailable = recipe?.ingredients?.every(ingredient => 
    ingredient.type === 'automated' && 
    ingredient.onPump === true && 
    (!ingredient.amountMissing || ingredient.amountMissing <= 0)
  ) || false;
  
  // Determine availability text and color
  let availabilityText = 'Available';
  let availabilityColor = 'bg-success/60';
  
  if (isAutomaticAndAvailable) {
    availabilityText = 'Auto + Available';
    availabilityColor = 'bg-primary/60';
  } else if (isAutomatic && isAvailable) {
    availabilityText = 'Auto + Available';
    availabilityColor = 'bg-primary/60';
  } else if (isAutomatic) {
    availabilityText = 'Automatic';
    availabilityColor = 'bg-info/60';
  } else if (isManual && isAvailable) {
    availabilityText = 'Manual + Available';
    availabilityColor = 'bg-warning/60';
  } else if (isManual) {
    availabilityText = 'Manual';
    availabilityColor = 'bg-warning/40';
  } else if (isAvailable) {
    availabilityText = 'Available';
    availabilityColor = 'bg-success/60';
  } else {
    availabilityText = 'Unavailable';
    availabilityColor = 'bg-error/60';
  }

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
        <div className="flex flex-col flex-1 p-4">
          {/* Title and badge section */}
          <div className="flex items-start gap-3 mb-2">
            <h3 className="text-base font-bold text-base-content/90 leading-tight flex-1 min-w-0 line-clamp-2">
              {recipe.name}
            </h3>
            {recipe.alcoholic && (
              <div className="badge badge-error badge-sm whitespace-nowrap shrink-0 text-xs font-semibold">
                21+
              </div>
            )}
          </div>
          
          {/* Availability indicator */}
          <div className="mt-auto pt-2">
            <div className="flex items-center gap-2 text-xs text-base-content/60">
              <div className={`w-2 h-2 rounded-full ${availabilityColor}`}></div>
              <span className="font-medium">{availabilityText}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimpleDrinkCard;
