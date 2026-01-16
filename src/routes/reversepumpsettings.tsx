import { createFileRoute, redirect } from '@tanstack/react-router';
import ReversePumping from '../pages/AdvancedMode/PumpsPage/components/reversePumping';
import useAuthStore from '../store/authStore';

export const Route = createFileRoute('/reversepumpsettings')({
  component: ReversePumping,
  beforeLoad: () => {
    const token = useAuthStore.getState().token;
    if (!token) {
      throw redirect({ to: '/login' });
    }
  },
});
