import { Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import VirtualRecipesGrid from '@/components/drinks/VirtualRecipesGrid.jsx';
import { Card, CardContent } from '@/components/ui/card';
import DrinkCard from './DrinkCard.jsx';

function AdvancedSkeleton() {
  return (
    <Card className="animate-pulse">
      <CardContent className="p-4">
        <div className="h-4 bg-surface-sunken rounded mb-2"></div>
        <div className="h-3 bg-surface-sunken rounded mb-1"></div>
        <div className="h-3 bg-surface-sunken rounded w-2/3"></div>
      </CardContent>
    </Card>
  );
}

function VirtualDrinksGrid({
  token,
  searchTerm,
  collapsed = false,
  filters,
  fabricableRecipes,
  onCheckFabricability,
  onFilterRecipes,
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
      mode="advanced"
      collapsed={collapsed}
      loadingLabel={t('virtual_drinks_grid.loading_drinks')}
      noMoreLabel={t('virtual_drinks_grid.no_more_drinks')}
      renderCard={({ recipe }) => <DrinkCard recipe={recipe} />}
      renderSkeleton={() => <AdvancedSkeleton />}
      renderEmpty={() => (
        <div className="flex flex-col items-center justify-center py-12 px-4">
          <div className="text-foreground-muted mb-4">
            <Search className="w-16 h-16" />
          </div>
          <h3 className="text-lg font-semibold mb-2">
            {t('virtual_drinks_grid.no_drinks_found')}
          </h3>
          <p className="text-foreground-muted text-center text-sm">
            {t('virtual_drinks_grid.try_adjusting_search')}
          </p>
        </div>
      )}
    />
  );
}

export default VirtualDrinksGrid;
