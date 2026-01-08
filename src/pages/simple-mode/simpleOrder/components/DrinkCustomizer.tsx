import { useState } from 'react';
import { PlusCircle, Settings, AlertTriangle, BeakerIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface Ingredient {
  id: string;
  name: string;
  type: string;
  unit: string;
}

interface AdditionalIngredient {
  ingredient: Ingredient;
  amount: number;
  manualAdd: boolean;
}

interface Customisations {
  boost: number;
  additionalIngredients: AdditionalIngredient[];
}

interface DrinkCustomizerProps {
  disableBoosting?: boolean;
  customisations: Customisations;
  onCustomisationsChange: (customisations: Customisations) => void;
  availableIngredients?: Ingredient[];
}

const DrinkCustomizer = ({
  disableBoosting = false,
  customisations,
  onCustomisationsChange,
  availableIngredients = [],
}: DrinkCustomizerProps) => {
  const [addingIngredient, setAddingIngredient] = useState(false);
  const [selectedIngredient, setSelectedIngredient] =
    useState<Ingredient | null>(null);

  const additionalIngredients = customisations?.additionalIngredients || [];

  const handleBoostChange = (value: number | readonly number[]) => {
    const newValue = Array.isArray(value) ? value[0] : value;
    onCustomisationsChange({
      ...customisations,
      boost: newValue,
    });
  };

  const handleAdditionalIngredientAmountChange = (
    ingredientId: string,
    amount: number,
  ) => {
    const updatedIngredients = additionalIngredients.map((ing) =>
      ing.ingredient.id === ingredientId ? { ...ing, amount } : ing,
    );
    onCustomisationsChange({
      ...customisations,
      additionalIngredients: updatedIngredients,
    });
  };

  const handleAddIngredient = () => {
    if (!selectedIngredient) return;

    const exists = additionalIngredients.some(
      (ing) => ing.ingredient.id === selectedIngredient.id,
    );

    if (!exists) {
      onCustomisationsChange({
        ...customisations,
        additionalIngredients: [
          ...additionalIngredients,
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

  const automatedIngredients = availableIngredients.filter(
    (ing) => ing.type === 'automated',
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 mb-4">
        <Settings className="w-6 h-6 text-primary" />
        <h2 className="text-xl sm:text-2xl font-bold">Customize Your Drink</h2>
      </div>

      {/* Bento Grid for Customization Options */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
        {/* Alcohol Strength Card */}
        <Card
          className={`md:col-span-${automatedIngredients.length > 0 ? '1' : '2'}`}
        >
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center gap-2 mb-4">
              <BeakerIcon className="w-5 h-5 text-primary" />
              <h3 className="text-base sm:text-lg font-bold">
                Alcohol Strength
              </h3>
            </div>

            {disableBoosting ? (
              <Alert className="bg-yellow-500/10 border-yellow-500/30">
                <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                <AlertDescription className="text-sm">
                  This drink's strength cannot be adjusted
                </AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-4">
                <div className="text-center">
                  <div className="text-3xl sm:text-4xl font-bold text-primary mb-1">
                    {customisations?.boost === 100
                      ? 'Normal'
                      : `${customisations?.boost > 100 ? '+' : ''}${(customisations?.boost || 100) - 100}%`}
                  </div>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Alcohol content adjustment
                  </p>
                </div>

                <Slider
                  value={[customisations?.boost || 100]}
                  onValueChange={handleBoostChange}
                  min={0}
                  max={200}
                  step={10}
                  className="my-6"
                />

                <div className="flex justify-between text-xs text-muted-foreground">
                  <span className="font-medium">
                    0%
                    <br />
                    None
                  </span>
                  <span className="font-medium">
                    100%
                    <br />
                    Normal
                  </span>
                  <span className="font-medium">
                    200%
                    <br />
                    Double
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Additional Ingredients Card */}
        {automatedIngredients.length > 0 && (
          <Card className="md:col-span-1">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center gap-2 mb-4">
                <PlusCircle className="w-5 h-5 text-primary" />
                <h3 className="text-base sm:text-lg font-bold">
                  Extra Ingredients
                </h3>
              </div>

              <p className="text-sm text-muted-foreground mb-4">
                Add extra ingredients to personalize your drink
              </p>

              <div className="space-y-3">
                {additionalIngredients.map(({ ingredient, amount }) => (
                  <div
                    key={ingredient.id}
                    className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg"
                  >
                    <Label className="font-medium text-sm flex-1">
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
                      className="w-20 text-sm"
                    />
                  </div>
                ))}

                {addingIngredient ? (
                  <div className="space-y-3 p-3 border-2 border-dashed border-primary/30 rounded-lg">
                    <Label className="font-medium text-sm">
                      Select Ingredient
                    </Label>
                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      value={selectedIngredient?.id || ''}
                      onChange={(e) => {
                        const ingredient = automatedIngredients.find(
                          (ing) => ing.id === e.target.value,
                        );
                        setSelectedIngredient(ingredient || null);
                      }}
                    >
                      <option value="">Choose an ingredient...</option>
                      {automatedIngredients
                        .filter(
                          (ing) =>
                            !additionalIngredients.some(
                              (added) => added.ingredient.id === ing.id,
                            ),
                        )
                        .map((ing) => (
                          <option key={ing.id} value={ing.id}>
                            {ing.name}
                          </option>
                        ))}
                    </select>
                    <div className="flex gap-2">
                      <Button
                        onClick={handleAddIngredient}
                        disabled={!selectedIngredient}
                        size="sm"
                        className="flex-1"
                      >
                        Add
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
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
                    size="sm"
                  >
                    <PlusCircle className="w-4 h-4" />
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
