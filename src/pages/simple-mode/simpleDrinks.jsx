import React, { useState, useEffect, useCallback } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Search, X, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import debounce from 'lodash/debounce';
import { useWindowVirtualizer } from '@tanstack/react-virtual';
import { useInfiniteQuery } from '@tanstack/react-query';

import useAuthStore from '../../store/authStore';
import RecipeService from '../../services/recipe.service.js';
import CocktailService from '../../services/cocktail.service.js';
import { isAutomatic, filterRecipes } from '../../utils/recipeFilters.js';
import SimpleDrinkCard from '../../components/simple-mode/drinks/simpleDrinkCard';
import SimpleDrinkCardSkeleton from '../../components/simple-mode/drinks/simpleDrinkCardSkeleton';
import SimpleDrinkModal from '../../components/simple-mode/drinks/simpleDrinkModal';

const SearchForm = React.memo(({ onSubmit, onInput, loading }) => (
  <form onSubmit={onSubmit} className="join w-full">
    <input
      name="search"
      className="input h-8 min-h-[32px] join-item w-full border-2 border-accent-content border-r-0 text-xs"
      placeholder="Search drinks..."
      onChange={onInput}
      disabled={loading}
    />
    <button
      type="submit"
      className="btn h-8 min-h-[32px] w-8 border-2 border-accent-content bg-base-100 join-item border-l-1 hover:bg-base-200 px-0"
      disabled={loading}
    >
      {loading ? (
        <span className="loading loading-spinner loading-xs"></span>
      ) : (
        <Search className="w-3 h-3" />
      )}
    </button>
  </form>
));

const FilterButtons = React.memo(({ filters, onFilterChange }) => (
  <div className="flex flex-col gap-1">
    <div className="flex flex-wrap gap-1">
      <button
        className={`btn btn-xs ${filters.automatic ? 'btn-primary' : 'btn-outline'}`}
        onClick={() => onFilterChange('automatic')}
        title="Show drinks that can be made automatically"
      >
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-primary"></span>
          Automatic
        </span>
      </button>
      <button
        className={`btn btn-xs ${filters.manual ? 'btn-primary' : 'btn-outline'}`}
        onClick={() => onFilterChange('manual')}
        title="Show drinks that require manual preparation"
      >
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-primary"></span>
          Manual
        </span>
      </button>
      <button
        className={`btn btn-xs ${filters.fabricable ? 'btn-primary' : 'btn-outline'}`}
        onClick={() => onFilterChange('fabricable')}
        title="Show only drinks that can be made right now"
      >
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-primary"></span>
          Available
        </span>
      </button>
    </div>
    {(filters.automatic || filters.manual || filters.fabricable) && (
      <button
        className="btn btn-ghost btn-xs text-error"
        onClick={() => onFilterChange('clear')}
      >
        Clear Filters
      </button>
    )}
  </div>
));

const ErrorMessage = React.memo(({ error, onDismiss }) => (
  <div className="alert alert-error mb-2 text-xs">
    <AlertCircle className="w-4 h-4" />
    <span>{error}</span>
    <button className="btn btn-ghost btn-xs" onClick={onDismiss}>
      <X className="w-3 h-3" />
    </button>
  </div>
));

function VirtualGrid({ fabricableRecipes, onCardClick, token, searchTerm, filters, onCheckFabricability, onFilterRecipes }) {
  const listRef = React.useRef(null);
  const itemsPerRow = 4;
  const rowHeight = 160;

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
        token
      );

      if (response.content) {
        await onCheckFabricability(response.content);
        response.content = onFilterRecipes(response.content, filters, fabricableRecipes);
      }

      return {
        content: response.content,
        last: response.last,
        nextOffset: pageParam + 1
      };
    },
    getNextPageParam: (lastGroup) => lastGroup.last ? undefined : lastGroup.nextOffset,
    initialPageParam: 0,
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

  useEffect(() => {
    const [lastItem] = [...virtualizer.getVirtualItems()].reverse();
    if (!lastItem) return;

    if (lastItem.index >= rowCount - 3 && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, fetchNextPage, rowCount, isFetchingNextPage, virtualizer.getVirtualItems()]);

  useEffect(() => {
    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
      const remainingScroll = scrollHeight - scrollTop - clientHeight;
      const scrollThreshold = 1000;

      if (remainingScroll < scrollThreshold && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [hasNextPage, fetchNextPage, isFetchingNextPage]);

  if (status === 'pending') {
    return (
      <div className="grid grid-cols-4 gap-1 sm:gap-2 mt-2">
        {[...Array(4)].map((_, index) => (
          <SimpleDrinkCardSkeleton key={`skeleton-${Date.now()}-${index}`} />
        ))}
      </div>
    );
  }

  if (status === 'error') {
    return <div className="text-error text-sm p-4">Error: {error.message}</div>;
  }

  return (
    <div ref={listRef} className="px-2 py-1 relative">
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
            rowIndex * itemsPerRow + itemsPerRow
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
              <div className="grid grid-cols-4 gap-1 sm:gap-2 h-full">
                {rowRecipes.map((recipe) => (
                  <div key={recipe.id} className="flex items-center justify-center">
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
        <div className="grid grid-cols-4 gap-1 sm:gap-2 mt-2">
          {[...Array(4)].map((_, index) => (
            <SimpleDrinkCardSkeleton key={`skeleton-${Date.now()}-${index}`} />
          ))}
        </div>
      )}
      {!hasNextPage && !isFetching && (
        <div className="flex items-center justify-center py-4">
          <p className="text-center text-base-content/60 text-xs">
            {allRecipes.length === 0 ? 'No drinks found' : "No more drinks to load"}
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
  const [filters, setFilters] = useState({
    automatic: false,
    manual: false,
    fabricable: false,
  });
  const [fabricableRecipes, setFabricableRecipes] = useState(new Set());
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const token = useAuthStore((state) => state.token);

  const {
    status,
    data,
    error: queryError,
    isFetching,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
  } = useInfiniteQuery({
    queryKey: ['recipes', searchTerm, filters],
    queryFn: async ({ pageParam = 0 }) => {
      const response = await RecipeService.getRecipes(
        pageParam,
        null, // onlyOwnRecipes
        null, // collectionId
        filters.fabricable ? true : null, // fabricable
        null, // containsIngredients
        searchTerm,
        null, // categoryId
        null  // orderBy
      );

      if (response.content) {
        // Check fabricability for new recipes
        await checkFabricability(response.content);
        
        // Filter recipes using the service
        response.content = filterRecipes(response.content, filters, fabricableRecipes);
      }

      return {
        content: response.content,
        last: response.last,
        nextOffset: pageParam + 1
      };
    },
    getNextPageParam: (lastGroup) => lastGroup.last ? undefined : lastGroup.nextOffset,
    initialPageParam: 0,
  });

  // Update recipes when filters change
  useEffect(() => {
    setSearchLoading(true);
    // The query will automatically refetch due to the queryKey including filters
    setTimeout(() => {
      setSearchLoading(false);
    }, 500);
  }, [filters]);

  const handleFilterChange = (filterName) => {
    setSearchLoading(true);
    if (filterName === 'clear') {
      setFilters({
        automatic: false,
        manual: false,
        fabricable: false,
      });
    } else {
      setFilters((prev) => ({
        ...prev,
        [filterName]: !prev[filterName],
      }));
    }
  };

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

  const checkFabricability = useCallback(
    async (recipes) => {
      const fabricableSet = new Set();
      const batchSize = 5;
      for (let i = 0; i < recipes.length; i += batchSize) {
        const batch = recipes.slice(i, i + batchSize);
        await Promise.all(
          batch.map(async (recipe) => {
            try {
              // Check if recipe can be made with any available ingredients
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
                // Allow both automatic and manual ingredients
                allowManualIngredients: true,
                allowAutomaticIngredients: true
              };

              const result = await CocktailService.checkFeasibility(
                recipe.id,
                orderConfig,
                false,
                token,
              );

              if (result?.feasible) {
                fabricableSet.add(recipe.id);
              }
            } catch (err) {
              console.error(
                `Error checking fabricability for recipe ${recipe.id}:`,
                err,
              );
            }
          }),
        );
      }
      setFabricableRecipes(fabricableSet);
    },
    [token],
  );

  const debouncedSearch = useCallback(
    debounce((value) => {
      setSearchTerm(value);
    }, 300),
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
    setSelectedRecipe(recipe);
  };

  const handleModalClose = () => {
    setSelectedRecipe(null);
  };

  const handleMakeDrink = () => {
    navigate('/simple/order', { state: { recipe: selectedRecipe } });
    handleModalClose();
  };

  if (!token) {
    return <Navigate to="/login" />;
  }

  return (
    <div className="min-h-screen">
      <button
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className="fixed left-0 top-1/2 -translate-y-1/2 z-10 bg-base-200 border border-base-300 rounded-r-lg p-1 shadow-sm hover:bg-base-300 transition-colors md:hidden"
      >
        {isSidebarOpen ? (
          <ChevronLeft className="w-4 h-4" />
        ) : (
          <ChevronRight className="w-4 h-4" />
        )}
      </button>

      <div
        className={`md:hidden fixed left-0 top-0 h-screen bg-base-200 border-r border-base-300 transition-transform duration-200 ease-in-out z-20 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{ width: '8rem' }}
      >
        <div className="p-2 flex flex-col gap-2 h-full">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold">Filters</h2>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="btn btn-ghost btn-xs p-0"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
          <SearchForm
            onSubmit={handleSearch}
            onInput={handleSearchInput}
            loading={searchLoading}
          />
          <FilterButtons
            filters={filters}
            onFilterChange={handleFilterChange}
          />
          {error && <ErrorMessage error={error} onDismiss={() => setError(null)} />}
        </div>
      </div>

      <div className="md:ml-0 ml-8">
        <div className="md:block hidden p-2 border-b border-base-300 sticky top-0 bg-base-100 z-10">
          <div className="max-w-2xl mx-auto space-y-2">
            <h2 className="text-xs font-bold text-center">Available Drinks</h2>
            <SearchForm
              onSubmit={handleSearch}
              onInput={handleSearchInput}
              loading={searchLoading}
            />
            <FilterButtons
              filters={filters}
              onFilterChange={handleFilterChange}
            />
            {error && <ErrorMessage error={error} onDismiss={() => setError(null)} />}
          </div>
        </div>

        <div className="md:hidden p-2 sticky top-0 bg-base-100 z-10">
          <h2 className="text-xs font-bold text-center">Available Drinks</h2>
        </div>

        <VirtualGrid
          fabricableRecipes={fabricableRecipes}
          onCardClick={handleCardClick}
          token={token}
          searchTerm={searchTerm}
          filters={filters}
          onCheckFabricability={checkFabricability}
          onFilterRecipes={filterRecipes}
        />
      </div>

      {selectedRecipe && (
        <SimpleDrinkModal
          recipe={selectedRecipe}
          isOpen={true}
          onClose={handleModalClose}
          onMakeDrink={handleMakeDrink}
        />
      )}
    </div>
  );
}

export default React.memo(SimpleDrinks);

