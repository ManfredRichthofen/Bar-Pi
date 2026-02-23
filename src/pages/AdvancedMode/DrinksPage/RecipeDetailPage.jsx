import { useNavigate, useLocation } from '@tanstack/react-router';
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
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useLazyImage } from '@/hooks/useLazyImage';
import useFavoritesStore from '@/store/favoritesStore';
import useAuthStore from '@/store/authStore';
import { calculateRecipeStats } from '@/utils/recipeStats';

const RecipeDetailPage = () => {
  const navigate = useNavigate({ from: '/drinks/$recipeId' });
  const location = useLocation();
  const recipe = location.state?.recipe;

  console.log('RecipeDetailPage loaded, recipe:', recipe);

  const { toggleFavorite, isFavorite } = useFavoritesStore();
  const token = useAuthStore((state) => state.token);

  // Lazy load image
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
          <p className="text-muted-foreground mb-4">
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
    // TODO: edit recipe
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
          <p className="text-muted-foreground mb-4">
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
      {/* Header */}
      <div className="sticky top-16 z-40 bg-background/95 backdrop-blur-sm border-b shadow-sm">
        <div className="container mx-auto px-3 sm:px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleBack}
                className="shrink-0"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="min-w-0">
                <h1 className="text-xl sm:text-2xl font-bold truncate">
                  {recipe.name}
                </h1>
                <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm text-muted-foreground mt-1">
                  <div className="flex items-center gap-1">
                    <GlassWater className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span>{ingredientCount} ingredients</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
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
              {/* Subtle favorite button */}
              <Button
                variant="ghost"
                size="icon"
                onClick={handleToggleFavorite}
                className="shrink-0 h-8 w-8"
              >
                <Heart
                  className={`h-4 w-4 transition-colors ${
                    favorited
                      ? 'fill-red-500 text-red-500'
                      : 'text-muted-foreground hover:text-red-400'
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

      {/* Content */}
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6">
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-4 sm:gap-6">
          {/* Image and Stats Column */}
          <div className="xl:col-span-1 space-y-4">
            {/* Image */}
            {(imageUrl || imageLoading) && (
              <div className="relative aspect-[4/3] sm:aspect-[16/9] rounded-lg overflow-hidden bg-muted border">
                {imageLoading ? (
                  <div className="w-full h-full flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground/40" />
                  </div>
                ) : (
                  <>
                    <img
                      className="w-full h-full object-cover"
                      src={imageUrl}
                      alt={recipe.name}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent pointer-events-none" />
                  </>
                )}
              </div>
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
              <div className="bg-card border rounded-lg p-2 sm:p-3 text-center">
                <div className="text-lg sm:text-xl font-bold text-primary">
                  {ingredientCount}
                </div>
                <div className="text-xs text-muted-foreground">Ingredients</div>
              </div>
              <div className="bg-card border rounded-lg p-2 sm:p-3 text-center">
                <div className="text-lg sm:text-xl font-bold text-primary">
                  {stepCount}
                </div>
                <div className="text-xs text-muted-foreground">Steps</div>
              </div>
              <div className="bg-card border rounded-lg p-2 sm:p-3 text-center">
                <div className="text-lg sm:text-xl font-bold text-primary">
                  {recipeStats.totalVolume}
                </div>
                <div className="text-xs text-muted-foreground">ml</div>
              </div>
              <div className="bg-card border rounded-lg p-2 sm:p-3 text-center">
                <div className="text-lg sm:text-xl font-bold text-primary">
                  {recipeStats.estimatedABV}%
                </div>
                <div className="text-xs text-muted-foreground">ABV</div>
              </div>
              <div className="bg-card border rounded-lg p-2 sm:p-3 text-center">
                <div className="text-lg sm:text-xl font-bold text-primary">
                  {recipeStats.automatedIngredients}
                </div>
                <div className="text-xs text-muted-foreground">Automated</div>
              </div>
              <div className="bg-card border rounded-lg p-2 sm:p-3 text-center">
                <div className="text-lg sm:text-xl font-bold text-primary">
                  {recipeStats.manualIngredients}
                </div>
                <div className="text-xs text-muted-foreground">Manual</div>
              </div>
            </div>

            {/* Description */}
            {recipe.description && (
              <div className="bg-muted/30 rounded-lg p-3 sm:p-4">
                <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                  <span className="w-2 h-2 bg-primary rounded-full"></span>
                  Description
                </h4>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {recipe.description}
                </p>
              </div>
            )}
          </div>

          {/* Ingredients and Instructions Column */}
          <div className="xl:col-span-3 space-y-4 sm:space-y-6">
            {/* Ingredients Section */}
            <div className="bg-card border rounded-lg p-3 sm:p-4">
              <h4 className="font-semibold text-base mb-3 sm:mb-4 flex items-center gap-2">
                <GlassWater className="h-4 w-4 text-primary" />
                Ingredients
                <Badge variant="secondary" className="text-xs">
                  {ingredientCount} items
                </Badge>
              </h4>
              <div className="space-y-2">
                {recipe.ingredients?.map((ingredient, index) => (
                  <div
                    key={index}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3 py-2 sm:py-3 px-3 bg-muted/30 rounded-lg border border-border/50"
                  >
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="w-6 h-6 sm:w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                        <span className="text-xs font-bold text-primary">
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
                            className="text-xs"
                          >
                            {ingredient.type}
                          </Badge>
                          {ingredient.onPump && (
                            <Badge variant="outline" className="text-xs">
                              On Pump
                            </Badge>
                          )}
                          {ingredient.inBar && (
                            <Badge variant="outline" className="text-xs">
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
                        <div className="text-xs text-muted-foreground">
                          {ingredient.alcoholContent}% ABV
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Instructions Section */}
            {recipe.productionSteps && recipe.productionSteps.length > 0 && (
              <div className="bg-card border rounded-lg p-3 sm:p-4">
                <h4 className="font-semibold text-base mb-3 sm:mb-4 flex items-center gap-2">
                  <BeakerIcon className="h-4 w-4 text-primary" />
                  Instructions
                  <Badge variant="secondary" className="text-xs">
                    {stepCount} steps
                  </Badge>
                </h4>
                <div className="space-y-2 sm:space-y-3">
                  {recipe.productionSteps.map((step, index) => (
                    <div
                      key={index}
                      className="flex gap-3 sm:gap-4 p-3 sm:p-4 bg-muted/30 rounded-lg border border-border/50"
                    >
                      <div className="w-6 h-6 sm:w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold">
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
                                  className="text-xs"
                                >
                                  {si.ingredient.name} ({si.amount} {si.scale})
                                </Badge>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                            <Badge variant="outline" className="text-xs w-fit">
                              {step.type}
                            </Badge>
                            <p className="text-muted-foreground">
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

            {/* Recipe Details Section */}
            <div className="bg-card border rounded-lg p-3 sm:p-4">
              <h4 className="font-semibold text-base mb-3 sm:mb-4">
                Recipe Details
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Volume:</span>
                  <span className="font-medium">
                    {recipeStats.totalVolume}ml
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Estimated ABV:</span>
                  <span className="font-medium">
                    {recipeStats.estimatedABV}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Automated Ingredients:
                  </span>
                  <span className="font-medium">
                    {recipeStats.automatedIngredients}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Manual Ingredients:
                  </span>
                  <span className="font-medium">
                    {recipeStats.manualIngredients}
                  </span>
                </div>
                {recipe.defaultGlass && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Recommended Glass:
                    </span>
                    <span className="font-medium truncate">
                      {recipe.defaultGlass.name}
                    </span>
                  </div>
                )}
                {recipe.category && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Category:</span>
                    <span className="font-medium truncate">
                      {recipe.category}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row gap-3 sticky bottom-0 bg-background/95 backdrop-blur-sm border-t p-4">
          <Button
            onClick={handleMakeDrink}
            className="w-full sm:flex-1"
            size="lg"
          >
            <BeakerIcon className="mr-2 h-4 w-4" />
            Make Drink
          </Button>
        </div>
      </div>
    </div>
  );
};

export default RecipeDetailPage;
