import { Beaker } from 'lucide-react';

interface Ingredient {
  name: string;
  amount: number;
  unit: string;
}

interface IngredientsListProps {
  ingredients: Ingredient[];
}

const IngredientsList = ({ ingredients }: IngredientsListProps) => {
  return (
    <div className="card bg-base-200/50 shadow-sm">
      <div className="card-body p-3 sm:p-4">
        <h2 className="text-sm sm:text-base font-semibold mb-3 sm:mb-4 text-base-content/90 flex items-center gap-2">
          <Beaker className="w-3 h-3 sm:w-4 sm:h-4" />
          Ingredients
        </h2>
        <ul className="space-y-2 sm:space-y-3">
          {ingredients.map((ingredient, index) => (
            <li
              key={`${ingredient.name}-${index}`}
              className="flex items-center gap-3 sm:gap-4 p-2 sm:p-3 bg-base-100 rounded-lg shadow-sm hover:shadow-md transition-shadow"
            >
              <span className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs sm:text-sm font-semibold shrink-0">
                {index + 1}
              </span>
              <span className="flex-1 font-medium text-base-content/90 text-sm sm:text-base min-w-0 break-words">
                {ingredient.name}
              </span>
              <span className="text-base-content/70 font-semibold shrink-0 text-xs sm:text-sm">
                {ingredient.amount} {ingredient.unit}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default IngredientsList;
