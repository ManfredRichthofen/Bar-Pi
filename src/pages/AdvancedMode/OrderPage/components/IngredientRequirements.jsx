import React from 'react';
import { CheckCircle, XCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const IngredientRequirements = ({ requiredIngredients }) => {
  const { t } = useTranslation();
  const insufficientIngredients = requiredIngredients.filter(
    (x) => x.amountMissing > 0,
  );
  const isFulfilled = insufficientIngredients.length === 0;

  return (
    <div
      className={`card shadow-xl mb-4 ${isFulfilled ? 'bg-success/10' : 'bg-warning/10'}`}
    >
      <div className="card-body">
        <div className="flex items-center gap-2 mb-4">
          {isFulfilled ? (
            <CheckCircle className="text-success" size={20} />
          ) : (
            <XCircle className="text-error" size={20} />
          )}
          <h3 className="card-title text-lg">
            {isFulfilled ? 'All ingredients available' : 'Missing ingredients'}
          </h3>
        </div>

        <div className="space-y-2">
          {(isFulfilled ? requiredIngredients : insufficientIngredients).map(
            (item, index) => (
              <div
                key={index}
                className="flex justify-between w-full p-2 bg-base-200 rounded-lg"
              >
                <span>{item.ingredient.name}</span>
                <span className="font-semibold">
                  {item.amountRequired} {item.ingredient.unit}
                  {!isFulfilled && item.amountMissing > 0 && (
                    <span className="text-error">
                      {' '}
                      ({t('ingredient_requirements.missing')}: {item.amountMissing} {item.ingredient.unit})
                    </span>
                  )}
                </span>
              </div>
            ),
          )}
        </div>
      </div>
    </div>
  );
};

export default IngredientRequirements;
