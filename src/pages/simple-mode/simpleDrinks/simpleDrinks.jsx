import { useIsFetching } from '@tanstack/react-query';
import { Navigate, useNavigate } from '@tanstack/react-router';
import { ArrowUp, Filter } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
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
} from '@/lib/simpleMotion';
import useAuthStore from '../../../store/authStore.js';
import useFilterStore from '../../../store/filterStore.js';
import { filterRecipes } from '../../../utils/recipeFilters.js';
import VirtualGrid from './VirtualGrid.jsx';

const SIMPLE_FILTER_KEYS = ['automatic', 'manual', 'available'];
const FILTER_PANEL_ID = 'simple-drinks-filters';

function SimpleDrinks() {
  const { t } = useTranslation();
  const reduceMotion = useReducedMotion();
  const [searchTerm, setSearchTerm] = useState('');
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const headerRef = useRef(null);
  const { filters: allFilters, updateFilter } = useFilterStore();
  const token = useAuthStore((state) => state.token);
  const navigate = useNavigate({ from: '/simple/drinks' });
  const isFetchingRecipes =
    useIsFetching({ queryKey: ['recipes', 'simple'] }) > 0;
  const fabTransition = reduceMotion ? noneTransition : enterTransition;

  // Advanced-mode filters live in the same store; simple mode only shows and applies these.
  const filters = useMemo(
    () =>
      Object.fromEntries(
        SIMPLE_FILTER_KEYS.map((key) => [key, !!allFilters[key]]),
      ),
    [allFilters],
  );
  const activeFilterCount = SIMPLE_FILTER_KEYS.filter(
    (key) => filters[key],
  ).length;

  const handleUnauthorized = useCallback(() => {
    navigate({ to: '/login' });
  }, [navigate]);

  const { fabricableRecipes, checkFabricability } = useFabricableRecipes({
    token,
    onUnauthorized: handleUnauthorized,
  });

  const clearSimpleFilters = useCallback(() => {
    for (const key of SIMPLE_FILTER_KEYS) {
      updateFilter(key, false);
    }
  }, [updateFilter]);

  const handleFilterChange = useCallback(
    (filterName) => {
      if (filterName === 'clear') {
        clearSimpleFilters();
      } else {
        updateFilter(filterName, !filters[filterName]);
      }
    },
    [filters, clearSimpleFilters, updateFilter],
  );

  const filterRecipesMemo = useCallback(
    (recipes, activeFilters = filters, fabricable = fabricableRecipes) => {
      if (!recipes?.length) return [];

      if (!SIMPLE_FILTER_KEYS.some((key) => activeFilters[key])) {
        return recipes;
      }

      return filterRecipes(recipes, activeFilters, fabricable);
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
              variant="simple"
            />
          )}
        </div>
      </header>

      <motion.div
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
            clearSimpleFilters();
            setSearchTerm('');
          }}
        />
      </motion.div>

      <AnimatePresence>
        {showScrollTop && (
          <motion.div
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
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default React.memo(SimpleDrinks);
