import React, { useState } from 'react';
import { BeakerIcon, PencilIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const DrinkCard = ({ recipe }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const navigate = useNavigate();

  const showModal = () => setIsModalOpen(true);
  const handleCancel = () => setIsModalOpen(false);

  const handleMakeDrink = () => {
    navigate('/order', { state: { recipe } });
    handleCancel();
  };

  const handleEditRecipe = () => {
    // TODO: Implement edit recipe functionality
    console.log('Edit recipe:', recipe.id);
  };

  return (
    <>
      <div
        onClick={showModal}
        className="card bg-base-100 shadow-md hover:shadow-lg hover:-translate-y-1 transition-all duration-200 h-full cursor-pointer"
      >
        <figure className="aspect-[4/3]">
          {recipe.image ? (
            <img
              src={recipe.image}
              alt={recipe.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-base-200 flex items-center justify-center">
              <span className="text-base-content/60 text-sm">
                No image available
              </span>
            </div>
          )}
        </figure>

        <div className="card-body p-4">
          <div className="flex items-center justify-between gap-2 mb-2">
            <h3
              className="card-title text-base sm:text-lg truncate"
              title={recipe.name}
            >
              {recipe.name}
            </h3>
            {recipe.alcoholic && (
              <div className="badge badge-error text-xs sm:text-sm">
                Alcoholic
              </div>
            )}
          </div>

          {recipe.description && (
            <p
              className="text-base-content/70 mb-3 line-clamp-2 text-xs sm:text-sm"
              title={recipe.description}
            >
              {recipe.description}
            </p>
          )}

          <div className="mt-auto">
            <p className="font-semibold text-xs sm:text-sm mb-1">
              Ingredients:
            </p>
            <ul className="space-y-0.5">
              {recipe.ingredients.map((ingredient, index) => (
                <li
                  key={index}
                  className="text-xs"
                  title={`${ingredient.name} - ${ingredient.amount} ${ingredient.unit}`}
                >
                  • {ingredient.name} - {ingredient.amount} {ingredient.unit}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <dialog open className="modal modal-open">
          <div className="modal-box max-w-4xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg sm:text-xl">{recipe.name}</h3>
              {recipe.alcoholic && (
                <div className="badge badge-error text-xs sm:text-sm">
                  Alcoholic
                </div>
              )}
            </div>

            <div className="flex flex-col md:flex-row gap-4 sm:gap-6">
              {recipe.image && (
                <div className="w-full md:w-1/2">
                  <img
                    className="w-full rounded-lg object-cover"
                    src={recipe.image}
                    alt={recipe.name}
                  />
                </div>
              )}

              <div className="flex-1">
                {recipe.description && (
                  <div className="mb-4 sm:mb-6">
                    <h4 className="font-bold text-base sm:text-lg mb-2">
                      Description
                    </h4>
                    <p className="text-sm sm:text-base">{recipe.description}</p>
                  </div>
                )}

                <div className="mb-4 sm:mb-6">
                  <h4 className="font-bold text-base sm:text-lg mb-2">
                    Ingredients
                  </h4>
                  <ul className="space-y-2">
                    {recipe.ingredients.map((ingredient, index) => (
                      <li key={index} className="text-sm sm:text-base">
                        • {ingredient.name} - {ingredient.amount}{' '}
                        {ingredient.unit}
                      </li>
                    ))}
                  </ul>
                </div>

                {recipe.productionSteps &&
                  recipe.productionSteps.length > 0 && (
                    <div>
                      <h4 className="font-bold text-base sm:text-lg mb-2">
                        Instructions
                      </h4>
                      <ul className="space-y-2">
                        {recipe.productionSteps.map((step, index) => (
                          <li key={index} className="text-sm sm:text-base">
                            {step.type === 'writtenInstruction' ? (
                              <span>
                                {index + 1}. {step.message}
                              </span>
                            ) : (
                              step.type === 'addIngredients' && (
                                <span>
                                  {index + 1}. Add:{' '}
                                  {step.stepIngredients
                                    .map(
                                      (si) =>
                                        `${si.ingredient.name} (${si.amount} ${si.scale})`,
                                    )
                                    .join(', ')}
                                </span>
                              )
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
              </div>
            </div>

            <div className="modal-action">
              <button
                className="btn btn-primary gap-2"
                onClick={handleMakeDrink}
              >
                <BeakerIcon size={16} />
                Make Drink
              </button>
              <button className="btn gap-2" onClick={handleEditRecipe}>
                <PencilIcon size={16} />
                Edit Recipe
              </button>
              <button className="btn" onClick={handleCancel}>
                Close
              </button>
            </div>
          </div>
          <form method="dialog" className="modal-backdrop">
            <button onClick={handleCancel}>close</button>
          </form>
        </dialog>
      )}
    </>
  );
};

export default DrinkCard;
