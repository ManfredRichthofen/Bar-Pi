import { useNavigate } from '@tanstack/react-router';
import { GlassWater, Heart, Loader2 } from 'lucide-react';
import { m } from 'motion/react';
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useLazyImage } from '@/hooks/useLazyImage';
import { usePress } from '@/hooks/usePress';
import useFavoritesStore from '@/store/favoritesStore';

const DrinkCard = ({ recipe }) => {
  const navigate = useNavigate({ from: '/drinks' });
  const press = usePress({ lift: true });
  const toggleFavorite = useFavoritesStore((s) => s.toggleFavorite);
  const favorited = useFavoritesStore((s) =>
    s.favorites.some((fav) => fav.id === recipe.id),
  );

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
    <m.div
      {...press}
      className="h-full"
    >
      <Card
        onClick={handleCardClick}
        className="group cursor-pointer h-full overflow-hidden border-border hover:border-border hover:shadow-lg transition-colors p-0"
      >
        <div className="flex flex-col h-full">
          <div
            ref={elementRef}
            className="relative aspect-[4/3] overflow-hidden bg-surface-sunken flex-shrink-0"
          >
            {imageLoading ? (
              <div className="w-full h-full flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-foreground-muted" />
              </div>
            ) : imageUrl ? (
              <img
                src={imageUrl}
                alt={recipe.name}
                className="w-full h-full object-cover transition-transform  "
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                <GlassWater className="h-12 w-12 text-foreground-muted" />
                <span className="text-foreground-muted text-sm font-medium">
                  {imageError ? 'Failed to load' : 'No image'}
                </span>
              </div>
            )}

            <div className="absolute top-3 right-3 z-10">
              <Button
                type="button"
                size="icon"
                variant={favorited ? 'default' : 'secondary'}
                className={`size-control-sm  transition-colors ${
                  favorited
                    ? 'bg-danger hover:bg-danger'
                    : 'bg-background hover:bg-background'
                }`}
                onClick={handleToggleFavorite}
              >
                <Heart
                  className={`size-6 transition-colors ${
                    favorited ? 'fill-current scale-110' : ''
                  }`}
                />
              </Button>
            </div>

            {recipe.alcoholic && (
              <div className="absolute top-3 left-3 z-10">
                <Badge variant="destructive" className="font-semibold">
                  21+
                </Badge>
              </div>
            )}

            <div className="absolute bottom-3 right-3 z-10">
              <Badge
                variant="secondary"
                className="text-sm font-medium bg-background"
              >
                {ingredientCount} ingredient{ingredientCount !== 1 ? 's' : ''}
              </Badge>
            </div>
          </div>

          <CardContent className="flex flex-col flex-1 p-4">
            <h3 className="text-base sm:text-lg font-bold text-foreground leading-tight mb-2 line-clamp-2 min-h-[2.5rem]">
              {recipe.name}
            </h3>

            {recipe.description && (
              <p className="text-sm text-foreground-muted line-clamp-2 mb-3 flex-1">
                {recipe.description}
              </p>
            )}

            <div className="mt-auto pt-3 border-t border-border">
              <div className="flex items-center gap-2 text-sm text-foreground-muted mb-2">
                <GlassWater className="h-3.5 w-3.5" />
                <span className="font-semibold">Top Ingredients</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {recipe.ingredients.slice(0, 3).map((ingredient, index) => (
                  <Badge
                    key={index}
                    variant="outline"
                    className="text-sm font-normal"
                  >
                    {ingredient.name}
                  </Badge>
                ))}
                {ingredientCount > 3 && (
                  <Badge variant="outline" className="text-sm font-normal">
                    +{ingredientCount - 3} more
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </div>
      </Card>
    </m.div>
  );
};

export default DrinkCard;
