import { Navigate } from '@tanstack/react-router';
import debounce from 'lodash/debounce';
import { ArrowUp, Filter } from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import FilterPanel from '@/components/ui/filter-panel.jsx';
import SearchInput from '@/components/ui/search-input.jsx';
import CocktailService from '../../../services/cocktail.service.js';
import useAuthStore from '../../../store/authStore.js';
import useFilterStore from '../../../store/filterStore.js';
import { filterRecipes } from '../../../utils/recipeFilters.js';
import VirtualDrinksGrid from './components/drinks/VirtualDrinksGrid.jsx';

const Drinks = ({ sidebarCollapsed = false }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchValue, setSearchValue] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const { filters, updateFilter, clearFilters } = useFilterStore();
  const [fabricableRecipes, setFabricableRecipes] = useState(new Set());
  const [showScrollTop, setShowScrollTop] = useState(false);

  const filterPanelRef = useRef(null);
  const token = useAuthStore((state) => state.token);

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
      if (!token) return;

      const fabricableSet = new Set(fabricableRecipes);
      const batchSize = 50;

      for (let i = 0; i < recipes.length; i += batchSize) {
        const batch = recipes.slice(i, i + batchSize);
        const results = await Promise.allSettled(
          batch.map(async (recipe) => {
            if (fabricableSet.has(recipe.id)) return recipe.id;
            try {
              const isFabricable = await CocktailService.checkFabricability(
                recipe.id,
                token,
              );
              if (isFabricable) {
                fabricableSet.add(recipe.id);
              }
              return recipe.id;
            } catch (error) {
              console.error(
                `Failed to check fabricability for recipe ${recipe.id}:`,
                error,
              );
              return recipe.id;
            }
          }),
        );

        // Update state after each batch to show progress
        setFabricableRecipes(new Set(fabricableSet));
      }

      return fabricableSet;
    },
    [token, fabricableRecipes],
  );

  const handleFilterRecipes = useCallback(
    (recipes, filters, fabricableRecipes) => {
      return filterRecipes(recipes, filters, fabricableRecipes);
    },
    [],
  );

  const debouncedSearch = useCallback(
    debounce((value) => {
      setSearchTerm(value);
      setSearchLoading(false);
    }, 500),
    [],
  );

  const handleSearch = (e) => {
    e.preventDefault();
    const value = e.target.search.value;
    setSearchValue(value);
    setSearchLoading(true);
    debouncedSearch(value);
  };

  const handleSearchInput = (value) => {
    setSearchValue(value);
    setSearchLoading(true);
    debouncedSearch(value);
  };

  const handleFilterToggle = (e) => {
    e?.stopPropagation();
    console.log('Filter toggle clicked, current state:', isFilterPanelOpen);
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

  if (!token) {
    return <Navigate to="/login" />;
  }

  return (
    <div className="min-h-screen bg-background">
      <div
        className={`sticky top-16 z-40 bg-background/95 backdrop-blur-sm border-b shadow-sm transition-all duration-300 ${
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
            className="max-w-2xl mx-auto"
            inputClassName="rounded-lg border-2 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200"
            buttonClassName="rounded-lg"
          />

          {/* Filter Panel */}
          {isFilterPanelOpen && (
            <FilterPanel
              filters={filters}
              onFilterChange={handleFilterChange}
              onTogglePanel={() => setIsFilterPanelOpen(false)}
              isOpen={isFilterPanelOpen}
              variant="advanced"
              showCloseButton={true}
            />
          )}
        </div>
      </div>

      {/* Main Content */}
      <VirtualDrinksGrid
        token={token}
        searchTerm={searchTerm}
        collapsed={sidebarCollapsed}
        filters={filters}
        fabricableRecipes={fabricableRecipes}
        onCheckFabricability={checkFabricability}
        onFilterRecipes={handleFilterRecipes}
      />

      {/* Scroll to Top Button */}
      {showScrollTop && (
        <Button
          onClick={scrollToTop}
          size="icon"
          className="fixed bottom-8 right-8 z-50 rounded-full shadow-lg"
          aria-label="Scroll to top"
        >
          <ArrowUp className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
};

export default Drinks;
