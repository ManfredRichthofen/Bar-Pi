import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { Navigate, useNavigate } from '@tanstack/react-router';
import {
  Edit,
  Heart,
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
import SearchInput from '@/components/ui/search-input.jsx';
import {
  PageHeader,
  EmptyState,
  ListCard,
  ActionButtons,
  ScrollToTopButton,
  LoadingState,
  VirtualizedList,
} from '@/components/AdvancedMode';
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

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const lastY = lastScrollYRef.current;

      if (currentScrollY > lastY && currentScrollY > 100) {
        setIsHeaderVisible(false);
      } else {
        setIsHeaderVisible(true);
      }

      lastScrollYRef.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const favoriteIds = useMemo(
    () => new Set((favorites || []).map((fav) => fav.id)),
    [favorites],
  );

  if (!token) {
    return <Navigate to="/login" />;
  }

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        title="Recipes"
        isVisible={isHeaderVisible}
        action={
          <Button
            onClick={handleAdd}
            className="w-full sm:w-auto"
            size="default"
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Recipe
          </Button>
        }
        searchComponent={
          <>
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
          </>
        }
      />

      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 md:py-8">
        {status === 'pending' ? (
          <LoadingState />
        ) : status === 'error' ? (
          <EmptyState
            title="Error Loading Recipes"
            description={error?.message || 'Failed to load recipes'}
            variant="error"
          />
        ) : allRecipes.length === 0 ? (
          <EmptyState
            title={
              searchTerm
                ? t('recipes.no_results', 'No Recipes Found')
                : t('recipes.empty_title', 'No Recipes Found')
            }
            description={
              searchTerm
                ? t(
                    'recipes.no_results_message',
                    `No recipes found matching "{{searchTerm}}"`,
                    { searchTerm },
                  )
                : t(
                    'recipes.empty_message',
                    'Get started by creating your first recipe to begin mixing drinks',
                  )
            }
            variant={searchTerm ? 'search' : 'info'}
            actions={
              <>
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
              </>
            }
          />
        ) : (
          <div className="space-y-2">
            <VirtualizedList
              items={allRecipes}
              estimatedSize={120}
              renderItem={(recipe) => {
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
                  <div className="px-2 sm:px-4 py-1.5 sm:py-2">
                    <ListCard
                      title={recipe.name}
                      description={recipe.description}
                      badges={
                        isFavorite && (
                          <Heart className="h-3.5 w-3.5 sm:h-4 sm:w-4 fill-destructive text-destructive flex-shrink-0" />
                        )
                      }
                      metadata={
                        <>
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
                        </>
                      }
                      actions={
                        <ActionButtons
                          actions={[
                            {
                              icon: (
                                <Heart
                                  className={`h-4 w-4 ${
                                    isFavorite
                                      ? 'fill-destructive text-destructive'
                                      : ''
                                  }`}
                                />
                              ),
                              label: isFavorite
                                ? t(
                                    'recipes.remove_favorite',
                                    'Remove from favorites',
                                  )
                                : t(
                                    'recipes.add_favorite',
                                    'Add to favorites',
                                  ),
                              onClick: (e) => {
                                e.stopPropagation();
                                handleToggleFavorite(recipe);
                              },
                            },
                            {
                              icon: <Edit className="h-4 w-4" />,
                              label: t('recipes.edit', 'Edit recipe'),
                              onClick: (e) => {
                                e.stopPropagation();
                                handleEdit(recipe);
                              },
                            },
                            {
                              icon: <Trash2 className="h-4 w-4 text-destructive" />,
                              label: t('recipes.delete', 'Delete recipe'),
                              onClick: (e) => {
                                e.stopPropagation();
                                handleDelete(recipe.id);
                              },
                            },
                          ]}
                        />
                      }
                    />
                  </div>
                );
              }}
            />

            {isFetchingNextPage && hasNextPage && (
              <LoadingState className="py-4" />
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

      <ScrollToTopButton />
    </div>
  );
};

export default Recipes;
