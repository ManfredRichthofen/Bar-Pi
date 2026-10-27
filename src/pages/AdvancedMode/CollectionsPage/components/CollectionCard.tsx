import { Link } from '@tanstack/react-router';
import { ChevronsUpDown, Library, Pencil, Plus, Trash2, X } from 'lucide-react';
import type React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import type { Collection } from '../../../../services/collection.service';

interface CollectionCardProps {
  collection: Collection;
  canEdit: boolean;
  onEdit: (collection: Collection) => void;
  onDelete: (collection: Collection) => void;
  onAddRecipe: (collection: Collection) => void;
  onRemoveRecipe: (collection: Collection, recipeId: number) => void;
}

export const CollectionCard: React.FC<CollectionCardProps> = ({
  collection,
  canEdit,
  onEdit,
  onDelete,
  onAddRecipe,
  onRemoveRecipe,
}) => {
  const recipes = collection.recipes ?? [];

  return (
    <Card>
      <Collapsible>
        <CardHeader className="border-b">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <Library className="size-6 shrink-0 text-foreground-muted" />
              <div className="min-w-0">
                <CardTitle className="truncate text-lg font-bold">
                  {collection.name}
                </CardTitle>
                <p className="truncate text-sm text-foreground-muted">
                  {collection.description ||
                    `By ${collection.owner?.username ?? 'unknown'}`}
                </p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <Badge variant="secondary">
                {recipes.length} {recipes.length === 1 ? 'recipe' : 'recipes'}
              </Badge>
              {canEdit && (
                <>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    title="Edit"
                    onClick={() => onEdit(collection)}
                  >
                    <Pencil className="size-5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    title="Delete"
                    onClick={() => onDelete(collection)}
                  >
                    <Trash2 className="size-5 text-danger" />
                  </Button>
                </>
              )}
              <CollapsibleTrigger className="inline-flex h-8 w-8 items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-primary-tint hover:text-primary-tint-ink">
                <ChevronsUpDown className="size-5" />
                <span className="sr-only">Toggle recipes</span>
              </CollapsibleTrigger>
            </div>
          </div>
        </CardHeader>
        <CollapsibleContent>
          <CardContent className="space-y-1 pt-4">
            {recipes.length === 0 && (
              <p className="text-sm text-foreground-muted">
                No recipes in this collection yet.
              </p>
            )}
            {recipes.map((recipe) => (
              <div
                key={recipe.id}
                className="flex items-center justify-between gap-3 rounded-lg px-3 py-2 hover:bg-surface-sunken"
              >
                <Link
                  to="/drinks/$recipeId"
                  params={{ recipeId: String(recipe.id) }}
                  className="truncate font-medium hover:underline"
                >
                  {recipe.name}
                </Link>
                {canEdit && (
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    title="Remove from collection"
                    onClick={() => onRemoveRecipe(collection, recipe.id)}
                  >
                    <X className="size-5" />
                  </Button>
                )}
              </div>
            ))}
            {canEdit && (
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => onAddRecipe(collection)}
              >
                <Plus />
                Add recipe
              </Button>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};
