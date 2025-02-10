import React, { useState, useEffect } from 'react';
import useAuthStore from '../../store/authStore';
import RecipeService from '../../services/recipe.service.js';
import CocktailService from '../../services/cocktail.service.js';
import { Navigate } from 'react-router-dom';
import SimpleDrinkCard from '../../components/simple-mode/drinks/simpleDrinkCard';
import InfiniteScroll from 'react-infinite-scroll-component';
import { Search, SlidersHorizontal, X } from 'lucide-react';

const SimpleDrinks = () => {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(false);
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
            token
          );
          
          if (result?.feasible) {
            fabricableSet.add(recipe.id);
          }
        } catch (error) {
          console.error(`Error checking fabricability for recipe ${recipe.id}:`, error);
        }
      })
    );
    
    setFabricableRecipes(fabricableSet);
  };

  const fetchRecipes = async (pageNumber, search = '') => {
    if (!token) {
      console.log('No token available');
      return;
    }

    setLoading(true);
    try {
      const response = await RecipeService.getRecipes(
        pageNumber,
        null,
        null,
        null, // Remove fabricable filter from initial fetch
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
          filteredContent = filteredContent.filter(recipe => recipe.alcoholic);
        } else if (!filters.alcoholic && filters.nonAlcoholic) {
          filteredContent = filteredContent.filter(recipe => !recipe.alcoholic);
        }

        // Check fabricability for new recipes
        await checkFabricability(filteredContent);

        // Apply fabricable filter if needed
        if (filters.fabricable) {
          filteredContent = filteredContent.filter(recipe => fabricableRecipes.has(recipe.id));
        }

        if (pageNumber === 0) {
          setRecipes(filteredContent);
        } else {
          setRecipes((prev) => [...prev, ...filteredContent]);
        }
        setHasMore(!response.last);
      } else {
        console.log('Invalid response format:', response);
      }
    } catch (error) {
      console.error('Error fetching recipes:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecipes(0, searchTerm);
  }, [token, filters]);

  const handleSearch = (e) => {
    e.preventDefault();
    const value = e.target.search.value;
    setSearchTerm(value);
    setPage(0);
    setRecipes([]);
    fetchRecipes(0, value);
  };

  const handleFilterChange = (filterName) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: !prev[filterName]
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

  if (!token) return <Navigate to="/login" />;

  return (
    <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8 pt-16 sm:pt-20 min-h-screen">
      <div className="mb-4 sm:mb-8">
        <h2 className="text-xl sm:text-2xl font-bold text-center mb-4 sm:mb-6">
          Available Drinks
        </h2>

        <div className="max-w-md mx-auto mb-3 sm:mb-4">
          <form onSubmit={handleSearch} className="join w-full">
            <input
              name="search"
              className="input input-sm sm:input-md join-item w-full"
              placeholder="Search drinks..."
            />
            <button type="submit" className="btn btn-sm sm:btn-md bg-base-100 join-item">
              <Search className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
            <button
              type="button"
              className="btn btn-sm sm:btn-md bg-base-100 join-item"
              onClick={() => setShowFilters(!showFilters)}
            >
              <SlidersHorizontal className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
          </form>
        </div>

        {/* Filters Section */}
        <div className={`transition-all duration-300 overflow-hidden ${showFilters ? 'max-h-96' : 'max-h-0'}`}>
          <div className="max-w-md mx-auto bg-base-200 rounded-lg p-3 sm:p-4 mb-3 sm:mb-4 text-sm sm:text-base">
            <div className="flex justify-between items-center mb-3 sm:mb-4">
              <h3 className="font-semibold">Filters</h3>
              <button
                onClick={() => setShowFilters(false)}
                className="btn btn-ghost btn-sm p-0 h-auto min-h-0"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-2">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  className="checkbox checkbox-sm sm:checkbox-md"
                  checked={filters.alcoholic}
                  onChange={() => handleFilterChange('alcoholic')}
                />
                <span>Alcoholic</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  className="checkbox checkbox-sm sm:checkbox-md"
                  checked={filters.nonAlcoholic}
                  onChange={() => handleFilterChange('nonAlcoholic')}
                />
                <span>Non-Alcoholic</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  className="checkbox checkbox-sm sm:checkbox-md"
                  checked={filters.fabricable}
                  onChange={() => handleFilterChange('fabricable')}
                />
                <span>Available to Make</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      <InfiniteScroll
        dataLength={recipes.length}
        next={loadMoreData}
        hasMore={hasMore}
        loader={
          <div className="text-center py-3 sm:py-4">
            <span className="loading loading-spinner loading-md sm:loading-lg"></span>
          </div>
        }
        endMessage={
          <div className="text-center py-4 sm:py-6 text-base-content/60 text-sm sm:text-base">
            {recipes.length === 0
              ? 'No drinks found'
              : 'No more drinks to load'}
          </div>
        }
        scrollThreshold="90%"
      >
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
          {recipes.map((recipe) => (
            <SimpleDrinkCard key={recipe.id} recipe={recipe} />
          ))}
        </div>
      </InfiniteScroll>
    </div>
  );
};

export default SimpleDrinks;
