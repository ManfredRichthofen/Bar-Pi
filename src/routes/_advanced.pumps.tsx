import {
  createFileRoute,
  redirect,
  Outlet,
  useMatches,
} from '@tanstack/react-router';
import { PumpsPage } from '../pages/AdvancedMode/PumpsPage/PumpsPage';
import useAuthStore from '../store/authStore';
import userService from '../services/user.service';
import { hasPermission, mapAdminLevelToRole } from '../utils/roleAccess';

export const Route = createFileRoute('/_advanced/pumps')({
  component: AdvancedPumpsRoute,
  beforeLoad: async () => {
    const token = useAuthStore.getState().token;
    if (!token) {
      throw redirect({ to: '/login' });
    }

    try {
      const headers = { Authorization: `Bearer ${token}` };
      const userData = await userService.getMe(headers);
      const role = mapAdminLevelToRole(userData.adminLevel);

      if (!hasPermission(role, 'canManagePumps')) {
        throw redirect({ to: '/drinks' });
      }
    } catch (error) {
      if (error instanceof Error && 'response' in error) {
        const response = error.response as any;
        if (response?.status === 401) {
          throw redirect({ to: '/login' });
        }
      }
      throw redirect({ to: '/drinks' });
    }
  },
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
