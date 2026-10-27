import { createFileRoute, Outlet, useMatches } from '@tanstack/react-router';
import Recipes from '../pages/AdvancedMode/RecipesPage/recipes';
import { requirePermission } from '../utils/requirePermission';

export const Route = createFileRoute('/_advanced/recipes')({
  component: AdvancedRecipesRoute,
  beforeLoad: () => requirePermission('canManageRecipes'),
});

function AdvancedRecipesRoute() {
  const matches = useMatches();
  const isChildRoute = matches.some(
    (match) =>
      match.id.includes('/new') || match.id.includes('/$recipeId/edit'),
  );

  // If we're on a child route (like new or edit), show the Outlet
  // Otherwise show the recipes list page
  if (isChildRoute) {
    return <Outlet />;
  }

  return <Recipes />;
}
