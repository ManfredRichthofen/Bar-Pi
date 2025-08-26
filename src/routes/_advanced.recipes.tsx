import { createFileRoute } from '@tanstack/react-router';
import Recipes from '../pages/recipes';

export const Route = createFileRoute('/_advanced/recipes')({
  component: Recipes,
});
