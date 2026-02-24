import { X } from 'lucide-react';
import type React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

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

interface IngredientSelectorProps {
  stepIngredient: StepIngredient;
  ingredients: Ingredient[];
  onUpdate: (field: keyof StepIngredient, value: any) => void;
  onRemove: () => void;
  showBoostable?: boolean;
}

export const IngredientSelector: React.FC<IngredientSelectorProps> = ({
  stepIngredient,
  ingredients,
  onUpdate,
  onRemove,
  showBoostable = false,
}) => {
  const updateIngredient = (value: string | null) => {
    if (!value) return;
    const ingredient = ingredients.find((ing) => ing.id.toString() === value);
    onUpdate('ingredient', ingredient);
  };

  const updateAmount = (value: string) => {
    onUpdate('amount', parseFloat(value) || 0);
  };

  const updateScale = (value: string | null) => {
    if (!value) return;
    onUpdate('scale', value);
  };

  return (
    <div
      className={`grid grid-cols-1 gap-2 sm:gap-3 items-end ${
        showBoostable
          ? 'sm:grid-cols-[1fr_96px_80px_auto_auto]'
          : 'sm:grid-cols-[1fr_96px_80px_auto]'
      }`}
    >
      <div>
        <Label className="text-xs sm:text-sm">Ingredient</Label>
        <Select
          value={stepIngredient.ingredient?.id?.toString() || ''}
          onValueChange={updateIngredient}
        >
          <SelectTrigger className="h-10 sm:h-11">
            <SelectValue>
              {stepIngredient.ingredient
                ? stepIngredient.ingredient.name
                : 'Select ingredient'}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {ingredients.map((ingredient) => (
              <SelectItem key={ingredient.id} value={ingredient.id.toString()}>
                {ingredient.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label className="text-xs sm:text-sm">Amount</Label>
        <Input
          type="number"
          value={stepIngredient.amount}
          onChange={(e) => updateAmount(e.target.value)}
          min="0"
          className="h-10 sm:h-11"
        />
      </div>

      <div>
        <Label className="text-xs sm:text-sm">Unit</Label>
        <Select value={stepIngredient.scale || ''} onValueChange={updateScale}>
          <SelectTrigger className="h-10 sm:h-11">
            <SelectValue>{stepIngredient.scale || 'Select unit'}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="grams">grams</SelectItem>
            <SelectItem value="pieces">pieces</SelectItem>
            <SelectItem value="milliliter">milliliter</SelectItem>
            <SelectItem value="teaspoons">teaspoons</SelectItem>
            <SelectItem value="tablespoons">tablespoons</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {showBoostable && (
        <div className="flex items-center gap-2 h-10 sm:h-11">
          <input
            type="checkbox"
            className="h-4 w-4"
            checked={stepIngredient.boostable || false}
            onChange={(e) => onUpdate('boostable', e.target.checked)}
          />
          <span className="text-xs">Boostable</span>
        </div>
      )}

      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-10 w-10 sm:h-11 sm:w-11"
        onClick={onRemove}
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
};
