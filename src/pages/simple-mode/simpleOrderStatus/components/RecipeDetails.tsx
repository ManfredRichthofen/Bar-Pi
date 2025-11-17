import { Info, ChefHat } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

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
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
      {/* Ingredients List */}
      {recipe.ingredients && (
        <Card className={recipe.description ? 'md:col-span-1' : 'md:col-span-2'}>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center gap-2 mb-4">
              <ChefHat className="w-5 h-5 text-primary" />
              <h3 className="text-base sm:text-lg font-bold">
                Ingredients
              </h3>
            </div>
            <div className="space-y-2">
              {recipe.ingredients.map((ingredient, index) => (
                <div
                  key={`${ingredient.name}-${index}`}
                  className="flex justify-between items-center p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
                >
                  <span className="font-medium text-sm sm:text-base min-w-0 break-words flex-1 pr-2">
                    {ingredient.name}
                  </span>
                  <span className="text-xs sm:text-sm text-muted-foreground shrink-0 font-semibold">
                    {ingredient.amount} {ingredient.unit}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Description */}
      {recipe.description && (
        <Card className="md:col-span-1">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center gap-2 mb-4">
              <Info className="w-5 h-5 text-primary" />
              <h3 className="text-base sm:text-lg font-bold">
                About This Drink
              </h3>
            </div>
            <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
              {recipe.description}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default RecipeDetails;
