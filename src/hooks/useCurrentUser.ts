import { useQuery } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { useEffect } from 'react';
import { toast } from 'sonner';
import userService from '../services/user.service';
import useAuthStore from '../store/authStore';
import type { User } from '../types/user';

export const currentUserQueryKey = ['currentUser'] as const;

export async function fetchCurrentUser(): Promise<User> {
  return userService.getMe() as Promise<User>;
}

export function useCurrentUser(options?: { logoutOn401?: boolean }) {
  const { logoutOn401 = false } = options ?? {};
  const token = useAuthStore((state) => state.token);
  const logoutUser = useAuthStore((state) => state.logoutUser);
  const navigate = useNavigate();

  const query = useQuery({
    queryKey: currentUserQueryKey,
    queryFn: fetchCurrentUser,
    enabled: !!token,
  });

  useEffect(() => {
    if (!logoutOn401 || !query.error) return;

    const error = query.error;
    if (
      error instanceof Error &&
      'response' in error &&
      typeof error.response === 'object' &&
      error.response &&
      'status' in error.response &&
      error.response.status === 401
    ) {
      logoutUser();
      navigate({ to: '/login', replace: true });
      toast.error('Failed to load user information');
    }
  }, [logoutOn401, query.error, logoutUser, navigate]);

  return {
    user: query.data ?? null,
    loading: query.isLoading || query.isPending,
    error: query.error,
    refetch: query.refetch,
  };
}
