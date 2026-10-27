import { Library, PlusCircle } from 'lucide-react';
import type React from 'react';
import { useState } from 'react';
import {
  EmptyState,
  LoadingState,
  PageHeader,
} from '@/components/AdvancedMode';
import { Button } from '@/components/ui/button';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { toast } from '@/components/ui/toast';
import {
  useCollectionMutations,
  useCollectionsList,
} from '../../../hooks/useCollections';
import { useCurrentUser } from '../../../hooks/useCurrentUser';
import type {
  Collection,
  CollectionInput,
} from '../../../services/collection.service';
import { mapAdminLevelToRole } from '../../../utils/roleAccess';
import { AddRecipeDialog } from './components/AddRecipeDialog';
import { CollectionCard } from './components/CollectionCard';
import { CollectionFormDialog } from './components/CollectionFormDialog';

const errorMessage = (error: unknown, fallback: string): string => {
  const err = error as {
    response?: { data?: { message?: string } };
    message?: string;
  };
  return err?.response?.data?.message || err?.message || fallback;
};

export const CollectionsPage: React.FC = () => {
  const { data: collections = [], isLoading } = useCollectionsList();
  const { saveCollection, deleteCollection, addRecipe, removeRecipe } =
    useCollectionMutations();
  const { user } = useCurrentUser();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Collection | null>(null);
  const [toDelete, setToDelete] = useState<Collection | null>(null);
  const [addingTo, setAddingTo] = useState<Collection | null>(null);

  const isAdmin = ['admin', 'super-admin'].includes(
    mapAdminLevelToRole(user?.adminLevel),
  );
  const canEdit = (c: Collection) => isAdmin || c.ownerId === user?.id;

  // Keep the dialog's "already added" state in sync after each add.
  const addingToLive =
    collections.find((c) => c.id === addingTo?.id) ?? addingTo;

  const openForm = (collection: Collection | null) => {
    setEditing(collection);
    setFormOpen(true);
  };

  const handleSave = async (input: CollectionInput) => {
    try {
      await saveCollection.mutateAsync({ ...input, id: editing?.id });
      toast.success(editing ? 'Collection updated' : 'Collection created');
      setFormOpen(false);
    } catch (error) {
      toast.error(errorMessage(error, 'Failed to save collection'));
    }
  };

  const handleDelete = async () => {
    if (!toDelete) return;
    try {
      await deleteCollection.mutateAsync(toDelete.id);
      toast.success('Collection deleted');
    } catch (error) {
      toast.error(errorMessage(error, 'Failed to delete collection'));
    } finally {
      setToDelete(null);
    }
  };

  const handleAddRecipe = async (recipeId: number) => {
    if (!addingTo) return;
    try {
      await addRecipe.mutateAsync({ collectionId: addingTo.id, recipeId });
    } catch (error) {
      toast.error(errorMessage(error, 'Failed to add recipe'));
    }
  };

  const handleRemoveRecipe = async (
    collection: Collection,
    recipeId: number,
  ) => {
    try {
      await removeRecipe.mutateAsync({
        collectionId: collection.id,
        recipeId,
      });
    } catch (error) {
      toast.error(errorMessage(error, 'Failed to remove recipe'));
    }
  };

  const newButton = (
    <Button onClick={() => openForm(null)}>
      <PlusCircle />
      New collection
    </Button>
  );

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        title="Collections"
        subtitle="Group recipes into your own lists"
        action={newButton}
      />

      <div className="container mx-auto px-4 py-6 sm:px-6 sm:py-8">
        {isLoading ? (
          <LoadingState message="Loading collections..." />
        ) : collections.length === 0 ? (
          <EmptyState
            icon={<Library className="h-16 w-16" />}
            title="No Collections Yet"
            description="Create a collection to group your favourite recipes"
            actions={newButton}
          />
        ) : (
          <div className="mx-auto max-w-3xl space-y-4">
            {collections.map((collection) => (
              <CollectionCard
                key={collection.id}
                collection={collection}
                canEdit={canEdit(collection)}
                onEdit={openForm}
                onDelete={setToDelete}
                onAddRecipe={setAddingTo}
                onRemoveRecipe={handleRemoveRecipe}
              />
            ))}
          </div>
        )}
      </div>

      <CollectionFormDialog
        open={formOpen}
        collection={editing}
        saving={saveCollection.isPending}
        onClose={() => setFormOpen(false)}
        onSave={handleSave}
      />
      <AddRecipeDialog
        open={!!addingTo}
        existingRecipeIds={
          new Set((addingToLive?.recipes ?? []).map((r) => r.id))
        }
        onClose={() => setAddingTo(null)}
        onAdd={handleAddRecipe}
      />
      <ConfirmationDialog
        open={!!toDelete}
        onOpenChange={(o) => !o && setToDelete(null)}
        title="Delete collection"
        description={`Delete "${toDelete?.name}"? The recipes themselves are kept.`}
        confirmText="Delete"
        variant="destructive"
        onConfirm={handleDelete}
      />
    </div>
  );
};
