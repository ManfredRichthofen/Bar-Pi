import { BeakerIcon, PlusCircle, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
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

const MAX_EXTRA_ML = 100;

const DrinkCustomizer = ({
  disableBoosting = false,
  customisations,
  onCustomisationsChange,
  availableIngredients = [],
}: DrinkCustomizerProps) => {
  const { t } = useTranslation();
  const {
    addingIngredient,
    setAddingIngredient,
    selectedIngredient,
    setSelectedIngredient,
    additionalIngredients,
    handleBoostChange,
    handleAdditionalIngredientAmountChange,
    handleAddIngredient,
    handleRemoveIngredient,
  } = useDrinkCustomizerActions({
    customizations: customisations,
    onCustomizationsChange: onCustomisationsChange,
  });

  const boost = customisations?.boost ?? 100;

  const automatedIngredients = availableIngredients.filter(
    (ing) => ing.type === 'automated',
  );

  const handleAmountInput = (ingredientId: string, raw: string) => {
    const parsed = Number.parseFloat(raw);
    const amount = Number.isFinite(parsed)
      ? Math.min(Math.max(parsed, 0), MAX_EXTRA_ML)
      : 0;
    handleAdditionalIngredientAmountChange(ingredientId, amount);
  };

  const strengthPresets = [
    { value: 0, label: t('simple_order.strength_none', 'None') },
    { value: 100, label: t('simple_order.strength_normal', 'Normal') },
    { value: 200, label: t('simple_order.strength_double', 'Double') },
  ];

  return (
    <div className="space-y-4">
      {!disableBoosting && (
        <Card>
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center gap-2 mb-4">
              <BeakerIcon className="size-6 text-primary" />
              <h3 className="text-base sm:text-lg font-bold">
                {t('simple_order.strength_title', 'Alcohol Strength')}
              </h3>
            </div>

            <div className="space-y-5">
              <div className="text-center">
                <div className="text-3xl sm:text-4xl font-bold text-primary mb-1">
                  {boost === 100
                    ? t('simple_order.strength_normal', 'Normal')
                    : boost === 0
                      ? t('simple_order.strength_none', 'None')
                      : `${boost}%`}
                </div>
                <p className="text-sm text-foreground-muted">
                  {t(
                    'simple_order.strength_hint',
                    'Alcohol content adjustment',
                  )}
                </p>
              </div>

              <div className="px-2 sm:px-3">
                <Slider
                  size="lg"
                  value={[boost]}
                  onValueChange={handleBoostChange}
                  min={0}
                  max={200}
                  step={10}
                  aria-label={t(
                    'simple_order.strength_title',
                    'Alcohol Strength',
                  )}
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                {strengthPresets.map((preset) => (
                  <Button
                    key={preset.value}
                    type="button"
                    variant={boost === preset.value ? 'default' : 'outline'}
                    aria-pressed={boost === preset.value}
                    onClick={() => handleBoostChange(preset.value)}
                    className="flex-col gap-0 h-auto py-2"
                  >
                    <span className="font-mono text-base font-bold">
                      {preset.value}%
                    </span>
                    <span className="text-sm">{preset.label}</span>
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {automatedIngredients.length > 0 && (
        <Card>
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center gap-2 mb-4">
              <PlusCircle className="size-6 text-primary" />
              <h3 className="text-base sm:text-lg font-bold">
                {t('simple_order.extras_title', 'Extra Ingredients')}
              </h3>
            </div>

            <p className="text-sm text-foreground-muted mb-4">
              {t(
                'simple_order.extras_hint',
                'Add extra ingredients to personalize your drink',
              )}
            </p>

            <div className="space-y-3">
              {additionalIngredients.map(({ ingredient, amount }) => (
                <div
                  key={ingredient.id}
                  className="flex items-center gap-3 p-3 bg-surface-sunken rounded-lg"
                >
                  <Label
                    htmlFor={`extra-${ingredient.id}`}
                    className="font-medium text-base flex-1 min-w-0 break-words"
                  >
                    {ingredient.name}
                  </Label>
                  <div className="relative shrink-0">
                    <Input
                      id={`extra-${ingredient.id}`}
                      type="number"
                      inputMode="decimal"
                      min={0}
                      max={MAX_EXTRA_ML}
                      value={amount}
                      onChange={(e) =>
                        handleAmountInput(ingredient.id, e.target.value)
                      }
                      className="w-28 pr-10 text-base"
                    />
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-foreground-muted">
                      ml
                    </span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={t('simple_order.extras_remove', 'Remove')}
                    onClick={() => handleRemoveIngredient(ingredient.id)}
                  >
                    <X className="size-6" />
                  </Button>
                </div>
              ))}

              {addingIngredient ? (
                <div className="space-y-3 p-3 border-2 border-dashed border-border-strong rounded-lg">
                  <Label className="font-medium text-base">
                    {t('simple_order.extras_select', 'Select Ingredient')}
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
                      <SelectValue
                        placeholder={t(
                          'simple_order.extras_placeholder',
                          'Choose an ingredient...',
                        )}
                      />
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
                      {t('simple_order.extras_add', 'Add')}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setAddingIngredient(false);
                        setSelectedIngredient(null);
                      }}
                      className="flex-1"
                    >
                      {t('common.cancel', 'Cancel')}
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
                  {t('simple_order.extras_add_ingredient', 'Add Ingredient')}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DrinkCustomizer;
