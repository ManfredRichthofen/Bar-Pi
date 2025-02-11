import React, { useState, useEffect, useCallback } from 'react';
import { Navigate } from 'react-router-dom';
import { Search, SlidersHorizontal, X, AlertCircle } from 'lucide-react';
import debounce from 'lodash/debounce';
import InfiniteScroll from 'react-infinite-scroll-component';

import useAuthStore from '../../store/authStore';
import RecipeService from '../../services/recipe.service.js';
import CocktailService from '../../services/cocktail.service.js';
import SimpleDrinkCard from '../../components/simple-mode/drinks/simpleDrinkCard';
import SimpleDrinkCardSkeleton from '../../components/simple-mode/drinks/simpleDrinkCardSkeleton';

const SimpleDrinks = () => {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    alcoholic: false,
    nonAlcoholic: false,
    fabricable: false,
  });
  const [fabricableRecipes, setFabricableRecipes] = useState(new Set());

  const token = useAuthStore((state) => state.token);

  const getOrderConfig = (recipe) => ({
    amountOrderedInMl: recipe.defaultGlass?.sizeInMl || 250,
    customisations: {
      boost: 100,
      additionalIngredients: [],
    },
    productionStepReplacements: [],
    ingredientGroupReplacements: [],
    useAutomaticIngredients: true,
    skipMissingIngredients: false,
  });

  const checkFabricability = async (recipes) => {
    const fabricableSet = new Set();

    await Promise.all(
      recipes.map(async (recipe) => {
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

    setFabricableRecipes(fabricableSet);
  };

  const fetchRecipes = async (pageNumber, search = '') => {
    if (!token) {
      console.log('No token available');
      return;
    }

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
        token,
      );

      if (response && response.content) {
        let filteredContent = response.content;

        // Apply client-side filtering for alcoholic/non-alcoholic
        if (filters.alcoholic && !filters.nonAlcoholic) {
          filteredContent = filteredContent.filter(
            (recipe) => recipe.alcoholic,
          );
        } else if (!filters.alcoholic && filters.nonAlcoholic) {
          filteredContent = filteredContent.filter(
            (recipe) => !recipe.alcoholic,
          );
        }

        // Check fabricability for new recipes
        await checkFabricability(filteredContent);

        // Apply fabricable filter if needed
        if (filters.fabricable) {
          filteredContent = filteredContent.filter((recipe) =>
            fabricableRecipes.has(recipe.id),
          );
        }

        if (pageNumber === 0) {
          setRecipes(filteredContent);
        } else {
          setRecipes((prevRecipes) => {
            const recipesMap = new Map();

            prevRecipes.forEach((recipe) => {
              if (!filters.fabricable || fabricableRecipes.has(recipe.id)) {
                recipesMap.set(recipe.id, recipe);
              }
            });

            filteredContent.forEach((recipe) => {
              if (!filters.fabricable || fabricableRecipes.has(recipe.id)) {
                recipesMap.set(recipe.id, recipe);
              }
            });

            return Array.from(recipesMap.values());
          });
        }

        if (filters.fabricable) {
          setHasMore(
            !response.last &&
              filteredContent.some((recipe) =>
                fabricableRecipes.has(recipe.id),
              ),
          );
        } else {
          setHasMore(!response.last);
        }
      } else {
        setError('Invalid response format from server');
      }
    } catch (err) {
      console.error('Error fetching recipes:', err);
      setError('Failed to fetch recipes. Please try again.');
    } finally {
      loadingState(false);
    }
  };

  // Debounced search function
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

  // Generate unique skeleton keys
  const generateSkeletonKey = (index, prefix = '') => {
    const timestamp = Date.now();
    return `skeleton-${prefix}-${timestamp}-${index}`;
  };

  // Generate unique recipe keys (currently not used)
  const generateRecipeKey = (recipe) => {
    const uniqueProps = [
      recipe.id,
      recipe.name,
      recipe.alcoholic ? 1 : 0,
      recipe.ingredients?.length || 0,
      recipe.defaultGlass?.id || 'no-glass',
    ].join('-');
    return `recipe-${uniqueProps}-${Date.now()}`;
  };

  if (!token) {
    return <Navigate to="/login" />;
  }

  return (
    <div className="container mx-auto px-2 py-2 pt-16 pb-4 min-h-screen">
      <div className="mb-3">
        <h2 className="text-xl font-bold text-center mb-3">Available Drinks</h2>

        <div className="max-w-md mx-auto mb-2">
          <form onSubmit={handleSearch} className="join w-full">
            <input
              name="search"
              className="input h-12 min-h-[48px] join-item w-full border-2 border-accent-content border-r-0"
              placeholder="Search drinks..."
              onChange={handleSearchInput}
              disabled={searchLoading}
            />
            <button
              type="submit"
              className="btn h-12 min-h-[48px] w-12 border-2 border-accent-content bg-base-100 join-item border-l-1 hover:bg-base-200 px-0"
              disabled={searchLoading}
            >
              {searchLoading ? (
                <span className="loading loading-spinner loading-sm"></span>
              ) : (
                <Search className="h-5 w-5" />
              )}
            </button>
            <button
              type="button"
              className="btn h-12 min-h-[48px] w-12 border-2 border-accent-content bg-base-100 join-item border-l-0 hover:bg-base-200 px-0"
              onClick={() => setShowFilters(!showFilters)}
              disabled={searchLoading}
            >
              <SlidersHorizontal className="h-5 w-5" />
            </button>
          </form>
        </div>

        {/* Filters Section */}
        <div
          className={`transition-all duration-300 overflow-hidden ${
            showFilters ? 'max-h-96' : 'max-h-0'
          }`}
        >
          <div className="max-w-md mx-auto bg-base-200 rounded-lg p-3 mb-2">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-semibold">Filters</h3>
              <button
                onClick={() => setShowFilters(false)}
                className="btn btn-ghost h-10 min-h-[40px] w-10 p-0"
                disabled={searchLoading}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-3">
              <label className="flex items-center gap-3 min-h-[40px] touch-none">
                <input
                  type="checkbox"
                  className="checkbox checkbox-lg"
                  checked={filters.alcoholic}
                  onChange={() => handleFilterChange('alcoholic')}
                  disabled={searchLoading}
                />
                <span className="text-base">Alcoholic</span>
              </label>
              <label className="flex items-center gap-3 min-h-[40px] touch-none">
                <input
                  type="checkbox"
                  className="checkbox checkbox-lg"
                  checked={filters.nonAlcoholic}
                  onChange={() => handleFilterChange('nonAlcoholic')}
                  disabled={searchLoading}
                />
                <span className="text-base">Non-Alcoholic</span>
              </label>
              <label className="flex items-center gap-3 min-h-[40px] touch-none">
                <input
                  type="checkbox"
                  className="checkbox checkbox-lg"
                  checked={filters.fabricable}
                  onChange={() => handleFilterChange('fabricable')}
                  disabled={searchLoading}
                />
                <span className="text-base">Available to Make</span>
              </label>
            </div>
          </div>
        </div>

        {error && (
          <div className="alert alert-error max-w-md mx-auto mb-3">
            <AlertCircle className="h-5 w-5" />
            <span>{error}</span>
          </div>
        )}
      </div>

      <InfiniteScroll
        dataLength={recipes.length}
        next={loadMoreData}
        hasMore={hasMore}
        loader={
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 mt-2">
            {[...Array(8)].map((_, index) => (
              <SimpleDrinkCardSkeleton
                key={generateSkeletonKey(index, 'loader')}
              />
            ))}
          </div>
        }
        endMessage={
          <div className="text-center py-8 text-base-content/60">
            {recipes.length === 0
              ? searchTerm
                ? 'No drinks found matching your search'
                : 'No drinks found'
              : 'No more drinks to load'}
          </div>
        }
        scrollThreshold="90%"
        className="pb-8"
      >
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
          {(loading || searchLoading) && recipes.length === 0
            ? [...Array(12)].map((_, index) => (
                <SimpleDrinkCardSkeleton
                  key={generateSkeletonKey(index, 'initial')}
                />
              ))
            : recipes.map((recipe) => (
                <SimpleDrinkCard key={`recipe-${recipe.id}`} recipe={recipe} />
              ))}
        </div>
      </InfiniteScroll>
    </div>
  );
};

export default SimpleDrinks;
