import { AlertTriangle, BeakerIcon, PlusCircle, Settings } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
import { useDrinkCustomizerActions } from '@/hooks/useDrinkCustomizerActions';
import type { Ingredient, OrderCustomizations } from '@/pages/Shared/order';

interface DrinkCustomizerProps {
  disableBoosting?: boolean;
  customisations: OrderCustomizations;
  onCustomisationsChange: (customisations: OrderCustomizations) => void;
  availableIngredients?: Ingredient[];
}

const DrinkCustomizer = ({
  disableBoosting = false,
  customisations,
  onCustomisationsChange,
  availableIngredients = [],
}: DrinkCustomizerProps) => {
  const {
    addingIngredient,
    setAddingIngredient,
    selectedIngredient,
    setSelectedIngredient,
    additionalIngredients,
    handleBoostChange,
    handleAdditionalIngredientAmountChange,
    handleAddIngredient,
  } = useDrinkCustomizerActions({
    customizations: customisations,
    onCustomizationsChange: onCustomisationsChange,
  });

  const automatedIngredients = availableIngredients.filter(
    (ing) => ing.type === 'automated',
  );

  return (
    <div className="space-y-4 sm:space-y-5">
      <div className="flex items-center gap-3 mb-4">
        <Settings className="size-6 text-primary" />
        <h2 className="text-lg sm:text-xl lg:text-2xl font-bold">
          Customize Your Drink
        </h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 lg:gap-5">
        <Card
          className={`${automatedIngredients.length > 0 ? 'sm:col-span-1' : 'sm:col-span-2'} hover:shadow-md hover:border-border-strong transition-colors`}
        >
          <CardContent className="p-4 sm:p-5 lg:p-6">
            <div className="flex items-center gap-2 mb-4">
              <BeakerIcon className="size-6 text-primary" />
              <h3 className="text-base sm:text-lg font-bold">
                Alcohol Strength
              </h3>
            </div>

            {disableBoosting ? (
              <Alert className="bg-primary-tint border-border-strong">
                <AlertTriangle className="size-6 text-primary-tint-ink" />
                <AlertDescription className="text-base">
                  This drink's strength cannot be adjusted
                </AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-5 sm:space-y-6">
                <div className="text-center">
                  <div className="text-3xl sm:text-4xl lg:text-5xl font-bold text-primary mb-2">
                    {customisations?.boost === 100
                      ? 'Normal'
                      : `${customisations?.boost > 100 ? '+' : ''}${(customisations?.boost || 100) - 100}%`}
                  </div>
                  <p className="text-sm text-foreground-muted">
                    Alcohol content adjustment
                  </p>
                </div>

                <div className="px-2 sm:px-3">
                  <Slider
                    value={[customisations?.boost || 100]}
                    onValueChange={handleBoostChange}
                    min={0}
                    max={200}
                    step={10}
                    className="my-6 sm:my-8"
                  />
                </div>

                <div className="flex justify-between text-sm text-foreground-muted px-1">
                  <span className="font-medium text-center">
                    <span className="block text-base sm:text-lg font-bold text-foreground">
                      0%
                    </span>
                    None
                  </span>
                  <span className="font-medium text-center">
                    <span className="block text-base sm:text-lg font-bold text-primary">
                      100%
                    </span>
                    Normal
                  </span>
                  <span className="font-medium text-center">
                    <span className="block text-base sm:text-lg font-bold text-foreground">
                      200%
                    </span>
                    Double
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {automatedIngredients.length > 0 && (
          <Card className="sm:col-span-1 hover:shadow-md hover:border-border-strong transition-colors">
            <CardContent className="p-4 sm:p-5 lg:p-6">
              <div className="flex items-center gap-2 mb-4">
                <PlusCircle className="size-6 text-primary" />
                <h3 className="text-base sm:text-lg font-bold">
                  Extra Ingredients
                </h3>
              </div>

              <p className="text-sm text-foreground-muted mb-4">
                Add extra ingredients to personalize your drink
              </p>

              <div className="space-y-3">
                {additionalIngredients.map(({ ingredient, amount }) => (
                  <div
                    key={ingredient.id}
                    className="flex items-center gap-3 p-3 bg-surface-sunken rounded-lg"
                  >
                    <Label className="font-medium text-base flex-1">
                      {ingredient.name}
                    </Label>
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
                      className="w-24 text-base"
                    />
                  </div>
                ))}

                {addingIngredient ? (
                  <div className="space-y-3 p-3 border-2 border-dashed border-border-strong rounded-lg">
                    <Label className="font-medium text-base">
                      Select Ingredient
                    </Label>
                    <Select
                      value={selectedIngredient?.id || ''}
                      onValueChange={(value) => {
                        const ingredient = automatedIngredients.find(
                          (ing) => ing.id === value,
                        );
                        setSelectedIngredient(ingredient || null);
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Choose an ingredient..." />
                      </SelectTrigger>
                      <SelectContent>
                        {automatedIngredients
                          .filter(
                            (ing) =>
                              !additionalIngredients.some(
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
                    <div className="flex gap-2">
                      <Button
                        onClick={handleAddIngredient}
                        disabled={!selectedIngredient}
                        className="flex-1"
                      >
                        Add
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setAddingIngredient(false);
                          setSelectedIngredient(null);
                        }}
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    onClick={() => setAddingIngredient(true)}
                    className="w-full gap-2"
                  >
                    <PlusCircle className="size-6" />
                    Add Ingredient
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default DrinkCustomizer;
