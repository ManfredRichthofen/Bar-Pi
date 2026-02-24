import { useNavigate, useParams } from '@tanstack/react-router';
import { Loader2 } from 'lucide-react';
import React, { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import glassService from '@/services/glass.service';
import ingredientService from '@/services/ingredient.service';
import RecipeService from '@/services/recipe.service';
import useAuthStore from '@/store/authStore';
import { ProductionStepEditor } from './components/ProductionStepEditor';
import { RecipeBasicInfo } from './components/RecipeBasicInfo';
import { RecipeFormHeader } from './components/RecipeFormHeader';
import { RecipeImageUpload } from './components/RecipeImageUpload';

const RecipeEditPage = () => {
  const navigate = useNavigate({ from: '/recipes/$recipeId/edit' });
  const params = useParams({ strict: false });
  const recipeId = params?.recipeId;
  const token = useAuthStore((state) => state.token);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [ingredients, setIngredients] = useState([]);
  const [glasses, setGlasses] = useState([]);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    defaultGlass: null,
    defaultAmountToFill: 250,
    productionSteps: [],
    image: null,
    imagePreview: null,
    removeImage: false,
  });

  useEffect(() => {
    if (token) {
      loadData();
    }
  }, [token, recipeId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [ingredientsData, glassesData] = await Promise.all([
        ingredientService.getIngredients(token),
        glassService.getGlasses(token),
      ]);

      setIngredients(ingredientsData);
      setGlasses(glassesData);

      if (recipeId) {
        const fullRecipe = await RecipeService.getRecipe(
          recipeId,
          false,
          token,
        );

        // Map old unit names to new compatible units
        const mapUnit = (unit) => {
          const unitMap = {
            'ml': 'milliliter',
            'cl': 'milliliter',
            'oz': 'milliliter',
            'g': 'grams',
            'tsp': 'teaspoons',
            'tbsp': 'tablespoons',
          };
          return unitMap[unit] || unit || 'milliliter';
        };

        const productionSteps =
          fullRecipe.productionSteps?.map((step) => {
            if (step.type === 'addIngredients') {
              return {
                ...step,
                stepIngredients:
                  step.stepIngredients?.map((si) => {
                    const ingredient = si.ingredient || {};
                    return {
                      ingredient: {
                        id: ingredient.id,
                        name: ingredient.name,
                        ...ingredient,
                      },
                      amount: si.amount || 0,
                      scale: mapUnit(ingredient.unit),
                      boostable: si.boostable || false,
                    };
                  }) || [],
              };
            }
            return { ...step };
          }) || [];

        setFormData({
          name: fullRecipe.name || '',
          description: fullRecipe.description || '',
          defaultGlass: fullRecipe.defaultGlass || null,
          defaultAmountToFill: fullRecipe.defaultAmountToFill || 250,
          productionSteps: productionSteps,
          image: null,
          imagePreview: fullRecipe.image || null,
          removeImage: false,
        });
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = useCallback(async () => {
    try {
      if (!formData.name?.trim()) {
        toast.error('Recipe name is required');
        return;
      }

      setSaving(true);

      const recipeDto = {
        name: formData.name.trim(),
        description: formData.description?.trim() || '',
        defaultGlassId: formData.defaultGlass?.id || null,
        defaultAmountToFill: formData.defaultAmountToFill || 250,
        productionSteps: formData.productionSteps || [],
        categoryIds: [],
      };

      if (recipeId) {
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

      navigate({ to: '/recipes' });
    } catch (error) {
      console.error('Error saving recipe:', error);
      toast.error('Failed to save recipe');
    } finally {
      setSaving(false);
    }
  }, [recipeId, formData, navigate]);

  const handleImageChange = useCallback((e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData((prev) => ({ ...prev, image: file }));
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({ ...prev, imagePreview: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const addProductionStep = useCallback((type) => {
    const newStep =
      type === 'addIngredients'
        ? { type: 'addIngredients', stepIngredients: [] }
        : { type: 'writtenInstruction', message: '' };

    setFormData((prev) => ({
      ...prev,
      productionSteps: [...prev.productionSteps, newStep],
    }));
  }, []);

  const removeProductionStep = useCallback((index) => {
    setFormData((prev) => ({
      ...prev,
      productionSteps: prev.productionSteps.filter((_, i) => i !== index),
    }));
  }, []);

  const updateProductionStep = useCallback((index, updatedStep) => {
    setFormData((prev) => ({
      ...prev,
      productionSteps: prev.productionSteps.map((step, i) =>
        i === index ? updatedStep : step,
      ),
    }));
  }, []);

  const addIngredientToStep = useCallback(
    (stepIndex) => {
      const step = formData.productionSteps[stepIndex];
      if (step.type === 'addIngredients') {
        const updatedStep = {
          ...step,
          stepIngredients: [
            ...step.stepIngredients,
            { ingredient: null, amount: 30, scale: 'milliliter', boostable: false },
          ],
        };
        updateProductionStep(stepIndex, updatedStep);
      }
    },
    [formData.productionSteps, updateProductionStep],
  );

  const removeIngredientFromStep = useCallback(
    (stepIndex, ingredientIndex) => {
      const step = formData.productionSteps[stepIndex];
      if (step.type === 'addIngredients') {
        const updatedStep = {
          ...step,
          stepIngredients: step.stepIngredients.filter(
            (_, i) => i !== ingredientIndex,
          ),
        };
        updateProductionStep(stepIndex, updatedStep);
      }
    },
    [formData.productionSteps, updateProductionStep],
  );

  const updateStepIngredient = useCallback(
    (stepIndex, ingredientIndex, field, value) => {
      const step = formData.productionSteps[stepIndex];
      if (step.type === 'addIngredients') {
        const updatedStep = {
          ...step,
          stepIngredients: step.stepIngredients.map((ing, i) =>
            i === ingredientIndex ? { ...ing, [field]: value } : ing,
          ),
        };
        updateProductionStep(stepIndex, updatedStep);
      }
    },
    [formData.productionSteps, updateProductionStep],
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <RecipeFormHeader
        title={recipeId ? 'Edit Recipe' : 'Create Recipe'}
      />

      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 max-w-5xl pb-20 sm:pb-0">
        <div className="space-y-4 sm:space-y-6">
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
            <CardContent className="pt-4 sm:pt-6 px-4 sm:px-6">
              <RecipeImageUpload
                imagePreview={formData.imagePreview}
                onImageChange={handleImageChange}
                onRemoveImage={() =>
                  setFormData((prev) => ({
                    ...prev,
                    image: null,
                    imagePreview: null,
                  }))
                }
                showRemoveToggle={!!recipeId}
                removeImage={formData.removeImage}
                onToggleRemoveImage={(checked) =>
                  setFormData((prev) => ({ ...prev, removeImage: checked }))
                }
              />
            </CardContent>
          </Card>

          <Card id="production-steps">
            <CardContent className="pt-4 sm:pt-6 px-4 sm:px-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                <div>
                  <h3 className="font-semibold text-base sm:text-lg">Production Steps</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                    Build the drink using ingredient steps and written
                    instructions
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full sm:w-auto h-10"
                    onClick={() => addProductionStep('addIngredients')}
                  >
                    + Add Ingredients
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full sm:w-auto h-10"
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
          </Card>
        </div>

        {/* Mobile sticky action bar */}
        <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t shadow-lg z-50 p-3">
          <div className="flex gap-3">
            <Button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 h-12 text-base"
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
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
      </div>
    </div>
  );
};

export default RecipeEditPage;
