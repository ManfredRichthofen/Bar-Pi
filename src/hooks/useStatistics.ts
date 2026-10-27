import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import StatisticsService, {
  isLegacyBackendStatisticsError,
  type StatisticsOverview,
} from '../services/statistics.service';
import useAuthStore from '../store/authStore';
import { useBackendInfo } from './useBackendInfo';

export const statisticsQueryKey = (days: number) =>
  ['statistics', 'overview', days] as const;

export function useStatistics(days = 14) {
  const token = useAuthStore((state) => state.token);
  const queryClient = useQueryClient();
  const {
    backendInfo,
    backendType,
    isGoBackend,
    isOriginalCocktailPi,
    loading: backendLoading,
    refetch: refetchBackendInfo,
  } = useBackendInfo();

  const query = useQuery<StatisticsOverview>({
    queryKey: statisticsQueryKey(days),
    queryFn: () => StatisticsService.getOverview(days, token),
    enabled: Boolean(token) && !isOriginalCocktailPi,
    staleTime: 15_000,
    retry: (failureCount, err) =>
      !isLegacyBackendStatisticsError(err) && failureCount < 2,
  });

  const isLegacyBackend =
    isOriginalCocktailPi || isLegacyBackendStatisticsError(query.error);

  const clearHistoryMutation = useMutation({
    mutationFn: () => StatisticsService.clearOrderHistory(token),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['statistics'] });
    },
  });

  const refetch = async () => {
    await refetchBackendInfo();
    return query.refetch();
  };

  return {
    statistics: query.data ?? null,
    loading: (query.isLoading || backendLoading) && !isLegacyBackend,
    fetching: query.isFetching,
    isLegacyBackend,
    isGoBackend: isGoBackend || Boolean(query.data),
    backendType: isLegacyBackend
      ? 'cocktailpi'
      : query.data
        ? 'go'
        : backendType,
    backendInfo,
    error: isLegacyBackend
      ? null
      : query.error instanceof Error
        ? query.error.message
        : query.error
          ? String(query.error)
          : null,
    refetch,
    clearHistory: clearHistoryMutation.mutateAsync,
    clearingHistory: clearHistoryMutation.isPending,
  };
}
