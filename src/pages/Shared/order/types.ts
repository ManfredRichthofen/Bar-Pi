export interface Glass {
  id: string;
  name: string;
  size?: number;
  sizeInMl?: number;
  description?: string;
}

export interface Ingredient {
  id: string;
  name: string;
  type: string;
  unit?: string;
  alcoholContent?: number;
  onPump?: boolean;
  inBar?: boolean;
}

export interface RecipeIngredient {
  name: string;
  amount: number;
  unit: string;
}

export interface Recipe {
  id: string;
  name: string;
  description?: string;
  image?: string;
  alcoholic?: boolean;
  defaultGlass?: Glass;
  ingredients?: RecipeIngredient[];
}

export interface AdditionalIngredient {
  ingredient: Ingredient;
  amount: number;
  manualAdd?: boolean;
}

export interface OrderCustomizations {
  boost: number;
  additionalIngredients: AdditionalIngredient[];
}

export interface RequiredIngredient {
  ingredient: Ingredient;
  amountRequired: number;
  amountMissing: number;
  amount?: number;
}

export interface FeasibilityResult {
  feasible: boolean;
  totalAmountInMl?: number;
  reason?: string;
  requiredIngredients: RequiredIngredient[];
}

export type OrderFlowMode = 'simple' | 'advanced';
