import { AlertTriangle, CheckCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

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
    <Card className="border-accent/30 bg-accent/5">
      <CardContent className="p-4 sm:p-6">
        <div className="flex items-start gap-3 sm:gap-4 mb-4">
          <div className="rounded-full p-2 sm:p-3 bg-accent/20">
            <AlertTriangle className="w-6 h-6 sm:w-8 sm:h-8 text-accent-foreground" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg sm:text-xl font-bold mb-1">
              Manual Action Required
            </h3>
            <p className="text-sm sm:text-base text-muted-foreground">
              Please add the following ingredients manually
            </p>
          </div>
        </div>

        {ingredients.length > 0 ? (
          <div className="space-y-2 mb-4 sm:mb-6">
            {ingredients.map((item, index) => (
              <div
                key={`${item.ingredient.name}-${index}`}
                className="flex justify-between items-center p-3 sm:p-4 bg-background rounded-lg border border-accent/20 hover:border-accent/40 transition-colors"
              >
                <span className="font-medium text-sm sm:text-base min-w-0 break-words flex-1 pr-2">
                  {item.ingredient.name}
                </span>
                <span className="text-sm sm:text-base text-accent-foreground shrink-0 font-bold">
                  {item.amount} {item.ingredient.unit}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm sm:text-base text-muted-foreground mb-4 sm:mb-6">
            Required ingredients will be listed here
          </p>
        )}

        <Button
          className="w-full bg-yellow-600 hover:bg-yellow-700 text-white gap-2"
          onClick={onConfirm}
          disabled={confirming}
          size="lg"
        >
          <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" />
          {confirming ? 'Confirming...' : 'Confirm Ingredients Added'}
        </Button>
      </CardContent>
    </Card>
  );
};

export default ManualIngredientPrompt;
