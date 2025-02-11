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

        // Filter processing
        if (filters.alcoholic && !filters.nonAlcoholic) {
          filteredContent = filteredContent.filter(
            (recipe) => recipe.alcoholic,
          );
        } else if (!filters.alcoholic && filters.nonAlcoholic) {
          filteredContent = filteredContent.filter(
            (recipe) => !recipe.alcoholic,
          );
        }

        try {
          await checkFabricability(filteredContent);
        } catch (err) {
          console.error('Error checking fabricability:', err);
          // Continue with the recipes even if fabricability check fails
        }

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
      setError(err.message || 'Failed to fetch recipes. Please try again.');
    } finally {
      loadingState(false);
    }
  };

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

  const generateSkeletonKey = (index, prefix = '') => {
    const timestamp = Date.now();
    return `skeleton-${prefix}-${timestamp}-${index}`;
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
                <Search className="w-5 h-5" />
              )}
            </button>
          </form>
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
            <div className="flex flex-wrap gap-2 mb-3">
              <button
                className={`btn btn-sm ${
                  filters.alcoholic ? 'btn-primary' : 'btn-outline'
                }`}
                onClick={() => handleFilterChange('alcoholic')}
              >
                Alcoholic
              </button>
              <button
                className={`btn btn-sm ${
                  filters.nonAlcoholic ? 'btn-primary' : 'btn-outline'
                }`}
                onClick={() => handleFilterChange('nonAlcoholic')}
              >
                Non-Alcoholic
              </button>
              <button
                className={`btn btn-sm ${
                  filters.fabricable ? 'btn-primary' : 'btn-outline'
                }`}
                onClick={() => handleFilterChange('fabricable')}
              >
                Available Now
              </button>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="alert alert-error mb-4">
          <AlertCircle className="w-6 h-6" />
          <span>{error}</span>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => setError(null)}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <InfiniteScroll
        dataLength={recipes.length}
        next={loadMoreData}
        hasMore={hasMore}
        loader={
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-4">
            {[...Array(4)].map((_, index) => (
              <SimpleDrinkCardSkeleton key={generateSkeletonKey(index)} />
            ))}
          </div>
        }
        endMessage={
          <p className="text-center text-gray-500 mt-4">
            {recipes.length === 0
              ? 'No drinks found'
              : "That's all the drinks!"}
          </p>
        }
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {recipes.map((recipe) => (
            <SimpleDrinkCard
              key={recipe.id}
              recipe={recipe}
              isFabricable={fabricableRecipes.has(recipe.id)}
            />
          ))}
        </div>
      </InfiniteScroll>
    </div>
  );
}

export default SimpleDrinks;
