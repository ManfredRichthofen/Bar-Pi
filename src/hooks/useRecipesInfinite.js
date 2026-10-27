import { useInfiniteQuery } from '@tanstack/react-query';
import RecipeService from '../services/recipe.service.js';
import useFavoritesStore from '../store/favoritesStore';

/** Stable query key for paginated recipe browsing across modes. */
export function recipesInfiniteQueryKey({
  searchTerm = '',
  filters = {},
  mode = 'default',
  extraKey,
} = {}) {
  return ['recipes', mode, searchTerm, filters, extraKey].filter(
    (part) => part !== undefined,
  );
}

/** Shared infinite recipes query for Advanced and Simple drinks browsers. */
export function useRecipesInfinite({
  token,
  searchTerm,
  filters,
  fabricableRecipes,
  onCheckFabricability,
  onFilterRecipes,
  mode = 'default',
  extraKey,
  enabled = true,
}) {
  const favorites = useFavoritesStore((state) => state.favorites);
  // Only key on favorites while that filter is active so other queries stay cached.
  const favoriteIds = filters?.favorited
    ? favorites.map((fav) => fav.id)
    : null;

  return useInfiniteQuery({
    queryKey: recipesInfiniteQueryKey({
      searchTerm,
      filters,
      mode,
      extraKey: [extraKey, favoriteIds],
    }),
    queryFn: async ({ pageParam = 0 }) => {
      const response = await RecipeService.getRecipes(
        pageParam,
        null, // ownerId
        filters?.collectionId ?? null, // inCollection
        null, // fabricable
        null, // containsIngredients
        searchTerm, // searchName
        null, // inCategoryId
        null, // orderBy
        token,
        false, // includeImage - load images lazily instead
      );

      if (response.content) {
        const newRecipes = response.content.filter(
          (recipe) => !fabricableRecipes.has(recipe.id),
        );
        let fabricable = fabricableRecipes;
        if (newRecipes.length > 0 && onCheckFabricability) {
          fabricable = (await onCheckFabricability(newRecipes)) ?? fabricable;
        }
        if (onFilterRecipes) {
          response.content = onFilterRecipes(
            response.content,
            filters,
            fabricable,
            new Set(favoriteIds ?? []),
          );
        }
      }

      return {
        content: response.content || [],
        last: response.last,
        nextOffset: pageParam + 1,
      };
    },
    getNextPageParam: (lastGroup) =>
      lastGroup.last ? undefined : lastGroup.nextOffset,
    initialPageParam: 0,
    enabled: enabled && !!token,
    staleTime: 30000,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    select: (data) => ({
      pages: data.pages,
      pageParams: data.pageParams,
    }),
  });
}

export default useRecipesInfinite;
