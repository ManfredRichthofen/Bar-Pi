import { AlertTriangle } from 'lucide-react';

interface ManualIngredient {
  ingredient: {
    name: string;
    unit: string;
  };
  amount: number;
}

interface ManualIngredientPromptProps {
  ingredients: ManualIngredient[];
  onConfirm: () => void;
  confirming: boolean;
}

const ManualIngredientPrompt = ({
  ingredients,
  onConfirm,
  confirming,
}: ManualIngredientPromptProps) => {
  return (
    <div className="card bg-warning/20 border border-warning/30 shadow-sm">
      <div className="card-body p-3 sm:p-4">
        <div className="flex gap-2 sm:gap-3">
          <AlertTriangle
            size={20}
            className="text-warning shrink-0 mt-0.5 sm:mt-1 sm:w-6 sm:h-6"
          />
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-base sm:text-lg mb-2 sm:mb-3">
              Manual Ingredients Required
            </h3>
            <div>
              {ingredients.length > 0 ? (
                <ul className="space-y-1.5 sm:space-y-2 mb-3 sm:mb-4">
                  {ingredients.map((item, index) => (
                    <li
                      key={`${item.ingredient.name}-${index}`}
                      className="flex justify-between items-center p-2 sm:p-3 bg-base-100 rounded-lg"
                    >
                      <span className="font-medium text-sm sm:text-base min-w-0 break-words flex-1 pr-2">
                        {item.ingredient.name}
                      </span>
                      <span className="text-xs sm:text-sm text-base-content/70 shrink-0">
                        {item.amount} {item.ingredient.unit}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs sm:text-sm mb-3 sm:mb-4">
                  Required ingredients will be listed here
                </p>
              )}
              <p className="text-xs sm:text-sm opacity-75 mb-3 sm:mb-4">
                Please add these ingredients and confirm when ready.
              </p>
              <button
                type="button"
                className="btn btn-warning w-full h-10 sm:h-12 text-sm sm:text-base font-semibold"
                onClick={onConfirm}
                disabled={confirming}
              >
                {confirming ? 'Confirming...' : 'Confirm Added'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManualIngredientPrompt;
