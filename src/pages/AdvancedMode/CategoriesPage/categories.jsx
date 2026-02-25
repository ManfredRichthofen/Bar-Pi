import { Navigate } from '@tanstack/react-router';
import { Edit, FolderOpen, PlusCircle, Trash2 } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  PageHeader,
  EmptyState,
  ListCard,
  ActionButtons,
  LoadingState,
} from '@/components/AdvancedMode';
import CategoryService from '@/services/category.service';
import useAuthStore from '../../../store/authStore';
import { CategoryFormModal } from './components/CategoryFormModal';
import { DeleteCategoryDialog } from './components/DeleteCategoryDialog';

const Categories = ({ sidebarCollapsed = false }) => {
  const token = useAuthStore((state) => state.token);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState(null);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await CategoryService.getAllCategories(token);
      setCategories(data || []);
    } catch (err) {
      setError('Failed to load categories');
      toast.error('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

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
      if (editingCategory) {
        await CategoryService.updateCategory({
          id: editingCategory.id,
          name: name,
        }, token);
        toast.success('Category updated successfully');
      } else {
        await CategoryService.createCategory(name, token);
        toast.success('Category created successfully');
      }
      setIsModalOpen(false);
      setEditingCategory(null);
      await loadCategories();
    } catch (err) {
      const errorMsg = err.response?.data?.message || 
        `Failed to ${editingCategory ? 'update' : 'create'} category`;
      setError(errorMsg);
      toast.error(errorMsg);
    }
  };

  const confirmDelete = async () => {
    if (!categoryToDelete) return;

    try {
      setError('');
      await CategoryService.deleteCategory(categoryToDelete.id, token);
      toast.success('Category deleted successfully');
      setDeleteConfirmOpen(false);
      setCategoryToDelete(null);
      await loadCategories();
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to delete category';
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
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Category
          </Button>
        }
      />

      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 md:py-8">
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
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
                    <Badge variant="secondary" className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5">
                      ID: {category.id}
                    </Badge>
                  }
                  actions={
                    <ActionButtons
                      actions={[
                        {
                          icon: <Edit className="h-4 w-4" />,
                          label: 'Edit category',
                          onClick: (e) => {
                            e.stopPropagation();
                            handleEdit(category);
                          },
                        },
                        {
                          icon: <Trash2 className="h-4 w-4 text-destructive" />,
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
