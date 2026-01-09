import React, { useState } from 'react';
import { BeakerIcon, PencilIcon, Heart } from 'lucide-react';
import { useNavigate } from '@tanstack/react-router';
import useFavoritesStore from '@/store/favoritesStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const DrinkCard = ({ recipe }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const navigate = useNavigate();
  const { toggleFavorite, isFavorite } = useFavoritesStore();
  const favorited = isFavorite(recipe.id);

  const showModal = () => setIsModalOpen(true);
  const handleCancel = () => setIsModalOpen(false);

  const handleToggleFavorite = (e) => {
    e.stopPropagation();
    toggleFavorite(recipe);
  };

  const handleMakeDrink = () => {
    navigate({ to: '/order', state: { recipe } });
    handleCancel();
  };

  const handleEditRecipe = () => {
    // TODO: edit recipe
    console.log('Edit recipe:', recipe.id);
  };

  return (
    <>
      <Card
        onClick={showModal}
        className="hover:shadow-lg transition-all cursor-pointer h-full overflow-hidden"
      >
        <div className="relative aspect-[4/3] sm:aspect-[16/9] overflow-hidden bg-muted">
          {recipe.image ? (
            <img
              src={recipe.image}
              alt={recipe.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-muted flex items-center justify-center">
              <span className="text-muted-foreground text-sm">
                No image available
              </span>
            </div>
          )}
          <div className="absolute top-2 right-2">
            <Button
              type="button"
              size="icon"
              variant={favorited ? 'destructive' : 'secondary'}
              className="h-8 w-8 rounded-full"
              onClick={handleToggleFavorite}
            >
              <Heart className="h-4 w-4" fill={favorited ? 'currentColor' : 'none'} />
            </Button>
          </div>
        </div>

        <CardContent className="p-3 sm:p-4">
          <div className="flex items-center justify-between gap-2 mb-1 sm:mb-2">
            <h3
              className="text-sm sm:text-base font-bold truncate"
              title={recipe.name}
            >
              {recipe.name}
            </h3>
            {recipe.alcoholic && (
              <Badge variant="destructive" className="text-xs whitespace-nowrap">
                Alcoholic
              </Badge>
            )}
          </div>

          {recipe.description && (
            <p
              className="text-muted-foreground mb-2 sm:mb-3 line-clamp-2 text-xs sm:text-sm"
              title={recipe.description}
            >
              {recipe.description}
            </p>
          )}

          <div className="mt-auto">
            <p className="font-semibold text-xs mb-1">Ingredients:</p>
            <ul className="space-y-0.5 text-xs">
              {recipe.ingredients.map((ingredient, index) => (
                <li
                  key={index}
                  className="truncate"
                  title={`${ingredient.name} - ${ingredient.amount} ${ingredient.unit}`}
                >
                  • {ingredient.name} - {ingredient.amount} {ingredient.unit}
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <div className="flex items-center justify-between gap-2">
              <DialogTitle className="text-lg sm:text-xl">
                {recipe.name}
              </DialogTitle>
              {recipe.alcoholic && (
                <Badge variant="destructive" className="text-xs whitespace-nowrap">
                  Alcoholic
                </Badge>
              )}
            </div>
          </DialogHeader>
          
          <div className="flex flex-col sm:flex-row gap-4">
            {recipe.image && (
              <div className="w-full sm:w-1/2">
                <img
                  className="w-full rounded-lg object-cover aspect-[4/3]"
                  src={recipe.image}
                  alt={recipe.name}
                />
              </div>
            )}

            <div className="flex-1 min-w-0">

              {recipe.description && (
                <div className="mb-4">
                  <h4 className="font-bold text-base mb-2">
                    Description
                  </h4>
                  <p className="text-sm">{recipe.description}</p>
                </div>
              )}

              <div className="mb-4">
                <h4 className="font-bold text-base mb-2">
                  Ingredients
                </h4>
                <ul className="space-y-1">
                  {recipe.ingredients.map((ingredient, index) => (
                    <li key={index} className="text-sm">
                      • {ingredient.name} - {ingredient.amount}{' '}
                      {ingredient.unit}
                    </li>
                  ))}
                </ul>
              </div>

              {recipe.productionSteps &&
                recipe.productionSteps.length > 0 && (
                  <div>
                    <h4 className="font-bold text-base mb-2">
                      Instructions
                    </h4>
                    <ul className="space-y-1">
                      {recipe.productionSteps.map((step, index) => (
                        <li key={index} className="text-sm">
                          {step.type === 'writtenInstruction' ? (
                            <span>
                              {index + 1}. {step.message}
                            </span>
                          ) : (
                            step.type === 'addIngredients' && (
                              <span>
                                {index + 1}. Add:{' '}
                                {step.stepIngredients
                                  .map(
                                    (si) =>
                                      `${si.ingredient.name} (${si.amount} ${si.scale})`,
                                  )
                                  .join(', ')}
                              </span>
                            )
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              onClick={handleMakeDrink}
              className="flex-1 sm:flex-none"
            >
              <BeakerIcon className="mr-2 h-4 w-4" />
              Make Drink
            </Button>
            <Button
              variant={favorited ? 'destructive' : 'outline'}
              onClick={handleToggleFavorite}
              className="flex-1 sm:flex-none"
            >
              <Heart className="mr-2 h-4 w-4" fill={favorited ? 'currentColor' : 'none'} />
              {favorited ? 'Unfavorite' : 'Favorite'}
            </Button>
            <Button
              variant="outline"
              onClick={handleEditRecipe}
              className="flex-1 sm:flex-none"
            >
              <PencilIcon className="mr-2 h-4 w-4" />
              Edit Recipe
            </Button>
            <Button
              variant="outline"
              onClick={handleCancel}
              className="w-full sm:w-auto"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
    </>
  );
};

export default DrinkCard;
