import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import CollectionService, {
  type CollectionInput,
} from '../services/collection.service';
import useAuthStore from '../store/authStore';

export const collectionsQueryKey = ['collections'] as const;

export function useCollectionsList() {
  const token = useAuthStore((state) => state.token);

  return useQuery({
    queryKey: collectionsQueryKey,
    queryFn: () => CollectionService.getCollections(),
    enabled: !!token,
  });
}

export function useCollectionMutations() {
  const queryClient = useQueryClient();

  const onSuccess = () =>
    queryClient.invalidateQueries({ queryKey: collectionsQueryKey });

  const saveCollection = useMutation({
    mutationFn: ({ id, ...input }: CollectionInput & { id?: number }) =>
      id
        ? CollectionService.updateCollection(id, input)
        : CollectionService.createCollection(input),
    onSuccess,
  });

  const deleteCollection = useMutation({
    mutationFn: (id: number) => CollectionService.deleteCollection(id),
    onSuccess,
  });

  const addRecipe = useMutation({
    mutationFn: (vars: { collectionId: number; recipeId: number }) =>
      CollectionService.addRecipe(vars.collectionId, vars.recipeId),
    onSuccess,
  });

  const removeRecipe = useMutation({
    mutationFn: (vars: { collectionId: number; recipeId: number }) =>
      CollectionService.removeRecipe(vars.collectionId, vars.recipeId),
    onSuccess,
  });

  return { saveCollection, deleteCollection, addRecipe, removeRecipe };
}
