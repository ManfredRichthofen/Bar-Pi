import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import StatisticsService, {
  type StatisticsOverview,
} from '../services/statistics.service';
import useAuthStore from '../store/authStore';

export const statisticsQueryKey = (days: number) =>
  ['statistics', 'overview', days] as const;

export function useStatistics(days = 14) {
  const token = useAuthStore((state) => state.token);
  const queryClient = useQueryClient();

  const query = useQuery<StatisticsOverview>({
    queryKey: statisticsQueryKey(days),
    queryFn: () => StatisticsService.getOverview(days, token),
    enabled: Boolean(token),
    staleTime: 15_000,
  });

  const clearHistoryMutation = useMutation({
    mutationFn: () => StatisticsService.clearOrderHistory(token),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['statistics'] });
    },
  });

  return {
    statistics: query.data ?? null,
    loading: query.isLoading,
    fetching: query.isFetching,
    error:
      query.error instanceof Error
        ? query.error.message
        : query.error
          ? String(query.error)
          : null,
    refetch: query.refetch,
    clearHistory: clearHistoryMutation.mutateAsync,
    clearingHistory: clearHistoryMutation.isPending,
  };
}
