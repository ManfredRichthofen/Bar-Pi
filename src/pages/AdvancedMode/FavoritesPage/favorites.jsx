import { PageHeader } from '@/components/AdvancedMode/PageHeader';
import { Navigate, useNavigate } from '@tanstack/react-router';
import { AlertCircle, Heart, Trash2 } from 'lucide-react';
import React, { useState, useEffect, useCallback } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import RecipeService from '@/services/recipe.service';
import useAuthStore from '../../../store/authStore';
import useFavoritesStore from '../../../store/favoritesStore';

const Favorites = ({ sidebarCollapsed = false }) => {
  const token = useAuthStore((state) => state.token);
  const navigate = useNavigate({ from: '/favorites' });
  const { favorites, removeFavorite, clearFavorites } = useFavoritesStore();
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [favoritesWithImages, setFavoritesWithImages] = useState([]);
  const [loadingImages, setLoadingImages] = useState(false);

  // Load images for favorites
  const loadImagesForFavorites = useCallback(async () => {
    if (!token || favorites.length === 0) return;

    setLoadingImages(true);
    try {
      const updatedFavorites = await Promise.all(
        favorites.map(async (recipe) => {
          // Only load image if recipe hasImage but no image data
          if (recipe.hasImage && !recipe.image) {
            try {
              const recipeWithImage = await RecipeService.getRecipe(
                recipe.id,
                false,
                token,
              );
              return { ...recipe, image: recipeWithImage.image };
            } catch (error) {
              console.error(
                `Failed to load image for recipe ${recipe.id}:`,
                error,
              );
              return recipe;
            }
          }
          return recipe;
        }),
      );
      setFavoritesWithImages(updatedFavorites);
    } catch (error) {
      console.error('Failed to load images:', error);
      setFavoritesWithImages(favorites);
    } finally {
      setLoadingImages(false);
    }
  }, [token, favorites]);

  useEffect(() => {
    loadImagesForFavorites();
  }, [loadImagesForFavorites]);

  if (!token) {
    return <Navigate to="/login" />;
  }

  // Use favorites with images for rendering
  const displayFavorites =
    favoritesWithImages.length > 0 ? favoritesWithImages : favorites;

  const handleCardClick = (recipe) => {
    navigate({ to: '/order', state: { recipe } });
  };

  const handleRemoveFavorite = (e, recipeId) => {
    e.stopPropagation();
    removeFavorite(recipeId);
  };

  const handleClearAll = () => {
    clearFavorites();
    setShowClearConfirm(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        title="Favorites"
        count={favorites.length > 0 ? favorites.length : undefined}
        action={
          favorites.length > 0 && (
            <Button variant="outline" onClick={() => setShowClearConfirm(true)}>
              <Trash2 className="text-danger" />
              Clear all
            </Button>
          )
        }
      />

      <div className="container mx-auto px-4 py-6 sm:py-8">
        {favorites.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 min-h-[400px]">
            <Heart className="h-16 w-16 text-foreground-muted mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Favorites Yet</h3>
            <p className="text-foreground-muted text-center mb-6 max-w-sm">
              Your favorite drinks will appear here
            </p>
          </div>
        ) : loadingImages ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
            {displayFavorites.map((recipe) => (
              <Card
                key={recipe.id}
                onClick={() => handleCardClick(recipe)}
                className="cursor-pointer hover:shadow-lg transition-colors overflow-hidden"
              >
                <div className="relative w-full aspect-[4/3] overflow-hidden bg-surface-sunken">
                  {recipe.image ? (
                    <img
                      src={recipe.image}
                      alt={recipe.name}
                      className="w-full h-full object-cover transition-transform  "
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full bg-surface-sunken flex items-center justify-center">
                      <span className="text-foreground-muted text-sm font-medium">
                        No image
                      </span>
                    </div>
                  )}
                  <div className="absolute top-2 right-2">
                    <Button
                      size="icon"
                      variant="destructive"
                      className="w-8 rounded-full"
                      onClick={(e) => handleRemoveFavorite(e, recipe.id)}
                    >
                      <Heart className="size-6" fill="currentColor" />
                    </Button>
                  </div>
                </div>

                <CardContent className="p-4">
                  <div className="flex items-start gap-3 mb-2">
                    <h3 className="text-base font-bold leading-tight flex-1 min-w-0 line-clamp-2">
                      {recipe.name}
                    </h3>
                    {recipe.alcoholic && (
                      <Badge
                        variant="destructive"
                        className="whitespace-nowrap shrink-0 text-sm"
                      >
                        21+
                      </Badge>
                    )}
                  </div>

                  {recipe.description && (
                    <p className="text-sm text-foreground-muted line-clamp-2 mb-2">
                      {recipe.description}
                    </p>
                  )}

                  <div className="text-sm text-foreground-muted">
                    {recipe.ingredients?.length || 0} ingredient
                    {recipe.ingredients?.length !== 1 ? 's' : ''}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <AlertDialog open={showClearConfirm} onOpenChange={setShowClearConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear All Favorites?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove all {favorites.length} favorite
              {favorites.length !== 1 ? 's' : ''}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleClearAll}
              className="bg-danger text-danger-foreground hover:bg-danger"
            >
              Clear All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Favorites;
