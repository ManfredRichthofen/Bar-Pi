import { useIsFetching } from '@tanstack/react-query';
import { Navigate, useNavigate } from '@tanstack/react-router';
import { ArrowUp, Filter } from 'lucide-react';
import { AnimatePresence, m, useReducedMotion } from 'motion/react';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import FilterPanel from '@/components/ui/filter-panel.jsx';
import SearchInput from '@/components/ui/search-input.jsx';
import { useFabricableRecipes } from '@/hooks/useFabricableRecipes';
import {
  enterTransition,
  fadeAnimate,
  fadeInitial,
  noneTransition,
} from '@/lib/motionPresets';
import useAuthStore from '../../../store/authStore.js';
import useFilterStore from '../../../store/filterStore.js';
import {
  countActiveFilters,
  filterRecipes,
  hasActiveClientFilters,
} from '../../../utils/recipeFilters.js';
import VirtualGrid from './VirtualGrid.jsx';

const FILTER_PANEL_ID = 'simple-drinks-filters';

function SimpleDrinks() {
  const { t } = useTranslation();
  const reduceMotion = useReducedMotion();
  const [searchTerm, setSearchTerm] = useState('');
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const headerRef = useRef(null);
  const { filters, updateFilter, clearFilters } = useFilterStore();
  const token = useAuthStore((state) => state.token);
  const navigate = useNavigate({ from: '/simple/drinks' });
  const isFetchingRecipes =
    useIsFetching({ queryKey: ['recipes', 'simple'] }) > 0;
  const fabTransition = reduceMotion ? noneTransition : enterTransition;

  const activeFilterCount = countActiveFilters(filters);

  const handleUnauthorized = useCallback(() => {
    navigate({ to: '/login' });
  }, [navigate]);

  const { fabricableRecipes, checkFabricability } = useFabricableRecipes({
    token,
    onUnauthorized: handleUnauthorized,
  });

  const handleFilterChange = useCallback(
    (filterName) => {
      if (filterName === 'clear') {
        clearFilters();
      } else {
        updateFilter(filterName, !filters[filterName]);
      }
    },
    [filters, clearFilters, updateFilter],
  );

  const handleCollectionChange = useCallback(
    (collectionId) => updateFilter('collectionId', collectionId),
    [updateFilter],
  );

  const filterRecipesMemo = useCallback(
    (
      recipes,
      activeFilters = filters,
      fabricable = fabricableRecipes,
      favoriteIds,
    ) => {
      if (!hasActiveClientFilters(activeFilters)) return recipes ?? [];
      return filterRecipes(recipes, activeFilters, fabricable, favoriteIds);
    },
    [filters, fabricableRecipes],
  );

  const handleSearch = (e) => {
    e.preventDefault();
    setSearchTerm(e.target.search.value);
  };

  const handleFilterToggle = (e) => {
    e?.stopPropagation();
    setIsFilterPanelOpen((open) => !open);
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (!isFilterPanelOpen) return;

    const handleClickOutside = (event) => {
      if (headerRef.current && !headerRef.current.contains(event.target)) {
        setIsFilterPanelOpen(false);
      }
    };

    document.addEventListener('pointerdown', handleClickOutside);
    return () => {
      document.removeEventListener('pointerdown', handleClickOutside);
    };
  }, [isFilterPanelOpen]);

  const handleCardClick = (recipe) => {
    navigate({
      to: '/simple/drink/$id',
      params: { id: recipe.id },
      state: { recipe },
    });
  };

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      <header
        ref={headerRef}
        className="sticky top-0 z-20 border-b-hairline border-border bg-background"
      >
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 space-y-4">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl sm:text-4xl">
              {t('navigation.drinks', 'Drinks')}
            </h1>
            <Button
              variant={isFilterPanelOpen ? 'default' : 'outline'}
              onClick={handleFilterToggle}
              aria-expanded={isFilterPanelOpen}
              aria-controls={FILTER_PANEL_ID}
              aria-label={
                activeFilterCount > 0
                  ? t('simple_drinks.filters_active', {
                      count: activeFilterCount,
                      defaultValue: 'Filters, {{count}} active',
                    })
                  : undefined
              }
              className="relative"
            >
              <Filter />
              {t('simple_drinks.filters', 'Filters')}
              {activeFilterCount > 0 && (
                <span
                  aria-hidden="true"
                  className="flex size-6 items-center justify-center rounded-full bg-primary-tint font-mono text-sm text-primary-tint-ink"
                >
                  {activeFilterCount}
                </span>
              )}
            </Button>
          </div>

          <SearchInput
            value={searchTerm}
            onChange={setSearchTerm}
            onSubmit={handleSearch}
            loading={isFetchingRecipes}
            placeholder={t(
              'simple_drinks.search_placeholder',
              'Search drinks...',
            )}
            debounceMs={400}
          />

          {isFilterPanelOpen && (
            <FilterPanel
              id={FILTER_PANEL_ID}
              filters={filters}
              onFilterChange={handleFilterChange}
              onCollectionChange={handleCollectionChange}
              variant="simple"
            />
          )}
        </div>
      </header>

      <m.div
        initial={reduceMotion ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={reduceMotion ? noneTransition : enterTransition}
      >
        <VirtualGrid
          fabricableRecipes={fabricableRecipes}
          onCardClick={handleCardClick}
          token={token}
          searchTerm={searchTerm}
          filters={filters}
          onCheckFabricability={checkFabricability}
          onFilterRecipes={filterRecipesMemo}
          onClearFilters={() => {
            clearFilters();
            setSearchTerm('');
          }}
        />
      </m.div>

      <AnimatePresence>
        {showScrollTop && (
          <m.div
            initial={reduceMotion ? false : fadeInitial}
            animate={fadeAnimate}
            exit={reduceMotion ? undefined : fadeInitial}
            transition={fabTransition}
            className="fixed bottom-[calc(var(--dock-height)+1rem)] right-4 z-40"
          >
            <Button
              onClick={scrollToTop}
              size="icon"
              aria-label={t('simple_drinks.scroll_top', 'Scroll to top')}
            >
              <ArrowUp className="size-6" />
            </Button>
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default React.memo(SimpleDrinks);
