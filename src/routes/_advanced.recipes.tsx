import { createFileRoute } from '@tanstack/react-router';
import Recipes from '../pages/AdvancedMode/RecipesPage/recipes.jsx';

export const Route = createFileRoute('/_advanced/recipes')({
  component: Recipes,
});
