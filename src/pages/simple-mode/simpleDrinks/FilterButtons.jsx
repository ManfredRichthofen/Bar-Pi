import React from 'react';

const FilterButtons = React.memo(({ filters, onFilterChange }) => (
  <div className="flex flex-col gap-3">
    <div className="flex flex-wrap gap-2">
      <button
        className={`btn btn-sm h-10 ${filters.automatic ? 'btn-primary' : 'btn-outline'} transition-colors`}
        onClick={() => onFilterChange('automatic')}
        title="Show drinks that can be made automatically"
      >
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-primary"></span>
          Automatic
        </span>
      </button>
      <button
        className={`btn btn-sm h-10 ${filters.manual ? 'btn-primary' : 'btn-outline'} transition-colors`}
        onClick={() => onFilterChange('manual')}
        title="Show drinks that require manual preparation"
      >
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-primary"></span>
          Manual
        </span>
      </button>
      <button
        className={`btn btn-sm h-10 ${filters.fabricable ? 'btn-primary' : 'btn-outline'} transition-colors`}
        onClick={() => onFilterChange('fabricable')}
        title="Show only drinks that can be made right now"
      >
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-primary"></span>
          Available
        </span>
      </button>
    </div>
    {(filters.automatic || filters.manual || filters.fabricable) && (
      <button
        className="btn btn-ghost btn-sm h-10 text-error hover:bg-error/10 transition-colors"
        onClick={() => onFilterChange('clear')}
      >
        Clear Filters
      </button>
    )}
  </div>
));

export default FilterButtons;
