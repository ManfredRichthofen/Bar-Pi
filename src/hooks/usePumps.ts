import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import PumpService from '../services/pump.service';
import useAuthStore from '../store/authStore';
import { usePumpStore } from '../store/pumpStore';

export const pumpsQueryKey = ['pumps'] as const;

export function usePumps() {
  const token = useAuthStore((state) => state.token);
  const setPumps = usePumpStore((state) => state.setPumps);
  const pumps = usePumpStore((state) => state.pumps);

  const query = useQuery({
    queryKey: pumpsQueryKey,
    queryFn: () => PumpService.getAllPumps(token),
    enabled: !!token,
  });

  // Keep pumpStore in sync for WebSocket / local mutations (add/update/remove)
  useEffect(() => {
    if (query.data) {
      setPumps(query.data);
    }
  }, [query.data, setPumps]);

  return {
    pumps,
    loading: query.isLoading || query.isPending,
    error: query.error ? (query.error as Error).message : null,
    refetch: query.refetch,
    query,
  };
}
