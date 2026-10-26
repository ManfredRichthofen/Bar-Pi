import { Navigate, useNavigate } from '@tanstack/react-router';
import { debounce } from 'es-toolkit';
import { ArrowUp, Filter } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import FilterPanel from '@/components/ui/filter-panel.jsx';
import SearchInput from '@/components/ui/search-input.jsx';
import { useFabricableRecipes } from '@/hooks/useFabricableRecipes';
import useAuthStore from '../../../store/authStore.js';
import useFilterStore from '../../../store/filterStore.js';
import { filterRecipes } from '../../../utils/recipeFilters.js';
import ErrorMessage from './ErrorMessage.jsx';
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
  const token = useAuthStore((state) => state.token);
  const navigate = useNavigate({ from: '/simple/drinks' });
  const [showScrollTop, setShowScrollTop] = useState(false);

  const filterPanelRef = useRef(null);

  const handleUnauthorized = useCallback(() => {
    navigate({ to: '/login' });
  }, [navigate]);

  const { fabricableRecipes, checkFabricability } = useFabricableRecipes({
    token,
    onUnauthorized: handleUnauthorized,
  });

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

  // Memoize the filter function to prevent unnecessary recalculations
  const filterRecipesMemo = useCallback(
    (recipes, activeFilters = filters, fabricable = fabricableRecipes) => {
      if (!recipes?.length) return [];

      // Early return if no filters are active
      if (
        !activeFilters.automatic &&
        !activeFilters.manual &&
        !activeFilters.available
      ) {
        return recipes;
      }

      return filterRecipes(recipes, activeFilters, fabricable);
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

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div
        className={`sticky top-0 z-20 bg-background  border-b border-border shadow-sm pt-2 transition-colors ${
          isHeaderVisible
            ? 'translate-y-0 opacity-100'
            : '-translate-y-full opacity-0'
        }`}
      >
        <div className="px-3 sm:px-4 py-3 sm:py-4 space-y-4">
          {/* Header Section */}
          <div className="flex items-center justify-between">
            <div>
              <p className="eyebrow">01 · the menu</p>
              <h1 className="text-3xl sm:text-4xl">
                <span className="text-foreground-muted">Thirsty? </span>
                Pick a drink.
              </h1>
            </div>
            <Button
              variant={isFilterPanelOpen ? 'default' : 'ghost'}
              size="icon"
              onClick={handleFilterToggle}
              className="rounded-lg transition-colors"
            >
              <Filter className="size-6 sm:h-5 sm:w-5" />
              {Object.values(filters).some(Boolean) && (
                <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground rounded-full size-6 text-sm font-medium flex items-center justify-center">
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
        onClearFilters={clearFilters}
      />

      {/* Scroll to top button */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="fixed bottom-24 right-4 z-[100]"
          >
            <Button
              onClick={scrollToTop}
              size="icon"
              className=""
              aria-label="Scroll to top"
            >
              <ArrowUp className="size-6" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default React.memo(SimpleDrinks);
