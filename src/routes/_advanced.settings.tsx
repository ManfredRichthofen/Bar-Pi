import { createFileRoute, redirect } from '@tanstack/react-router';
import { SettingsPage } from '../pages/AdvancedMode/SettingsPage/SettingsPage';
import useAuthStore from '../store/authStore';
import userService from '../services/user.service';
import { hasPermission } from '../utils/roleAccess';

export const Route = createFileRoute('/_advanced/settings')({
  component: AdvancedSettingsRoute,
  beforeLoad: async () => {
    const token = useAuthStore.getState().token;
    if (!token) {
      throw redirect({ to: '/login' });
    }

    try {
      const headers = { Authorization: `Bearer ${token}` };
      const userData = await userService.getMe(headers);
      
      if (!hasPermission(userData.role, 'canManageSettings')) {
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

function AdvancedSettingsRoute() {
  return <SettingsPage />;
}
