import { Navigate, useNavigate } from '@tanstack/react-router';
import { debounce } from 'es-toolkit';
import { ArrowUp, Filter } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
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

  const filterRecipesMemo = useCallback(
    (recipes, activeFilters = filters, fabricable = fabricableRecipes) => {
      if (!recipes?.length) return [];

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

  useEffect(() => {
    setSearchLoading(true);
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

      if (isFilterPanelOpen) {
        setIsHeaderVisible(true);
        setLastScrollY(currentScrollY);
        setShowScrollTop(currentScrollY > 400);
        return;
      }

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
      <header
        className={`sticky top-0 z-20 border-b-hairline border-border bg-background transition-transform ${
          isHeaderVisible ? 'translate-y-0' : '-translate-y-full'
        }`}
      >
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 space-y-4">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl sm:text-4xl">Drinks</h1>
            <Button
              variant={isFilterPanelOpen ? 'default' : 'outline'}
              onClick={handleFilterToggle}
              className="relative"
            >
              <Filter />
              Filters
              {Object.values(filters).some(Boolean) && (
                <span className="flex size-6 items-center justify-center rounded-full bg-primary-tint font-mono text-sm text-primary-tint-ink">
                  {Object.values(filters).filter(Boolean).length}
                </span>
              )}
            </Button>
          </div>

          <SearchInput
            value={searchValue}
            onChange={handleSearchInput}
            onSubmit={handleSearch}
            loading={searchLoading}
            placeholder="Search drinks..."
            debounceMs={500}
          />

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
      </header>

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
