import { createFileRoute, redirect } from '@tanstack/react-router';
import CreateUser from '../pages/AdvancedMode/UsersPage/user';
import useAuthStore from '../store/authStore';
import userService from '../services/user.service';
import { hasPermission, mapAdminLevelToRole } from '../utils/roleAccess';

export const Route = createFileRoute('/_advanced/users')({
  component: AdvancedUsersRoute,
  beforeLoad: async () => {
    const token = useAuthStore.getState().token;
    if (!token) {
      throw redirect({ to: '/login' });
    }

    try {
      const headers = { Authorization: `Bearer ${token}` };
      const userData = await userService.getMe(headers);
      const role = mapAdminLevelToRole(userData.adminLevel);
      
      if (!hasPermission(role, 'canManageUsers')) {
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

function AdvancedUsersRoute() {
  return <CreateUser />;
}
