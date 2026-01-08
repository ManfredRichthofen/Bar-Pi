import React, { memo } from 'react';
import { X, Trash2, Image as ImageIcon } from 'lucide-react';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';

const RecipeModal = ({
  isVisible,
  onClose,
  editingRecipe,
  formData,
  setFormData,
  ingredients,
  glasses,
  onSave,
  onImageChange,
  addProductionStep,
  removeProductionStep,
  updateProductionStep,
  addIngredientToStep,
  removeIngredientFromStep,
  updateStepIngredient,
}) => {
  return (
    <Dialog open={isVisible} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden p-0 flex flex-col">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle className="text-xl">
            {editingRecipe ? 'Edit Recipe' : 'Create Recipe'}
          </DialogTitle>
          <DialogDescription>
            Define the basics, image and production steps for this drink.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 pb-6 pt-4 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="recipe-name">Recipe Name *</Label>
              <Input
                id="recipe-name"
                placeholder="Enter recipe name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="default-glass">Default Glass</Label>
              <Select
                value={formData.defaultGlass?.id?.toString() || ''}
                onValueChange={(value) => {
                  const glass = glasses.find(g => g.id === parseInt(value));
                  setFormData(prev => ({ ...prev, defaultGlass: glass || null }));
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
                onChange={(e) => setFormData(prev => ({ ...prev, defaultAmountToFill: parseInt(e.target.value) || 0 }))}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Describe the drink, flavor profile or any notes for the bartender"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="resize-y min-h-[5.5rem] max-h-40"
            />
          </div>

          <div className="space-y-2">
            <Label>Recipe Image</Label>
            <div className="flex flex-wrap items-center gap-4">
              {formData.imagePreview ? (
                <div className="relative w-32 h-32 rounded-lg overflow-hidden shadow-sm">
                  <img
                    src={formData.imagePreview}
                    alt="Recipe preview"
                    className="w-full h-full object-cover"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                    onClick={() => setFormData(prev => ({ ...prev, image: null, imagePreview: null }))}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-32 h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                  <div className="flex flex-col items-center justify-center p-3">
                    <ImageIcon size={24} className="mb-2" />
                    <p className="text-xs text-center font-semibold">Upload</p>
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={onImageChange}
                  />
                </label>
              )}
              {editingRecipe?.hasImage && !formData.imagePreview && (
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    className="h-4 w-4"
                    checked={formData.removeImage}
                    onChange={(e) => setFormData(prev => ({ ...prev, removeImage: e.target.checked }))}
                  />
                  <span className="text-sm">Remove existing image</span>
                </div>
              )}
            </div>
          </div>

          <div className="border-t pt-6">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div>
                <h4 className="font-semibold text-base">Production Steps</h4>
                <p className="text-xs text-muted-foreground mt-1">
                  Build the drink using ingredient steps and written instructions.
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
                        Step {stepIndex + 1} · {step.type === 'addIngredients' ? 'Add ingredients' : 'Instruction'}
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
                          <div key={ingIndex} className="flex gap-2 items-center">
                            <Select
                              value={ing.ingredient?.id?.toString() || ''}
                              onValueChange={(value) => {
                                const ingredient = ingredients.find(i => i.id === parseInt(value));
                                updateStepIngredient(stepIndex, ingIndex, 'ingredient', ingredient);
                              }}
                            >
                              <SelectTrigger className="flex-1">
                                <SelectValue placeholder="Select ingredient" />
                              </SelectTrigger>
                              <SelectContent>
                                {ingredients.map((ingredient) => (
                                  <SelectItem key={ingredient.id} value={ingredient.id.toString()}>
                                    {ingredient.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Input
                              type="number"
                              className="w-20"
                              value={ing.amount}
                              onChange={(e) => updateStepIngredient(stepIndex, ingIndex, 'amount', parseFloat(e.target.value) || 0)}
                            />
                            <Select
                              value={ing.scale}
                              onValueChange={(value) => updateStepIngredient(stepIndex, ingIndex, 'scale', value)}
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
                              onClick={() => removeIngredientFromStep(stepIndex, ingIndex)}
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
                        placeholder="Enter instruction"
                        value={step.message || ''}
                        onChange={(e) => updateProductionStep(stepIndex, { ...step, message: e.target.value })}
                      />
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter className="px-6 py-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={onSave}
          >
            {editingRecipe ? 'Update Recipe' : 'Create Recipe'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default memo(RecipeModal);
