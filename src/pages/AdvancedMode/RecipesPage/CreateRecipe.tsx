import { useNavigate } from '@tanstack/react-router';
import { Loader2, Plus } from 'lucide-react';
import type React from 'react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import glassService from '@/services/glass.service';
import ingredientService from '@/services/ingredient.service';
import RecipeService from '@/services/recipe.service';
import useAuthStore from '@/store/authStore';
import { ProductionStepEditor } from './components/ProductionStepEditor';
import { RecipeBasicInfo } from './components/RecipeBasicInfo';
import { RecipeFormHeader } from './components/RecipeFormHeader';
import { RecipeImageUpload } from './components/RecipeImageUpload';

// Types
interface Ingredient {
  id: number;
  name: string;
}

interface Glass {
  id: number;
  name: string;
  size: number;
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

export const NewRecipePage: React.FC = () => {
  const navigate = useNavigate();
  const token = useAuthStore((state) => state.token);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [glasses, setGlasses] = useState<Glass[]>([]);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    defaultGlass: null as Glass | null,
    defaultAmountToFill: 250,
    productionSteps: [] as ProductionStep[],
    image: null as File | null,
    imagePreview: null as string | null,
  });

  useEffect(() => {
    if (token) {
      loadData();
    }
  }, [token]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [ingredientsData, glassesData] = await Promise.all([
        ingredientService.getIngredients(token),
        glassService.getGlasses(token),
      ]);

      setIngredients(ingredientsData);
      setGlasses(glassesData);
    } catch (error) {
      console.error('Failed to load data:', error);
      toast.error('Failed to load ingredients and glasses');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast.error('Recipe name is required');
      return;
    }

    try {
      setSaving(true);

      const recipeData = new FormData();
      recipeData.append('name', formData.name);
      recipeData.append('description', formData.description);
      if (formData.defaultGlass) {
        recipeData.append('defaultGlass', formData.defaultGlass.id.toString());
      }
      recipeData.append(
        'defaultAmountToFill',
        formData.defaultAmountToFill.toString(),
      );

      const productionStepsPayload = formData.productionSteps.map((step) => ({
        type: step.type,
        stepIngredients:
          step.stepIngredients?.map((si) => ({
            ingredient: si.ingredient ? { id: si.ingredient.id } : null,
            amount: si.amount,
            scale: si.scale,
            boostable: si.boostable,
          })) || [],
      }));

      recipeData.append(
        'productionSteps',
        JSON.stringify(productionStepsPayload),
      );

      if (formData.image) {
        recipeData.append('image', formData.image);
      }

      await RecipeService.createRecipe(recipeData, token);
      toast.success('Recipe created successfully');
      navigate({ to: '/recipes' });
    } catch (error) {
      console.error('Failed to create recipe:', error);
      toast.error('Failed to create recipe');
    } finally {
      setSaving(false);
    }
  };

  const addProductionStep = () => {
    setFormData({
      ...formData,
      productionSteps: [
        ...formData.productionSteps,
        {
          type: 'addIngredients',
          stepIngredients: [],
        },
      ],
    });
  };

  const removeProductionStep = (index: number) => {
    const newSteps = formData.productionSteps.filter((_, i) => i !== index);
    setFormData({ ...formData, productionSteps: newSteps });
  };

  const addIngredientToStep = (stepIndex: number) => {
    const newSteps = [...formData.productionSteps];
    const step = newSteps[stepIndex];
    if (step.type === 'addIngredients') {
      step.stepIngredients = [
        ...(step.stepIngredients || []),
        {
          ingredient: ingredients[0],
          amount: 30,
          scale: 'ml',
          boostable: false,
        },
      ];
      setFormData({ ...formData, productionSteps: newSteps });
    }
  };

  const updateStepIngredient = (
    stepIndex: number,
    ingredientIndex: number,
    field: keyof StepIngredient,
    value: any,
  ) => {
    const newSteps = [...formData.productionSteps];
    const step = newSteps[stepIndex];
    if (step.type === 'addIngredients' && step.stepIngredients) {
      step.stepIngredients[ingredientIndex] = {
        ...step.stepIngredients[ingredientIndex],
        [field]: value,
      };
      setFormData({ ...formData, productionSteps: newSteps });
    }
  };

  const removeIngredientFromStep = (
    stepIndex: number,
    ingredientIndex: number,
  ) => {
    const newSteps = [...formData.productionSteps];
    const step = newSteps[stepIndex];
    if (step.type === 'addIngredients' && step.stepIngredients) {
      step.stepIngredients = step.stepIngredients.filter(
        (_, i) => i !== ingredientIndex,
      );
      setFormData({ ...formData, productionSteps: newSteps });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <RecipeFormHeader
        title="Create New Recipe"
        onSave={handleSubmit}
        saving={saving}
        saveText="Create Recipe"
      />

      <div className="container mx-auto px-4 py-6 max-w-5xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          <RecipeBasicInfo
            name={formData.name}
            description={formData.description}
            defaultGlass={formData.defaultGlass}
            defaultAmountToFill={formData.defaultAmountToFill}
            glasses={glasses}
            onUpdate={(field, value) =>
              setFormData({ ...formData, [field]: value })
            }
          />

          <Card>
            <CardHeader>
              <CardTitle>Recipe Image</CardTitle>
            </CardHeader>
            <CardContent>
              <RecipeImageUpload
                imagePreview={formData.imagePreview}
                onImageChange={(file) =>
                  setFormData({
                    ...formData,
                    image: file,
                    imagePreview: URL.createObjectURL(file),
                  })
                }
                onRemoveImage={() =>
                  setFormData({ ...formData, image: null, imagePreview: null })
                }
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Production Steps</CardTitle>
                <Button type="button" onClick={addProductionStep} size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Step
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {formData.productionSteps.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  No production steps added yet. Click "Add Step" to begin.
                </p>
              ) : (
                formData.productionSteps.map((step, stepIndex) => (
                  <ProductionStepEditor
                    key={stepIndex}
                    step={step}
                    stepIndex={stepIndex}
                    ingredients={ingredients}
                    onUpdateStep={(updatedStep) => {
                      const newSteps = [...formData.productionSteps];
                      newSteps[stepIndex] = updatedStep;
                      setFormData({ ...formData, productionSteps: newSteps });
                    }}
                    onRemoveStep={() => removeProductionStep(stepIndex)}
                    onAddIngredient={() => addIngredientToStep(stepIndex)}
                    onRemoveIngredient={(ingredientIndex) =>
                      removeIngredientFromStep(stepIndex, ingredientIndex)
                    }
                    onUpdateIngredient={(ingredientIndex, field, value) =>
                      updateStepIngredient(
                        stepIndex,
                        ingredientIndex,
                        field,
                        value,
                      )
                    }
                  />
                ))
              )}
            </CardContent>
          </Card>

          <div className="flex gap-4">
            <Button type="submit" disabled={saving} className="flex-1">
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>Save</>
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate({ to: '/recipes' })}
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
