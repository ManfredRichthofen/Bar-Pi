import React, { useState } from 'react';
import { PlusCircle, AlertTriangle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Slider } from '@/components/ui/slider';

const DrinkCustomizer = ({
  disableBoosting = false,
  customizations,
  onCustomizationsChange,
  availableIngredients = [],
}) => {
  const [addingIngredient, setAddingIngredient] = useState(false);
  const [selectedIngredient, setSelectedIngredient] = useState(null);

  const handleBoostChange = (event) => {
    onCustomizationsChange({
      ...customizations,
      boost: parseInt(event.target.value),
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

  const [isOpen, setIsOpen] = useState(false);

  return (
    <Card className="mb-6">
      <CardContent className="pt-6">
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleTrigger className="flex items-center justify-between w-full text-xl font-medium py-2">
            Customize Drink
            <span
              className={`transform transition-transform ${isOpen ? 'rotate-180' : ''}`}
            >
              ▼
            </span>
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-4">
            <div className="mb-6">
              <h3 className="text-lg font-bold mb-2">
                Alcohol Content Adjustment
              </h3>
              {disableBoosting ? (
                <Alert className="mb-2">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    This drink's strength cannot be adjusted
                  </AlertDescription>
                </Alert>
              ) : (
                <p className="text-muted-foreground mb-2">
                  Adjust the strength of your drink by modifying the alcohol
                  content
                </p>
              )}
              <div className="flex items-center gap-4">
                <Slider
                  min={0}
                  max={200}
                  step={10}
                  value={[customizations.boost]}
                  onValueChange={([value]) =>
                    handleBoostChange({ target: { value } })
                  }
                  disabled={disableBoosting}
                  className={`flex-1 ${disableBoosting ? 'opacity-50' : ''}`}
                />
                <Badge
                  variant="secondary"
                  className={`min-w-20 justify-center ${disableBoosting ? 'opacity-50' : ''}`}
                >
                  {customizations.boost === 100
                    ? 'Normal'
                    : `${customizations.boost > 100 ? '+' : ''}${customizations.boost - 100}%`}
                </Badge>
              </div>
              <div
                className={`w-full flex justify-between text-xs px-2 mt-1 text-muted-foreground ${disableBoosting ? 'opacity-50' : ''}`}
              >
                <span>No Alcohol</span>
                <span>Normal</span>
                <span>Double</span>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-bold mb-2">Additional Ingredients</h3>
              <p className="text-muted-foreground mb-4">
                Add extra ingredients to customize your drink
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                {customizations.additionalIngredients.map(
                  ({ ingredient, amount }) => (
                    <Card key={ingredient.id}>
                      <CardContent className="p-4">
                        <h4 className="font-bold">{ingredient.name}</h4>
                        <div className="flex items-center gap-2 mt-2">
                          <Input
                            type="number"
                            min={0}
                            max={100}
                            value={amount}
                            onChange={(e) =>
                              handleAdditionalIngredientAmountChange(
                                ingredient.id,
                                parseFloat(e.target.value),
                              )
                            }
                            className="flex-1"
                          />
                          <span className="text-sm text-muted-foreground">
                            ml
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  ),
                )}

                {addingIngredient ? (
                  <Card>
                    <CardContent className="p-4">
                      <h4 className="font-bold mb-2">Add New Ingredient</h4>
                      <Select
                        value={selectedIngredient?.id || ''}
                        onValueChange={(value) => {
                          const ingredient = availableIngredients.find(
                            (ing) => ing.id === value,
                          );
                          setSelectedIngredient(ingredient);
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select ingredient" />
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
                              <SelectItem key={ing.id} value={ing.id}>
                                {ing.name}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                      <div className="flex gap-2 mt-2">
                        <Button
                          size="sm"
                          onClick={handleAddIngredient}
                          disabled={!selectedIngredient}
                        >
                          Add
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setAddingIngredient(false);
                            setSelectedIngredient(null);
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card
                    className="cursor-pointer hover:bg-accent transition-colors"
                    onClick={() => setAddingIngredient(true)}
                  >
                    <CardContent className="flex flex-col items-center justify-center text-center p-4 min-h-32">
                      <PlusCircle className="mb-2" size={24} />
                      <span>Add Ingredient</span>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
};

export default DrinkCustomizer;
