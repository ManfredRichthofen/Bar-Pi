import { createFileRoute } from '@tanstack/react-router';
import Ingredients from '../pages/AdvancedMode/IngredientsPage/ingredients';

export const Route = createFileRoute('/_advanced/ingredients')({
  component: AdvancedIngredientsRoute,
});

function AdvancedIngredientsRoute() {
  return <Ingredients />;
}
