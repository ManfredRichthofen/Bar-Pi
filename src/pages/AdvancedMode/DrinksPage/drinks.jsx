import { Navigate } from '@tanstack/react-router';
import { debounce } from 'es-toolkit';
import { ArrowUp, Filter } from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { PageHeader } from '@/components/AdvancedMode/PageHeader';
import { Button } from '@/components/ui/button';
import FilterPanel from '@/components/ui/filter-panel.jsx';
import SearchInput from '@/components/ui/search-input.jsx';
import { useFabricableRecipes } from '@/hooks/useFabricableRecipes';
import useAuthStore from '../../../store/authStore.js';
import useFilterStore from '../../../store/filterStore.js';
import {
  countActiveFilters,
  filterRecipes,
} from '../../../utils/recipeFilters.js';
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
  const [showScrollTop, setShowScrollTop] = useState(false);

  const filterPanelRef = useRef(null);
  const token = useAuthStore((state) => state.token);
  const { fabricableRecipes, checkFabricability } = useFabricableRecipes({
    token,
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

  const handleCollectionChange = useCallback(
    (collectionId) => {
      setSearchLoading(true);
      updateFilter('collectionId', collectionId);
    },
    [updateFilter],
  );

  const handleFilterRecipes = useCallback(
    (recipes, activeFilters, fabricable, favoriteIds) =>
      filterRecipes(recipes, activeFilters, fabricable, favoriteIds),
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
      <PageHeader
        title="Drinks"
        isVisible={isHeaderVisible}
        action={
          <Button
            variant={isFilterPanelOpen ? 'default' : 'outline'}
            onClick={handleFilterToggle}
            className="relative"
          >
            <Filter />
            Filters
            {countActiveFilters(filters) > 0 && (
              <span className="flex size-6 items-center justify-center rounded-full bg-primary-tint font-mono text-sm text-primary-tint-ink">
                {countActiveFilters(filters)}
              </span>
            )}
          </Button>
        }
        searchComponent={
          <SearchInput
            value={searchValue}
            onChange={handleSearchInput}
            onSubmit={handleSearch}
            loading={searchLoading}
            placeholder="Search drinks..."
            debounceMs={500}
          />
        }
      >
        {isFilterPanelOpen && (
          <FilterPanel
            filters={filters}
            onFilterChange={handleFilterChange}
            onCollectionChange={handleCollectionChange}
            onTogglePanel={() => setIsFilterPanelOpen(false)}
            isOpen={isFilterPanelOpen}
            variant="advanced"
            showCloseButton={true}
          />
        )}
      </PageHeader>

      <VirtualDrinksGrid
        token={token}
        searchTerm={searchTerm}
        collapsed={sidebarCollapsed}
        filters={filters}
        fabricableRecipes={fabricableRecipes}
        onCheckFabricability={checkFabricability}
        onFilterRecipes={handleFilterRecipes}
      />

      {showScrollTop && (
        <Button
          onClick={scrollToTop}
          size="icon"
          className="fixed bottom-8 right-8 z-30"
          aria-label="Scroll to top"
        >
          <ArrowUp className="size-6" />
        </Button>
      )}
    </div>
  );
};

export default Drinks;
