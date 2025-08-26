import { createFileRoute } from '@tanstack/react-router';
import SimpleDrinks from '../pages/simple-mode/simpleDrinks/simpleDrinks';

export const Route = createFileRoute('/simple/drinks')({
  component: SimpleDrinksRoute,
});

function SimpleDrinksRoute() {
  return <SimpleDrinks />;
}
