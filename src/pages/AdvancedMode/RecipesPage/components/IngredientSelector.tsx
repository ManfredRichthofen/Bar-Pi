import React from 'react';
import { X } from 'lucide-react';
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
    <div className="flex gap-2 items-end">
      <div className="flex-1">
        <Label>Ingredient</Label>
        <Select
          value={stepIngredient.ingredient?.id?.toString() || ''}
          onValueChange={updateIngredient}
        >
          <SelectTrigger>
            <SelectValue>
              {stepIngredient.ingredient ? stepIngredient.ingredient.name : "Select ingredient"}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {ingredients.map((ingredient) => (
              <SelectItem
                key={ingredient.id}
                value={ingredient.id.toString()}
              >
                {ingredient.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="w-24">
        <Label>Amount</Label>
        <Input
          type="number"
          value={stepIngredient.amount}
          onChange={(e) => updateAmount(e.target.value)}
          min="0"
        />
      </div>

      <div className="w-20">
        <Label>Unit</Label>
        <Select
          value={stepIngredient.scale}
          onValueChange={updateScale}
        >
          <SelectTrigger>
            <SelectValue>
              {stepIngredient.scale || "ml"}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ml">ml</SelectItem>
            <SelectItem value="cl">cl</SelectItem>
            <SelectItem value="oz">oz</SelectItem>
            <SelectItem value="dash">dash</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {showBoostable && (
        <div className="flex items-center gap-2 pb-2">
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
        onClick={onRemove}
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
};
