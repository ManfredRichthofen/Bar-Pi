import React from 'react';
import { Edit, Trash2, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from 'react-i18next';

const RecipeCard = ({ recipe, isFavorite, onEdit, onDelete }) => {
  const { t } = useTranslation();
  const handleEditClick = () => {
    onEdit(recipe);
  };

  const handleDeleteClick = () => {
    onDelete(recipe.id);
  };

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-all">
      <div className="relative w-full aspect-[4/3] overflow-hidden bg-muted">
        {recipe.image ? (
          <img
            src={recipe.image}
            alt={recipe.name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-muted to-muted/80 flex items-center justify-center">
            <span className="text-muted-foreground text-sm font-medium">
              {t('recipe_card.no_image')}
            </span>
          </div>
        )}
        {isFavorite && (
          <div className="absolute top-2 right-2">
            <Badge variant="destructive" className="gap-1">
              <Heart size={12} fill="currentColor" />
            </Badge>
          </div>
        )}
      </div>

      <CardHeader className="p-4 pb-2">
        <h3 className="text-base font-bold line-clamp-1">{recipe.name}</h3>
      </CardHeader>

      <CardContent className="p-4 pt-0">
        {recipe.description && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
            {recipe.description}
          </p>
        )}
        <div className="text-xs text-muted-foreground">
          {recipe.productionSteps?.length || 0} {t('recipe_card.step')}
          {recipe.productionSteps?.length !== 1
            ? t('recipe_card.steps_plural')
            : ''}
        </div>
      </CardContent>

      <CardFooter className="flex justify-end gap-2 p-4 pt-0">
        <Button variant="ghost" size="icon-sm" onClick={handleEditClick}>
          <Edit className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon-sm" onClick={handleDeleteClick}>
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </CardFooter>
    </Card>
  );
};

export default React.memo(RecipeCard);
