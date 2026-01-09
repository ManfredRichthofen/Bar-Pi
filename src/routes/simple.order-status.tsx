import { createFileRoute } from '@tanstack/react-router';
import SimpleOrderStatus from '../pages/simple-mode/simpleOrderStatus/simpleOrderStatus';

export const Route = createFileRoute('/simple/order-status')({
  component: SimpleOrderStatus,
});
