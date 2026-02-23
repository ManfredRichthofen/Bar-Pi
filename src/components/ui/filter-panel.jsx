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
        'h-10 rounded-lg transition-all duration-200 hover:scale-105';
      return `${baseClasses} ${isActive ? '' : 'hover:scale-105'}`;
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
              className={`w-2 h-2 rounded-full ${isActive ? 'bg-primary' : 'bg-muted-foreground'}`}
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
              className="h-10 text-destructive hover:bg-destructive/10 transition-all duration-200"
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
        className={`bg-gradient-to-br from-card to-card/50 border-2 border-primary/20 rounded-xl px-4 sm:px-6 py-6 space-y-4 shadow-lg backdrop-blur-sm animate-in slide-in-from-top-2 duration-300 ${className}`}
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
              className="text-muted-foreground hover:text-foreground transition-colors duration-200"
            >
              Clear All
            </Button>
            {showCloseButton && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onTogglePanel}
                className="text-muted-foreground hover:text-foreground transition-colors duration-200 h-8 w-8 p-0"
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
