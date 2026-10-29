import { GlassWater, Loader2 } from 'lucide-react';
import { m, useReducedMotion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useLazyImage } from '@/hooks/useLazyImage';
import { usePress } from '@/hooks/usePress';
import { imageFadeVariants } from '@/lib/motionPresets';
import { isAvailable, requiresManual } from '@/utils/recipeFilters.js';

const getAvailability = (recipe, t) => {
  if (!isAvailable(recipe)) {
    return {
      label: t('simple_drinks.status_unavailable', 'Unavailable'),
      color: 'bg-danger',
    };
  }
  if (requiresManual(recipe)) {
    return {
      label: t('simple_drinks.status_hand_pour', 'Hand-pour'),
      color: 'bg-warning',
    };
  }
  return {
    label: t('simple_drinks.status_ready', 'Ready'),
    color: 'bg-success',
  };
};

const SimpleDrinkCard = ({ recipe, onCardClick }) => {
  const { t } = useTranslation();
  const reduceMotion = useReducedMotion();
  const press = usePress({ lift: true });
  const {
    imageUrl,
    loading: imageLoading,
    error: imageError,
    elementRef,
  } = useLazyImage(recipe.id, recipe.hasImage);

  const availability = getAvailability(recipe, t);

  return (
    <m.button
      type="button"
      {...press}
      onClick={() => onCardClick(recipe)}
      aria-label={`${recipe.name}, ${availability.label}`}
      className="h-full w-full cursor-pointer rounded-lg text-left focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ring"
    >
      <Card className="overflow-hidden w-full h-full shadow-md [@media(hover:hover)]:hover:border-border-strong transition-colors duration-150 ease-out p-0 gap-0">
        <figure
          ref={elementRef}
          className="relative w-full aspect-[4/3] overflow-hidden bg-surface-sunken flex-shrink-0"
        >
          {imageLoading ? (
            <div className="w-full h-full flex items-center justify-center">
              <Loader2 className="size-8 animate-spin text-foreground-muted" />
            </div>
          ) : imageUrl ? (
            <m.img
              key={imageUrl}
              src={imageUrl}
              alt=""
              className="w-full h-full object-cover"
              variants={imageFadeVariants}
              initial={reduceMotion ? false : 'hidden'}
              animate="visible"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center gap-2">
              <GlassWater className="size-12 text-foreground-muted" />
              <span className="text-foreground-muted text-sm font-medium">
                {imageError
                  ? t('simple_drinks.image_failed', 'Failed to load')
                  : t('simple_drinks.image_none', 'No image')}
              </span>
            </div>
          )}

          {recipe.alcoholic && (
            <div className="absolute top-3 left-3 z-10">
              <Badge variant="destructive">21+</Badge>
            </div>
          )}

          <div className="absolute inset-x-3 bottom-3 z-10 flex justify-end">
            <div className="flex min-w-0 max-w-full items-center gap-2 px-3 py-1.5 rounded-sm bg-background shadow-sm">
              <span
                aria-hidden="true"
                className={`size-4 shrink-0 rounded-full ${availability.color}`}
              />
              <span className="truncate text-sm font-semibold text-foreground">
                {availability.label}
              </span>
            </div>
          </div>
        </figure>

        <CardContent className="px-4 pt-3 pb-3">
          <h3 className="text-base sm:text-lg font-bold text-foreground leading-tight line-clamp-2">
            {recipe.name}
          </h3>
        </CardContent>
      </Card>
    </m.button>
  );
};

export default SimpleDrinkCard;
