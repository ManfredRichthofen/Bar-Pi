import { Filter } from 'lucide-react';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCollectionsList } from '@/hooks/useCollections';
import { FILTER_GROUPS, hasActiveClientFilters } from '@/utils/recipeFilters';

const ALL_COLLECTIONS = 'all';

const FilterPanel = React.memo(
  ({
    filters,
    onFilterChange,
    onCollectionChange,
    onTogglePanel,
    variant = 'simple', // layout only: 'simple' or 'advanced'
    showCloseButton = true,
    className = '',
    id,
  }) => {
    const { t } = useTranslation();
    const { data: collections = [] } = useCollectionsList();
    const isSimple = variant === 'simple';
    const hasActiveFilters =
      hasActiveClientFilters(filters) || filters.collectionId != null;

    const filterLabels = {
      automatic: t('filters.automatic', 'Automatic'),
      manual: t('filters.manual', 'Needs hands-on steps'),
      available: t('filters.available', 'In stock'),
      fabricable: t('filters.fabricable', 'Craftable'),
      alcoholic: t('filters.alcoholic', 'Alcoholic'),
      nonAlcoholic: t('filters.non_alcoholic', 'Non-alcoholic'),
      favorited: t('filters.favorited', 'Favorites only'),
    };

    const filterDescriptions = {
      automatic: t(
        'filters.automatic_description',
        'The pumps make it all, nothing to add by hand',
      ),
      manual: t(
        'filters.manual_description',
        'You add at least one ingredient by hand',
      ),
      available: t(
        'filters.available_description',
        'Every ingredient is on a pump or marked in the bar',
      ),
      fabricable: t(
        'filters.fabricable_description',
        'Verified makeable right now: nothing missing and every automated ingredient is on a pump',
      ),
      alcoholic: t('filters.alcoholic_description', 'Contains alcohol'),
      nonAlcoholic: t('filters.non_alcoholic_description', 'No alcohol'),
      favorited: t('filters.favorited_description', 'Only drinks you favorited'),
    };

    const groupLabels = {
      alcohol: t('filters.group_alcohol', 'Alcohol'),
      preparation: t('filters.group_preparation', 'Preparation'),
      stock: t('filters.group_stock', 'Ingredients'),
      other: t('filters.group_other', 'Other'),
    };

    const renderFilterButton = (filter) => {
      const isActive = !!filters[filter];
      return (
        <Button
          key={filter}
          variant={isActive ? 'default' : 'outline'}
          size={isSimple ? 'default' : 'sm'}
          onClick={() => onFilterChange(filter)}
          className={isSimple ? 'min-h-control-md' : 'min-h-control-sm'}
          title={filterDescriptions[filter]}
          aria-pressed={isActive}
        >
          {filterLabels[filter]}
        </Button>
      );
    };

    const renderGroup = (group) => {
      const active = group.filters.find((filter) => filters[filter]);
      return (
        <div key={group.id} className="space-y-1.5">
          {group.id !== 'other' && (
            <div className="text-sm font-medium">{groupLabels[group.id]}</div>
          )}
          <div className="flex flex-wrap gap-2">
            {group.filters.map(renderFilterButton)}
          </div>
          {active && (
            <p className="text-sm text-foreground-muted">
              {filterDescriptions[active]}
            </p>
          )}
        </div>
      );
    };

    const selectedCollection = collections.find(
      (collection) => collection.id === filters.collectionId,
    );

    const collectionSelect = collections.length > 0 && (
      <div className="space-y-1.5">
        <div className="text-sm font-medium">
          {t('filters.collection', 'Collection')}
        </div>
        <Select
          value={
            filters.collectionId != null
              ? String(filters.collectionId)
              : ALL_COLLECTIONS
          }
          onValueChange={(value) =>
            onCollectionChange(value === ALL_COLLECTIONS ? null : Number(value))
          }
        >
          <SelectTrigger className="w-56">
            <SelectValue>
              {selectedCollection?.name ??
                t('filters.all_collections', 'All collections')}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_COLLECTIONS}>
              {t('filters.all_collections', 'All collections')}
            </SelectItem>
            {collections.map((collection) => (
              <SelectItem key={collection.id} value={String(collection.id)}>
                {collection.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );

    const body = (
      <div className="grid gap-4 sm:grid-cols-2">
        {FILTER_GROUPS.map(renderGroup)}
        {collectionSelect}
      </div>
    );

    if (isSimple) {
      return (
        <section
          id={id}
          aria-label={t('filters.title', 'Filters')}
          className={`flex flex-col gap-4 ${className}`}
        >
          {body}
          {hasActiveFilters && (
            <Button
              variant="ghost"
              className="text-danger self-start"
              onClick={() => onFilterChange('clear')}
            >
              {t('filters.clear', 'Clear Filters')}
            </Button>
          )}
        </section>
      );
    }

    return (
      <div
        id={id}
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
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onFilterChange('clear')}
                className="text-foreground-muted hover:text-foreground transition-colors"
              >
                {t('filters.clear_all', 'Clear All')}
              </Button>
            )}
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
        {body}
      </div>
    );
  },
);

FilterPanel.displayName = 'FilterPanel';

export default FilterPanel;
