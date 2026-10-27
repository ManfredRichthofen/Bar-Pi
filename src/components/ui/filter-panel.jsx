import { Filter } from 'lucide-react';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';

const SIMPLE_FILTERS = ['automatic', 'manual', 'available'];
const ADVANCED_FILTERS = ['alcoholic', 'nonAlcoholic', 'favorited', 'fabricable'];

const FilterPanel = React.memo(
  ({
    filters,
    onFilterChange,
    onTogglePanel,
    variant = 'simple', // 'simple' or 'advanced'
    showCloseButton = true,
    className = '',
  }) => {
    const { t } = useTranslation();
    const activeFilters =
      variant === 'simple' ? SIMPLE_FILTERS : ADVANCED_FILTERS;
    const hasActiveFilters = activeFilters.some((filter) => filters[filter]);

    const filterLabels = {
      automatic: t('filters.automatic', 'Automatic'),
      manual: t('filters.manual', 'Manual'),
      available: t('filters.available', 'Available'),
      alcoholic: t('filters.alcoholic', 'Alcoholic'),
      nonAlcoholic: t('filters.non_alcoholic', 'Non-Alcoholic'),
      favorited: t('filters.favorited', 'Favorited'),
      fabricable: t('filters.fabricable', 'Can Make'),
    };

    const filterDescriptions = {
      automatic: t(
        'filters.automatic_description',
        'Show drinks with all automated ingredients',
      ),
      manual: t(
        'filters.manual_description',
        'Show drinks that require manual preparation',
      ),
      available: t(
        'filters.available_description',
        'Show drinks with ingredients on pumps or in the bar',
      ),
      alcoholic: t('filters.alcoholic_description', 'Show alcoholic drinks'),
      nonAlcoholic: t(
        'filters.non_alcoholic_description',
        'Show non-alcoholic drinks',
      ),
      favorited: t('filters.favorited_description', 'Show favorited drinks'),
      fabricable: t(
        'filters.fabricable_description',
        'Show drinks you can make with available ingredients',
      ),
    };

    const renderFilterButton = (filter) => {
      const isActive = !!filters[filter];
      return (
        <Button
          key={filter}
          variant={isActive ? 'default' : 'outline'}
          size="sm"
          onClick={() => onFilterChange(filter)}
          className="min-h-control-sm"
          title={filterDescriptions[filter]}
          aria-pressed={isActive}
        >
          <span className="flex items-center gap-1.5">
            {variant === 'simple' && (
              <span
                className={`size-2 rounded-full ${isActive ? 'bg-primary-foreground' : 'bg-foreground-muted'}`}
              />
            )}
            {filterLabels[filter]}
          </span>
        </Button>
      );
    };

    if (variant === 'simple') {
      return (
        <div className={`flex flex-col gap-3 ${className}`}>
          <div className="flex flex-wrap gap-2">
            {activeFilters.map(renderFilterButton)}
          </div>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              className="text-danger self-start"
              onClick={() => onFilterChange('clear')}
            >
              {t('filters.clear', 'Clear Filters')}
            </Button>
          )}
        </div>
      );
    }

    return (
      <div
        className={`bg-surface border-control border-border-strong rounded-lg px-4 sm:px-6 py-6 space-y-4 shadow-lg animate-in slide-in-from-top-2 ${className}`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">
              {t('filters.title', 'Filter Drinks')}
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onFilterChange('clear')}
              className="text-foreground-muted hover:text-foreground transition-colors"
            >
              {t('filters.clear_all', 'Clear All')}
            </Button>
            {showCloseButton && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onTogglePanel}
                aria-label={t('common.close', 'Close')}
                className="text-foreground-muted"
              >
                ×
              </Button>
            )}
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {activeFilters.map(renderFilterButton)}
        </div>
      </div>
    );
  },
);

FilterPanel.displayName = 'FilterPanel';

export default FilterPanel;
