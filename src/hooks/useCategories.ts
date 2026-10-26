import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import CategoryService from '../services/category.service';
import useAuthStore from '../store/authStore';

export const categoriesQueryKey = ['categories'] as const;

export function useCategories() {
  const token = useAuthStore((state) => state.token);

  return useQuery({
    queryKey: categoriesQueryKey,
    queryFn: () => CategoryService.getAllCategories(token),
    enabled: !!token,
  });
}

export function useCategoryMutations() {
  const queryClient = useQueryClient();
  const token = useAuthStore((state) => state.token);

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: categoriesQueryKey });

  const saveCategory = useMutation({
    mutationFn: async ({
      name,
      editingCategory,
    }: {
      name: string;
      editingCategory: { id: number; name: string } | null;
    }) => {
      if (editingCategory) {
        return CategoryService.updateCategory(
          { id: editingCategory.id, name },
          token,
        );
      }
      return CategoryService.createCategory(name, token);
    },
    onSuccess: invalidate,
  });

  const deleteCategory = useMutation({
    mutationFn: (id: number) => CategoryService.deleteCategory(id, token),
    onSuccess: invalidate,
  });

  return { saveCategory, deleteCategory, invalidate };
}
