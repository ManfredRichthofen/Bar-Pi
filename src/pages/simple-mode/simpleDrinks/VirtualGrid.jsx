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
  return (
    <VirtualRecipesGrid
      token={token}
      searchTerm={searchTerm}
      filters={filters}
      fabricableRecipes={fabricableRecipes}
      onCheckFabricability={onCheckFabricability}
      onFilterRecipes={onFilterRecipes}
      mode="simple"
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
