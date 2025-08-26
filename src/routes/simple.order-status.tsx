import { createFileRoute } from '@tanstack/react-router';
import SimpleOrderStatus from '../pages/simple-mode/simpleOrderStatus';

export const Route = createFileRoute('/simple/order-status')({
  component: SimpleOrderStatusRoute,
});

function SimpleOrderStatusRoute() {
  return <SimpleOrderStatus />;
}
