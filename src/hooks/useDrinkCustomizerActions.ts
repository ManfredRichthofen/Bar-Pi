import { useState } from 'react';
import type {
  Ingredient,
  OrderCustomizations,
} from '../pages/Shared/order/types';

interface UseDrinkCustomizerActionsOptions {
  customizations: OrderCustomizations;
  onCustomizationsChange: (customizations: OrderCustomizations) => void;
}

/**
 * Shared boost / additional-ingredient mutations for both DrinkCustomizer UIs.
 */
export function useDrinkCustomizerActions({
  customizations,
  onCustomizationsChange,
}: UseDrinkCustomizerActionsOptions) {
  const [addingIngredient, setAddingIngredient] = useState(false);
  const [selectedIngredient, setSelectedIngredient] =
    useState<Ingredient | null>(null);

  const additionalIngredients = customizations?.additionalIngredients || [];

  const handleBoostChange = (value: number | readonly number[]) => {
    const boost = Array.isArray(value) ? value[0] : value;
    onCustomizationsChange({
      ...customizations,
      boost,
    });
  };

  const handleAdditionalIngredientAmountChange = (
    ingredientId: string,
    amount: number,
  ) => {
    const updatedIngredients = additionalIngredients.map((ing) =>
      ing.ingredient.id === ingredientId ? { ...ing, amount } : ing,
    );
    onCustomizationsChange({
      ...customizations,
      additionalIngredients: updatedIngredients,
    });
  };

  const handleAddIngredient = () => {
    if (!selectedIngredient) return;

    const exists = additionalIngredients.some(
      (ing) => ing.ingredient.id === selectedIngredient.id,
    );

    if (!exists) {
      onCustomizationsChange({
        ...customizations,
        additionalIngredients: [
          ...additionalIngredients,
          {
            ingredient: selectedIngredient,
            amount: 0,
            manualAdd: true,
          },
        ],
      });
    }

    setSelectedIngredient(null);
    setAddingIngredient(false);
  };

  const handleRemoveIngredient = (ingredientId: string) => {
    onCustomizationsChange({
      ...customizations,
      additionalIngredients: additionalIngredients.filter(
        (ing) => ing.ingredient.id !== ingredientId,
      ),
    });
  };

  return {
    addingIngredient,
    setAddingIngredient,
    selectedIngredient,
    setSelectedIngredient,
    additionalIngredients,
    handleBoostChange,
    handleAdditionalIngredientAmountChange,
    handleAddIngredient,
    handleRemoveIngredient,
  };
}
