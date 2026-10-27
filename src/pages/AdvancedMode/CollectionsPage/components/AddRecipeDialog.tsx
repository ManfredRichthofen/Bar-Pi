import { useQuery } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import type React from 'react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import RecipeService from '../../../../services/recipe.service';
import useAuthStore from '../../../../store/authStore';

interface AddRecipeDialogProps {
  open: boolean;
  existingRecipeIds: Set<number>;
  onClose: () => void;
  onAdd: (recipeId: number) => void;
}

export const AddRecipeDialog: React.FC<AddRecipeDialogProps> = ({
  open,
  existingRecipeIds,
  onClose,
  onAdd,
}) => {
  const token = useAuthStore((state) => state.token);
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');

  useEffect(() => {
    if (!open) setSearch('');
  }, [open]);

  useEffect(() => {
    const handle = setTimeout(() => setDebounced(search.trim()), 250);
    return () => clearTimeout(handle);
  }, [search]);

  const { data, isLoading } = useQuery({
    queryKey: ['collection-add-recipe-search', debounced],
    queryFn: () =>
      RecipeService.getRecipes(
        0,
        null,
        null,
        null,
        null,
        debounced || null,
        null,
        null,
        token,
        false,
      ),
    enabled: open && !!token,
  });

  const recipes: { id: number; name: string }[] = data?.content ?? [];

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add recipe</DialogTitle>
        </DialogHeader>
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search recipes"
          autoFocus
        />
        <div className="max-h-80 space-y-1 overflow-y-auto">
          {isLoading ? (
            <Skeleton className="h-32 w-full" />
          ) : recipes.length === 0 ? (
            <p className="py-6 text-center text-foreground-muted">
              No recipes found.
            </p>
          ) : (
            recipes.map((recipe) => {
              const added = existingRecipeIds.has(recipe.id);
              return (
                <div
                  key={recipe.id}
                  className="flex items-center justify-between gap-3 rounded-lg px-3 py-2 hover:bg-surface-sunken"
                >
                  <span className="truncate">{recipe.name}</span>
                  <Button
                    size="sm"
                    variant={added ? 'ghost' : 'outline'}
                    disabled={added}
                    onClick={() => onAdd(recipe.id)}
                  >
                    {added ? 'Added' : <Plus />}
                  </Button>
                </div>
              );
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
