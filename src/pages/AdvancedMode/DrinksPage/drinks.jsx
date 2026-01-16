import { Navigate } from '@tanstack/react-router';
import debounce from 'lodash/debounce';
import { ArrowUp, Filter, Search } from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import CocktailService from '@/services/cocktail.service.js';
import useAuthStore from '@/store/authStore.js';
import useFilterStore from '@/store/filterStore.js';
import { filterRecipes } from '@/utils/recipeFilters.js';
import VirtualDrinksGrid from './components/drinks/VirtualDrinksGrid.jsx';

const Drinks = ({ sidebarCollapsed = false }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchValue, setSearchValue] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
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
              const isFabricable = await CocktailService.checkFabricability(recipe.id, token);
              if (isFabricable) {
                fabricableSet.add(recipe.id);
              }
              return recipe.id;
            } catch (error) {
              console.error(`Failed to check fabricability for recipe ${recipe.id}:`, error);
              return recipe.id;
            }
          })
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

  const handleSearchInput = (e) => {
    const value = e.target.value;
    setSearchValue(value);
    setSearchLoading(true);
    debouncedSearch(value);
  };

  const handleCardClick = (recipe) => {
    navigate({ to: '/order', state: { recipe } });
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (filterPanelRef.current && !filterPanelRef.current.contains(event.target)) {
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
      <div className="sticky top-16 z-40 bg-background border-b shadow-sm">
        <div className="container mx-auto px-4 py-4 space-y-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Available Drinks</h1>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsFilterPanelOpen(!isFilterPanelOpen)}
              className="flex items-center gap-2"
            >
              <Filter className="h-4 w-4" />
              Filters
              {Object.values(filters).some(Boolean) && (
                <span className="bg-primary text-primary-foreground rounded-full px-2 py-0.5 text-xs">
                  {Object.values(filters).filter(Boolean).length}
                </span>
              )}
            </Button>
          </div>

          <form onSubmit={handleSearch} className="max-w-md mx-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                name="search"
                value={searchValue}
                onChange={handleSearchInput}
                placeholder="Search drinks..."
                className="pl-10 pr-4"
              />
            </div>
          </form>

          {/* Filter Panel */}
          {isFilterPanelOpen && (
            <div ref={filterPanelRef} className="bg-card border rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">Filter Drinks</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleFilterChange('clear')}
                >
                  Clear All
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={filters.alcoholic ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleFilterChange('alcoholic')}
                >
                  Alcoholic
                </Button>
                <Button
                  variant={filters.nonAlcoholic ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleFilterChange('nonAlcoholic')}
                >
                  Non-Alcoholic
                </Button>
                <Button
                  variant={filters.favorited ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleFilterChange('favorited')}
                >
                  Favorited
                </Button>
                <Button
                  variant={filters.fabricable ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleFilterChange('fabricable')}
                >
                  Can Make
                </Button>
              </div>
            </div>
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
        onCardClick={handleCardClick}
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
