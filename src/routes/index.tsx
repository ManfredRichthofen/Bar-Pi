import { createFileRoute, Navigate } from '@tanstack/react-router';
import useAuthStore from '../store/authStore';
import useUIModeStore from '../store/uiModeStore';

export const Route = createFileRoute('/')({
  component: IndexRoute,
});

function IndexRoute() {
  const token = useAuthStore((state) => state.token);
  const { isAdvancedMode } = useUIModeStore();

  // If not authenticated, redirect to login
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // Redirect based on mode preference
  return <Navigate to={isAdvancedMode ? '/drinks' : '/simple/drinks'} replace />;
}
