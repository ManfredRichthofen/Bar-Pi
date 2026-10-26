import {
  BeakerIcon,
  Loader2,
  CheckCircle,
  AlertTriangle,
  Beaker,
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { useOrderFlow } from '@/hooks/useOrderFlow';
import { organizeRequiredIngredients } from '@/pages/Shared/order';
import DrinkCustomizer from './components/DrinkCustomizer';
import GlassSelector from './components/GlassSelector';
import IngredientRequirements from './components/IngredientRequirements';

const Order = () => {
  const {
    token,
    recipe,
    loading,
    checking,
    feasibilityResult,
    amountToProduce,
    selectedGlass,
    setSelectedGlass,
    customizations,
    setCustomizations,
    customizerIngredients,
    canOrderDrink,
    hasBoostableIngredients,
    handleGlassChange,
    handleMakeDrink,
    navigate,
  } = useOrderFlow({
    mode: 'advanced',
    successRoute: '/drinks',
  });

  if (!token || !recipe) return null;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 lg:py-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
          <div>
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold">
              Drink Production
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground">
              Customize and prepare your drink
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => navigate({ to: '/drinks' })}
            className="flex items-center gap-2 w-full sm:w-auto"
          >
            Back to Drinks
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5 lg:gap-6">
          <div className="lg:col-span-2 space-y-4 sm:space-y-5 lg:space-y-6">
            <Card>
              <CardHeader className="pb-3 sm:pb-4">
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                  {recipe.image && (
                    <div className="w-full sm:w-1/3">
                      <div className="aspect-square rounded-lg overflow-hidden bg-muted">
                        <img
                          className="w-full h-full object-cover"
                          src={recipe.image}
                          alt={recipe.name}
                        />
                      </div>
                    </div>
                  )}
                  <div className="flex-1">
                    <CardTitle className="text-lg sm:text-xl mb-2">
                      {recipe.name}
                    </CardTitle>
                    {recipe.description && (
                      <p className="text-muted-foreground text-sm mb-3 sm:mb-4">
                        {recipe.description}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary" className="text-xs sm:text-sm">
                        <Beaker className="w-3 h-3 mr-1" />
                        {amountToProduce || 250}ml
                      </Badge>
                      {feasibilityResult?.feasible && (
                        <Badge variant="default" className="text-xs sm:text-sm">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Available
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4">
                <GlassSelector
                  selectedGlass={selectedGlass}
                  setSelectedGlass={setSelectedGlass}
                  defaultGlass={recipe.defaultGlass}
                  token={token}
                  onGlassChange={handleGlassChange}
                />

                <Separator />

                {checking ? (
                  <div className="flex items-center justify-center py-3 sm:py-4">
                    <Loader2 className="h-5 w-5 sm:h-6 sm:w-6 animate-spin" />
                  </div>
                ) : feasibilityResult ? (
                  <Alert
                    variant={
                      feasibilityResult.feasible ? 'default' : 'destructive'
                    }
                  >
                    <AlertDescription>
                      <div className="space-y-1.5 sm:space-y-2">
                        <div className="flex items-center gap-2">
                          {feasibilityResult.feasible ? (
                            <CheckCircle className="w-4 h-4" />
                          ) : (
                            <AlertTriangle className="w-4 h-4" />
                          )}
                          <span className="font-medium text-sm sm:text-base">
                            {feasibilityResult.feasible
                              ? 'Ready to make'
                              : 'Cannot make'}
                          </span>
                        </div>
                        <div className="text-xs sm:text-sm">
                          Total amount: {feasibilityResult.totalAmountInMl}ml
                        </div>
                        {!feasibilityResult.feasible && (
                          <div className="text-xs sm:text-sm">
                            {feasibilityResult.reason}
                          </div>
                        )}
                      </div>
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className="text-center py-3 sm:py-4 text-sm text-muted-foreground">
                    {selectedGlass
                      ? 'Checking feasibility...'
                      : 'Select a glass to continue'}
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                  <Button
                    onClick={handleMakeDrink}
                    disabled={!canOrderDrink || loading}
                    size="lg"
                    className="flex-1 h-11 sm:h-12"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Making Drink...
                      </>
                    ) : (
                      <>
                        <BeakerIcon className="mr-2 h-4 w-4" />
                        {feasibilityResult
                          ? `Make Drink (${feasibilityResult.totalAmountInMl}ml)`
                          : 'Make Drink'}
                      </>
                    )}
                  </Button>
                </div>
                {!canOrderDrink &&
                  !loading &&
                  !checking &&
                  feasibilityResult && (
                    <p className="text-xs sm:text-sm text-center text-muted-foreground">
                      {!selectedGlass
                        ? '🥃 Select a glass to continue'
                        : feasibilityResult?.requiredIngredients?.some(
                              (item) => item.amountMissing > 0,
                            )
                          ? '⚠️ Missing ingredients'
                          : 'Cannot make this drink'}
                    </p>
                  )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3 sm:pb-4">
                <CardTitle className="text-base sm:text-lg">
                  Customization
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 sm:space-y-6">
                <DrinkCustomizer
                  disableBoosting={!hasBoostableIngredients}
                  customizations={customizations}
                  onCustomizationsChange={setCustomizations}
                  availableIngredients={customizerIngredients}
                />

                <Separator />

                {checking ? (
                  <div className="space-y-3 sm:space-y-4">
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-16 sm:h-20 w-full" />
                    <Skeleton className="h-16 sm:h-20 w-full" />
                  </div>
                ) : feasibilityResult ? (
                  <IngredientRequirements
                    requiredIngredients={feasibilityResult.requiredIngredients}
                  />
                ) : (
                  <div className="text-center py-6 sm:py-8 text-sm text-muted-foreground">
                    {selectedGlass
                      ? 'Loading ingredient data...'
                      : 'Select a glass to view ingredients'}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4 sm:space-y-5 lg:space-y-6">
            {feasibilityResult?.requiredIngredients && (
              <Card>
                <CardHeader className="pb-3 sm:pb-4">
                  <CardTitle className="text-base sm:text-lg">
                    Quick Stats
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {(() => {
                    const ingredients = organizeRequiredIngredients(
                      feasibilityResult.requiredIngredients,
                    );
                    return (
                      <div className="space-y-2.5 sm:space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-xs sm:text-sm">Automated</span>
                          <Badge variant="secondary" className="text-xs">
                            {ingredients.automated.length}
                          </Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs sm:text-sm">Manual</span>
                          <Badge variant="secondary" className="text-xs">
                            {ingredients.manual.length}
                          </Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs sm:text-sm">In Bar</span>
                          <Badge variant="default" className="text-xs">
                            {ingredients.inBar.length}
                          </Badge>
                        </div>
                        {ingredients.notInBar.length > 0 && (
                          <div className="flex justify-between items-center">
                            <span className="text-xs sm:text-sm">Missing</span>
                            <Badge variant="destructive" className="text-xs">
                              {ingredients.notInBar.length}
                            </Badge>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Order;
