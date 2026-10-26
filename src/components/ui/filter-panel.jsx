import { Filter } from 'lucide-react';
import React from 'react';
import { Button } from '@/components/ui/button';

const FilterPanel = React.memo(
  ({
    filters,
    onFilterChange,
    onTogglePanel,
    isOpen = false,
    variant = 'simple', // 'simple' or 'advanced'
    showCloseButton = true,
    className = '',
  }) => {
    // Unified filter options for both modes
    const allFilters = [
      'automatic',
      'manual',
      'available',
      'alcoholic',
      'nonAlcoholic',
      'favorited',
      'fabricable',
    ];

    // Mode-specific filters
    const simpleFilters = ['automatic', 'manual', 'available'];
    const advancedFilters = [
      'alcoholic',
      'nonAlcoholic',
      'favorited',
      'fabricable',
    ];

    const activeFilters =
      variant === 'simple' ? simpleFilters : advancedFilters;
    const hasActiveFilters = activeFilters.some((filter) => filters[filter]);

    const filterLabels = {
      automatic: 'Automatic',
      manual: 'Manual',
      available: 'Available',
      alcoholic: 'Alcoholic',
      nonAlcoholic: 'Non-Alcoholic',
      favorited: 'Favorited',
      fabricable: 'Can Make',
    };

    const filterDescriptions = {
      automatic: 'Show drinks with all automated ingredients',
      manual: 'Show drinks that require manual preparation',
      available: 'Show drinks with ingredients on pumps or in the bar',
      alcoholic: 'Show alcoholic drinks',
      nonAlcoholic: 'Show non-alcoholic drinks',
      favorited: 'Show favorited drinks',
      fabricable: 'Show drinks you can make with available ingredients',
    };

    // Consistent button styling for both variants
    const getButtonClassName = (isActive) => {
      const baseClasses =
        'min-h-control-sm';
      return `${baseClasses} ${isActive ? '' : ''}`;
    };

    // Consistent filter button component
    const FilterButton = ({ filter, isActive }) => (
      <Button
        key={filter}
        variant={isActive ? 'default' : 'outline'}
        size="sm"
        onClick={() => onFilterChange(filter)}
        className={getButtonClassName(isActive)}
        title={filterDescriptions[filter]}
      >
        <span className="flex items-center gap-1.5">
          {variant === 'simple' && (
            <span
              className={`w-2 h-2 rounded-full ${isActive ? 'bg-primary' : 'bg-surface-sunken-foreground'}`}
            ></span>
          )}
          {filterLabels[filter]}
        </span>
      </Button>
    );

    if (variant === 'simple') {
      return (
        <div className={`flex flex-col gap-3 ${className}`}>
          <div className="flex flex-wrap gap-2">
            {activeFilters.map((filter) => (
              <FilterButton
                key={filter}
                filter={filter}
                isActive={filters[filter]}
              />
            ))}
          </div>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              className="text-danger"
              onClick={() => onFilterChange('clear')}
            >
              Clear Filters
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
            <h3 className="text-lg font-semibold">Filter Drinks</h3>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onFilterChange('clear')}
              className="text-foreground-muted hover:text-foreground transition-colors"
            >
              Clear All
            </Button>
            {showCloseButton && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onTogglePanel}
                className="text-foreground-muted"
              >
                ×
              </Button>
            )}
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {activeFilters.map((filter) => (
            <FilterButton
              key={filter}
              filter={filter}
              isActive={filters[filter]}
            />
          ))}
        </div>
      </div>
    );
  },
);

FilterPanel.displayName = 'FilterPanel';

export default FilterPanel;
