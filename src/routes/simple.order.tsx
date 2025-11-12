import { createFileRoute } from '@tanstack/react-router';
import SimpleOrder from '../pages/simple-mode/simpleOrder/simpleOrder';

export const Route = createFileRoute('/simple/order')({
  component: SimpleOrderRoute,
});

function SimpleOrderRoute() {
  return <SimpleOrder />;
}
