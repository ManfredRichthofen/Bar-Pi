import { createFileRoute } from '@tanstack/react-router';
import { PumpsPage } from '../pages/AdvancedMode/PumpsPage/PumpsPage';

export const Route = createFileRoute('/_advanced/pumps')({
  component: AdvancedPumpsRoute,
});

function AdvancedPumpsRoute() {
  return <PumpsPage />;
}
