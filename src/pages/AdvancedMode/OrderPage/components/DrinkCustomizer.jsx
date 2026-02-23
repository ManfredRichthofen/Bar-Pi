import {
  AlertTriangle,
  PlusCircle,
  Sliders,
  Beaker,
  Trash2,
} from 'lucide-react';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const DrinkCustomizer = ({
  disableBoosting = false,
  customizations,
  onCustomizationsChange,
  availableIngredients = [],
}) => {
  const { t } = useTranslation();
  const [addingIngredient, setAddingIngredient] = useState(false);
  const [selectedIngredient, setSelectedIngredient] = useState(null);

  const handleBoostChange = (value) => {
    onCustomizationsChange({
      ...customizations,
      boost: value,
    });
  };

  const handleAdditionalIngredientAmountChange = (ingredientId, amount) => {
    const updatedIngredients = customizations.additionalIngredients.map(
      (ing) => (ing.ingredient.id === ingredientId ? { ...ing, amount } : ing),
    );
    onCustomizationsChange({
      ...customizations,
      additionalIngredients: updatedIngredients,
    });
  };

  const handleAddIngredient = () => {
    if (!selectedIngredient) return;

    const exists = customizations.additionalIngredients.some(
      (ing) => ing.ingredient.id === selectedIngredient.id,
    );

    if (!exists) {
      onCustomizationsChange({
        ...customizations,
        additionalIngredients: [
          ...customizations.additionalIngredients,
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

  const handleRemoveIngredient = (ingredientId) => {
    const updatedIngredients = customizations.additionalIngredients.filter(
      (ing) => ing.ingredient.id !== ingredientId,
    );
    onCustomizationsChange({
      ...customizations,
      additionalIngredients: updatedIngredients,
    });
  };

  const getBoostLabel = (value) => {
    if (value === 100) return 'Normal';
    if (value === 0) return 'No Alcohol';
    if (value === 200) return 'Double';
    return `${value > 100 ? '+' : ''}${value - 100}%`;
  };

  return (
    <div className="space-y-4 sm:space-y-5 lg:space-y-6">
      {/* Alcohol Content Adjustment */}
      <Card>
        <CardHeader className="pb-3 sm:pb-4">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Sliders className="w-4 h-4 sm:w-5 sm:h-5" />
            Alcohol Content Adjustment
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 sm:space-y-4">
          {disableBoosting ? (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-sm">
                This drink's strength cannot be adjusted as it contains no
                boostable ingredients.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-sm sm:text-base">Alcohol Strength</Label>
                <Badge
                  variant="secondary"
                  className="min-w-16 sm:min-w-20 justify-center text-xs sm:text-sm"
                >
                  {getBoostLabel(customizations.boost)}
                </Badge>
              </div>
              <Slider
                min={0}
                max={200}
                step={10}
                value={[customizations.boost]}
                onValueChange={([value]) => handleBoostChange(value)}
                disabled={disableBoosting}
                className={`w-full ${disableBoosting ? 'opacity-50' : ''}`}
              />
              <div
                className={`w-full flex justify-between text-xs sm:text-sm px-1 sm:px-2 text-muted-foreground ${disableBoosting ? 'opacity-50' : ''}`}
              >
                <span>No Alcohol</span>
                <span>Normal</span>
                <span>Double</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Additional Ingredients */}
      <Card>
        <CardHeader className="pb-3 sm:pb-4">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Beaker className="w-4 h-4 sm:w-5 sm:h-5" />
            Additional Ingredients
            <Badge variant="outline" className="ml-auto text-xs">
              {customizations.additionalIngredients.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="current" className="w-full">
            <TabsList className="grid w-full grid-cols-2 h-9 sm:h-10">
              <TabsTrigger value="current" className="text-xs sm:text-sm">
                Current Ingredients
              </TabsTrigger>
              <TabsTrigger value="add" className="text-xs sm:text-sm">
                Add Ingredients
              </TabsTrigger>
            </TabsList>

            <TabsContent value="current" className="space-y-3 sm:space-y-4">
              {customizations.additionalIngredients.length === 0 ? (
                <div className="text-center py-6 sm:py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                  <Beaker className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 sm:mb-4 opacity-50" />
                  <p className="text-sm sm:text-base">
                    No additional ingredients added
                  </p>
                  <p className="text-xs sm:text-sm">
                    Add ingredients to customize your drink
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                  {customizations.additionalIngredients.map(
                    ({ ingredient, amount }) => (
                      <Card key={ingredient.id} className="relative">
                        <CardContent className="p-3 sm:p-4">
                          <div className="flex items-start justify-between mb-2 sm:mb-3">
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-sm sm:text-base truncate">
                                {ingredient.name}
                              </h4>
                              <p className="text-xs sm:text-sm text-muted-foreground">
                                {ingredient.type === 'automated'
                                  ? 'Automated'
                                  : 'Manual'}
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                handleRemoveIngredient(ingredient.id)
                              }
                              className="text-destructive hover:text-destructive shrink-0 h-8 w-8 p-0"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                          <div className="space-y-1.5 sm:space-y-2">
                            <Label
                              htmlFor={`amount-${ingredient.id}`}
                              className="text-xs sm:text-sm"
                            >
                              Amount (ml)
                            </Label>
                            <div className="flex items-center gap-2">
                              <Input
                                id={`amount-${ingredient.id}`}
                                type="number"
                                min={0}
                                max={100}
                                value={amount}
                                onChange={(e) =>
                                  handleAdditionalIngredientAmountChange(
                                    ingredient.id,
                                    parseFloat(e.target.value) || 0,
                                  )
                                }
                                className="flex-1 h-9 sm:h-10 text-sm"
                              />
                              <span className="text-xs sm:text-sm text-muted-foreground shrink-0">
                                ml
                              </span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ),
                  )}
                </div>
              )}
            </TabsContent>

            <TabsContent value="add" className="space-y-3 sm:space-y-4">
              {availableIngredients.length === 0 ? (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription className="text-sm">
                    No additional ingredients available for this drink.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-3 sm:space-y-4">
                  <div className="space-y-1.5 sm:space-y-2">
                    <Label className="text-sm sm:text-base">
                      Select Ingredient
                    </Label>
                    <Select
                      value={selectedIngredient?.id || ''}
                      onValueChange={(value) => {
                        const ingredient = availableIngredients.find(
                          (ing) => ing.id === value,
                        );
                        setSelectedIngredient(ingredient);
                      }}
                    >
                      <SelectTrigger className="h-10 sm:h-11">
                        <SelectValue
                          placeholder="Select ingredient to add"
                          className="text-sm"
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {availableIngredients
                          .filter(
                            (ing) =>
                              !customizations.additionalIngredients.some(
                                (added) => added.ingredient.id === ing.id,
                              ),
                          )
                          .map((ing) => (
                            <SelectItem
                              key={ing.id}
                              value={ing.id}
                              className="py-2.5"
                            >
                              <div className="flex items-center gap-2">
                                <div
                                  className={`w-2 h-2 rounded-full shrink-0 ${
                                    ing.type === 'automated'
                                      ? 'bg-blue-500'
                                      : 'bg-gray-500'
                                  }`}
                                />
                                <span className="text-sm flex-1 truncate">
                                  {ing.name}
                                </span>
                                <Badge
                                  variant="outline"
                                  className="ml-auto shrink-0 text-xs"
                                >
                                  {ing.type}
                                </Badge>
                              </div>
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={handleAddIngredient}
                      disabled={!selectedIngredient}
                      className="flex-1 h-10 sm:h-11 text-sm sm:text-base"
                    >
                      <PlusCircle className="w-4 h-4 mr-2" />
                      Add Ingredient
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSelectedIngredient(null);
                      }}
                      disabled={!selectedIngredient}
                      className="h-10 sm:h-11 text-sm sm:text-base"
                    >
                      Clear
                    </Button>
                  </div>

                  {selectedIngredient && (
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="text-xs sm:text-sm">
                        <strong>{selectedIngredient.name}</strong> will be added
                        to your drink. You can adjust the amount after adding
                        it.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default DrinkCustomizer;
