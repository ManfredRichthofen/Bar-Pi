import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';
import MainLayout from '../components/Layout';
import useAuthStore from '../store/authStore';
import useUIModeStore from '../store/uiModeStore';

export const Route = createFileRoute('/_advanced')({
  component: AdvancedModeLayout,
  beforeLoad: () => {
    // Check authentication
    const authStore = useAuthStore.getState();
    if (!authStore.token) {
      throw redirect({ to: '/login' });
    }

    // Check if user is in simple mode
    const uiModeStore = useUIModeStore.getState();
    if (!uiModeStore.isAdvancedMode) {
      throw redirect({ to: '/simple/drinks' });
    }
  },
});

function AdvancedModeLayout() {
  return (
    <MainLayout>
      <Outlet />
    </MainLayout>
  );
}
