import { X } from 'lucide-react';
import type React from 'react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
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

  const [amountDraft, setAmountDraft] = useState(
    String(stepIngredient.amount ?? ''),
  );

  useEffect(() => {
    if ((parseFloat(amountDraft) || 0) !== stepIngredient.amount) {
      setAmountDraft(String(stepIngredient.amount ?? ''));
    }
  }, [stepIngredient.amount]);

  const updateAmount = (value: string) => {
    setAmountDraft(value);
    onUpdate('amount', parseFloat(value) || 0);
  };

  const updateScale = (value: string | null) => {
    if (!value) return;
    onUpdate('scale', value);
  };

  return (
    <div className="grid grid-cols-2 gap-2 sm:gap-3 items-end @2xl:grid-cols-[minmax(0,1fr)_6rem_10rem_auto]">
      <div className="col-span-2 min-w-0 @2xl:col-span-1">
        <Label className="text-sm sm:text-sm">Ingredient</Label>
        <Select
          value={stepIngredient.ingredient?.id?.toString() || ''}
          onValueChange={updateIngredient}
        >
          <SelectTrigger>
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

      <div className="min-w-0">
        <Label className="text-sm sm:text-sm">Amount</Label>
        <Input
          type="number"
          value={amountDraft}
          onChange={(e) => updateAmount(e.target.value)}
          min="0"
          step="any"
          className="h-10 sm:h-11"
        />
      </div>

      <div className="min-w-0">
        <Label className="text-sm sm:text-sm">Unit</Label>
        <Select value={stepIngredient.scale || ''} onValueChange={updateScale}>
          <SelectTrigger>
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

      <div className="col-span-2 flex items-center justify-between gap-3 @2xl:col-span-1">
        {showBoostable && (
          <Label className="text-sm cursor-pointer whitespace-nowrap">
            <Checkbox
              checked={stepIngredient.boostable || false}
              onCheckedChange={(checked) => onUpdate('boostable', checked)}
            />
            Boostable
          </Label>
        )}

        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="ml-auto shrink-0"
          aria-label="Remove ingredient"
          onClick={onRemove}
        >
          <X className="size-6" />
        </Button>
      </div>
    </div>
  );
};
