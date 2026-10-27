import { useQuery } from '@tanstack/react-query';
import SystemService, {
  type BackendInfo,
  type BackendType,
} from '../services/system.service';
import useAuthStore from '../store/authStore';
import useConfigStore from '../store/configStore';

export const backendInfoQueryKey = (apiBaseUrl: string, hasToken: boolean) =>
  ['system', 'backend', apiBaseUrl, hasToken] as const;

export function useBackendInfo() {
  const token = useAuthStore((state) => state.token);
  const apiBaseUrl = useConfigStore((state) => state.apiBaseUrl);

  const query = useQuery<BackendInfo>({
    queryKey: backendInfoQueryKey(apiBaseUrl, Boolean(token)),
    queryFn: () => SystemService.detectBackend(token),
    staleTime: 60_000,
    retry: 1,
  });

  const backendType: BackendType = query.data?.type ?? 'unknown';

  return {
    backendInfo: query.data ?? null,
    backendType,
    isGoBackend: backendType === 'go',
    isOriginalCocktailPi: backendType === 'cocktailpi',
    loading: query.isLoading,
    refetch: query.refetch,
  };
}

export default useBackendInfo;
