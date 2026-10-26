import { GlassWater, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useLazyImage } from '@/hooks/useLazyImage';
import { cn } from '@/lib/utils';

const SimpleDrinkCard = ({ recipe, onCardClick }) => {
  // Lazy load image
  const {
    imageUrl,
    loading: imageLoading,
    error: imageError,
    elementRef,
  } = useLazyImage(recipe.id, recipe.hasImage);

  // Determine recipe characteristics
  const isAutomatic =
    recipe?.ingredients?.every(
      (ingredient) => ingredient.type === 'automated',
    ) || false;
  const isManual =
    recipe?.ingredients?.some((ingredient) => ingredient.type === 'manual') ||
    false;
  const isAvailable =
    recipe?.ingredients?.every((ingredient) => {
      const isOnPump = ingredient.onPump === true;
      const isInBar = ingredient.inBar === true;
      const hasNoMissingAmount =
        !ingredient.amountMissing || ingredient.amountMissing <= 0;
      return (isOnPump || isInBar) && hasNoMissingAmount;
    }) || false;

  // Special case: automatic AND available (all automated ingredients on pumps with no missing amounts)
  const isAutomaticAndAvailable =
    recipe?.ingredients?.every(
      (ingredient) =>
        ingredient.type === 'automated' &&
        ingredient.onPump === true &&
        (!ingredient.amountMissing || ingredient.amountMissing <= 0),
    ) || false;

  // Determine availability text and color
  let availabilityText = 'Available';
  let availabilityColor = 'bg-success';

  if (isAutomaticAndAvailable) {
    availabilityText = 'Auto + Available';
    availabilityColor = 'bg-success';
  } else if (isAutomatic && isAvailable) {
    availabilityText = 'Auto + Available';
    availabilityColor = 'bg-success';
  } else if (isAutomatic) {
    availabilityText = 'Automatic';
    availabilityColor = 'bg-success';
  } else if (isManual && isAvailable) {
    availabilityText = 'Manual + Available';
    availabilityColor = 'bg-warning';
  } else if (isManual) {
    availabilityText = 'Manual';
    availabilityColor = 'bg-warning';
  } else if (isAvailable) {
    availabilityText = 'Available';
    availabilityColor = 'bg-success';
  } else {
    availabilityText = 'Unavailable';
    availabilityColor = 'bg-danger';
  }

  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className="h-full w-full"
    >
      <Card
        className="group cursor-pointer overflow-hidden w-full h-full shadow-md [@media(hover:hover)]:hover:border-border-strong transition-colors p-0"
        onClick={() => onCardClick(recipe)}
      >
        <div className="flex flex-col">
          {/* Image section - fixed aspect ratio */}
          <figure
            ref={elementRef}
            className="relative w-full aspect-[4/3] overflow-hidden bg-surface-sunken flex-shrink-0"
          >
            {imageLoading ? (
              <div className="w-full h-full flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-foreground-muted" />
              </div>
            ) : imageUrl ? (
              <>
                <img
                  src={imageUrl}
                  alt={recipe.name}
                  className="w-full h-full object-cover transition-transform  "
                />
                {/* Gradient overlay for better badge visibility */}
                <div className="absolute inset-0 " />
              </>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                <GlassWater className="h-12 w-12 text-foreground-muted" />
                <span className="text-foreground-muted text-sm font-medium">
                  {imageError ? 'Failed to load' : 'No image'}
                </span>
              </div>
            )}

            {/* Alcoholic Badge - positioned on image */}
            {recipe.alcoholic && (
              <div className="absolute top-3 left-3 z-10">
                <Badge
                  variant="destructive"
                  className=""
                >
                  21+
                </Badge>
              </div>
            )}

            {/* Availability indicator - positioned on image */}
            <div className="absolute bottom-3 right-3 z-10">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-sm bg-background shadow-sm">
                <div
                  className={`size-4 rounded-full ${availabilityColor}`}
                ></div>
                <span className="text-sm font-semibold text-foreground whitespace-nowrap">
                  {availabilityText}
                </span>
              </div>
            </div>
          </figure>

          {/* Content section */}
          <CardContent className="px-4 pt-3 pb-3">
            {/* Title */}
            <h3 className="text-base sm:text-lg font-bold text-foreground leading-tight line-clamp-2">
              {recipe.name}
            </h3>
          </CardContent>
        </div>
      </Card>
    </motion.div>
  );
};

export default SimpleDrinkCard;
