import { Navigate, useNavigate } from '@tanstack/react-router';
import {
  AlertCircle,
  Edit,
  Heart,
  Loader2,
  PlusCircle,
  Trash2,
} from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import RecipeService from '@/services/recipe.service';
import useAuthStore from '@/store/authStore';
import useFavoritesStore from '@/store/favoritesStore';

const Recipes = ({ sidebarCollapsed = false }) => {
  const token = useAuthStore((state) => state.token);
  const navigate = useNavigate({ from: '/recipes' });
  const favorites = useFavoritesStore((state) => state.favorites);
  const { toggleFavorite } = useFavoritesStore();
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchRecipes = useCallback(async () => {
    try {
      setLoading(true);
      const data = await RecipeService.getRecipes(
        0,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        token,
      );
      setRecipes(data.content || []);
    } catch (error) {
      toast.error('Failed to fetch recipes');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      fetchRecipes();
    }
  }, [token, fetchRecipes]);

  const handleAdd = useCallback(() => {
    navigate({ to: '/recipes/new' });
  }, [navigate]);

  const handleEdit = useCallback(
    (recipe) => {
      navigate({
        to: `/recipes/${recipe.id}/edit`,
      });
    },
    [navigate],
  );

  const handleDelete = useCallback(
    async (id) => {
      if (window.confirm('Are you sure you want to delete this recipe?')) {
        try {
          await RecipeService.deleteRecipe(id);
          toast.success('Recipe deleted successfully');
          fetchRecipes();
        } catch (error) {
          toast.error('Failed to delete recipe');
        }
      }
    },
    [fetchRecipes],
  );

  const handleToggleFavorite = useCallback(
    async (recipe) => {
      try {
        await toggleFavorite(recipe);
      } catch (error) {
        toast.error('Failed to toggle favorite');
      }
    },
    [toggleFavorite],
  );

  const favoriteIds = useMemo(
    () => new Set((favorites || []).map((fav) => fav.id)),
    [favorites],
  );

  if (!token) {
    return <Navigate to="/login" />;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-20 bg-background border-b shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Recipes</h1>
            <Button onClick={handleAdd}>
              <PlusCircle />
              Add Recipe
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 sm:py-8">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : recipes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 min-h-[400px]">
            <AlertCircle className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Recipes Found</h3>
            <p className="text-muted-foreground text-center mb-6 max-w-sm">
              Get started by creating your first recipe to begin mixing drinks
            </p>
            <Button size="lg" onClick={handleAdd}>
              <PlusCircle className="mr-2" />
              Add First Recipe
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {recipes.map((recipe) => {
              const isFavorite = favoriteIds.has(recipe.id);
              const ingredientCount =
                recipe.productionSteps?.reduce(
                  (count, step) =>
                    step.type === 'addIngredients'
                      ? count + (step.stepIngredients?.length || 0)
                      : count,
                  0,
                ) || 0;

              return (
                <div
                  key={recipe.id}
                  className="flex items-center justify-between p-4 bg-card border rounded-lg hover:shadow-md transition-all duration-200"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-base truncate">
                        {recipe.name}
                      </h3>
                      {isFavorite && (
                        <Heart className="h-4 w-4 fill-destructive text-destructive flex-shrink-0" />
                      )}
                    </div>
                    {recipe.description && (
                      <p className="text-sm text-muted-foreground line-clamp-1 mt-1">
                        {recipe.description}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      {ingredientCount > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          {ingredientCount} ingredient
                          {ingredientCount !== 1 ? 's' : ''}
                        </Badge>
                      )}
                      {recipe.defaultGlass && (
                        <Badge variant="outline" className="text-xs">
                          {recipe.defaultGlass.name}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleToggleFavorite(recipe)}
                    >
                      <Heart
                        className={`h-4 w-4 ${
                          isFavorite ? 'fill-destructive text-destructive' : ''
                        }`}
                      />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(recipe)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(recipe.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Recipes;
