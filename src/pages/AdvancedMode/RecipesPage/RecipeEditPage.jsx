import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from '@tanstack/react-router';
import { ArrowLeft, Save, Trash2, X, Image as ImageIcon } from 'lucide-react';
import useAuthStore from '../../../store/authStore';
import RecipeService from '../../../services/recipe.service';
import ingredientService from '../../../services/ingredient.service';
import glassService from '../../../services/glass.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

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
                      scale: si.scale || 'ml',
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
            { ingredient: null, amount: 30, scale: 'ml', boostable: false },
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
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate({ to: '/recipes' })}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <h1 className="text-xl sm:text-2xl font-bold">
                {recipeId ? 'Edit Recipe' : 'Create Recipe'}
              </h1>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => navigate({ to: '/recipes' })}
              >
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Save
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6 max-w-5xl">
        <div className="space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="recipe-name">
                Recipe Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="recipe-name"
                placeholder="e.g., Mojito, Margarita"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="default-glass">Default Glass</Label>
              <Select
                value={formData.defaultGlass?.id?.toString() || ''}
                onValueChange={(value) => {
                  const glass = glasses.find((g) => g.id === parseInt(value));
                  setFormData((prev) => ({
                    ...prev,
                    defaultGlass: glass || null,
                  }));
                }}
              >
                <SelectTrigger id="default-glass">
                  <SelectValue placeholder="Select a glass" />
                </SelectTrigger>
                <SelectContent>
                  {glasses.map((glass) => (
                    <SelectItem key={glass.id} value={glass.id.toString()}>
                      {glass.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="default-amount">Default Amount (ml)</Label>
              <Input
                id="default-amount"
                type="number"
                value={formData.defaultAmountToFill}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    defaultAmountToFill: parseInt(e.target.value) || 0,
                  }))
                }
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Describe the drink, flavor profile or any notes"
              value={formData.description}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              className="resize-y min-h-[5.5rem] max-h-40"
            />
          </div>

          {/* Image */}
          <div className="space-y-2">
            <Label>Recipe Image</Label>
            <div className="flex flex-wrap items-center gap-4">
              {formData.imagePreview ? (
                <div className="relative w-40 h-40 rounded-lg overflow-hidden shadow-sm border-2 border-border">
                  <img
                    src={formData.imagePreview}
                    alt="Recipe preview"
                    className="w-full h-full object-cover"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute -top-2 -right-2 h-7 w-7 rounded-full shadow-md"
                    onClick={() =>
                      setFormData((prev) => ({
                        ...prev,
                        image: null,
                        imagePreview: null,
                      }))
                    }
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-40 h-40 border-2 border-dashed rounded-lg cursor-pointer hover:bg-accent hover:border-primary transition-all">
                  <div className="flex flex-col items-center justify-center p-4">
                    <ImageIcon
                      size={32}
                      className="mb-2 text-muted-foreground"
                    />
                    <p className="text-xs text-center text-muted-foreground">
                      <span className="font-semibold">Click to upload</span>
                      <br />
                      PNG, JPG (max 5MB)
                    </p>
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleImageChange}
                  />
                </label>
              )}
              {recipeId && !formData.imagePreview && (
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    className="h-4 w-4"
                    checked={formData.removeImage}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        removeImage: e.target.checked,
                      }))
                    }
                  />
                  <span className="text-sm">Remove existing image</span>
                </div>
              )}
            </div>
          </div>

          {/* Production Steps */}
          <div className="border-t pt-6">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="font-semibold text-lg">Production Steps</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Build the drink using ingredient steps and written
                  instructions
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => addProductionStep('addIngredients')}
                >
                  + Add Ingredients
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => addProductionStep('writtenInstruction')}
                >
                  + Add Instruction
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              {formData.productionSteps.map((step, stepIndex) => (
                <Card key={stepIndex}>
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between gap-3 mb-3">
                      <span className="font-medium text-sm">
                        Step {stepIndex + 1} ·{' '}
                        {step.type === 'addIngredients'
                          ? 'Add ingredients'
                          : 'Instruction'}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => removeProductionStep(stepIndex)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>

                    {step.type === 'addIngredients' ? (
                      <div className="space-y-2">
                        {step.stepIngredients.map((ing, ingIndex) => (
                          <div
                            key={ingIndex}
                            className="flex gap-2 items-center"
                          >
                            <Select
                              value={ing.ingredient?.id?.toString() || ''}
                              onValueChange={(value) => {
                                const ingredient = ingredients.find(
                                  (i) => i.id === parseInt(value),
                                );
                                updateStepIngredient(
                                  stepIndex,
                                  ingIndex,
                                  'ingredient',
                                  ingredient,
                                );
                              }}
                            >
                              <SelectTrigger className="flex-1">
                                <SelectValue placeholder="Select ingredient" />
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
                            <Input
                              type="number"
                              className="w-20"
                              value={ing.amount}
                              onChange={(e) =>
                                updateStepIngredient(
                                  stepIndex,
                                  ingIndex,
                                  'amount',
                                  parseFloat(e.target.value) || 0,
                                )
                              }
                            />
                            <Select
                              value={ing.scale}
                              onValueChange={(value) =>
                                updateStepIngredient(
                                  stepIndex,
                                  ingIndex,
                                  'scale',
                                  value,
                                )
                              }
                            >
                              <SelectTrigger className="w-20">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="ml">ml</SelectItem>
                                <SelectItem value="cl">cl</SelectItem>
                                <SelectItem value="oz">oz</SelectItem>
                                <SelectItem value="dash">dash</SelectItem>
                              </SelectContent>
                            </Select>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-sm"
                              onClick={() =>
                                removeIngredientFromStep(stepIndex, ingIndex)
                              }
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="w-full mt-1"
                          onClick={() => addIngredientToStep(stepIndex)}
                        >
                          + Add Ingredient
                        </Button>
                      </div>
                    ) : (
                      <Textarea
                        placeholder="Enter instruction (e.g., Shake with ice, Strain into glass)"
                        value={step.message || ''}
                        onChange={(e) =>
                          updateProductionStep(stepIndex, {
                            ...step,
                            message: e.target.value,
                          })
                        }
                      />
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecipeEditPage;
