import { createFileRoute } from '@tanstack/react-router';
import { NewRecipePage } from '../pages/AdvancedMode/RecipesPage/CreateRecipe';

export const Route = createFileRoute('/_advanced/recipes/new')({
  component: NewRecipePage,
});
