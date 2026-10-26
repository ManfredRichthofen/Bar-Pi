import { useInfiniteQuery } from '@tanstack/react-query';
import RecipeService from '../services/recipe.service.js';

/**
 * Stable query key for paginated recipe browsing.
 * Includes search, filters, and optional mode-specific deps so Advanced/Simple
 * (and future variants) do not collide when behavior diverges.
 */
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

/**
 * Shared infinite recipes query used by Advanced and Simple drinks browsers.
 *
 * Fabricability + client-side filtering run inside the pageFn so each page of
 * results is checked/filtered before it lands in the virtualizer.
 */
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
  return useInfiniteQuery({
    queryKey: recipesInfiniteQueryKey({
      searchTerm,
      filters,
      mode,
      extraKey,
    }),
    queryFn: async ({ pageParam = 0 }) => {
      const response = await RecipeService.getRecipes(
        pageParam,
        null, // ownerId
        null, // inCollection
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
        if (newRecipes.length > 0 && onCheckFabricability) {
          await onCheckFabricability(newRecipes);
        }
        if (onFilterRecipes) {
          response.content = onFilterRecipes(
            response.content,
            filters,
            fabricableRecipes,
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
