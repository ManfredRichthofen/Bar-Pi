import { Navigate, useNavigate } from '@tanstack/react-router';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useWindowVirtualizer } from '@tanstack/react-virtual';
import {
  AlertCircle,
  Edit,
  Heart,
  Loader2,
  PlusCircle,
  Search,
  Trash2,
} from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import RecipeService from '@/services/recipe.service';
import useAuthStore from '@/store/authStore';
import useFavoritesStore from '@/store/favoritesStore';

const Recipes = ({ sidebarCollapsed = false }) => {
  const token = useAuthStore((state) => state.token);
  const navigate = useNavigate({ from: '/recipes' });
  const favorites = useFavoritesStore((state) => state.favorites);
  const { toggleFavorite } = useFavoritesStore();
  const [searchTerm, setSearchTerm] = useState('');
  
  const listRef = useRef();
  const parentOffsetRef = useRef(0);
  const [rowHeight, setRowHeight] = React.useState(120);
  
  React.useLayoutEffect(() => {
    parentOffsetRef.current = listRef.current?.offsetTop || 0;
  }, []);

  const {
    status,
    data,
    error,
    isFetching,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
  } = useInfiniteQuery({
    queryKey: ['recipes', searchTerm],
    queryFn: async ({ pageParam = 0 }) => {
      const response = await RecipeService.getRecipes(
        pageParam,
        null,
        null,
        null,
        null,
        searchTerm,
        null,
        null,
        token,
      );
      
      return {
        content: response.content || [],
        last: response.last,
        nextOffset: pageParam + 1,
      };
    },
    getNextPageParam: (lastGroup) =>
      lastGroup.last ? undefined : lastGroup.nextOffset,
    initialPageParam: 0,
    staleTime: 30000,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: 2,
  });
  
  const allRecipes = data ? data.pages.flatMap((d) => d.content) : [];
  const totalCount = data ? data.pages[0]?.totalElements || 0 : 0;

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
          // Refetch the first page to refresh the list
          window.location.reload();
        } catch (error) {
          toast.error('Failed to delete recipe');
        }
      }
    },
    [],
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

  const handleLoadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);
  
  const handleSearch = useCallback((e) => {
    setSearchTerm(e.target.value);
  }, []);
  
  const favoriteIds = useMemo(
    () => new Set((favorites || []).map((fav) => fav.id)),
    [favorites],
  );
  
  // Window virtualizer setup
  const virtualizer = useWindowVirtualizer({
    count: allRecipes.length,
    estimateSize: () => rowHeight,
    overscan: 5,
    scrollMargin: parentOffsetRef.current,
  });
  
  const virtualItems = virtualizer.getVirtualItems();
  
  // Auto-load more when scrolling near end
  useEffect(() => {
    const [lastItem] = [...virtualizer.getVirtualItems()].reverse();
    if (!lastItem) return;

    if (lastItem.index >= allRecipes.length - 5 && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, fetchNextPage, allRecipes.length, isFetchingNextPage, virtualizer.getVirtualItems()]);

  if (!token) {
    return <Navigate to="/login" />;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-16 z-40 bg-background border-b shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <h1 className="text-2xl font-bold">Recipes</h1>
            <Button onClick={handleAdd}>
              <PlusCircle />
              Add Recipe
            </Button>
          </div>
          
          {/* Search Bar */}
          <div className="mt-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                type="text"
                placeholder="Search recipes..."
                value={searchTerm}
                onChange={handleSearch}
                className="pl-10"
              />
            </div>
            {totalCount > 0 && (
              <p className="text-sm text-muted-foreground mt-2">
                Showing {allRecipes.length} of {totalCount} recipes
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 sm:py-8">
        {status === 'pending' ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : status === 'error' ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 min-h-[400px]">
            <AlertCircle className="h-16 w-16 text-destructive mb-4" />
            <h3 className="text-xl font-semibold mb-2">Error Loading Recipes</h3>
            <p className="text-muted-foreground text-center mb-6 max-w-sm">
              {error?.message || 'Failed to load recipes'}
            </p>
          </div>
        ) : allRecipes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 min-h-[400px]">
            <AlertCircle className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">
              {searchTerm ? 'No Recipes Found' : 'No Recipes Found'}
            </h3>
            <p className="text-muted-foreground text-center mb-6 max-w-sm">
              {searchTerm 
                ? `No recipes found matching "${searchTerm}"`
                : 'Get started by creating your first recipe to begin mixing drinks'
              }
            </p>
            {!searchTerm && (
              <Button size="lg" onClick={handleAdd}>
                <PlusCircle className="mr-2" />
                Add First Recipe
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {/* Virtual List Container */}
            <div ref={listRef} className="relative">
              <div
                style={{
                  height: `${virtualizer.getTotalSize()}px`,
                  width: '100%',
                  position: 'relative',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    transform: `translateY(${(virtualItems[0]?.start ?? 0) - virtualizer.options.scrollMargin}px)`,
                  }}
                >
                  {virtualItems.map((virtualItem) => {
                    const recipe = allRecipes[virtualItem.index];
                    if (!recipe) return null;
                    
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
                        data-index={virtualItem.index}
                        ref={virtualizer.measureElement}
                        className="px-4 py-2"
                      >
                        <div className="flex items-center justify-between p-4 bg-card border rounded-lg hover:shadow-md transition-all duration-200">
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
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
            
            {/* Loading indicator at bottom */}
            {isFetchingNextPage && hasNextPage && (
              <div className="flex justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            )}
            
            {!hasNextPage && !isFetching && allRecipes.length > 0 && (
              <div className="flex items-center justify-center py-8">
                <p className="text-center text-muted-foreground text-sm">
                  Showing all {allRecipes.length} recipes
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Recipes;
