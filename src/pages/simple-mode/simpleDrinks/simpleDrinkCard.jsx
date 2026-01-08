import React from 'react';
import { motion } from 'motion/react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const SimpleDrinkCard = ({ recipe, onCardClick }) => {
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
  let availabilityColor = 'bg-success/60';

  if (isAutomaticAndAvailable) {
    availabilityText = 'Auto + Available';
    availabilityColor = 'bg-primary/60';
  } else if (isAutomatic && isAvailable) {
    availabilityText = 'Auto + Available';
    availabilityColor = 'bg-primary/60';
  } else if (isAutomatic) {
    availabilityText = 'Automatic';
    availabilityColor = 'bg-info/60';
  } else if (isManual && isAvailable) {
    availabilityText = 'Manual + Available';
    availabilityColor = 'bg-warning/60';
  } else if (isManual) {
    availabilityText = 'Manual';
    availabilityColor = 'bg-warning/40';
  } else if (isAvailable) {
    availabilityText = 'Available';
    availabilityColor = 'bg-success/60';
  } else {
    availabilityText = 'Unavailable';
    availabilityColor = 'bg-error/60';
  }

  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
    >
      <Card
        className="cursor-pointer overflow-hidden w-full h-full"
        onClick={() => onCardClick(recipe)}
      >
      <div className="flex flex-col h-full">
        {/* Image section - fixed aspect ratio */}
        <figure className="relative w-full aspect-[4/3] rounded-t-lg overflow-hidden bg-muted flex-shrink-0">
          {recipe.image ? (
            <img
              src={recipe.image}
              alt={recipe.name}
              className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-muted to-accent flex items-center justify-center">
              <span className="text-muted-foreground/60 text-sm font-medium">
                No image
              </span>
            </div>
          )}
        </figure>

        {/* Content section */}
        <CardContent className="flex flex-col flex-1 p-4">
          {/* Title and badge section */}
          <div className="flex items-start gap-3 mb-2">
            <h3 className="text-base font-bold text-foreground leading-tight flex-1 min-w-0 line-clamp-2">
              {recipe.name}
            </h3>
            {recipe.alcoholic && (
              <Badge variant="destructive" className="whitespace-nowrap shrink-0 text-xs">
                21+
              </Badge>
            )}
          </div>

          {/* Availability indicator */}
          <div className="mt-auto pt-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <div
                className={`w-2 h-2 rounded-full ${availabilityColor}`}
              ></div>
              <span className="font-medium">{availabilityText}</span>
            </div>
          </div>
        </CardContent>
      </div>
    </Card>
    </motion.div>
  );
};

export default SimpleDrinkCard;
