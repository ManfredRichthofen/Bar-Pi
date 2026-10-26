import { isRedirect, redirect } from '@tanstack/react-router';
import { currentUserQueryKey, fetchCurrentUser } from '../hooks/useCurrentUser';
import { queryClient } from '../lib/queryClient';
import useAuthStore from '../store/authStore';
import {
  hasPermission,
  mapAdminLevelToRole,
  type RolePermissions,
} from './roleAccess';

/**
 * TanStack Router beforeLoad guard that requires a permission.
 * Shares cache with useCurrentUser via queryClient.fetchQuery.
 */
export async function requirePermission(
  permission: keyof RolePermissions,
): Promise<void> {
  const token = useAuthStore.getState().token;
  if (!token) {
    throw redirect({ to: '/login' });
  }

  try {
    const userData = await queryClient.fetchQuery({
      queryKey: currentUserQueryKey,
      queryFn: fetchCurrentUser,
    });
    const role = mapAdminLevelToRole(userData.adminLevel);

    if (!hasPermission(role, permission)) {
      throw redirect({ to: '/drinks' });
    }
  } catch (error) {
    if (isRedirect(error)) {
      throw error;
    }

    if (error instanceof Error && 'response' in error) {
      const response = (error as { response?: { status?: number } }).response;
      if (response?.status === 401) {
        throw redirect({ to: '/login' });
      }
    }
    throw redirect({ to: '/drinks' });
  }
}
