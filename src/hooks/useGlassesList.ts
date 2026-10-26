import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import GlassService from '../services/glass.service';
import useAuthStore from '../store/authStore';

export const glassesQueryKey = ['glasses'] as const;

export function useGlassesList() {
  const token = useAuthStore((state) => state.token);

  return useQuery({
    queryKey: glassesQueryKey,
    queryFn: () => GlassService.getGlasses(token),
    enabled: !!token,
  });
}

export function useGlassMutations() {
  const queryClient = useQueryClient();

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: glassesQueryKey });

  const saveGlass = useMutation({
    mutationFn: async (glass: { id?: number; [key: string]: unknown }) => {
      if (glass.id) {
        return GlassService.updateGlass(glass);
      }
      return GlassService.createGlass(glass);
    },
    onSuccess: invalidate,
  });

  const deleteGlass = useMutation({
    mutationFn: (id: number) => GlassService.deleteGlass(id),
    onSuccess: invalidate,
  });

  return { saveGlass, deleteGlass, invalidate };
}
