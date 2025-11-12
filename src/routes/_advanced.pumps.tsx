import { createFileRoute } from '@tanstack/react-router';
import Pumps from '../pages/AdvancedMode/PumpsPage/pumps';

export const Route = createFileRoute('/_advanced/pumps')({
  component: AdvancedPumpsRoute,
});

function AdvancedPumpsRoute() {
  return <Pumps />;
}
