import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { Download, Loader2, Plus } from 'lucide-react';
import type React from 'react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import cocktailDBService from '@/services/cocktaildb.service';
import glassService from '@/services/glass.service';
import ingredientService from '@/services/ingredient.service';
import RecipeService from '@/services/recipe.service';
import useAuthStore from '@/store/authStore';
import { CocktailDBImportDialog } from './CocktailDBImportDialog';
import { ProductionStepEditor } from './ProductionStepEditor';
import { RecipeBasicInfo } from './RecipeBasicInfo';
import { RecipeFormHeader } from './RecipeFormHeader';
import { RecipeImageUpload } from './RecipeImageUpload';

export interface Ingredient {
  id: number;
  name: string;
  unit?: string;
}

export interface Glass {
  id: number;
  name: string;
  size: number;
}

export interface StepIngredient {
  ingredient: Ingredient | null;
  amount: number;
  scale: string;
  boostable?: boolean;
}

export interface ProductionStep {
  type: string;
  stepIngredients?: StepIngredient[];
  message?: string;
}

export interface RecipeFormData {
  name: string;
  description: string;
  defaultGlass: Glass | null;
  defaultAmountToFill: number;
  productionSteps: ProductionStep[];
  image: File | null;
  imagePreview: string | null;
  removeImage: boolean;
}

const INITIAL_FORM_DATA: RecipeFormData = {
  name: '',
  description: '',
  defaultGlass: null,
  defaultAmountToFill: 250,
  productionSteps: [],
  image: null,
  imagePreview: null,
  removeImage: false,
};

/** Map legacy / short unit names to scale values used by the step editor. */
export function mapUnit(unit?: string | null): string {
  const unitMap: Record<string, string> = {
    ml: 'milliliter',
    cl: 'milliliter',
    oz: 'milliliter',
    g: 'grams',
    piece: 'pieces',
    tsp: 'teaspoons',
    tbsp: 'tablespoons',
  };
  return (unit && unitMap[unit]) || unit || 'milliliter';
}

export function mapProductionStepsForSubmit(steps: ProductionStep[]) {
  return steps.map((step) => {
    if (step.type === 'writtenInstruction') {
      return {
        type: step.type,
        message: step.message || '',
      };
    }

    return {
      type: step.type,
      stepIngredients:
        step.stepIngredients?.map((si) => ({
          ingredient: si.ingredient ? { id: si.ingredient.id } : null,
          amount: si.amount,
          scale: si.scale,
          boostable: si.boostable,
        })) || [],
    };
  });
}

interface RecipeFormProps {
  mode: 'create' | 'edit';
  recipeId?: string;
}

export const RecipeForm: React.FC<RecipeFormProps> = ({ mode, recipeId }) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const token = useAuthStore((state) => state.token);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [glasses, setGlasses] = useState<Glass[]>([]);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [formData, setFormData] = useState<RecipeFormData>(INITIAL_FORM_DATA);

  useEffect(() => {
    if (token) {
      void loadData();
    }
  }, [token, recipeId, mode]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [ingredientsData, glassesData] = await Promise.all([
        ingredientService.getIngredients(token),
        glassService.getGlasses(token),
      ]);

      setIngredients(ingredientsData);
      setGlasses(glassesData);

      if (mode === 'edit' && recipeId) {
        const fullRecipe = await RecipeService.getRecipe(
          recipeId,
          false,
          token,
        );

        const productionSteps: ProductionStep[] =
          fullRecipe.productionSteps?.map(
            (step: {
              type: string;
              message?: string;
              stepIngredients?: Array<{
                ingredient?: Ingredient;
                amount?: number;
                boostable?: boolean;
              }>;
            }) => {
              if (step.type === 'addIngredients') {
                return {
                  ...step,
                  stepIngredients:
                    step.stepIngredients?.map((si) => {
                      const ingredient = si.ingredient || ({} as Ingredient);
                      return {
                        ingredient: {
                          ...ingredient,
                          id: ingredient.id,
                          name: ingredient.name,
                        },
                        amount: si.amount || 0,
                        scale: mapUnit(ingredient.unit),
                        boostable: si.boostable || false,
                      };
                    }) || [],
                };
              }
              return { ...step };
            },
          ) || [];

        setFormData({
          name: fullRecipe.name || '',
          description: fullRecipe.description || '',
          defaultGlass: fullRecipe.defaultGlass || null,
          defaultAmountToFill: fullRecipe.defaultAmountToFill || 250,
          productionSteps,
          image: null,
          imagePreview: fullRecipe.image || null,
          removeImage: false,
        });
      }
    } catch (error) {
      console.error('Failed to load data:', error);
      toast.error(
        mode === 'edit'
          ? 'Failed to load data'
          : 'Failed to load ingredients and glasses',
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();

    if (!formData.name.trim()) {
      toast.error('Recipe name is required');
      return;
    }

    try {
      setSaving(true);

      const recipeDto = {
        name: formData.name.trim(),
        description: formData.description?.trim() || '',
        defaultGlassId: formData.defaultGlass?.id || null,
        defaultAmountToFill: formData.defaultAmountToFill || 250,
        productionSteps: mapProductionStepsForSubmit(formData.productionSteps),
        categoryIds: [] as number[],
      };

      if (mode === 'edit' && recipeId) {
        await RecipeService.updateRecipe(
          recipeId,
          recipeDto,
          formData.image,
          formData.removeImage,
        );
        toast.success('Recipe updated successfully');
      } else {
        await RecipeService.createRecipe(recipeDto, formData.image);
        toast.success('Recipe created successfully');
      }

      await queryClient.invalidateQueries({ queryKey: ['recipes'] });
      navigate({ to: '/recipes' });
    } catch (error) {
      console.error(
        mode === 'edit'
          ? 'Failed to update recipe:'
          : 'Failed to create recipe:',
        error,
      );
      toast.error(
        mode === 'edit' ? 'Failed to save recipe' : 'Failed to create recipe',
      );
    } finally {
      setSaving(false);
    }
  };

  const addProductionStep = (type: string = 'addIngredients') => {
    const newStep: ProductionStep =
      type === 'addIngredients'
        ? { type: 'addIngredients', stepIngredients: [] }
        : { type: 'writtenInstruction', message: '' };

    setFormData((prev) => ({
      ...prev,
      productionSteps: [...prev.productionSteps, newStep],
    }));
  };

  const removeProductionStep = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      productionSteps: prev.productionSteps.filter((_, i) => i !== index),
    }));
  };

  const updateProductionStep = (index: number, updatedStep: ProductionStep) => {
    setFormData((prev) => ({
      ...prev,
      productionSteps: prev.productionSteps.map((step, i) =>
        i === index ? updatedStep : step,
      ),
    }));
  };

  const addIngredientToStep = (stepIndex: number) => {
    const step = formData.productionSteps[stepIndex];
    if (step?.type !== 'addIngredients') return;

    const defaultIngredient =
      mode === 'create' && ingredients.length > 0 ? ingredients[0] : null;

    updateProductionStep(stepIndex, {
      ...step,
      stepIngredients: [
        ...(step.stepIngredients || []),
        {
          ingredient: defaultIngredient,
          amount: 30,
          scale: 'milliliter',
          boostable: false,
        },
      ],
    });
  };

  const removeIngredientFromStep = (
    stepIndex: number,
    ingredientIndex: number,
  ) => {
    const step = formData.productionSteps[stepIndex];
    if (step?.type !== 'addIngredients' || !step.stepIngredients) return;

    updateProductionStep(stepIndex, {
      ...step,
      stepIngredients: step.stepIngredients.filter(
        (_, i) => i !== ingredientIndex,
      ),
    });
  };

  const updateStepIngredient = (
    stepIndex: number,
    ingredientIndex: number,
    field: keyof StepIngredient,
    value: unknown,
  ) => {
    const step = formData.productionSteps[stepIndex];
    if (step?.type !== 'addIngredients' || !step.stepIngredients) return;

    updateProductionStep(stepIndex, {
      ...step,
      stepIngredients: step.stepIngredients.map((ing, i) =>
        i === ingredientIndex ? { ...ing, [field]: value } : ing,
      ),
    });
  };

  const findIngredientByName = (list: Ingredient[], name: string) => {
    const target = cocktailDBService.normalizeName(name);
    const singular = (value: string) => value.replace(/s$/, '');
    return (
      list.find((i) => cocktailDBService.normalizeName(i.name) === target) ||
      list.find(
        (i) =>
          singular(cocktailDBService.normalizeName(i.name)) ===
          singular(target),
      ) ||
      null
    );
  };

  const createImportedIngredient = async (name: string, scale: string) => {
    const info = await cocktailDBService.getIngredientByName(name);
    const abv = parseFloat(info?.strABV ?? '');

    let image: File | null = null;
    try {
      const blob = await cocktailDBService.downloadImage(
        cocktailDBService.getIngredientImageUrl(info?.strIngredient || name),
      );
      image = new File([blob], `${name}.png`, { type: 'image/png' });
    } catch {
      // Not every CocktailDB ingredient has an image
    }

    await ingredientService.createIngredient(
      {
        type: 'manual',
        name,
        parentGroupId: null,
        unit: scale === 'pieces' ? 'piece' : 'ml',
        alcoholContent: Number.isFinite(abv)
          ? Math.min(Math.max(abv, 0), 100)
          : 0,
      },
      image,
      token,
    );
  };

  const handleImportFromCocktailDB = async (cocktailData: {
    name?: string;
    instructions?: string;
    description?: string;
    imageFile?: File;
    glass?: string;
    ingredients?: Array<{
      name: string;
      measure: string;
      amount: number | null;
      scale: string | null;
      garnish: boolean;
    }>;
  }) => {
    setFormData((prev) => ({
      ...prev,
      name: cocktailData.name || '',
      description: cocktailData.instructions || cocktailData.description || '',
    }));

    if (cocktailData.imageFile) {
      setFormData((prev) => ({
        ...prev,
        image: cocktailData.imageFile!,
        imagePreview: URL.createObjectURL(cocktailData.imageFile!),
      }));
    }

    type ImportedIngredient = NonNullable<
      typeof cocktailData.ingredients
    >[number];
    type MeasuredIngredient = ImportedIngredient & {
      amount: number;
      scale: string;
    };

    const imported = cocktailData.ingredients || [];
    const measured = imported.filter(
      (ing): ing is MeasuredIngredient =>
        ing.amount != null && !!ing.scale && !ing.garnish,
    );
    const unmeasured = imported.filter(
      (ing) => !measured.includes(ing as MeasuredIngredient),
    );

    let availableIngredients = ingredients;
    const created: string[] = [];
    const failed: string[] = [];

    const missing = measured.filter(
      (ing, index) =>
        !findIngredientByName(availableIngredients, ing.name) &&
        measured.findIndex(
          (other) =>
            cocktailDBService.normalizeName(other.name) ===
            cocktailDBService.normalizeName(ing.name),
        ) === index,
    );

    for (const ing of missing) {
      try {
        await createImportedIngredient(ing.name, ing.scale);
        created.push(ing.name);
      } catch (error) {
        console.error(`Failed to create ingredient "${ing.name}":`, error);
        failed.push(ing.name);
      }
    }

    if (created.length > 0) {
      try {
        availableIngredients = await ingredientService.getIngredients(token);
        setIngredients(availableIngredients);
        await queryClient.invalidateQueries({ queryKey: ['ingredients'] });
      } catch (error) {
        console.error('Failed to reload ingredients:', error);
      }
    }

    const productionSteps: ProductionStep[] = [];

    if (measured.length > 0) {
      productionSteps.push({
        type: 'addIngredients',
        stepIngredients: measured.map((ing) => ({
          ingredient: findIngredientByName(availableIngredients, ing.name),
          amount: ing.amount,
          scale: ing.scale,
          boostable: false,
        })),
      });
    }

    const garnishes = unmeasured.filter((ing) => ing.garnish);
    const extras = unmeasured.filter((ing) => !ing.garnish);
    const instructionParts = [
      extras.length > 0 &&
        `You will also need: ${extras
          .map((ing) =>
            ing.measure ? `${ing.name} (${ing.measure})` : ing.name,
          )
          .join(', ')}`,
      cocktailData.instructions?.trim(),
      garnishes.length > 0 &&
        `Garnish with ${garnishes.map((ing) => ing.name).join(', ')}.`,
    ].filter(Boolean);

    if (instructionParts.length > 0) {
      productionSteps.push({
        type: 'writtenInstruction',
        message: instructionParts.join('\n\n'),
      });
    }

    setFormData((prev) => ({ ...prev, productionSteps }));

    if (created.length > 0) {
      toast.info(`Created ingredients: ${created.join(', ')}`);
    }
    if (failed.length > 0) {
      toast.warning(
        `Could not create: ${failed.join(', ')}. Select them manually.`,
      );
    }

    if (cocktailData.glass && glasses.length > 0) {
      const matchedGlass = glasses.find(
        (g) =>
          g.name.toLowerCase().includes(cocktailData.glass!.toLowerCase()) ||
          cocktailData.glass!.toLowerCase().includes(g.name.toLowerCase()),
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
      <div className="flex items-center justify-center h-full min-h-screen bg-background">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const title = mode === 'edit' ? 'Edit Recipe' : 'Create Recipe';
  const savingLabel = mode === 'edit' ? 'Saving...' : 'Creating...';

  return (
    <div className="min-h-screen bg-background">
      <RecipeFormHeader title={title} />

      {mode === 'create' && (
        <CocktailDBImportDialog
          open={showImportDialog}
          onOpenChange={setShowImportDialog}
          onImport={handleImportFromCocktailDB}
        />
      )}

      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 max-w-5xl pb-20 sm:pb-0">
        {mode === 'create' && (
          <div className="mb-4 sm:mb-6">
            <Card>
              <CardContent className="pt-4 sm:pt-6 px-4 sm:px-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                  <div className="flex-1">
                    <h3 className="text-base sm:text-lg font-semibold mb-1">
                      Import from CocktailDB
                    </h3>
                    <p className="text-sm sm:text-sm text-foreground-muted">
                      Search and import cocktail recipes with ingredients,
                      instructions, and images from TheCocktailDB
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowImportDialog(true)}
                    className="w-full sm:w-auto shrink-0"
                  >
                    <Download className="mr-2 size-6" />
                    Import Recipe
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          <div id="basic-info">
            <RecipeBasicInfo
              name={formData.name}
              description={formData.description}
              defaultGlass={formData.defaultGlass}
              defaultAmountToFill={formData.defaultAmountToFill}
              glasses={glasses}
              onUpdate={(field, value) =>
                setFormData((prev) => ({ ...prev, [field]: value }))
              }
            />
          </div>

          <Card id="recipe-image">
            {mode === 'create' ? (
              <CardHeader className="px-4 sm:px-6 py-4 sm:py-6">
                <CardTitle className="text-base sm:text-lg">
                  Recipe Image
                </CardTitle>
              </CardHeader>
            ) : null}
            <CardContent
              className={
                mode === 'create'
                  ? 'px-4 sm:px-6 pb-4 sm:pb-6'
                  : 'pt-4 sm:pt-6 px-4 sm:px-6'
              }
            >
              <RecipeImageUpload
                imagePreview={formData.imagePreview}
                onImageChange={(file) =>
                  setFormData((prev) => ({
                    ...prev,
                    image: file,
                    imagePreview: URL.createObjectURL(file),
                    removeImage: false,
                  }))
                }
                onRemoveImage={() =>
                  setFormData((prev) => ({
                    ...prev,
                    image: null,
                    imagePreview: null,
                  }))
                }
                showRemoveToggle={mode === 'edit' && !!recipeId}
                removeImage={formData.removeImage}
                onToggleRemoveImage={(checked) =>
                  setFormData((prev) => ({ ...prev, removeImage: checked }))
                }
              />
            </CardContent>
          </Card>

          <Card id="production-steps">
            {mode === 'create' ? (
              <>
                <CardHeader className="px-4 sm:px-6 py-4 sm:py-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
                    <CardTitle className="text-base sm:text-lg">
                      Production Steps
                    </CardTitle>
                    <Button
                      type="button"
                      onClick={() => addProductionStep('addIngredients')}
                      size="sm"
                      className="w-full sm:w-auto"
                    >
                      <Plus className="mr-2 size-6" />
                      Add Step
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 sm:space-y-4 px-4 sm:px-6">
                  {formData.productionSteps.length === 0 ? (
                    <p className="text-sm text-foreground-muted text-center py-6 sm:py-4">
                      No production steps added yet. Click &quot;Add Step&quot;
                      to begin.
                    </p>
                  ) : (
                    formData.productionSteps.map((step, stepIndex) => (
                      <ProductionStepEditor
                        key={stepIndex}
                        step={step}
                        stepIndex={stepIndex}
                        ingredients={ingredients}
                        onUpdateStep={(updatedStep) =>
                          updateProductionStep(stepIndex, updatedStep)
                        }
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
              </>
            ) : (
              <CardContent className="pt-4 sm:pt-6 px-4 sm:px-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                  <div>
                    <h3 className="font-semibold text-base sm:text-lg">
                      Production Steps
                    </h3>
                    <p className="text-sm sm:text-sm text-foreground-muted mt-1">
                      Build the drink using ingredient steps and written
                      instructions
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="w-full sm:w-auto"
                      onClick={() => addProductionStep('addIngredients')}
                    >
                      + Add Ingredients
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="w-full sm:w-auto"
                      onClick={() => addProductionStep('writtenInstruction')}
                    >
                      + Add Instruction
                    </Button>
                  </div>
                </div>

                <div className="space-y-3 sm:space-y-4">
                  {formData.productionSteps.map((step, stepIndex) => (
                    <ProductionStepEditor
                      key={stepIndex}
                      step={step}
                      stepIndex={stepIndex}
                      ingredients={ingredients}
                      onUpdateStep={(updatedStep) =>
                        updateProductionStep(stepIndex, updatedStep)
                      }
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
                  ))}
                </div>
              </CardContent>
            )}
          </Card>

          {/* Desktop action buttons */}
          <div className="hidden sm:flex flex-row gap-4 pb-0">
            <Button
              type="submit"
              disabled={saving}
              className="flex-1 text-base sm:text-sm"
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 size-6 animate-spin" />
                  {savingLabel}
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
          <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-background border-t shadow-lg z-30 p-3">
            <div className="flex gap-3">
              <Button
                type="submit"
                disabled={saving}
                className="flex-1 text-base"
              >
                {saving ? (
                  <>
                    <Loader2 className="mr-2 size-6 animate-spin" />
                    {savingLabel}
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
