import SystemService from '../services/system.service';
import useAuthStore from '../store/authStore';
import useCocktailProgressStore from '../store/cocktailProgressStore';

/**
 * If a drink just completed and ordering policy requires PIN afterward,
 * clear the session (keeping the API URL) and send the user to login.
 * @returns {Promise<boolean>} true when the session was cleared
 */
export async function enforcePinAfterDrinkIfRequired(navigate) {
  const { pendingPinAfterDrink, clearPendingPinAfterDrink } =
    useCocktailProgressStore.getState();

  if (!pendingPinAfterDrink) {
    return false;
  }

  const token = useAuthStore.getState().token;
  if (!token) {
    clearPendingPinAfterDrink();
    return false;
  }

  let requirePin = false;
  try {
    const [policy, loginSettings] = await Promise.all([
      SystemService.getOrderingPolicy(token),
      SystemService.getLoginSettings().catch(() => null),
    ]);
    requirePin =
      !!policy?.requirePinAfterDrink && !!loginSettings?.pinLoginEnabled;
  } catch (error) {
    console.error('Failed to load ordering policy:', error);
    return false;
  }

  clearPendingPinAfterDrink();

  if (!requirePin) {
    return false;
  }

  useAuthStore.getState().logoutUser({ keepApiUrl: true });
  if (navigate) {
    navigate({ to: '/login' });
  }
  return true;
}
