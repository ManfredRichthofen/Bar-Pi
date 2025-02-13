import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Navigate } from 'react-router-dom';
import { Search, SlidersHorizontal, X, AlertCircle } from 'lucide-react';
import debounce from 'lodash/debounce';
import { Virtuoso } from 'react-virtuoso';

import useAuthStore from '../../store/authStore';
import RecipeService from '../../services/recipe.service.js';
import CocktailService from '../../services/cocktail.service.js';
import SimpleDrinkCard from '../../components/simple-mode/drinks/simpleDrinkCard';
import SimpleDrinkCardSkeleton from '../../components/simple-mode/drinks/simpleDrinkCardSkeleton';

function SimpleDrinks() {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    automatic: false,
    manual: false,
    fabricable: false,
  });
  const [fabricableRecipes, setFabricableRecipes] = useState(new Set());
  const [isPreloading, setIsPreloading] = useState(false);

  const token = useAuthStore((state) => state.token);

  const getOrderConfig = useCallback((recipe) => ({
    amountOrderedInMl: recipe.defaultGlass?.sizeInMl || 250,
    customisations: {
      boost: 100,
      additionalIngredients: [],
    },
    productionStepReplacements: [],
    ingredientGroupReplacements: [],
    useAutomaticIngredients: true,
    skipMissingIngredients: false,
  }), []);

  const checkFabricability = useCallback(async (recipes) => {
    const fabricableSet = new Set();
    
    // Process in batches of 5 to avoid overwhelming the server
    const batchSize = 5;
    for (let i = 0; i < recipes.length; i += batchSize) {
      const batch = recipes.slice(i, i + batchSize);
      await Promise.all(
        batch.map(async (recipe) => {
          try {
            const orderConfig = getOrderConfig(recipe);
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
  }, [token, getOrderConfig]);

  const isFullyAutomatic = useCallback((recipe) => {
    if (!recipe.ingredients) {
      return false;
    }
    return recipe.ingredients.every(ingredient => ingredient.onPump);
  }, []);

  const filterRecipes = useCallback((recipes, filters, fabricableRecipes) => {
    let filteredContent = recipes;

    if (filters.automatic || filters.manual) {
      filteredContent = filteredContent.filter((recipe) => {
        const isAutomatic = isFullyAutomatic(recipe);
        return (filters.automatic && isAutomatic) || (filters.manual && !isAutomatic);
      });
    }

    if (filters.fabricable) {
      filteredContent = filteredContent.filter((recipe) => fabricableRecipes.has(recipe.id));
    }

    return filteredContent;
  }, [isFullyAutomatic]);

  const fetchRecipes = useCallback(async (pageNumber, search = '') => {
    if (!token) return;

    const loadingState = pageNumber === 0 ? setSearchLoading : setLoading;
    loadingState(true);
    setError(null);

    try {
      const response = await RecipeService.getRecipes(
        pageNumber,
        null,
        null,
        null,
        null,
        search,
        null,
        null,
        token
      );

      if (response && response.content) {
        try {
          await checkFabricability(response.content);
        } catch (err) {
          console.error('Error checking fabricability:', err);
        }

        const filteredContent = filterRecipes(response.content, filters, fabricableRecipes);

        if (pageNumber === 0) {
          setRecipes(filteredContent);
        } else {
          setRecipes((prevRecipes) => {
            const uniqueRecipes = new Map([
              ...prevRecipes.map(recipe => [recipe.id, recipe]),
              ...filteredContent.map(recipe => [recipe.id, recipe])
            ]);
            return Array.from(uniqueRecipes.values());
          });
        }

        setHasMore(filters.fabricable 
          ? !response.last && filteredContent.some(recipe => fabricableRecipes.has(recipe.id))
          : !response.last
        );
      } else {
        setError('Invalid response format from server');
      }
    } catch (err) {
      console.error('Error fetching recipes:', err);
      setError(err.message || 'Failed to fetch recipes. Please try again.');
    } finally {
      loadingState(false);
    }
  }, [token, filters, fabricableRecipes, checkFabricability, filterRecipes]);

  const debouncedSearch = useCallback(
    debounce((value) => {
      setSearchTerm(value);
      setPage(0);
      setRecipes([]);
      fetchRecipes(0, value);
    }, 300),
    [filters],
  );

  useEffect(() => {
    fetchRecipes(0, searchTerm);
    return () => {
      debouncedSearch.cancel();
    };
  }, [token, filters]);

  const handleSearch = (e) => {
    e.preventDefault();
    const value = e.target.search.value;
    debouncedSearch(value);
  };

  const handleSearchInput = (e) => {
    debouncedSearch(e.target.value);
  };

  const handleFilterChange = (filterName) => {
    setSearchLoading(true);
    setFilters((prev) => ({
      ...prev,
      [filterName]: !prev[filterName],
    }));
    setPage(0);
    setRecipes([]);
  };

  const loadMoreData = () => {
    if (loading || !hasMore) return;
    setPage((prev) => {
      const nextPage = prev + 1;
      fetchRecipes(nextPage, searchTerm);
      return nextPage;
    });
  };

  const prefetchNextPage = useCallback(async () => {
    if (!hasMore || loading || isPreloading) return;
    
    setIsPreloading(true);
    try {
      const nextPage = page + 1;
      const response = await RecipeService.getRecipes(
        nextPage,
        null,
        null,
        null,
        null,
        searchTerm,
        null,
        null,
        token
      );

      if (response?.content) {
        await checkFabricability(response.content);
      }
    } catch (err) {
      console.error('Error prefetching:', err);
    } finally {
      setIsPreloading(false);
    }
  }, [page, hasMore, loading, searchTerm, token]);

  useEffect(() => {
    if (recipes.length > 0 && hasMore && !loading) {
      prefetchNextPage();
    }
  }, [recipes, hasMore, loading]);

  const generateSkeletonKey = (index, prefix = '') => {
    const timestamp = Date.now();
    return `skeleton-${prefix}-${timestamp}-${index}`;
  };

  const SearchForm = React.memo(({ onSubmit, onInput, loading }) => (
    <form onSubmit={onSubmit} className="join w-full">
      <input
        name="search"
        className="input h-12 min-h-[48px] join-item w-full border-2 border-accent-content border-r-0"
        placeholder="Search drinks..."
        onChange={onInput}
        disabled={loading}
      />
      <button
        type="submit"
        className="btn h-12 min-h-[48px] w-12 border-2 border-accent-content bg-base-100 join-item border-l-1 hover:bg-base-200 px-0"
        disabled={loading}
      >
        {loading ? (
          <span className="loading loading-spinner loading-sm"></span>
        ) : (
          <Search className="w-5 h-5" />
        )}
      </button>
    </form>
  ));

  const FilterButtons = React.memo(({ filters, onFilterChange }) => (
    <div className="flex flex-wrap gap-2 mb-3">
      <button
        className={`btn btn-sm ${filters.automatic ? 'btn-primary' : 'btn-outline'}`}
        onClick={() => onFilterChange('automatic')}
      >
        Fully Automatic
      </button>
      <button
        className={`btn btn-sm ${filters.manual ? 'btn-primary' : 'btn-outline'}`}
        onClick={() => onFilterChange('manual')}
      >
        Manual
      </button>
      <button
        className={`btn btn-sm ${filters.fabricable ? 'btn-primary' : 'btn-outline'}`}
        onClick={() => onFilterChange('fabricable')}
      >
        Available Now
      </button>
    </div>
  ));

  const ErrorMessage = React.memo(({ error, onDismiss }) => (
    <div className="alert alert-error mb-4">
      <AlertCircle className="w-6 h-6" />
      <span>{error}</span>
      <button className="btn btn-ghost btn-sm" onClick={onDismiss}>
        <X className="w-4 h-4" />
      </button>
    </div>
  ));

  const ListContainer = React.memo(React.forwardRef(({ style, children }, ref) => (
    <div 
      ref={ref}
      style={style}
      className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
    >
      {children}
    </div>
  )));

  const LoadingFooter = React.memo(() => (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-4">
      {[...Array(4)].map((_, index) => (
        <SimpleDrinkCardSkeleton key={generateSkeletonKey(index)} />
      ))}
    </div>
  ));

  const NoMoreDrinks = React.memo(({ recipesLength }) => (
    <p className="text-center text-gray-500 mt-4">
      {recipesLength === 0 ? 'No drinks found' : "That's all the drinks!"}
    </p>
  ));

  if (!token) {
    return <Navigate to="/login" />;
  }

  return (
    <div className="container mx-auto px-2 py-2 pt-16 pb-4 min-h-screen">
      <div className="mb-3">
        <h2 className="text-xl font-bold text-center mb-3">Available Drinks</h2>

        <div className="max-w-md mx-auto mb-2">
          <SearchForm 
            onSubmit={handleSearch}
            onInput={handleSearchInput}
            loading={searchLoading}
          />
        </div>

        <div className="max-w-md mx-auto">
          <button
            className="btn btn-sm btn-ghost gap-2 mb-2"
            onClick={() => setShowFilters(!showFilters)}
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filters
          </button>

          {showFilters && (
            <FilterButtons 
              filters={filters}
              onFilterChange={handleFilterChange}
            />
          )}
        </div>
      </div>

      {error && (
        <ErrorMessage 
          error={error}
          onDismiss={() => setError(null)}
        />
      )}

      <Virtuoso
        useWindowScroll
        data={recipes}
        endReached={loadMoreData}
        overscan={200}
        style={{ overflowY: 'hidden' }}
        components={{
          Footer: () => (
            loading ? (
              <LoadingFooter />
            ) : !hasMore && (
              <NoMoreDrinks recipesLength={recipes.length} />
            )
          )
        }}
        itemContent={(index, recipe) => (
          <SimpleDrinkCard
            recipe={recipe}
            isFabricable={fabricableRecipes.has(recipe.id)}
          />
        )}
        listcomponent={ListContainer}
      />
    </div>
  );
}

export default React.memo(SimpleDrinks);
