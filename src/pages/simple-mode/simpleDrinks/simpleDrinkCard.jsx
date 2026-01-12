import React from 'react';
import { motion } from 'motion/react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useLazyImage } from '@/hooks/useLazyImage';
import { Loader2, GlassWater } from 'lucide-react';

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
  let availabilityColor = 'bg-primary/60';

  if (isAutomaticAndAvailable) {
    availabilityText = 'Auto + Available';
    availabilityColor = 'bg-primary/60';
  } else if (isAutomatic && isAvailable) {
    availabilityText = 'Auto + Available';
    availabilityColor = 'bg-primary/60';
  } else if (isAutomatic) {
    availabilityText = 'Automatic';
    availabilityColor = 'bg-primary/60';
  } else if (isManual && isAvailable) {
    availabilityText = 'Manual + Available';
    availabilityColor = 'bg-accent/60';
  } else if (isManual) {
    availabilityText = 'Manual';
    availabilityColor = 'bg-accent/40';
  } else if (isAvailable) {
    availabilityText = 'Available';
    availabilityColor = 'bg-primary/60';
  } else {
    availabilityText = 'Unavailable';
    availabilityColor = 'bg-destructive/60';
  }

  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className="h-full w-full"
    >
      <Card
        className="group cursor-pointer overflow-hidden w-full h-full border-border/50 hover:border-border hover:shadow-xl transition-all duration-300 p-0"
        onClick={() => onCardClick(recipe)}
      >
        <div className="flex flex-col">
          {/* Image section - fixed aspect ratio */}
          <figure
            ref={elementRef}
            className="relative w-full aspect-[4/3] overflow-hidden bg-gradient-to-br from-muted to-accent flex-shrink-0"
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
                {/* Gradient overlay for better badge visibility */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/20" />
              </>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                <GlassWater className="h-12 w-12 text-muted-foreground/30" />
                <span className="text-muted-foreground/60 text-sm font-medium">
                  {imageError ? 'Failed to load' : 'No image'}
                </span>
              </div>
            )}

            {/* Alcoholic Badge - positioned on image */}
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

            {/* Availability indicator - positioned on image */}
            <div className="absolute bottom-3 right-3 z-10">
              <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-full bg-background/80 backdrop-blur-sm shadow-lg">
                <div
                  className={`w-2 h-2 rounded-full ${availabilityColor}`}
                ></div>
                <span className="text-xs font-semibold text-foreground">
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
