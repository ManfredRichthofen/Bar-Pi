import { AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { RequiredIngredient } from '@/pages/Shared/order';
import {
  isAutomatedIngredient,
  isManualIngredient,
} from '@/pages/Shared/order';

interface IngredientRequirementsProps {
  requiredIngredients: RequiredIngredient[];
}

const IngredientRequirements = ({
  requiredIngredients,
}: IngredientRequirementsProps) => {
  const { t } = useTranslation();
  const isRequiredIngredient = (item: RequiredIngredient) =>
    item && item.amountRequired > 0;

  const automaticIngredients = requiredIngredients.filter(
    (x) => isAutomatedIngredient(x.ingredient) && isRequiredIngredient(x),
  );

  const manualIngredients = requiredIngredients.filter(
    (x) => isManualIngredient(x.ingredient) && isRequiredIngredient(x),
  );

  if (requiredIngredients.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {automaticIngredients.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3 sm:mb-4">
            <CheckCircle className="size-6 text-success" />
            <h4 className="font-semibold text-base">
              {t('simple_order.automated_ingredients', 'Poured automatically')}
            </h4>
          </div>
          <div className="space-y-2 sm:space-y-3">
            {automaticIngredients.map((item) => {
              const hasProblem =
                item.amountMissing > 0 || !item.ingredient.onPump;
              return (
                <div
                  key={item.ingredient.id}
                  className={`flex justify-between items-center w-full p-3 sm:p-4 rounded-lg ${
                    hasProblem
                      ? 'bg-danger-tint border-hairline border-danger'
                      : 'bg-success-tint border-hairline border-success'
                  }`}
                >
                  <div className="flex-1 pr-2 sm:pr-3 min-w-0">
                    <span className="break-words font-medium text-base block">
                      {item.ingredient.name}
                    </span>
                    {hasProblem && (
                      <div className="flex items-center gap-1 mt-1">
                        <XCircle className="size-5 text-danger shrink-0" />
                        <span className="text-danger text-base">
                          {item.amountMissing > 0
                            ? t('simple_order.missing_amount', {
                                defaultValue: 'Missing: {{amount}} {{unit}}',
                                amount: item.amountMissing,
                                unit: item.ingredient.unit ?? '',
                              })
                            : t('simple_order.not_on_pump', 'Not on a pump')}
                        </span>
                      </div>
                    )}
                  </div>
                  <span className="font-semibold whitespace-nowrap text-base shrink-0">
                    {item.amountRequired} {item.ingredient.unit}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {manualIngredients.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3 sm:mb-4">
            <AlertCircle className="size-6 text-warning" />
            <h4 className="font-semibold text-base">
              {t('simple_order.manual_ingredients', 'Added by hand')}
            </h4>
          </div>
          <div className="space-y-2 sm:space-y-3">
            {manualIngredients.map((item) => (
              <div
                key={item.ingredient.id}
                className={`flex justify-between items-center w-full p-3 sm:p-4 rounded-lg ${
                  !item.ingredient.inBar
                    ? 'bg-warning-tint border-hairline border-warning'
                    : 'bg-surface-sunken border-hairline border-border'
                }`}
              >
                <div className="flex-1 pr-2 sm:pr-3 min-w-0">
                  <span className="break-words font-medium text-base block">
                    {item.ingredient.name}
                  </span>
                  {!item.ingredient.inBar && (
                    <div className="flex items-center gap-1 mt-1">
                      <AlertCircle className="size-5 text-warning shrink-0" />
                      <span className="text-warning text-base">
                        {t('simple_order.not_in_bar', 'Not in the bar')}
                      </span>
                    </div>
                  )}
                </div>
                <span className="font-semibold whitespace-nowrap text-base shrink-0">
                  {item.amountRequired} {item.ingredient.unit}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {automaticIngredients.length === 0 && manualIngredients.length === 0 && (
        <Alert className="bg-primary-tint border-border-strong">
          <AlertCircle className="size-6 text-primary-tint-ink" />
          <AlertDescription className="text-base">
            {t(
              'simple_order.unknown_types',
              'Could not determine ingredient types. Please check the recipe configuration.',
            )}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default IngredientRequirements;
