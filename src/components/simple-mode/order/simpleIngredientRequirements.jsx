import React from 'react';
import { XCircle, AlertCircle } from 'lucide-react';

const SimpleIngredientRequirements = ({ requiredIngredients }) => {

  const isAutomatedIngredient = (ingredient) => {
    return ingredient && 
           ingredient.type === 'automated' &&
           ingredient.onPump === true;
  };


  const isManualIngredient = (ingredient) => {
    return ingredient && 
           (ingredient.type === 'manual' || 
            ingredient.type === 'group' ||
            ingredient.type === 'ingredient' ||
            (ingredient.type === 'automated' && !ingredient.onPump));
  };


  const isRequiredIngredient = (item) => {
    return item && item.amountRequired > 0;
  };

  // Separate ingredients by type with proper type checking and amount requirements
  const automaticIngredients = requiredIngredients.filter(x => 
    isAutomatedIngredient(x.ingredient) && isRequiredIngredient(x)
  );

  const manualIngredients = requiredIngredients.filter(x => 
    isManualIngredient(x.ingredient) && isRequiredIngredient(x)
  );


  const hasUnavailableAutomatic = automaticIngredients.some(
    (x) => x.amountMissing > 0 || !x.ingredient.onPump
  );

  return (
    <>
      {/* Automated Ingredients Card */}
      {automaticIngredients.length > 0 && (
        <div className={`card shadow-xl mb-4 ${hasUnavailableAutomatic ? 'bg-error/10' : 'bg-base-100'}`}>
          <div className="card-body">
            <div className="flex items-center gap-2 mb-4">
              {hasUnavailableAutomatic && <XCircle className="text-error" size={20} />}
              <h3 className="card-title text-lg">Automated Ingredients</h3>
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
                  <span>{item.ingredient.name}</span>
                  <div className="text-right">
                    <span className="font-semibold">
                      {item.amountRequired} {item.ingredient.unit}
                    </span>
                    {item.amountMissing > 0 && (
                      <div className="text-error text-sm">
                        Missing: {item.amountMissing} {item.ingredient.unit}
                      </div>
                    )}
                    {!item.ingredient.onPump && (
                      <div className="text-error text-sm">Not on pump system</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Manual Ingredients Card */}
      {manualIngredients.length > 0 && (
        <div className="card shadow-xl mb-4 bg-base-100">
          <div className="card-body">
            <div className="flex items-center gap-2 mb-4">
              <AlertCircle className="text-warning" size={20} />
              <h3 className="card-title text-lg">Manual Ingredients Needed</h3>
            </div>
            <div className="space-y-2">
              {manualIngredients.map((item, index) => (
                <div
                  key={index}
                  className={`flex justify-between w-full p-2 rounded-lg ${
                    !item.ingredient.inBar ? 'bg-warning/10' : 'bg-base-200'
                  }`}
                >
                  <span>{item.ingredient.name}</span>
                  <div className="text-right">
                    <span className="font-semibold">
                      {item.amountRequired} {item.ingredient.unit}
                    </span>
                    {!item.ingredient.inBar && (
                      <div className="text-warning text-sm">Add manually</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}


      {requiredIngredients.length > 0 && 
       automaticIngredients.length === 0 && 
       manualIngredients.length === 0 && (
        <div className="alert alert-warning">
          <AlertCircle size={16} />
          <span>Could not determine ingredient types. Please check the recipe configuration.</span>
        </div>
      )}
    </>
  );
};

export default SimpleIngredientRequirements;
