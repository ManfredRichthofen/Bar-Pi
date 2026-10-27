import { createFileRoute, Outlet, useMatches } from '@tanstack/react-router';
import { PumpsPage } from '../pages/AdvancedMode/PumpsPage/PumpsPage';
import { requirePermission } from '../utils/requirePermission';

export const Route = createFileRoute('/_advanced/pumps')({
  component: AdvancedPumpsRoute,
  beforeLoad: () => requirePermission('canManagePumps'),
});

function AdvancedPumpsRoute() {
  const matches = useMatches();
  const isChildRoute = matches.some((match) =>
    match.id.includes('/$pumpId/edit'),
  );

  // If we're on a child route (like edit), show the Outlet
  // Otherwise show the pumps list page
  if (isChildRoute) {
    return <Outlet />;
  }

  return <PumpsPage />;
}
