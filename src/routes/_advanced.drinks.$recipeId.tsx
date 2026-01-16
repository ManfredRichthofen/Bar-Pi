import { createFileRoute } from '@tanstack/react-router';
import RecipeDetailPage from '../pages/AdvancedMode/DrinksPage/RecipeDetailPage';

export const Route = createFileRoute('/_advanced/drinks/$recipeId')({
  component: RecipeDetailRoute,
});

function RecipeDetailRoute() {
  return <RecipeDetailPage />;
}
