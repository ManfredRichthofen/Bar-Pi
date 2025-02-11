import React from 'react';
import { XCircle, AlertCircle } from 'lucide-react';

const SimpleIngredientRequirements = ({ requiredIngredients }) => {
  const isAutomatedIngredient = (ingredient) => {
    return ingredient && ingredient.type === 'automated';
  };

  const isManualIngredient = (ingredient) => {
    return (
      ingredient &&
      (ingredient.type === 'manual' ||
        ingredient.type === 'group' ||
        ingredient.type === 'ingredient')
    );
  };

  const isRequiredIngredient = (item) => {
    return item && item.amountRequired > 0;
  };

  const automaticIngredients = requiredIngredients.filter(
    (x) => isAutomatedIngredient(x.ingredient) && isRequiredIngredient(x),
  );

  const manualIngredients = requiredIngredients.filter(
    (x) => isManualIngredient(x.ingredient) && isRequiredIngredient(x),
  );

  const hasUnavailableIngredients = requiredIngredients.some(
    (x) => x.amountMissing > 0 || (!x.ingredient.onPump && x.ingredient.type === 'automated')
  );

  if (requiredIngredients.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Automated Ingredients Section */}
      {automaticIngredients.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <h3 className="font-semibold text-base">Automated Ingredients</h3>
          </div>
          <div className="space-y-2">
            {automaticIngredients.map((item, index) => (
              <div
                key={index}
                className={`flex justify-between w-full p-2 rounded-lg ${
                  item.amountMissing > 0 || !item.ingredient.onPump
                    ? 'bg-error/10'
                    : 'bg-base-200'
                }`}
              >
                <span className="break-words flex-1 pr-2">{item.ingredient.name}</span>
                <div className="text-right shrink-0">
                  <span className="font-semibold whitespace-nowrap">
                    {item.amountRequired} {item.ingredient.unit}
                  </span>
                  {item.amountMissing > 0 && (
                    <div className="text-error text-sm whitespace-nowrap">
                      Missing: {item.amountMissing} {item.ingredient.unit}
                    </div>
                  )}
                  {!item.ingredient.onPump && (
                    <div className="text-error text-sm whitespace-nowrap">
                      Not on pump system
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Manual Ingredients Section */}
      {manualIngredients.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <h3 className="font-semibold text-base">Manual Ingredients</h3>
            <AlertCircle className="text-warning" size={16} />
          </div>
          <div className="space-y-2">
            {manualIngredients.map((item, index) => (
              <div
                key={index}
                className={`flex justify-between w-full p-2 rounded-lg ${
                  !item.ingredient.inBar ? 'bg-warning/10' : 'bg-base-200'
                }`}
              >
                <span className="break-words flex-1 pr-2">{item.ingredient.name}</span>
                <div className="text-right shrink-0">
                  <span className="font-semibold whitespace-nowrap">
                    {item.amountRequired} {item.ingredient.unit}
                  </span>
                  {!item.ingredient.inBar && (
                    <div className="text-warning text-sm whitespace-nowrap">
                      Add manually
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Warning for unknown ingredients */}
      {requiredIngredients.length > 0 &&
        automaticIngredients.length === 0 &&
        manualIngredients.length === 0 && (
          <div className="alert alert-warning">
            <AlertCircle size={16} />
            <span className="break-words">
              Could not determine ingredient types. Please check the recipe
              configuration.
            </span>
          </div>
        )}
    </div>
  );
};

export default SimpleIngredientRequirements;
