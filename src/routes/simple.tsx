import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';
import SimpleLayout from '../components/simple-mode/simpleLayout';
import useAuthStore from '../store/authStore';
import useUIModeStore from '../store/uiModeStore';

export const Route = createFileRoute('/simple')({
  component: SimpleModeLayout,
  beforeLoad: () => {
    // Check authentication
    const authStore = useAuthStore.getState();
    if (!authStore.token) {
      throw redirect({ to: '/login' });
    }

    // Check if user is in advanced mode
    const uiModeStore = useUIModeStore.getState();
    if (uiModeStore.isAdvancedMode) {
      throw redirect({ to: '/drinks' });
    }
  },
});

function SimpleModeLayout() {
  return (
    <SimpleLayout>
      <Outlet />
    </SimpleLayout>
  );
}
