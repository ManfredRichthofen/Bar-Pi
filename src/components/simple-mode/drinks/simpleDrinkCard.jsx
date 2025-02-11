import React, { useState } from 'react';
import { BeakerIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const SimpleDrinkCard = ({ recipe }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const navigate = useNavigate();

  const showModal = () => setIsModalOpen(true);
  const handleCancel = () => setIsModalOpen(false);

  const handleMakeDrink = () => {
    navigate('/simple/order', { state: { recipe } });
    handleCancel();
  };

  const handleImageLoad = () => {
    setImageLoaded(true);
  };

  return (
    <>
      <div
        onClick={showModal}
        className="card bg-base-100 shadow-md hover:shadow-lg hover:-translate-y-1 transition-all duration-200 h-full cursor-pointer"
      >
        <figure className="aspect-[16/9] sm:aspect-[3/2] relative">
          {recipe.image ? (
            <>
              <div
                className={`absolute inset-0 bg-base-200 ${imageLoaded ? 'hidden' : 'flex items-center justify-center'}`}
              >
                <span className="loading loading-spinner loading-md"></span>
              </div>
              <img
                src={recipe.image}
                alt={recipe.name}
                className={`w-full h-full object-cover transition-opacity duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
                loading="lazy"
                onLoad={handleImageLoad}
              />
            </>
          ) : (
            <div className="w-full h-full bg-base-200 flex items-center justify-center">
              <span className="text-base-content/60 text-xs sm:text-sm">
                No image
              </span>
            </div>
          )}
        </figure>

        <div className="card-body p-2 sm:p-3">
          <div className="flex items-center justify-between gap-1 sm:gap-2 mb-0.5 sm:mb-1">
            <h3
              className="card-title text-xs sm:text-sm truncate"
              title={recipe.name}
            >
              {recipe.name}
            </h3>
            {recipe.alcoholic && (
              <div className="badge badge-error badge-xs sm:badge-sm text-[10px] sm:text-xs whitespace-nowrap">
                21+
              </div>
            )}
          </div>

          {recipe.description && (
            <p
              className="text-base-content/70 mb-1 sm:mb-2 line-clamp-2 text-[10px] sm:text-xs"
              title={recipe.description}
            >
              {recipe.description}
            </p>
          )}

          <div className="mt-auto">
            <p className="font-medium text-[10px] sm:text-xs mb-0.5 sm:mb-1">
              Ingredients:
            </p>
            <ul className="space-y-0.5 text-[10px] sm:text-xs">
              {recipe.ingredients.slice(0, 3).map((ingredient, index) => (
                <li
                  key={index}
                  className="truncate"
                  title={`${ingredient.name} - ${ingredient.amount} ${ingredient.unit}`}
                >
                  • {ingredient.name}
                </li>
              ))}
              {recipe.ingredients.length > 3 && (
                <li className="text-base-content/60">
                  +{recipe.ingredients.length - 3} more
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <dialog open className="modal modal-open">
          <div className="modal-box max-w-3xl mx-4">
            <div className="flex flex-col sm:flex-row gap-4">
              {recipe.image && (
                <div className="w-full sm:w-1/2">
                  <img
                    className="w-full rounded-lg object-cover aspect-[4/3]"
                    src={recipe.image}
                    alt={recipe.name}
                  />
                </div>
              )}

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-3">
                  <h3 className="font-bold text-lg sm:text-xl truncate">
                    {recipe.name}
                  </h3>
                  {recipe.alcoholic && (
                    <div className="badge badge-error text-xs whitespace-nowrap">
                      Alcoholic
                    </div>
                  )}
                </div>

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

            <div className="modal-action mt-4">
              <button
                className="btn btn-primary gap-2"
                onClick={handleMakeDrink}
              >
                <BeakerIcon size={16} />
                Make Drink
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

export default SimpleDrinkCard;
