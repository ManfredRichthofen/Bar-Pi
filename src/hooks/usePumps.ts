import { useQuery } from '@tanstack/react-query';
import PumpService from '../services/pump.service';
import useAuthStore from '../store/authStore';

export const pumpsQueryKey = ['pumps'] as const;

const NO_PUMPS: any[] = [];

export function usePumps() {
  const token = useAuthStore((state) => state.token);

  const query = useQuery({
    queryKey: pumpsQueryKey,
    queryFn: () => PumpService.getAllPumps(token),
    enabled: !!token,
  });

  return {
    pumps: (query.data as any[] | undefined) ?? NO_PUMPS,
    loading: query.isLoading || query.isPending,
    error: query.error ? (query.error as Error).message : null,
    refetch: query.refetch,
    query,
  };
}
