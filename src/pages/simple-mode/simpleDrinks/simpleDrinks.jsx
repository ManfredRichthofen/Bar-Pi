import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Navigate, useNavigate } from '@tanstack/react-router';
import {
  Filter,
  ArrowUp,
} from 'lucide-react';
import debounce from 'lodash/debounce';

import useAuthStore from '../../../store/authStore.js';
import useFilterStore from '../../../store/filterStore.js';
import CocktailService from '../../../services/cocktail.service.js';
import { filterRecipes } from '../../../utils/recipeFilters.js';
import SearchForm from './SearchForm.jsx';
import FilterButtons from './FilterButtons.jsx';
import ErrorMessage from './ErrorMessage.jsx';
import VirtualGrid from './VirtualGrid.jsx';

function SimpleDrinks() {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchValue, setSearchValue] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const { filters, updateFilter, clearFilters } = useFilterStore();
  const [fabricableRecipes, setFabricableRecipes] = useState(new Set());

  const filterPanelRef = useRef(null);
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
      if (!filters.automatic && !filters.manual && !filters.available) {
        return recipes;
      }

      return filterRecipes(recipes, filters, fabricableRecipes);
    },
    [filters, fabricableRecipes],
  );

  // Update recipes when filters change
  useEffect(() => {
    setSearchLoading(true);
    // Reduced timeout for better responsiveness
    setTimeout(() => {
      setSearchLoading(false);
    }, 100);
  }, [filters, filterRecipesMemo]);

  const debouncedSearch = useCallback(
    debounce((value) => {
      setSearchTerm(value);
    }, 500), // Increased debounce time to reduce API calls
    [],
  );

  const handleSearch = (e) => {
    e.preventDefault();
    const value = e.target.search.value;
    setSearchValue(value);
    debouncedSearch(value);
  };

  const handleSearchInput = (e) => {
    const value = e.target.value;
    setSearchValue(value);
    debouncedSearch(value);
  };

  const handleCardClick = (recipe) => {
    navigate({ to: '/simple/drink/$id', params: { id: recipe.id }, state: { recipe } });
  };

  // Handle click outside to close filter panel
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        filterPanelRef.current &&
        !filterPanelRef.current.contains(event.target) &&
        isFilterPanelOpen
      ) {
        setIsFilterPanelOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isFilterPanelOpen]);

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
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-base-100">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-base-100/95 backdrop-blur-md border-b border-base-200 shadow-sm">
        <div className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold">Available Drinks</h1>
            <button
              onClick={() => setIsFilterPanelOpen(!isFilterPanelOpen)}
              className={`btn btn-ghost btn-sm p-2 rounded-lg transition-all duration-200 ${
                isFilterPanelOpen ? 'bg-primary text-primary-content' : 'hover:bg-base-200'
              }`}
            >
              <Filter className="w-5 h-5" />
            </button>
          </div>
          
          <SearchForm
            onSubmit={handleSearch}
            onInput={handleSearchInput}
            loading={searchLoading}
            value={searchValue}
          />
        </div>
      </div>

      {/* Filter Panel */}
      {isFilterPanelOpen && (
        <div className="bg-base-200/50 border-b border-base-200 p-4">
          <FilterButtons
            filters={filters}
            onFilterChange={handleFilterChange}
          />
          {error && (
            <ErrorMessage error={error} onDismiss={() => setError(null)} />
          )}
        </div>
      )}

      {/* Main Content */}
      <VirtualGrid
        fabricableRecipes={fabricableRecipes}
        onCardClick={handleCardClick}
        token={token}
        searchTerm={searchTerm}
        filters={filters}
        onCheckFabricability={checkFabricability}
        onFilterRecipes={filterRecipesMemo}
      />

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
