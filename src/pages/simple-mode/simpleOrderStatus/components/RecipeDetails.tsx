import { Info } from 'lucide-react';

interface Ingredient {
  name: string;
  amount: number;
  unit: string;
}

interface Recipe {
  ingredients?: Ingredient[];
  description?: string;
}

interface RecipeDetailsProps {
  recipe: Recipe;
}

const RecipeDetails = ({ recipe }: RecipeDetailsProps) => {
  return (
    <div className="grid gap-3 sm:gap-4">
      {/* Ingredients List */}
      {recipe.ingredients && (
        <div className="card bg-base-200/50 shadow-sm">
          <div className="card-body p-3 sm:p-4">
            <h3 className="font-bold text-base sm:text-lg mb-2 sm:mb-3 flex items-center gap-2">
              <Info className="w-3 h-3 sm:w-4 sm:h-4" />
              Ingredients
            </h3>
            <div className="space-y-1.5 sm:space-y-2">
              {recipe.ingredients.map((ingredient, index) => (
                <div
                  key={`${ingredient.name}-${index}`}
                  className="flex justify-between items-center p-2 sm:p-3 bg-base-100 rounded-lg"
                >
                  <span className="font-medium text-sm sm:text-base min-w-0 break-words flex-1 pr-2">
                    {ingredient.name}
                  </span>
                  <span className="text-xs sm:text-sm text-base-content/70 shrink-0">
                    {ingredient.amount} {ingredient.unit}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Description */}
      {recipe.description && (
        <div className="card bg-base-200/50 shadow-sm">
          <div className="card-body p-3 sm:p-4">
            <h3 className="font-bold text-base sm:text-lg mb-2 sm:mb-3 flex items-center gap-2">
              <Info className="w-3 h-3 sm:w-4 sm:h-4" />
              Description
            </h3>
            <p className="text-base-content/70 text-xs sm:text-sm leading-relaxed">
              {recipe.description}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecipeDetails;
