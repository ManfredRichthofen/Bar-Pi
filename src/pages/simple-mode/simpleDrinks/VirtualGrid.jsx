import { useTranslation } from 'react-i18next';
import VirtualRecipesGrid from '@/components/drinks/VirtualRecipesGrid.jsx';
import EmptyState from './EmptyState.jsx';
import SimpleDrinkCard from './simpleDrinkCard.jsx';
import SimpleDrinkCardSkeleton from './simpleDrinkCardSkeleton.jsx';

function VirtualGrid({
  fabricableRecipes,
  onCardClick,
  token,
  searchTerm,
  filters,
  onCheckFabricability,
  onFilterRecipes,
  onClearFilters,
}) {
  const { t } = useTranslation();
  return (
    <VirtualRecipesGrid
      token={token}
      searchTerm={searchTerm}
      filters={filters}
      fabricableRecipes={fabricableRecipes}
      onCheckFabricability={onCheckFabricability}
      onFilterRecipes={onFilterRecipes}
      mode="simple"
      loadingLabel={t('simple_drinks.loading', 'Loading drinks...')}
      noMoreLabel={t('simple_drinks.no_more', "That's every drink")}
      renderError={({ retry }) => <EmptyState type="error" onRetry={retry} />}
      renderCard={({ recipe }) => (
        <SimpleDrinkCard recipe={recipe} onCardClick={onCardClick} />
      )}
      renderSkeleton={() => <SimpleDrinkCardSkeleton />}
      renderEmpty={({ searchTerm: term, filters: activeFilters }) => (
        <EmptyState
          type={
            term || Object.values(activeFilters).some(Boolean)
              ? 'no-results'
              : 'no-drinks'
          }
          onClearFilters={onClearFilters}
        />
      )}
    />
  );
}

export default VirtualGrid;
