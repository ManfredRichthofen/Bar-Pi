import { Trash2 } from 'lucide-react';
import type React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { IngredientSelector } from './IngredientSelector';

// Types
interface Ingredient {
  id: number;
  name: string;
}

interface StepIngredient {
  ingredient: Ingredient | null;
  amount: number;
  scale: string;
  boostable?: boolean;
}

interface ProductionStep {
  type: string;
  stepIngredients?: StepIngredient[];
  message?: string;
}

interface ProductionStepEditorProps {
  step: ProductionStep;
  stepIndex: number;
  ingredients: Ingredient[];
  onUpdateStep: (step: ProductionStep) => void;
  onRemoveStep: () => void;
  onAddIngredient: () => void;
  onRemoveIngredient: (ingredientIndex: number) => void;
  onUpdateIngredient: (
    ingredientIndex: number,
    field: keyof StepIngredient,
    value: any,
  ) => void;
}

export const ProductionStepEditor: React.FC<ProductionStepEditorProps> = ({
  step,
  stepIndex,
  ingredients,
  onUpdateStep,
  onRemoveStep,
  onAddIngredient,
  onRemoveIngredient,
  onUpdateIngredient,
}) => {
  const updateStepIngredient = (
    ingredientIndex: number,
    field: keyof StepIngredient,
    value: any,
  ) => {
    onUpdateIngredient(ingredientIndex, field, value);
  };

  return (
    <Card>
      <CardContent className="pt-4 px-3 sm:px-4 pb-4">
        <div className="flex items-start sm:items-center justify-between gap-2 mb-3">
          <span className="font-medium text-xs sm:text-sm leading-5">
            Step {stepIndex + 1} ·{' '}
            {step.type === 'addIngredients' ? 'Add ingredients' : 'Instruction'}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 sm:h-9 sm:w-9 shrink-0"
            onClick={onRemoveStep}
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>

        {step.type === 'addIngredients' ? (
          <div className="space-y-2 sm:space-y-3">
            {step.stepIngredients?.map((ing, ingIndex) => (
              <IngredientSelector
                key={ingIndex}
                stepIngredient={ing}
                ingredients={ingredients}
                onUpdate={(field, value) =>
                  updateStepIngredient(ingIndex, field, value)
                }
                onRemove={() => onRemoveIngredient(ingIndex)}
                showBoostable={true}
              />
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full mt-1 h-10"
              onClick={onAddIngredient}
            >
              + Add Ingredient
            </Button>
          </div>
        ) : (
          <Textarea
            placeholder="Enter instruction (e.g., Shake with ice, Strain into glass)"
            value={step.message || ''}
            className="min-h-[96px] sm:min-h-[110px]"
            onChange={(e) =>
              onUpdateStep({
                ...step,
                message: e.target.value,
              })
            }
          />
        )}
      </CardContent>
    </Card>
  );
};
