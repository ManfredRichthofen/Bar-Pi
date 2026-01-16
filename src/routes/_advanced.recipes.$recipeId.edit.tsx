import { createFileRoute } from '@tanstack/react-router';
import RecipeEditPage from '../pages/AdvancedMode/RecipesPage/EditRecipe.jsx';

export const Route = createFileRoute('/_advanced/recipes/$recipeId/edit')({
  component: RecipeEditPage,
});
