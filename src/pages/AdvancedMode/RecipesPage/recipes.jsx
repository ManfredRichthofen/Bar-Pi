import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { Navigate, useNavigate } from '@tanstack/react-router';
import { useWindowVirtualizer } from '@tanstack/react-virtual';
import {
  AlertCircle,
  ArrowUp,
  Edit,
  Heart,
  Loader2,
  PlusCircle,
  Trash2,
} from 'lucide-react';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import SearchInput from '@/components/ui/search-input.jsx';
import RecipeService from '../../../services/recipe.service.js';
import useAuthStore from '../../../store/authStore.js';
import useFavoritesStore from '../../../store/favoritesStore.js';

const Recipes = ({ sidebarCollapsed = false }) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const token = useAuthStore((state) => state.token);
  const navigate = useNavigate({ from: '/recipes' });
  const favorites = useFavoritesStore((state) => state.favorites);
  const { toggleFavorite } = useFavoritesStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const lastScrollYRef = useRef(0);
  const [showScrollTop, setShowScrollTop] = useState(false);

  const listRef = useRef();
  const parentOffsetRef = useRef(0);
  const rowHeight = 120;

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
      if (
        window.confirm(
          t(
            'recipes.delete_confirm',
            'Are you sure you want to delete this recipe?',
          ),
        )
      ) {
        try {
          await RecipeService.deleteRecipe(id, token);
          toast.success(
            t('recipes.delete_success', 'Recipe deleted successfully'),
          );
          // Invalidate and refetch the recipes query
          queryClient.invalidateQueries({ queryKey: ['recipes'] });
        } catch (error) {
          toast.error(t('recipes.delete_error', 'Failed to delete recipe'));
        }
      }
    },
    [t, token, queryClient],
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

  const handleSearch = useCallback((value) => {
    setSearchTerm(value);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const lastY = lastScrollYRef.current;

      // Hide header when scrolling down, show when scrolling up
      if (currentScrollY > lastY && currentScrollY > 100) {
        setIsHeaderVisible(false);
      } else {
        setIsHeaderVisible(true);
      }

      lastScrollYRef.current = currentScrollY;
      setShowScrollTop(currentScrollY > 400);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
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

    if (
      lastItem.index >= allRecipes.length - 5 &&
      hasNextPage &&
      !isFetchingNextPage
    ) {
      fetchNextPage();
    }
  }, [
    hasNextPage,
    fetchNextPage,
    allRecipes.length,
    isFetchingNextPage,
    virtualizer.getVirtualItems(),
  ]);

  if (!token) {
    return <Navigate to="/login" />;
  }

  return (
    <div className="min-h-screen bg-background">
      <div
        className={`sticky top-16 z-40 bg-background/95 backdrop-blur-sm border-b shadow-sm transition-all duration-300 ${
          isHeaderVisible
            ? 'translate-y-0 opacity-100'
            : '-translate-y-full opacity-0'
        }`}
      >
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
            <h1 className="text-xl sm:text-2xl font-bold">Recipes</h1>
            <Button
              onClick={handleAdd}
              className="w-full sm:w-auto"
              size="default"
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Recipe
            </Button>
          </div>

          {/* Search Bar */}
          <div className="mt-3 sm:mt-4">
            <SearchInput
              value={searchTerm}
              onChange={handleSearch}
              placeholder="Search recipes..."
              debounceMs={300}
              inputClassName="pl-10 h-10 sm:h-11"
            />
            {totalCount > 0 && (
              <p className="text-xs sm:text-sm text-muted-foreground mt-2">
                Showing {allRecipes.length} of {totalCount} recipes
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 md:py-8">
        {status === 'pending' ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : status === 'error' ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 min-h-[400px]">
            <AlertCircle className="h-16 w-16 text-destructive mb-4" />
            <h3 className="text-xl font-semibold mb-2">
              Error Loading Recipes
            </h3>
            <p className="text-muted-foreground text-center mb-6 max-w-sm">
              {error?.message || 'Failed to load recipes'}
            </p>
          </div>
        ) : allRecipes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 min-h-[400px]">
            <AlertCircle className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">
              {searchTerm
                ? t('recipes.no_results', 'No Recipes Found')
                : t('recipes.empty_title', 'No Recipes Found')}
            </h3>
            <p className="text-muted-foreground text-center mb-6 max-w-sm">
              {searchTerm
                ? t(
                    'recipes.no_results_message',
                    `No recipes found matching "{{searchTerm}}"`,
                    { searchTerm },
                  )
                : t(
                    'recipes.empty_message',
                    'Get started by creating your first recipe to begin mixing drinks',
                  )}
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              {searchTerm && (
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => setSearchTerm('')}
                >
                  {t('recipes.clear_search', 'Clear Search')}
                </Button>
              )}
              {!searchTerm && (
                <Button size="lg" onClick={handleAdd}>
                  <PlusCircle className="mr-2" />
                  {t('recipes.add_first', 'Add First Recipe')}
                </Button>
              )}
            </div>
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
                        className="px-2 sm:px-4 py-1.5 sm:py-2"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 bg-card border rounded-lg hover:shadow-md transition-all duration-200 gap-3 sm:gap-0">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 sm:gap-3">
                              <h3 className="font-semibold text-sm sm:text-base truncate">
                                {recipe.name}
                              </h3>
                              {isFavorite && (
                                <Heart className="h-3.5 w-3.5 sm:h-4 sm:w-4 fill-destructive text-destructive flex-shrink-0" />
                              )}
                            </div>
                            {recipe.description && (
                              <p className="text-xs sm:text-sm text-muted-foreground line-clamp-1 mt-1">
                                {recipe.description}
                              </p>
                            )}
                            <div className="flex items-center gap-1.5 sm:gap-2 mt-2 flex-wrap">
                              {ingredientCount > 0 && (
                                <Badge
                                  variant="secondary"
                                  className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5"
                                >
                                  {ingredientCount} ingredient
                                  {ingredientCount !== 1 ? 's' : ''}
                                </Badge>
                              )}
                              {recipe.defaultGlass && (
                                <Badge
                                  variant="outline"
                                  className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5"
                                >
                                  {recipe.defaultGlass.name}
                                </Badge>
                              )}
                            </div>
                          </div>
                          <TooltipProvider>
                            <div className="flex items-center gap-1 sm:gap-2 sm:ml-4 justify-end sm:justify-start">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleToggleFavorite(recipe)}
                                    className="h-9 w-9 sm:h-10 sm:w-10"
                                    aria-label={
                                      isFavorite
                                        ? t(
                                            'recipes.remove_favorite',
                                            'Remove from favorites',
                                          )
                                        : t(
                                            'recipes.add_favorite',
                                            'Add to favorites',
                                          )
                                    }
                                  >
                                    <Heart
                                      className={`h-4 w-4 ${
                                        isFavorite
                                          ? 'fill-destructive text-destructive'
                                          : ''
                                      }`}
                                    />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>
                                    {isFavorite
                                      ? t(
                                          'recipes.remove_favorite',
                                          'Remove from favorites',
                                        )
                                      : t(
                                          'recipes.add_favorite',
                                          'Add to favorites',
                                        )}
                                  </p>
                                </TooltipContent>
                              </Tooltip>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleEdit(recipe)}
                                    className="h-9 w-9 sm:h-10 sm:w-10"
                                    aria-label={t(
                                      'recipes.edit',
                                      'Edit recipe',
                                    )}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>{t('recipes.edit', 'Edit recipe')}</p>
                                </TooltipContent>
                              </Tooltip>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleDelete(recipe.id)}
                                    className="h-9 w-9 sm:h-10 sm:w-10"
                                    aria-label={t(
                                      'recipes.delete',
                                      'Delete recipe',
                                    )}
                                  >
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>{t('recipes.delete', 'Delete recipe')}</p>
                                </TooltipContent>
                              </Tooltip>
                            </div>
                          </TooltipProvider>
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

      {/* Scroll to top button */}
      {showScrollTop && (
        <Button
          onClick={scrollToTop}
          size="icon"
          className="fixed bottom-20 sm:bottom-24 right-3 sm:right-4 z-[100] rounded-full shadow-lg hover:shadow-xl transition-all duration-200 h-11 w-11 sm:h-12 sm:w-12"
          aria-label="Scroll to top"
        >
          <ArrowUp className="w-4 h-4 sm:w-5 sm:h-5" />
        </Button>
      )}
    </div>
  );
};

export default Recipes;
