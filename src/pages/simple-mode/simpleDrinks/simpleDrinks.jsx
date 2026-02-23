import { Navigate, useNavigate } from '@tanstack/react-router';
import debounce from 'lodash/debounce';
import { ArrowUp, Filter } from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import CocktailService from '../../../services/cocktail.service.js';
import useAuthStore from '../../../store/authStore.js';
import useFilterStore from '../../../store/filterStore.js';
import { filterRecipes } from '../../../utils/recipeFilters.js';
import ErrorMessage from './ErrorMessage.jsx';
import FilterPanel from '@/components/ui/filter-panel.jsx';
import SearchInput from '@/components/ui/search-input.jsx';
import VirtualGrid from './VirtualGrid.jsx';

function SimpleDrinks() {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchValue, setSearchValue] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const { filters, updateFilter, clearFilters } = useFilterStore();
  const [fabricableRecipes, setFabricableRecipes] = useState(new Set());
  const token = useAuthStore((state) => state.token);
  const navigate = useNavigate({ from: '/simple/drinks' });
  const [showScrollTop, setShowScrollTop] = useState(false);

  const filterPanelRef = useRef(null);

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
    }, 500),
    [],
  );

  const handleSearch = (e) => {
    e.preventDefault();
    const value = e.target.search.value;
    setSearchValue(value);
    debouncedSearch(value);
  };

  const handleSearchInput = (value) => {
    setSearchValue(value);
    debouncedSearch(value);
  };

  const handleFilterToggle = (e) => {
    e?.stopPropagation();
    setIsFilterPanelOpen(!isFilterPanelOpen);
    // Make sure header is visible when opening filters
    if (!isFilterPanelOpen) {
      setIsHeaderVisible(true);
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      // Don't hide header if filter panel is open
      if (isFilterPanelOpen) {
        setIsHeaderVisible(true);
        setLastScrollY(currentScrollY);
        setShowScrollTop(currentScrollY > 400);
        return;
      }

      // Hide header when scrolling down, show when scrolling up
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsHeaderVisible(false);
      } else {
        setIsHeaderVisible(true);
      }

      setLastScrollY(currentScrollY);
      setShowScrollTop(currentScrollY > 400);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY, isFilterPanelOpen]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        filterPanelRef.current &&
        !filterPanelRef.current.contains(event.target)
      ) {
        setIsFilterPanelOpen(false);
      }
    };

    if (isFilterPanelOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isFilterPanelOpen]);

  const handleCardClick = (recipe) => {
    navigate({
      to: '/simple/drink/$id',
      params: { id: recipe.id },
      state: { recipe },
    });
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

  // Handle scroll to show/hide scroll top button and header
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY =
        window.scrollY || document.documentElement.scrollTop;

      // Don't hide header if filter panel is open
      if (isFilterPanelOpen) {
        setIsHeaderVisible(true);
        setLastScrollY(currentScrollY);
        setShowScrollTop(currentScrollY > 300);
        return;
      }

      // Hide header when scrolling down, show when scrolling up
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsHeaderVisible(false);
      } else {
        setIsHeaderVisible(true);
      }

      setLastScrollY(currentScrollY);
      setShowScrollTop(currentScrollY > 300); // Show button after 300px scroll
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY, isFilterPanelOpen]);

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div
        className={`sticky top-0 z-20 bg-background/95 backdrop-blur-sm border-b border-border shadow-sm pt-2 transition-all duration-300 ${
          isHeaderVisible
            ? 'translate-y-0 opacity-100'
            : '-translate-y-full opacity-0'
        }`}
      >
        <div className="px-3 sm:px-4 py-3 sm:py-4 space-y-4">
          {/* Header Section */}
          <div className="flex items-center justify-between">
            <h1 className="text-xl sm:text-2xl font-bold">Available Drinks</h1>
            <Button
              variant={isFilterPanelOpen ? 'default' : 'ghost'}
              size="icon"
              onClick={handleFilterToggle}
              className="rounded-lg transition-all duration-200"
            >
              <Filter className="h-4 w-4 sm:h-5 sm:w-5" />
              {Object.values(filters).some(Boolean) && (
                <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground rounded-full w-4 h-4 text-xs font-medium flex items-center justify-center">
                  {Object.values(filters).filter(Boolean).length}
                </span>
              )}
            </Button>
          </div>

          {/* Search Bar */}
          <SearchInput
            value={searchValue}
            onChange={handleSearchInput}
            onSubmit={handleSearch}
            loading={searchLoading}
            placeholder="Search drinks..."
            debounceMs={500}
          />

          {/* Filter Panel */}
          {isFilterPanelOpen && (
            <FilterPanel
              filters={filters}
              onFilterChange={handleFilterChange}
              variant="simple"
            />
          )}
          {error && (
            <ErrorMessage error={error} onDismiss={() => setError(null)} />
          )}
        </div>
      </div>

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
        <Button
          onClick={scrollToTop}
          size="icon"
          className="fixed bottom-24 right-4 z-[100] rounded-full shadow-lg hover:shadow-xl transition-all duration-200"
          aria-label="Scroll to top"
        >
          <ArrowUp className="w-5 h-5" />
        </Button>
      )}
    </div>
  );
}

export default React.memo(SimpleDrinks);
