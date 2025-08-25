import React, { useState } from 'react';
import { PlusCircle, Settings } from 'lucide-react';

const SimpleDrinkCustomizer = ({
  disableBoosting = false,
  customisations,
  onCustomisationsChange,
  availableIngredients = [],
}) => {
  const [addingIngredient, setAddingIngredient] = useState(false);
  const [selectedIngredient, setSelectedIngredient] = useState(null);

  const additionalIngredients = customisations?.additionalIngredients || [];

  const handleBoostChange = (event) => {
    onCustomisationsChange({
      ...customisations,
      boost: parseInt(event.target.value),
    });
  };

  const handleAdditionalIngredientAmountChange = (ingredientId, amount) => {
    const updatedIngredients = additionalIngredients.map((ing) =>
      ing.ingredient.id === ingredientId ? { ...ing, amount } : ing,
    );
    onCustomisationsChange({
      ...customisations,
      additionalIngredients: updatedIngredients,
    });
  };

  const handleAddIngredient = () => {
    if (!selectedIngredient) return;

    const exists = additionalIngredients.some(
      (ing) => ing.ingredient.id === selectedIngredient.id,
    );

    if (!exists) {
      onCustomisationsChange({
        ...customisations,
        additionalIngredients: [
          ...additionalIngredients,
          {
            ingredient: selectedIngredient,
            amount: 0,
            manualAdd: true,
          },
        ],
      });
    }

    setSelectedIngredient(null);
    setAddingIngredient(false);
  };

  const automatedIngredients = availableIngredients.filter(
    (ing) => ing.type === 'automated',
  );

  return (
    <div className="card bg-base-200/50">
      <div className="collapse collapse-arrow">
        <input type="checkbox" defaultChecked className="peer" />
        <div className="collapse-title text-lg font-semibold flex items-center gap-2">
          <Settings className="w-5 h-5" />
          Customize Drink
        </div>
        <div className="collapse-content">
          <div className="mb-6 mt-4">
            <h3 className="text-lg font-bold mb-3 break-words">
              Alcohol Content Adjustment
            </h3>
            {disableBoosting ? (
              <div className="alert alert-warning mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="stroke-current shrink-0 h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
                <span className="whitespace-normal">
                  This drink's strength cannot be adjusted
                </span>
              </div>
            ) : (
              <p className="text-base-content/70 mb-4 whitespace-normal break-words">
                Adjust the strength of your drink by modifying the alcohol
                content
              </p>
            )}
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min={0}
                  max={200}
                  value={customisations?.boost || 100}
                  onChange={handleBoostChange}
                  step={10}
                  className={`range range-primary flex-1 ${disableBoosting ? 'range-disabled opacity-50' : ''}`}
                  disabled={disableBoosting}
                />
                <div
                  className={`badge ${customisations?.boost > 100 ? 'badge-error' : customisations?.boost < 100 ? 'badge-warning' : 'badge-success'} badge-lg ${disableBoosting ? 'opacity-50' : ''}`}
                >
                  {customisations?.boost === 100
                    ? 'Normal'
                    : `${customisations?.boost > 100 ? '+' : ''}${(customisations?.boost || 100) - 100}%`}
                </div>
              </div>
              <div
                className={`w-full flex justify-between text-sm px-2 text-base-content/70 ${disableBoosting ? 'opacity-50' : ''}`}
              >
                <span>No Alcohol</span>
                <span>Normal</span>
                <span>Double</span>
              </div>
            </div>
          </div>

          {automatedIngredients.length > 0 && (
            <div>
              <h3 className="text-lg font-bold mb-3 break-words">
                Additional Ingredients
              </h3>
              <p className="text-base-content/70 mb-4 whitespace-normal break-words">
                Add extra ingredients to customize your drink
              </p>

              <div className="space-y-4 mb-4">
                {additionalIngredients.map(({ ingredient, amount }) => (
                  <div
                    key={ingredient.id}
                    className="card bg-base-100 shadow-sm"
                  >
                    <div className="card-body p-4">
                      <div className="flex items-center justify-between gap-4 flex-wrap">
                        <h4 className="font-bold break-words">
                          {ingredient.name}
                        </h4>
                        <div className="flex items-center gap-2 shrink-0">
                          <input
                            type="number"
                            min={0}
                            max={100}
                            value={amount}
                            onChange={(e) =>
                              handleAdditionalIngredientAmountChange(
                                ingredient.id,
                                parseFloat(e.target.value),
                              )
                            }
                            className="input input-bordered input-sm w-20"
                          />
                          <span className="text-sm">ml</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {addingIngredient ? (
                  <div className="card bg-base-100 shadow-sm">
                    <div className="card-body p-4">
                      <h4 className="font-bold mb-3">Add New Ingredient</h4>
                      <select
                        className="select select-bordered w-full mb-3"
                        value={selectedIngredient?.id || ''}
                        onChange={(e) => {
                          const ingredient = automatedIngredients.find(
                            (ing) => ing.id === e.target.value,
                          );
                          setSelectedIngredient(ingredient);
                        }}
                      >
                        <option value="">Select ingredient</option>
                        {automatedIngredients
                          .filter(
                            (ing) =>
                              !additionalIngredients.some(
                                (added) => added.ingredient.id === ing.id,
                              ),
                          )
                          .map((ing) => (
                            <option key={ing.id} value={ing.id}>
                              {ing.name}
                            </option>
                          ))}
                      </select>
                      <div className="flex gap-2">
                        <button
                          className="btn btn-primary btn-sm flex-1"
                          onClick={handleAddIngredient}
                          disabled={!selectedIngredient}
                        >
                          Add
                        </button>
                        <button
                          className="btn btn-ghost btn-sm flex-1"
                          onClick={() => {
                            setAddingIngredient(false);
                            setSelectedIngredient(null);
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <button
                    className="btn btn-outline w-full h-12 gap-2"
                    onClick={() => setAddingIngredient(true)}
                  >
                    <PlusCircle className="w-5 h-5" />
                    Add Ingredient
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SimpleDrinkCustomizer;
