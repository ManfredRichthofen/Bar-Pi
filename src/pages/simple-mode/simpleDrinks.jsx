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
    <div className="container mx-auto px-2 py-2 pt-16 min-h-screen">
      <div className="mb-3">
        <h2 className="text-xl font-bold text-center mb-3">
          Available Drinks
        </h2>

        <div className="max-w-md mx-auto mb-2">
          <form onSubmit={handleSearch} className="join w-full">
            <input
              name="search"
              className="input h-12 min-h-[48px] join-item w-full border-2 border-accent-content border-r-0"
              placeholder="Search drinks..."
            />
            <button 
              type="submit" 
              className="btn h-12 min-h-[48px] w-12 border-2 border-accent-content bg-base-100 join-item border-l-1 hover:bg-base-200 px-0"
            >
              <Search className="h-5 w-5" />
            </button>
            <button
              type="button"
              className="btn h-12 min-h-[48px] w-12 border-2 border-accent-content bg-base-100 join-item border-l-0 hover:bg-base-200 px-0"
              onClick={() => setShowFilters(!showFilters)}
            >
              <SlidersHorizontal className="h-5 w-5" />
            </button>
          </form>
        </div>

        {/* Filters Section */}
        <div className={`transition-all duration-300 overflow-hidden ${showFilters ? 'max-h-96' : 'max-h-0'}`}>
          <div className="max-w-md mx-auto bg-base-200 rounded-lg p-3 mb-2">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-semibold">Filters</h3>
              <button
                onClick={() => setShowFilters(false)}
                className="btn btn-ghost h-10 min-h-[40px] w-10 p-0"
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
                />
                <span className="text-base">Alcoholic</span>
              </label>
              <label className="flex items-center gap-3 min-h-[40px] touch-none">
                <input
                  type="checkbox"
                  className="checkbox checkbox-lg"
                  checked={filters.nonAlcoholic}
                  onChange={() => handleFilterChange('nonAlcoholic')}
                />
                <span className="text-base">Non-Alcoholic</span>
              </label>
              <label className="flex items-center gap-3 min-h-[40px] touch-none">
                <input
                  type="checkbox"
                  className="checkbox checkbox-lg"
                  checked={filters.fabricable}
                  onChange={() => handleFilterChange('fabricable')}
                />
                <span className="text-base">Available to Make</span>
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
          <div className="text-center py-3">
            <span className="loading loading-spinner loading-lg"></span>
          </div>
        }
        endMessage={
          <div className="text-center py-4 text-base-content/60">
            {recipes.length === 0
              ? 'No drinks found'
              : 'No more drinks to load'}
          </div>
        }
        scrollThreshold="90%"
      >
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
          {recipes.map((recipe) => (
            <SimpleDrinkCard key={recipe.id} recipe={recipe} />
          ))}
        </div>
      </InfiniteScroll>
    </div>
  );
};

export default SimpleDrinks;
