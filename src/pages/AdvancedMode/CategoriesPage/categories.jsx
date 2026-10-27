import { Navigate } from '@tanstack/react-router';
import { Edit, FolderOpen, PlusCircle, Trash2 } from 'lucide-react';
import React, { useState } from 'react';
import { toast } from '@/components/ui/toast';
import {
  ActionButtons,
  EmptyState,
  ListCard,
  LoadingState,
  PageHeader,
} from '@/components/AdvancedMode';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useCategories, useCategoryMutations } from '@/hooks/useCategories';
import useAuthStore from '../../../store/authStore';
import { CategoryFormModal } from './components/CategoryFormModal';
import { DeleteCategoryDialog } from './components/DeleteCategoryDialog';

const Categories = () => {
  const token = useAuthStore((state) => state.token);
  const {
    data: categories = [],
    isLoading,
    isPending,
    error: queryError,
  } = useCategories();
  const { saveCategory, deleteCategory } = useCategoryMutations();
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState(null);

  const loading = isLoading || isPending;
  const displayError = error || (queryError ? 'Failed to load categories' : '');

  const handleCreate = () => {
    setEditingCategory(null);
    setIsModalOpen(true);
  };

  const handleEdit = (category) => {
    setEditingCategory(category);
    setIsModalOpen(true);
  };

  const handleDelete = (category) => {
    setCategoryToDelete(category);
    setDeleteConfirmOpen(true);
  };

  const handleSubmit = async (name) => {
    try {
      setError('');
      await saveCategory.mutateAsync({ name, editingCategory });
      toast.success(
        editingCategory
          ? 'Category updated successfully'
          : 'Category created successfully',
      );
      setIsModalOpen(false);
      setEditingCategory(null);
    } catch (err) {
      const errorMsg =
        err.response?.data?.message ||
        `Failed to ${editingCategory ? 'update' : 'create'} category`;
      setError(errorMsg);
      toast.error(errorMsg);
    }
  };

  const confirmDelete = async () => {
    if (!categoryToDelete) return;

    try {
      setError('');
      await deleteCategory.mutateAsync(categoryToDelete.id);
      toast.success('Category deleted successfully');
      setDeleteConfirmOpen(false);
      setCategoryToDelete(null);
    } catch (err) {
      const errorMsg =
        err.response?.data?.message || 'Failed to delete category';
      setError(errorMsg);
      toast.error(errorMsg);
    }
  };

  if (!token) {
    return <Navigate to="/login" />;
  }

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        title="Categories"
        action={
          <Button onClick={handleCreate} className="w-full sm:w-auto">
            <PlusCircle className="mr-2 size-6" />
            Add Category
          </Button>
        }
      />

      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 md:py-8">
        {displayError && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{displayError}</AlertDescription>
          </Alert>
        )}

        {loading ? (
          <LoadingState message="Loading categories..." />
        ) : categories.length === 0 ? (
          <EmptyState
            icon={<FolderOpen className="h-16 w-16" />}
            title="No Categories Found"
            description="Get started by creating your first category to organize your drinks"
            actions={
              <Button size="lg" onClick={handleCreate}>
                <PlusCircle className="mr-2" />
                Add First Category
              </Button>
            }
          />
        ) : (
          <div className="space-y-2">
            {categories.map((category) => (
              <div key={category.id} className="px-2 sm:px-4 py-1.5 sm:py-2">
                <ListCard
                  title={category.name}
                  badges={
                    <Badge variant="secondary" className="text-sm">
                      ID: {category.id}
                    </Badge>
                  }
                  actions={
                    <ActionButtons
                      actions={[
                        {
                          icon: <Edit className="size-6" />,
                          label: 'Edit category',
                          onClick: (e) => {
                            e.stopPropagation();
                            handleEdit(category);
                          },
                        },
                        {
                          icon: <Trash2 className="size-6 text-danger" />,
                          label: 'Delete category',
                          onClick: (e) => {
                            e.stopPropagation();
                            handleDelete(category);
                          },
                        },
                      ]}
                    />
                  }
                />
              </div>
            ))}
          </div>
        )}
      </div>

      <CategoryFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingCategory(null);
        }}
        onSubmit={handleSubmit}
        category={editingCategory}
        isEditing={!!editingCategory}
      />

      <DeleteCategoryDialog
        isOpen={deleteConfirmOpen}
        onClose={() => {
          setDeleteConfirmOpen(false);
          setCategoryToDelete(null);
          setError('');
        }}
        onConfirm={confirmDelete}
        category={categoryToDelete}
        error={error}
      />
    </div>
  );
};

export default Categories;
