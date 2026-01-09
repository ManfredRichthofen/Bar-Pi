import React from 'react';
import { Button } from '@/components/ui/button';

const FilterButtons = React.memo(({ filters, onFilterChange }) => (
  <div className="flex flex-col gap-3">
    <div className="flex flex-wrap gap-2">
      <Button
        variant={filters.automatic ? 'default' : 'outline'}
        size="sm"
        className="h-10"
        onClick={() => onFilterChange('automatic')}
        title="Show drinks with all automated ingredients"
      >
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-primary"></span>
          Automatic
        </span>
      </Button>
      <Button
        variant={filters.manual ? 'default' : 'outline'}
        size="sm"
        className="h-10"
        onClick={() => onFilterChange('manual')}
        title="Show drinks that require manual preparation"
      >
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-primary"></span>
          Manual
        </span>
      </Button>
      <Button
        variant={filters.available ? 'default' : 'outline'}
        size="sm"
        className="h-10"
        onClick={() => onFilterChange('available')}
        title="Show drinks with ingredients on pumps or in the bar"
      >
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-primary"></span>
          Available
        </span>
      </Button>
    </div>
    {(filters.automatic || filters.manual || filters.available) && (
      <Button
        variant="ghost"
        size="sm"
        className="h-10 text-destructive hover:bg-destructive/10"
        onClick={() => onFilterChange('clear')}
      >
        Clear Filters
      </Button>
    )}
  </div>
));

export default FilterButtons;
