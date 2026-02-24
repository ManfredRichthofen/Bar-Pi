import { useNavigate } from '@tanstack/react-router';
import { Loader2, Plus, Download } from 'lucide-react';
import type React from 'react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import glassService from '@/services/glass.service';
import ingredientService from '@/services/ingredient.service';
import RecipeService from '@/services/recipe.service';
import cocktailDBService from '@/services/cocktaildb.service';
import useAuthStore from '@/store/authStore';
import { ProductionStepEditor } from './components/ProductionStepEditor';
import { RecipeBasicInfo } from './components/RecipeBasicInfo';
import { RecipeFormHeader } from './components/RecipeFormHeader';
import { RecipeImageUpload } from './components/RecipeImageUpload';
import { CocktailDBImportDialog } from './components/CocktailDBImportDialog';

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
  const [showImportDialog, setShowImportDialog] = useState(false);

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
          ingredient: ingredients.length > 0 ? ingredients[0] : null,
          amount: 30,
          scale: 'milliliter',
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

  const handleImportFromCocktailDB = (cocktailData: any) => {
    // Set basic info
    setFormData((prev) => ({
      ...prev,
      name: cocktailData.name || '',
      description: cocktailData.instructions || cocktailData.description || '',
    }));

    // Set image if available
    if (cocktailData.imageFile) {
      setFormData((prev) => ({
        ...prev,
        image: cocktailData.imageFile,
        imagePreview: URL.createObjectURL(cocktailData.imageFile),
      }));
    }

    // Convert ingredients to production steps
    if (cocktailData.ingredients && cocktailData.ingredients.length > 0) {
      const stepIngredients = cocktailData.ingredients.map((ing: any) => {
        // Try to find matching ingredient in our system
        const matchedIngredient = ingredients.find(
          (i) => i.name.toLowerCase() === ing.name.toLowerCase(),
        );

        // Parse measurement - CocktailDB provides the unit (tsp, piece, oz, etc.)
        const measurement = cocktailDBService.parseMeasurement(ing.measure) as { amount: number; unit: string };

        return {
          ingredient: matchedIngredient || null,
          amount: measurement.amount,
          scale: measurement.unit,
          boostable: false,
        };
      });

      const productionStep = {
        type: 'addIngredients',
        stepIngredients: stepIngredients,
      };

      // Only set the production steps we need - remove any extras
      setFormData((prev) => ({
        ...prev,
        productionSteps: [productionStep],
      }));
    }

    // Find matching glass
    if (cocktailData.glass && glasses.length > 0) {
      const matchedGlass = glasses.find(
        (g) => g.name.toLowerCase().includes(cocktailData.glass.toLowerCase()) ||
               cocktailData.glass.toLowerCase().includes(g.name.toLowerCase()),
      );
      if (matchedGlass) {
        setFormData((prev) => ({
          ...prev,
          defaultGlass: matchedGlass,
        }));
      }
    }

    toast.success('Recipe imported! Review and adjust ingredients as needed.');
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
        title="Create Recipe"
      />

      <CocktailDBImportDialog
        open={showImportDialog}
        onOpenChange={setShowImportDialog}
        onImport={handleImportFromCocktailDB}
      />

      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 max-w-5xl">
        {/* Import Option */}
        <div className="mb-4 sm:mb-6">
          <Card>
            <CardContent className="pt-4 sm:pt-6 px-4 sm:px-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                <div className="flex-1">
                  <h3 className="text-base sm:text-lg font-semibold mb-1">Import from CocktailDB</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Search and import cocktail recipes with ingredients, instructions, and images from TheCocktailDB
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowImportDialog(true)}
                  className="w-full sm:w-auto shrink-0"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Import Recipe
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6 pb-20 sm:pb-0">
          <div id="basic-info">
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
          </div>

          <Card id="recipe-image">
            <CardHeader className="px-4 sm:px-6 py-4 sm:py-6">
              <CardTitle className="text-base sm:text-lg">Recipe Image</CardTitle>
            </CardHeader>
            <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
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

          <Card id="production-steps">
            <CardHeader className="px-4 sm:px-6 py-4 sm:py-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
                <CardTitle className="text-base sm:text-lg">Production Steps</CardTitle>
                <Button type="button" onClick={addProductionStep} size="sm" className="w-full sm:w-auto">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Step
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4 px-4 sm:px-6">
              {formData.productionSteps.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6 sm:py-4">
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

          {/* Desktop action buttons */}
          <div className="hidden sm:flex flex-row gap-4 pb-0">
            <Button
              type="submit"
              disabled={saving}
              className="flex-1 h-12 sm:h-10 text-base sm:text-sm"
            >
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
              className="h-12 sm:h-10 sm:w-auto text-base sm:text-sm"
            >
              Cancel
            </Button>
          </div>

          {/* Mobile sticky action bar */}
          <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t shadow-lg z-50 p-3">
            <div className="flex gap-3">
              <Button
                type="submit"
                disabled={saving}
                className="flex-1 h-12 text-base"
              >
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
                className="h-12 w-auto text-base px-6"
              >
                Cancel
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
