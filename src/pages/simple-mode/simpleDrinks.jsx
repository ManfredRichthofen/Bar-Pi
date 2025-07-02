import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import {
  Search,
  X,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  ArrowUp,
} from 'lucide-react';
import debounce from 'lodash/debounce';
import { useWindowVirtualizer } from '@tanstack/react-virtual';
import { useInfiniteQuery } from '@tanstack/react-query';

import useAuthStore from '../../store/authStore';
import useFilterStore from '../../store/filterStore';
import RecipeService from '../../services/recipe.service.js';
import CocktailService from '../../services/cocktail.service.js';
import { isAutomatic, filterRecipes } from '../../utils/recipeFilters.js';
import SimpleDrinkCard from '../../components/simple-mode/drinks/simpleDrinkCard';
import SimpleDrinkCardSkeleton from '../../components/simple-mode/drinks/simpleDrinkCardSkeleton';

const SearchForm = React.memo(({ onSubmit, onInput, loading }) => (
  <form onSubmit={onSubmit} className="join w-full">
    <input
      name="search"
      className="input h-10 min-h-[40px] join-item w-full border-2 border-base-300 text-sm bg-base-200 focus:bg-base-100 transition-colors placeholder:text-base-content/50"
      placeholder="Search drinks..."
      onChange={onInput}
    />
    <button
      type="submit"
      className="btn h-10 min-h-[40px] w-10 border-2 border-base-300 bg-base-200 hover:bg-base-300 join-item border-l-1 transition-colors px-0"
    >
      {loading ? (
        <span className="loading loading-spinner loading-sm"></span>
      ) : (
        <Search className="w-4 h-4" />
      )}
    </button>
  </form>
));

const FilterButtons = React.memo(({ filters, onFilterChange }) => (
  <div className="flex flex-col gap-2">
    <div className="flex flex-wrap gap-2">
      <button
        className={`btn btn-sm ${filters.automatic ? 'btn-primary' : 'btn-outline'} transition-colors`}
        onClick={() => onFilterChange('automatic')}
        title="Show drinks that can be made automatically"
      >
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-primary"></span>
          Automatic
        </span>
      </button>
      <button
        className={`btn btn-sm ${filters.manual ? 'btn-primary' : 'btn-outline'} transition-colors`}
        onClick={() => onFilterChange('manual')}
        title="Show drinks that require manual preparation"
      >
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-primary"></span>
          Manual
        </span>
      </button>
      <button
        className={`btn btn-sm ${filters.fabricable ? 'btn-primary' : 'btn-outline'} transition-colors`}
        onClick={() => onFilterChange('fabricable')}
        title="Show only drinks that can be made right now"
      >
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-primary"></span>
          Available
        </span>
      </button>
    </div>
    {(filters.automatic || filters.manual || filters.fabricable) && (
      <button
        className="btn btn-ghost btn-sm text-error hover:bg-error/10 transition-colors"
        onClick={() => onFilterChange('clear')}
      >
        Clear Filters
      </button>
    )}
  </div>
));

const ErrorMessage = React.memo(({ error, onDismiss }) => (
  <div className="alert alert-error mb-2 text-sm">
    <AlertCircle className="w-4 h-4" />
    <span>{error}</span>
    <button
      className="btn btn-ghost btn-sm p-0 hover:bg-error/10"
      onClick={onDismiss}
    >
      <X className="w-4 h-4" />
    </button>
  </div>
));

function VirtualGrid({
  fabricableRecipes,
  onCardClick,
  token,
  searchTerm,
  filters,
  onCheckFabricability,
  onFilterRecipes,
}) {
  const listRef = React.useRef(null);
  const [itemsPerRow, setItemsPerRow] = React.useState(4);
  const rowHeight = 160;

  // Responsive grid columns
  React.useEffect(() => {
    const updateGridColumns = () => {
      const width = window.innerWidth;
      if (width < 640) { // sm breakpoint
        setItemsPerRow(2);
      } else if (width < 768) { // md breakpoint
        setItemsPerRow(3);
      } else if (width < 1024) { // lg breakpoint
        setItemsPerRow(4);
      } else if (width < 1280) { // xl breakpoint
        setItemsPerRow(5);
      } else { // 2xl and above
        setItemsPerRow(6);
      }
    };

    updateGridColumns();
    window.addEventListener('resize', updateGridColumns);
    return () => window.removeEventListener('resize', updateGridColumns);
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
    queryKey: ['recipes', searchTerm, filters],
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

      if (response.content) {
        // Only check fabricability for new recipes
        const newRecipes = response.content.filter(
          (recipe) => !fabricableRecipes.has(recipe.id),
        );
        if (newRecipes.length > 0) {
          await onCheckFabricability(newRecipes);
        }
        response.content = onFilterRecipes(
          response.content,
          filters,
          fabricableRecipes,
        );
      }

      return {
        content: response.content,
        last: response.last,
        nextOffset: pageParam + 1,
      };
    },
    getNextPageParam: (lastGroup) =>
      lastGroup.last ? undefined : lastGroup.nextOffset,
    initialPageParam: 0,
    staleTime: 30000, // Consider data fresh for 30 seconds
    gcTime: 5 * 60 * 1000, // Keep unused data in cache for 5 minutes
    refetchOnWindowFocus: false, // Don't refetch when window regains focus
    refetchOnMount: false, // Don't refetch when component mounts
    retry: 2, // Retry failed requests twice
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
    select: (data) => ({
      pages: data.pages,
      pageParams: data.pageParams,
    }),
  });

  const allRecipes = data ? data.pages.flatMap((d) => d.content) : [];
  const rowCount = Math.ceil(allRecipes.length / itemsPerRow);
  const totalRowCount = rowCount;

  const virtualizer = useWindowVirtualizer({
    count: totalRowCount,
    estimateSize: () => rowHeight,
    overscan: 5,
    scrollMargin: 0,
  });

  // Prefetch next page when we're close to the end
  useEffect(() => {
    const [lastItem] = [...virtualizer.getVirtualItems()].reverse();
    if (!lastItem) return;

    if (lastItem.index >= rowCount - 5 && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [
    hasNextPage,
    fetchNextPage,
    rowCount,
    isFetchingNextPage,
    virtualizer.getVirtualItems(),
  ]);

  // Optimize scroll handler with debounce
  useEffect(() => {
    const handleScroll = debounce(() => {
      const { scrollTop, scrollHeight, clientHeight } =
        document.documentElement;
      const remainingScroll = scrollHeight - scrollTop - clientHeight;
      const scrollThreshold = 1000;

      if (
        remainingScroll < scrollThreshold &&
        hasNextPage &&
        !isFetchingNextPage
      ) {
        fetchNextPage();
      }
    }, 100);

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      handleScroll.cancel();
    };
  }, [hasNextPage, fetchNextPage, isFetchingNextPage]);

  if (status === 'pending') {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 sm:gap-3">
          {[...Array(12)].map((_, index) => (
            <SimpleDrinkCardSkeleton key={`skeleton-${Date.now()}-${index}`} />
          ))}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 sm:gap-3">
          {[...Array(12)].map((_, index) => (
            <SimpleDrinkCardSkeleton
              key={`skeleton-${Date.now()}-${index + 12}`}
            />
          ))}
        </div>
        <div className="flex items-center justify-center py-4">
          <div className="flex items-center gap-2">
            <span className="loading loading-spinner loading-sm"></span>
            <span className="text-sm text-base-content/60">
              Loading drinks...
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return <div className="text-error text-sm p-4">Error: {error.message}</div>;
  }

  return (
    <div ref={listRef} className="px-3 py-2 relative">
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map((virtualRow) => {
          const rowIndex = virtualRow.index;
          const rowRecipes = allRecipes.slice(
            rowIndex * itemsPerRow,
            rowIndex * itemsPerRow + itemsPerRow,
          );

          return (
            <div
              key={virtualRow.key}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${virtualRow.start}px)`,
                height: `${virtualRow.size}px`,
              }}
            >
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-1.5 sm:gap-2 h-full">
                {rowRecipes.map((recipe) => (
                  <div
                    key={recipe.id}
                    className="flex items-center justify-center"
                  >
                    <SimpleDrinkCard
                      recipe={recipe}
                      isFabricable={fabricableRecipes.has(recipe.id)}
                      onCardClick={onCardClick}
                    />
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
      {isFetchingNextPage && hasNextPage && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 sm:gap-3 mt-2">
          {[...Array(4)].map((_, index) => (
            <SimpleDrinkCardSkeleton key={`skeleton-${Date.now()}-${index}`} />
          ))}
        </div>
      )}
      {!hasNextPage && !isFetching && (
        <div className="flex items-center justify-center py-4">
          <p className="text-center text-base-content/60 text-xs">
            {allRecipes.length === 0
              ? 'No drinks found'
              : 'No more drinks to load'}
          </p>
        </div>
      )}
    </div>
  );
}

function SimpleDrinks() {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [error, setError] = useState(null);
  const { filters, updateFilter, clearFilters } = useFilterStore();
  const [fabricableRecipes, setFabricableRecipes] = useState(new Set());

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const sidebarRef = useRef(null);
  const navigate = useNavigate();
  const token = useAuthStore((state) => state.token);
  const [showScrollTop, setShowScrollTop] = useState(false);

  const handleFilterChange = useCallback(
    (filterName) => {
      setSearchLoading(true);
      if (filterName === 'clear') {
        clearFilters();
      } else {
        updateFilter(filterName, !filters[filterName]);
      }
    },
    [filters, clearFilters, updateFilter],
  );

  const checkFabricability = useCallback(
    async (recipes) => {
      if (!token) return; // Skip if no token

      const fabricableSet = new Set(fabricableRecipes);
      const batchSize = 50; // Increased batch size for faster processing

      for (let i = 0; i < recipes.length; i += batchSize) {
        const batch = recipes.slice(i, i + batchSize);
        const results = await Promise.allSettled(
          batch.map(async (recipe) => {
            try {
              const orderConfig = {
                amountOrderedInMl: recipe.defaultGlass?.sizeInMl || 250,
                customisations: {
                  boost: 100,
                  additionalIngredients: [],
                },
                productionStepReplacements: [],
                ingredientGroupReplacements: [],
                useAutomaticIngredients: true,
                skipMissingIngredients: false,
                allowManualIngredients: true,
                allowAutomaticIngredients: true,
                checkMissingIngredients: true,
              };

              const result = await CocktailService.checkFeasibility(
                recipe.id,
                orderConfig,
                false,
                token,
              );

              // Check for missing ingredients and ensure automatic ingredients are on pumps
              const hasMissingIngredients = result?.requiredIngredients?.some(
                (item) => item.amountMissing > 0,
              );

              const hasUnpumpedAutomaticIngredients =
                result?.requiredIngredients?.some(
                  (item) =>
                    item.ingredient.type === 'automated' &&
                    !item.ingredient.onPump,
                );

              return {
                id: recipe.id,
                feasible:
                  result?.feasible &&
                  !hasMissingIngredients &&
                  !hasUnpumpedAutomaticIngredients,
              };
            } catch (err) {
              if (err.response?.status === 401) {
                navigate('/login');
                return { id: recipe.id, feasible: false };
              }
              console.error(
                `Error checking fabricability for recipe ${recipe.id}:`,
                err,
              );
              return { id: recipe.id, feasible: false };
            }
          }),
        );

        // Process results in bulk
        results.forEach((result) => {
          if (result.status === 'fulfilled' && result.value.feasible) {
            fabricableSet.add(result.value.id);
          }
        });

        // Update fabricable recipes after each batch
        setFabricableRecipes(new Set(fabricableSet));
      }
    },
    [token, fabricableRecipes, navigate],
  );

  // Memoize the filter function to prevent unnecessary recalculations
  const filterRecipesMemo = useCallback(
    (recipes) => {
      if (!recipes?.length) return [];

      // Early return if no filters are active
      if (!filters.automatic && !filters.manual && !filters.fabricable) {
        return recipes;
      }

      return filterRecipes(recipes, filters, fabricableRecipes);
    },
    [filters, fabricableRecipes],
  );

  const {
    status,
    data,
    error: queryError,
    isFetching,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
  } = useInfiniteQuery({
    queryKey: ['recipes', searchTerm],
    queryFn: async ({ pageParam = 0 }) => {
      // Check if token is available
      if (!token) {
        throw new Error('No authentication token available');
      }

      try {
        const response = await RecipeService.getRecipes(
          pageParam,
          null, // onlyOwnRecipes
          null, // collectionId
          null, // fabricable - we'll handle this client-side
          null, // containsIngredients
          searchTerm,
          null, // categoryId
          null, // orderBy
          token,
        );

        if (response.content) {
          // Only check fabricability for new recipes
          const newRecipes = response.content.filter(
            (recipe) => !fabricableRecipes.has(recipe.id),
          );
          if (newRecipes.length > 0) {
            await checkFabricability(newRecipes);
          }

          // Apply filters client-side
          response.content = filterRecipesMemo(response.content);
        }

        return {
          content: response.content,
          last: response.last,
          nextOffset: pageParam + 1,
        };
      } catch (error) {
        // If unauthorized, redirect to login
        if (error.response?.status === 401) {
          navigate('/login');
          throw new Error('Session expired. Please login again.');
        }
        throw error;
      }
    },
    getNextPageParam: (lastGroup) =>
      lastGroup.last ? undefined : lastGroup.nextOffset,
    initialPageParam: 0,
    staleTime: 30000,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: 2, // Retry failed requests twice
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
  });

  // Update recipes when filters change
  useEffect(() => {
    setSearchLoading(true);
    // Apply filters to existing data instead of refetching
    if (data?.pages) {
      data.pages = data.pages.map((page) => ({
        ...page,
        content: filterRecipesMemo(page.content),
      }));
    }
    // Reduced timeout for better responsiveness
    setTimeout(() => {
      setSearchLoading(false);
    }, 100);
  }, [filters, filterRecipesMemo, data?.pages]);

  const getOrderConfig = useCallback(
    (recipe) => ({
      amountOrderedInMl: recipe.defaultGlass?.sizeInMl || 250,
      customisations: {
        boost: 100,
        additionalIngredients: [],
      },
      productionStepReplacements: [],
      ingredientGroupReplacements: [],
      useAutomaticIngredients: true,
      skipMissingIngredients: false,
    }),
    [],
  );

  const debouncedSearch = useCallback(
    debounce((value) => {
      setSearchTerm(value);
    }, 500), // Increased debounce time to reduce API calls
    [],
  );

  const handleSearch = (e) => {
    e.preventDefault();
    const value = e.target.search.value;
    debouncedSearch(value);
  };

  const handleSearchInput = (e) => {
    debouncedSearch(e.target.value);
  };

  const handleCardClick = (recipe) => {
    navigate('/simple/drink/' + recipe.id, { state: { recipe } });
  };

  // Handle click outside to close sidebar
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        sidebarRef.current &&
        !sidebarRef.current.contains(event.target) &&
        isSidebarOpen
      ) {
        setIsSidebarOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isSidebarOpen]);

  // Handle scroll to show/hide scroll top button
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      setShowScrollTop(scrollTop > 300); // Show button after 300px scroll
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = useCallback(() => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }, []);

  if (!token) {
    return <Navigate to="/login" />;
  }

  return (
    <div className="min-h-screen pb-20">
      {/* Backdrop blur when sidebar is open */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-10 md:hidden transition-opacity duration-300"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <button
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className="fixed left-0 top-1/2 -translate-y-1/2 z-20 bg-base-200 border border-base-300 rounded-r-lg p-2 shadow-lg hover:bg-base-300 transition-all duration-200 md:hidden"
      >
        {isSidebarOpen ? (
          <ChevronLeft className="w-5 h-5" />
        ) : (
          <ChevronRight className="w-5 h-5" />
        )}
      </button>

      <div
        ref={sidebarRef}
        className={`md:hidden fixed left-0 top-0 h-screen bg-base-200 border-r border-base-300 transition-all duration-300 ease-in-out z-30 shadow-lg ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{ width: '16rem' }}
      >
        <div className="p-4 flex flex-col gap-4 h-full">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">Filters</h2>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="btn btn-ghost btn-sm p-1 hover:bg-base-300"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-4">
            <SearchForm
              onSubmit={handleSearch}
              onInput={handleSearchInput}
              loading={searchLoading}
            />
            <FilterButtons
              filters={filters}
              onFilterChange={handleFilterChange}
            />
            {error && (
              <ErrorMessage error={error} onDismiss={() => setError(null)} />
            )}
          </div>
        </div>
      </div>

      <div
        className={`md:ml-0 transition-all duration-300 ${isSidebarOpen ? 'ml-16' : 'ml-0'}`}
      >
        <div className="md:block hidden p-4 border-b border-base-300 sticky top-0 bg-base-100 z-10 shadow-sm">
          <div className="max-w-2xl mx-auto space-y-4">
            <h2 className="text-sm font-semibold text-center">
              Available Drinks
            </h2>
            <SearchForm
              onSubmit={handleSearch}
              onInput={handleSearchInput}
              loading={searchLoading}
            />
            <FilterButtons
              filters={filters}
              onFilterChange={handleFilterChange}
            />
            {error && (
              <ErrorMessage error={error} onDismiss={() => setError(null)} />
            )}
          </div>
        </div>

        <div className="md:hidden p-4 sticky top-0 bg-base-100 z-10 shadow-sm">
          <h2 className="text-sm font-semibold text-center">
            Available Drinks
          </h2>
        </div>

        <VirtualGrid
          fabricableRecipes={fabricableRecipes}
          onCardClick={handleCardClick}
          token={token}
          searchTerm={searchTerm}
          filters={filters}
          onCheckFabricability={checkFabricability}
          onFilterRecipes={filterRecipesMemo}
        />
      </div>



      {/* Scroll to top button */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-24 right-4 z-[100] btn btn-circle btn-primary shadow-lg hover:shadow-xl transition-all duration-200"
          aria-label="Scroll to top"
        >
          <ArrowUp className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}

export default React.memo(SimpleDrinks);
