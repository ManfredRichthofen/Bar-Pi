import { useNavigate } from '@tanstack/react-router';
import { GlassWater, Heart, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useLazyImage } from '@/hooks/useLazyImage';
import useFavoritesStore from '@/store/favoritesStore';

const DrinkCard = ({ recipe }) => {
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

  const handleCardClick = () => {
    navigate({
      to: '/drinks/$recipeId',
      params: { recipeId: recipe.id },
      state: { recipe },
    });
  };

  const handleToggleFavorite = (e) => {
    e.stopPropagation();
    toggleFavorite(recipe);
  };

  const ingredientCount = recipe.ingredients?.length || 0;

  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className="h-full"
    >
      <Card
        onClick={handleCardClick}
        className="group cursor-pointer h-full overflow-hidden border-border/50 hover:border-border hover:shadow-xl transition-all duration-300 p-0"
      >
        <div className="flex flex-col h-full">
          {/* Image Section with Gradient Overlay */}
          <div
            ref={elementRef}
            className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-muted to-accent flex-shrink-0"
          >
            {imageLoading ? (
              <div className="w-full h-full flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground/40" />
              </div>
            ) : imageUrl ? (
              <>
                <img
                  src={imageUrl}
                  alt={recipe.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                {/* Gradient overlay for better text readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0" />
              </>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                <GlassWater className="h-12 w-12 text-muted-foreground/30" />
                <span className="text-muted-foreground/60 text-sm font-medium">
                  {imageError ? 'Failed to load' : 'No image'}
                </span>
              </div>
            )}

            {/* Favorite Button */}
            <div className="absolute top-3 right-3 z-10">
              <Button
                type="button"
                size="icon"
                variant={favorited ? 'default' : 'secondary'}
                className={`h-9 w-9 rounded-full shadow-lg backdrop-blur-sm transition-all ${
                  favorited
                    ? 'bg-destructive/90 hover:bg-destructive'
                    : 'bg-background/80 hover:bg-background'
                }`}
                onClick={handleToggleFavorite}
              >
                <Heart
                  className={`h-4 w-4 transition-all ${
                    favorited ? 'fill-current scale-110' : ''
                  }`}
                />
              </Button>
            </div>

            {/* Alcoholic Badge */}
            {recipe.alcoholic && (
              <div className="absolute top-3 left-3 z-10">
                <Badge
                  variant="destructive"
                  className="text-xs font-semibold shadow-lg backdrop-blur-sm bg-destructive/90"
                >
                  21+
                </Badge>
              </div>
            )}

            {/* Ingredient Count Badge */}
            <div className="absolute bottom-3 right-3 z-10">
              <Badge
                variant="secondary"
                className="text-xs font-medium shadow-lg backdrop-blur-sm bg-background/80"
              >
                {ingredientCount} ingredient{ingredientCount !== 1 ? 's' : ''}
              </Badge>
            </div>
          </div>

          {/* Content Section */}
          <CardContent className="flex flex-col flex-1 p-4">
            {/* Title */}
            <h3 className="text-base sm:text-lg font-bold text-foreground leading-tight mb-2 line-clamp-2 min-h-[2.5rem]">
              {recipe.name}
            </h3>

            {/* Description */}
            {recipe.description && (
              <p className="text-sm text-muted-foreground line-clamp-2 mb-3 flex-1">
                {recipe.description}
              </p>
            )}

            {/* Ingredients Preview */}
            <div className="mt-auto pt-3 border-t border-border/50">
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                <GlassWater className="h-3.5 w-3.5" />
                <span className="font-semibold">Top Ingredients</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {recipe.ingredients.slice(0, 3).map((ingredient, index) => (
                  <Badge
                    key={index}
                    variant="outline"
                    className="text-xs font-normal"
                  >
                    {ingredient.name}
                  </Badge>
                ))}
                {ingredientCount > 3 && (
                  <Badge variant="outline" className="text-xs font-normal">
                    +{ingredientCount - 3} more
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </div>
      </Card>
    </motion.div>
  );
};

export default DrinkCard;
