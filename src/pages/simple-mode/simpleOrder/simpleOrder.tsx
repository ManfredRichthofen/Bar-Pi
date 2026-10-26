import { ArrowLeft, BeakerIcon, Info } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { useOrderFlow } from '@/hooks/useOrderFlow';
import DrinkCustomizer from './components/DrinkCustomizer';
import GlassSelector from './components/GlassSelector';
import IngredientRequirements from './components/IngredientRequirements';

const SimpleOrder = () => {
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
    navigate,
  } = useOrderFlow({
    mode: 'simple',
    successRoute: '/simple/order-status',
  });

  if (!token || !recipe) return null;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-md border-b border-border shadow-sm pt-2">
        <div className="px-3 sm:px-4 py-3 sm:py-4 flex items-center justify-between">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="rounded-xl transition-all duration-200"
            onClick={() => navigate({ to: '/simple/drinks' })}
          >
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          </Button>
          <h1 className="text-base sm:text-lg font-bold truncate flex-1 mx-2 sm:mx-3 text-center">
            Order Drink
          </h1>
          <div className="w-8 sm:w-10" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="p-3 sm:p-4 lg:p-6 max-w-7xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 sm:gap-4 lg:gap-5 auto-rows-[minmax(140px,auto)]">
            <Card className="sm:col-span-2 lg:col-span-5 lg:row-span-2 bg-gradient-to-br from-primary/10 via-primary/5 to-background border-primary/20 hover:shadow-lg hover:border-primary/30 transition-all duration-300">
              <CardContent className="p-5 sm:p-6 lg:p-8 h-full flex flex-col justify-center gap-4">
                <div className="flex items-center gap-2 mb-2">
                  <BeakerIcon className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                  <h3 className="font-bold text-lg sm:text-xl lg:text-2xl truncate flex-1">
                    {recipe.name}
                  </h3>
                  {recipe.alcoholic && (
                    <Badge variant="destructive" className="shrink-0 text-xs">
                      21+
                    </Badge>
                  )}
                </div>
                {recipe.description && (
                  <p className="text-sm sm:text-base text-muted-foreground line-clamp-2 sm:line-clamp-3">
                    {recipe.description}
                  </p>
                )}
                <Button
                  type="button"
                  size="lg"
                  className="w-full h-12 sm:h-14 lg:h-16 gap-2 sm:gap-3 text-base sm:text-lg font-bold shadow-lg hover:shadow-xl transition-all duration-200"
                  onClick={handleMakeDrink}
                  disabled={!canOrderDrink || loading}
                >
                  {loading && <Spinner className="w-5 h-5" />}
                  {!loading && <BeakerIcon className="w-5 h-5 sm:w-6 sm:h-6" />}
                  {loading ? 'Making...' : 'Make Drink'}
                </Button>
                {!canOrderDrink && !loading && !checking && (
                  <p className="text-sm text-error text-center font-medium">
                    {feasibilityResult?.requiredIngredients?.some(
                      (item) => item.amountMissing > 0,
                    )
                      ? '⚠️ Missing ingredients'
                      : '🥃 Select a glass to continue'}
                  </p>
                )}
              </CardContent>
            </Card>

            <Card className="sm:col-span-1 lg:col-span-4 lg:row-span-2 hover:shadow-md hover:border-primary/20 transition-all duration-300">
              <CardContent className="p-4 sm:p-5 lg:p-6 h-full">
                <GlassSelector
                  selectedGlass={selectedGlass}
                  defaultGlass={recipe.defaultGlass || null}
                  token={token}
                  setSelectedGlass={setSelectedGlass}
                  onGlassChange={handleGlassChange}
                />
              </CardContent>
            </Card>

            <Card className="sm:col-span-1 lg:col-span-3 lg:row-span-3 hover:shadow-md hover:border-primary/20 transition-all duration-300">
              <CardContent className="p-4 sm:p-5 lg:p-6 h-full flex flex-col">
                <div className="flex items-center gap-2 mb-4">
                  <BeakerIcon className="w-5 h-5 text-primary" />
                  <h3 className="font-bold text-base sm:text-lg">Recipe</h3>
                </div>
                <ul className="space-y-2 text-sm sm:text-base flex-1 overflow-y-auto max-h-[400px] lg:max-h-none">
                  {recipeIngredients.map((item, index) => (
                    <li
                      key={index}
                      className="flex justify-between gap-2 whitespace-normal break-words py-1.5 border-b border-border/50 last:border-0"
                    >
                      <span className="font-medium">{item.name}</span>
                      <span className="text-muted-foreground shrink-0">
                        {item.amount} {item.unit}
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {feasibilityResult?.requiredIngredients && (
              <Card className="sm:col-span-2 lg:col-span-9 hover:shadow-md hover:border-primary/20 transition-all duration-300">
                <CardContent className="p-4 sm:p-5 lg:p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Info className="w-5 h-5 text-primary" />
                    <h3 className="font-bold text-base sm:text-lg">
                      Ingredient Availability
                    </h3>
                  </div>
                  <IngredientRequirements
                    requiredIngredients={feasibilityResult.requiredIngredients}
                  />
                </CardContent>
              </Card>
            )}

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

      <div className="bg-background/95 backdrop-blur-md border-t border-border p-3 sm:p-4 shadow-lg">
        <Button
          type="button"
          variant="ghost"
          size="lg"
          className="w-full h-12 sm:h-14 text-sm sm:text-base font-semibold"
          onClick={() => navigate({ to: '/simple/drinks' })}
        >
          Back to Drinks
        </Button>
      </div>
    </div>
  );
};

export default SimpleOrder;
