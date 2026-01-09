import { Beaker } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

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
    <Card className="bg-muted/50">
      <CardContent className="p-3 sm:p-4">
        <h2 className="text-sm sm:text-base font-semibold mb-3 sm:mb-4 flex items-center gap-2">
          <Beaker className="w-3 h-3 sm:w-4 sm:h-4" />
          Ingredients
        </h2>
        <ul className="space-y-2 sm:space-y-3">
          {ingredients.map((ingredient, index) => (
            <li
              key={`${ingredient.name}-${index}`}
              className="flex items-center gap-3 sm:gap-4 p-2 sm:p-3 bg-background rounded-lg shadow-sm hover:shadow-md transition-shadow"
            >
              <span className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs sm:text-sm font-semibold shrink-0">
                {index + 1}
              </span>
              <span className="flex-1 font-medium text-sm sm:text-base min-w-0 break-words">
                {ingredient.name}
              </span>
              <span className="text-muted-foreground font-semibold shrink-0 text-xs sm:text-sm">
                {ingredient.amount} {ingredient.unit}
              </span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
};

export default IngredientsList;
