import { ArrowLeft, BeakerIcon, GlassWater, Info } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { useBackNavigation } from '@/hooks/useBackNavigation';
import { useOrderFlow } from '@/hooks/useOrderFlow';
import DrinkCustomizer from './components/DrinkCustomizer';
import GlassSelector from './components/GlassSelector';
import IngredientRequirements from './components/IngredientRequirements';

const SimpleOrder = () => {
  const { t } = useTranslation();
  const goBack = useBackNavigation('/simple/drinks');
  const {
    token,
    recipe,
    loading,
    checking,
    feasibilityResult,
    selectedGlass,
    setSelectedGlass,
    customizations,
    setCustomizations,
    customizerIngredients,
    recipeIngredients,
    canOrderDrink,
    hasBoostableIngredients,
    handleGlassChange,
    handleMakeDrink,
  } = useOrderFlow({
    mode: 'simple',
    successRoute: '/simple/order-status',
  });

  if (!token || !recipe) return null;

  const isCheckingFeasibility =
    checking || (!!selectedGlass && !feasibilityResult);
  const hasMissingIngredients = !!feasibilityResult?.requiredIngredients?.some(
    (item) => item.amountMissing > 0,
  );

  let blockedMessage: string | null = null;
  if (!canOrderDrink && !loading && !isCheckingFeasibility) {
    if (!selectedGlass) {
      blockedMessage = t(
        'simple_order.blocked_no_glass',
        'Select a glass to continue',
      );
    } else if (hasMissingIngredients) {
      blockedMessage = t(
        'simple_order.blocked_missing',
        'Some ingredients are missing',
      );
    } else {
      blockedMessage =
        feasibilityResult?.reason ||
        t(
          'simple_order.blocked_unavailable',
          "This drink can't be made right now",
        );
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-20 border-b-hairline border-border bg-background">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 flex items-center justify-between">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={t('common.back', 'Back')}
            onClick={goBack}
          >
            <ArrowLeft className="size-6" />
          </Button>
          <h1 className="text-xl font-bold truncate flex-1 mx-3 text-center text-foreground">
            {t('simple_order.title', 'Order Drink')}
          </h1>
          <div className="size-control-md" />
        </div>
      </header>

      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-7xl px-4 pt-6 pb-48 sm:px-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-4 lg:gap-5">
            <Card className="sm:col-span-1 lg:col-span-7 bg-surface-sunken border-border-strong">
              <CardContent className="p-5 sm:p-6 h-full flex flex-col justify-center gap-2">
                <div className="flex items-center gap-2">
                  <BeakerIcon className="size-6 text-primary shrink-0" />
                  <h2 className="font-bold text-lg sm:text-xl lg:text-2xl truncate flex-1">
                    {recipe.name}
                  </h2>
                  {recipe.alcoholic && (
                    <Badge variant="destructive" className="shrink-0">
                      21+
                    </Badge>
                  )}
                </div>
                {recipe.description && (
                  <p className="text-base text-foreground-muted line-clamp-2">
                    {recipe.description}
                  </p>
                )}
              </CardContent>
            </Card>

            <Card className="sm:col-span-1 lg:col-span-5">
              <CardContent className="p-4 sm:p-5 lg:p-6 h-full space-y-3">
                <div className="flex items-center gap-2">
                  <GlassWater className="size-6 text-primary" />
                  <h3 className="font-bold text-base sm:text-lg">
                    {t('simple_order.glass_title', 'Glass')}
                  </h3>
                </div>
                <GlassSelector
                  selectedGlass={selectedGlass}
                  defaultGlass={recipe.defaultGlass || null}
                  token={token}
                  setSelectedGlass={setSelectedGlass}
                  onGlassChange={handleGlassChange}
                />
              </CardContent>
            </Card>

            <Card className="sm:col-span-2 lg:col-span-12">
              <CardContent className="p-4 sm:p-5 lg:p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Info className="size-6 text-primary" />
                  <h3 className="font-bold text-base sm:text-lg flex-1">
                    {t('simple_order.ingredients_title', 'Ingredients')}
                  </h3>
                  {checking && <Spinner className="size-6" />}
                </div>
                {feasibilityResult?.requiredIngredients ? (
                  <IngredientRequirements
                    requiredIngredients={feasibilityResult.requiredIngredients}
                  />
                ) : (
                  <ul className="space-y-2 text-base">
                    {recipeIngredients.map((item) => (
                      <li
                        key={`${item.name}-${item.amount}-${item.unit}`}
                        className="flex justify-between gap-2 break-words py-1.5 border-b border-border last:border-0"
                      >
                        <span className="font-medium">{item.name}</span>
                        <span className="text-foreground-muted shrink-0">
                          {item.amount} {item.unit}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>

            <div className="sm:col-span-2 lg:col-span-12">
              <DrinkCustomizer
                disableBoosting={!hasBoostableIngredients}
                customisations={customizations}
                onCustomisationsChange={setCustomizations}
                availableIngredients={customizerIngredients}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-[var(--dock-height)] z-40 border-t-hairline border-border bg-background shadow-lg">
        <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 space-y-2">
          {isCheckingFeasibility && !loading && (
            <p className="flex items-center justify-center gap-2 text-base text-foreground-muted font-medium">
              <Spinner className="size-5" />
              {t('simple_order.checking', 'Checking ingredients...')}
            </p>
          )}
          {blockedMessage && (
            <p className="text-base text-danger text-center font-medium">
              {blockedMessage}
            </p>
          )}
          <Button
            type="button"
            size="lg"
            className="w-full"
            onClick={handleMakeDrink}
            disabled={!canOrderDrink || loading}
          >
            {loading ? (
              <Spinner className="size-6" />
            ) : (
              <BeakerIcon className="size-6" />
            )}
            {loading
              ? t('simple_order.making', 'Making...')
              : t('simple_order.make_drink', 'Make Drink')}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SimpleOrder;
