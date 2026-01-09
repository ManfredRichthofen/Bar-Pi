import { createFileRoute } from '@tanstack/react-router';
import RecipeEditPage from '../pages/AdvancedMode/RecipesPage/RecipeEditPage';

export const Route = createFileRoute('/_advanced/recipes/$recipeId/edit')({
  component: RecipeEditRoute,
});

function RecipeEditRoute() {
  return <RecipeEditPage />;
}
