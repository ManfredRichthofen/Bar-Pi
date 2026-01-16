import { useNavigate } from '@tanstack/react-router';
import {
  BeakerIcon,
  Clock,
  GlassWater,
  Heart,
  Loader2,
  PencilIcon,
  X,
} from 'lucide-react';
import React, { useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogScrollArea,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useLazyImage } from '@/hooks/useLazyImage';
import useFavoritesStore from '@/store/favoritesStore';

const DrinkModal = ({ recipe, isOpen, onClose }) => {
  const navigate = useNavigate({ from: '/drinks' });
  const { toggleFavorite, isFavorite } = useFavoritesStore();
  const favorited = isFavorite(recipe.id);

  // Lazy load image
  const {
    imageUrl,
    loading: imageLoading,
    error: imageError,
    elementRef,
  } = useLazyImage(recipe.id, recipe.hasImage);

  const handleToggleFavorite = (e) => {
    e.stopPropagation();
    toggleFavorite(recipe);
  };

  const handleMakeDrink = () => {
    navigate({ to: '/order', state: { recipe } });
    onClose();
  };

  const handleEditRecipe = () => {
    // TODO: edit recipe
    console.log('Edit recipe:', recipe.id);
  };

  const ingredientCount = recipe.ingredients?.length || 0;
  const stepCount = recipe.productionSteps?.length || 0;
  
  // Calculate additional recipe information
  const recipeStats = useMemo(() => {
    const automatedIngredients = recipe.ingredients?.filter(ing => ing.type === 'automated').length || 0;
    const manualIngredients = recipe.ingredients?.filter(ing => ing.type === 'manual').length || 0;
    const totalAlcoholContent = recipe.ingredients?.reduce((sum, ing) => {
      if (ing.alcoholContent && ing.amount) {
        // Convert to ml for calculation
        const amountMl = ing.unit === 'cl' ? ing.amount * 10 : ing.amount;
        return sum + (amountMl * ing.alcoholContent / 100);
      }
      return sum;
    }, 0) || 0;
    
    const estimatedABV = recipe.ingredients?.length > 0 ? 
      (totalAlcoholContent / recipe.ingredients.reduce((sum, ing) => {
        const amountMl = ing.unit === 'cl' ? ing.amount * 10 : ing.amount;
        return sum + amountMl;
      }, 0)) * 100 : 0;
    
    return {
      automatedIngredients,
      manualIngredients,
      estimatedABV: estimatedABV.toFixed(1),
      totalVolume: recipe.ingredients?.reduce((sum, ing) => {
        const amountMl = ing.unit === 'cl' ? ing.amount * 10 : ing.amount;
        return sum + amountMl;
      }, 0) || 0
    };
  }, [recipe]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[85vh] p-0">
        <div className="flex flex-col h-full">
          {/* Fixed Header */}
          <DialogHeader className="px-6 py-4 border-b">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <DialogTitle className="text-xl sm:text-2xl font-bold">
                    {recipe.name}
                  </DialogTitle>
                  {recipe.alcoholic && (
                    <Badge
                      variant="destructive"
                      className="text-xs font-semibold whitespace-nowrap"
                    >
                      21+
                    </Badge>
                  )}
                </div>
                
                {/* Recipe Meta Info */}
                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <GlassWater className="h-4 w-4" />
                    <span>{ingredientCount} ingredients</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>{stepCount} steps</span>
                  </div>
                  {recipe.defaultGlass && (
                    <Badge variant="outline" className="text-xs">
                      {recipe.defaultGlass.name}
                    </Badge>
                  )}
                  {recipeStats.totalVolume > 0 && (
                    <span>{recipeStats.totalVolume}ml total</span>
                  )}
                  {recipeStats.estimatedABV > 0 && (
                    <span>~{recipeStats.estimatedABV}% ABV</span>
                  )}
                </div>
              </div>
              
              {/* Close Button */}
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="shrink-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogHeader>

          {/* Scrollable Content */}
          <ScrollArea className="flex-1">
            <div className="px-6 py-4">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Image and Stats Column */}
                <div className="lg:col-span-1 space-y-4">
                  {/* Image */}
                  {(imageUrl || imageLoading) && (
                    <div className="relative aspect-[4/3] rounded-lg overflow-hidden bg-muted border">
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
                  
                  {/* Stats Cards */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-card border rounded-lg p-3 text-center">
                      <div className="text-xl font-bold text-primary">{ingredientCount}</div>
                      <div className="text-xs text-muted-foreground">Ingredients</div>
                    </div>
                    <div className="bg-card border rounded-lg p-3 text-center">
                      <div className="text-xl font-bold text-primary">{stepCount}</div>
                      <div className="text-xs text-muted-foreground">Steps</div>
                    </div>
                    <div className="bg-card border rounded-lg p-3 text-center">
                      <div className="text-xl font-bold text-primary">{recipeStats.automatedIngredients}</div>
                      <div className="text-xs text-muted-foreground">Automated</div>
                    </div>
                    <div className="bg-card border rounded-lg p-3 text-center">
                      <div className="text-xl font-bold text-primary">{recipeStats.manualIngredients}</div>
                      <div className="text-xs text-muted-foreground">Manual</div>
                    </div>
                  </div>
                  
                  {/* Additional Info */}
                  {recipe.description && (
                    <div className="bg-muted/30 rounded-lg p-4">
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
                <div className="lg:col-span-2 space-y-6">
                  {/* Ingredients Section */}
                  <div className="bg-card border rounded-lg p-4">
                    <h4 className="font-semibold text-base mb-4 flex items-center gap-2">
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
                          className="flex items-center justify-between py-3 px-3 bg-muted/30 rounded-lg border border-border/50"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                              <span className="text-xs font-bold text-primary">{index + 1}</span>
                            </div>
                            <div className="min-w-0">
                              <div className="font-medium text-sm truncate">{ingredient.name}</div>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge 
                                  variant={ingredient.type === 'automated' ? 'default' : 'secondary'} 
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
                    <div className="bg-card border rounded-lg p-4">
                      <h4 className="font-semibold text-base mb-4 flex items-center gap-2">
                        <BeakerIcon className="h-4 w-4 text-primary" />
                        Instructions
                        <Badge variant="secondary" className="text-xs">
                          {stepCount} steps
                        </Badge>
                      </h4>
                      <div className="space-y-3">
                        {recipe.productionSteps.map((step, index) => (
                          <div
                            key={index}
                            className="flex gap-4 p-4 bg-muted/30 rounded-lg border border-border/50"
                          >
                            <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold">
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
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className="text-xs">
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
                  
                  {/* Additional Recipe Info */}
                  <div className="bg-card border rounded-lg p-4">
                    <h4 className="font-semibold text-base mb-4">Recipe Details</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Total Volume:</span>
                        <span className="font-medium">{recipeStats.totalVolume}ml</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Estimated ABV:</span>
                        <span className="font-medium">{recipeStats.estimatedABV}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Automated Ingredients:</span>
                        <span className="font-medium">{recipeStats.automatedIngredients}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Manual Ingredients:</span>
                        <span className="font-medium">{recipeStats.manualIngredients}</span>
                      </div>
                      {recipe.defaultGlass && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Recommended Glass:</span>
                          <span className="font-medium">{recipe.defaultGlass.name}</span>
                        </div>
                      )}
                      {recipe.category && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Category:</span>
                          <span className="font-medium">{recipe.category}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </ScrollArea>

          {/* Fixed Footer */}
          <DialogFooter className="px-6 py-4 border-t bg-background">
            <div className="flex flex-col sm:flex-row gap-3 w-full">
              <Button onClick={handleMakeDrink} className="flex-1" size="lg">
                <BeakerIcon className="mr-2 h-4 w-4" />
                Make Drink
              </Button>
              <Button
                variant={favorited ? 'destructive' : 'outline'}
                onClick={handleToggleFavorite}
                className="flex-1 sm:flex-none"
                size="lg"
              >
                <Heart
                  className="mr-2 h-4 w-4"
                  fill={favorited ? 'currentColor' : 'none'}
                />
                {favorited ? 'Unfavorite' : 'Favorite'}
              </Button>
              <Button
                variant="outline"
                onClick={handleEditRecipe}
                className="flex-1 sm:flex-none"
                size="lg"
              >
                <PencilIcon className="mr-2 h-4 w-4" />
                Edit Recipe
              </Button>
              <Button
                variant="ghost"
                onClick={onClose}
                className="w-full sm:w-auto"
                size="lg"
              >
                Close
              </Button>
            </div>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DrinkModal;
