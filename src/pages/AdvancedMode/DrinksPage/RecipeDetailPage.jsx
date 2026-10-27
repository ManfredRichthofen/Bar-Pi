import { useLocation, useNavigate } from '@tanstack/react-router';
import {
  ArrowLeft,
  BeakerIcon,
  Clock,
  GlassWater,
  Heart,
  Loader2,
  PencilIcon,
} from 'lucide-react';
import React, { useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useLazyImage } from '@/hooks/useLazyImage';
import useAuthStore from '@/store/authStore';
import useFavoritesStore from '@/store/favoritesStore';
import { calculateRecipeStats } from '@/utils/recipeStats';

const RecipeDetailPage = () => {
  const navigate = useNavigate({ from: '/drinks/$recipeId' });
  const location = useLocation();
  const recipe = location.state?.recipe;

  console.log('RecipeDetailPage loaded, recipe:', recipe);

  const { toggleFavorite, isFavorite } = useFavoritesStore();
  const token = useAuthStore((state) => state.token);

  const {
    imageUrl,
    loading: imageLoading,
    error: imageError,
    elementRef,
  } = useLazyImage(recipe?.id, recipe?.hasImage);

  // Redirect if no recipe data
  React.useEffect(() => {
    if (!recipe) {
      navigate({ to: '/drinks' });
    }
  }, [recipe, navigate]);

  // Scroll to top when component mounts
  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  if (!recipe) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Recipe not found</h2>
          <p className="text-foreground-muted mb-4">
            No recipe data was passed to this page.
          </p>
          <Button onClick={() => navigate({ to: '/drinks' })}>
            Back to Drinks
          </Button>
        </div>
      </div>
    );
  }

  const handleToggleFavorite = () => {
    if (recipe) {
      toggleFavorite(recipe);
    }
  };

  const handleMakeDrink = () => {
    if (recipe) {
      navigate({ to: '/order', state: { recipe } });
    }
  };

  const handleEditRecipe = () => {
    console.log('Edit recipe:', recipe?.id);
  };

  const handleBack = () => {
    navigate({ to: '/drinks' });
  };

  // Calculate recipe stats using utility function
  const recipeStats = useMemo(() => calculateRecipeStats(recipe), [recipe]);

  const ingredientCount = recipe?.ingredients?.length || 0;
  const stepCount = recipe?.productionSteps?.length || 0;
  const favorited = recipe ? isFavorite(recipe.id) : false;

  if (!recipe) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Recipe not found</h2>
          <p className="text-foreground-muted mb-4">
            No recipe data was passed to this page.
          </p>
          <Button onClick={() => navigate({ to: '/drinks' })}>
            Back to Drinks
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-16 z-30 border-b-hairline border-border bg-background">
        <div className="container mx-auto px-3 sm:px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleBack}
                className="shrink-0"
              >
                <ArrowLeft className="size-6" />
              </Button>
              <div className="min-w-0">
                <h1 className="truncate text-3xl sm:text-4xl">{recipe.name}</h1>
                <div className="flex flex-wrap items-center gap-3 text-sm sm:text-sm text-foreground-muted mt-1">
                  <div className="flex items-center gap-1">
                    <GlassWater className="size-4 sm:h-4 sm:w-4" />
                    <span>{ingredientCount} ingredients</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="size-4 sm:h-4 sm:w-4" />
                    <span>{stepCount} steps</span>
                  </div>
                  {recipeStats.totalVolume > 0 && (
                    <span className="hidden sm:inline">
                      {recipeStats.totalVolume}ml
                    </span>
                  )}
                  {recipeStats.estimatedABV > 0 && (
                    <span className="hidden sm:inline">
                      ~{recipeStats.estimatedABV}% ABV
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleToggleFavorite}
                className="shrink-0 w-8"
              >
                <Heart
                  className={`size-6 transition-colors ${
                    favorited
                      ? 'fill-red-500 text-danger'
                      : 'text-foreground-muted hover:text-danger'
                  }`}
                />
              </Button>

              {recipe.alcoholic && (
                <Badge variant="destructive" className="shrink-0">
                  21+
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6">
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-4 sm:gap-6">
          <div className="xl:col-span-1 space-y-4">
            {(imageUrl || imageLoading) && (
              <div className="relative aspect-[4/3] sm:aspect-[16/9] rounded-lg overflow-hidden bg-surface-sunken border">
                {imageLoading ? (
                  <div className="w-full h-full flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-foreground-muted" />
                  </div>
                ) : (
                  <img
                    className="w-full h-full object-cover"
                    src={imageUrl}
                    alt={recipe.name}
                  />
                )}
              </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
              <div className="bg-surface border rounded-lg p-2 sm:p-3 text-center">
                <div className="text-lg sm:text-xl font-bold text-primary">
                  {ingredientCount}
                </div>
                <div className="text-sm text-foreground-muted">Ingredients</div>
              </div>
              <div className="bg-surface border rounded-lg p-2 sm:p-3 text-center">
                <div className="text-lg sm:text-xl font-bold text-primary">
                  {stepCount}
                </div>
                <div className="text-sm text-foreground-muted">Steps</div>
              </div>
              <div className="bg-surface border rounded-lg p-2 sm:p-3 text-center">
                <div className="text-lg sm:text-xl font-bold text-primary">
                  {recipeStats.totalVolume}
                </div>
                <div className="text-sm text-foreground-muted">ml</div>
              </div>
              <div className="bg-surface border rounded-lg p-2 sm:p-3 text-center">
                <div className="text-lg sm:text-xl font-bold text-primary">
                  {recipeStats.estimatedABV}%
                </div>
                <div className="text-sm text-foreground-muted">ABV</div>
              </div>
              <div className="bg-surface border rounded-lg p-2 sm:p-3 text-center">
                <div className="text-lg sm:text-xl font-bold text-primary">
                  {recipeStats.automatedIngredients}
                </div>
                <div className="text-sm text-foreground-muted">Automated</div>
              </div>
              <div className="bg-surface border rounded-lg p-2 sm:p-3 text-center">
                <div className="text-lg sm:text-xl font-bold text-primary">
                  {recipeStats.manualIngredients}
                </div>
                <div className="text-sm text-foreground-muted">Manual</div>
              </div>
            </div>

            {recipe.description && (
              <div className="bg-surface-sunken rounded-lg p-3 sm:p-4">
                <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                  <span className="w-2 h-2 bg-primary rounded-full"></span>
                  Description
                </h4>
                <p className="text-sm leading-relaxed text-foreground-muted">
                  {recipe.description}
                </p>
              </div>
            )}
          </div>

          <div className="xl:col-span-3 space-y-4 sm:space-y-6">
            <div className="bg-surface border rounded-lg p-3 sm:p-4">
              <h4 className="font-semibold text-base mb-3 sm:mb-4 flex items-center gap-2">
                <GlassWater className="size-6 text-primary" />
                Ingredients
                <Badge variant="secondary" className="text-sm">
                  {ingredientCount} items
                </Badge>
              </h4>
              <div className="space-y-2">
                {recipe.ingredients?.map((ingredient, index) => (
                  <div
                    key={index}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3 py-2 sm:py-3 px-3 bg-surface-sunken rounded-lg border border-border"
                  >
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="w-6 h-6 sm:w-8 h-8 bg-primary-tint rounded-full flex items-center justify-center shrink-0">
                        <span className="text-sm font-bold text-primary">
                          {index + 1}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium text-sm truncate">
                          {ingredient.name}
                        </div>
                        <div className="flex flex-wrap items-center gap-1 sm:gap-2 mt-1">
                          <Badge
                            variant={
                              ingredient.type === 'automated'
                                ? 'default'
                                : 'secondary'
                            }
                            className="text-sm"
                          >
                            {ingredient.type}
                          </Badge>
                          {ingredient.onPump && (
                            <Badge variant="outline" className="text-sm">
                              On Pump
                            </Badge>
                          )}
                          {ingredient.inBar && (
                            <Badge variant="outline" className="text-sm">
                              In Bar
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-medium text-sm">
                        {ingredient.amount} {ingredient.unit}
                      </div>
                      {ingredient.alcoholContent && (
                        <div className="text-sm text-foreground-muted">
                          {ingredient.alcoholContent}% ABV
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {recipe.productionSteps && recipe.productionSteps.length > 0 && (
              <div className="bg-surface border rounded-lg p-3 sm:p-4">
                <h4 className="font-semibold text-base mb-3 sm:mb-4 flex items-center gap-2">
                  <BeakerIcon className="size-6 text-primary" />
                  Instructions
                  <Badge variant="secondary" className="text-sm">
                    {stepCount} steps
                  </Badge>
                </h4>
                <div className="space-y-2 sm:space-y-3">
                  {recipe.productionSteps.map((step, index) => (
                    <div
                      key={index}
                      className="flex gap-3 sm:gap-4 p-3 sm:p-4 bg-surface-sunken rounded-lg border border-border"
                    >
                      <div className="w-6 h-6 sm:w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold">
                        {index + 1}
                      </div>
                      <div className="flex-1 text-sm">
                        {step.type === 'writtenInstruction' ? (
                          <p className="leading-relaxed">{step.message}</p>
                        ) : step.type === 'addIngredients' ? (
                          <div>
                            <p className="font-medium mb-2">Add ingredients:</p>
                            <div className="flex flex-wrap gap-1">
                              {step.stepIngredients?.map((si, idx) => (
                                <Badge
                                  key={idx}
                                  variant="outline"
                                  className="text-sm"
                                >
                                  {si.ingredient.name} ({si.amount} {si.scale})
                                </Badge>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                            <Badge variant="outline" className="text-sm w-fit">
                              {step.type}
                            </Badge>
                            <p className="text-foreground-muted">
                              {step.message || 'No description available'}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-surface border rounded-lg p-3 sm:p-4">
              <h4 className="font-semibold text-base mb-3 sm:mb-4">
                Recipe Details
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-foreground-muted">Total Volume:</span>
                  <span className="font-medium">
                    {recipeStats.totalVolume}ml
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-foreground-muted">Estimated ABV:</span>
                  <span className="font-medium">
                    {recipeStats.estimatedABV}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-foreground-muted">
                    Automated Ingredients:
                  </span>
                  <span className="font-medium">
                    {recipeStats.automatedIngredients}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-foreground-muted">
                    Manual Ingredients:
                  </span>
                  <span className="font-medium">
                    {recipeStats.manualIngredients}
                  </span>
                </div>
                {recipe.defaultGlass && (
                  <div className="flex justify-between">
                    <span className="text-foreground-muted">
                      Recommended Glass:
                    </span>
                    <span className="font-medium truncate">
                      {recipe.defaultGlass.name}
                    </span>
                  </div>
                )}
                {recipe.category && (
                  <div className="flex justify-between">
                    <span className="text-foreground-muted">Category:</span>
                    <span className="font-medium truncate">
                      {recipe.category}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row gap-3 sticky bottom-0 bg-background border-t p-4">
          <Button
            onClick={handleMakeDrink}
            className="w-full sm:flex-1"
            size="lg"
          >
            <BeakerIcon className="mr-2 size-6" />
            Make Drink
          </Button>
        </div>
      </div>
    </div>
  );
};

export default RecipeDetailPage;
