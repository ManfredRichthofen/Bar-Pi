import React, { useState, useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import {
  ArrowLeft,
  Save,
  X,
  Image as ImageIcon,
  Plus,
  Trash2,
} from 'lucide-react';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

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
  ingredient: Ingredient;
  amount: number;
  scale: string;
  boostable: boolean;
}

interface ProductionStep {
  type: string;
  stepIngredients?: StepIngredient[];
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

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData({
        ...formData,
        image: file,
        imagePreview: URL.createObjectURL(file),
      });
    }
  };

  const handleRemoveImage = () => {
    setFormData({
      ...formData,
      image: null,
      imagePreview: null,
    });
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

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
            ingredient: { id: si.ingredient.id },
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate({ to: '/recipes' })}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Recipes
        </Button>
        <h1 className="text-3xl font-bold">Create New Recipe</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name">Recipe Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Enter recipe name"
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Enter recipe description"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="glass">Default Glass</Label>
                <Select
                  value={formData.defaultGlass?.id.toString()}
                  onValueChange={(value) => {
                    const glass = glasses.find(
                      (g) => g.id.toString() === value,
                    );
                    setFormData({ ...formData, defaultGlass: glass || null });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {glasses.map((glass) => (
                      <SelectItem key={glass.id} value={glass.id.toString()}>
                        {glass.name} ({glass.size}ml)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="fillAmount">Fill Amount (ml)</Label>
                <Input
                  id="fillAmount"
                  type="number"
                  value={formData.defaultAmountToFill}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      defaultAmountToFill: parseInt(e.target.value) || 0,
                    })
                  }
                  min="0"
                />
              </div>
            </div>

            <div>
              <Label>Recipe Image</Label>
              <div className="mt-2">
                {formData.imagePreview ? (
                  <div className="relative inline-block">
                    <img
                      src={formData.imagePreview}
                      alt="Recipe preview"
                      className="h-40 w-40 object-cover rounded-lg"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute -top-2 -right-2"
                      onClick={handleRemoveImage}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Input
                      id="image"
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="max-w-xs"
                    />
                    <ImageIcon className="h-5 w-5 text-muted-foreground" />
                  </div>
                )}
              </div>
            </div>
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
                <Card key={stepIndex}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold">Step {stepIndex + 1}</h3>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => removeProductionStep(stepIndex)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="space-y-3">
                      {step.stepIngredients?.map((si, ingredientIndex) => (
                        <div
                          key={ingredientIndex}
                          className="flex gap-2 items-end"
                        >
                          <div className="flex-1">
                            <Label>Ingredient</Label>
                            <Select
                              value={si.ingredient.id.toString()}
                              onValueChange={(value) => {
                                const ingredient = ingredients.find(
                                  (ing) => ing.id.toString() === value,
                                );
                                if (ingredient) {
                                  updateStepIngredient(
                                    stepIndex,
                                    ingredientIndex,
                                    'ingredient',
                                    ingredient,
                                  );
                                }
                              }}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {ingredients.map((ing) => (
                                  <SelectItem
                                    key={ing.id}
                                    value={ing.id.toString()}
                                  >
                                    {ing.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="w-24">
                            <Label>Amount</Label>
                            <Input
                              type="number"
                              value={si.amount}
                              onChange={(e) =>
                                updateStepIngredient(
                                  stepIndex,
                                  ingredientIndex,
                                  'amount',
                                  parseInt(e.target.value) || 0,
                                )
                              }
                              min="0"
                            />
                          </div>

                          <div className="w-20">
                            <Label>Unit</Label>
                            <Select
                              value={si.scale}
                              onValueChange={(value) =>
                                updateStepIngredient(
                                  stepIndex,
                                  ingredientIndex,
                                  'scale',
                                  value,
                                )
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="ml">ml</SelectItem>
                                <SelectItem value="cl">cl</SelectItem>
                                <SelectItem value="oz">oz</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              removeIngredientFromStep(
                                stepIndex,
                                ingredientIndex,
                              )
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
                        onClick={() => addIngredientToStep(stepIndex)}
                        className="w-full"
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Add Ingredient
                      </Button>
                    </div>
                  </CardContent>
                </Card>
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
              <>
                <Save className="mr-2 h-4 w-4" />
                Create Recipe
              </>
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
  );
};
