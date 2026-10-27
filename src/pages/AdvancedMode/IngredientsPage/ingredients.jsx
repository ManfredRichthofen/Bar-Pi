import { useQuery } from '@tanstack/react-query';
import { Navigate } from '@tanstack/react-router';
import { Edit, PlusCircle, Trash2 } from 'lucide-react';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { toast } from 'sonner';
import {
  ActionButtons,
  EmptyState,
  ListCard,
  LoadingState,
  PageHeader,
  ScrollToTopButton,
  VirtualizedList,
} from '@/components/AdvancedMode';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import SearchInput from '@/components/ui/search-input.jsx';
import ingredientService from '../../../services/ingredient.service';
import useAuthStore from '../../../store/authStore';
import { IngredientFormDialog } from './components/IngredientFormDialog';

const Ingredients = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const lastScrollYRef = useRef(0);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingIngredient, setEditingIngredient] = useState(null);
  const token = useAuthStore((state) => state.token);

  const { status, data, error, isFetching } = useQuery({
    queryKey: ['ingredients'],
    queryFn: async () => {
      const response = await ingredientService.getIngredients(token);
      return response || [];
    },
    staleTime: 30000,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: 2,
  });

  const ingredients = useMemo(() => {
    if (!data) return [];
    if (!searchTerm) return data;

    const searchLower = searchTerm.toLowerCase();
    return data.filter((ingredient) =>
      ingredient.name.toLowerCase().includes(searchLower),
    );
  }, [data, searchTerm]);

  const openCreateDialog = () => {
    setEditingIngredient(null);
    setIsModalVisible(true);
  };

  const openEditDialog = (ingredient) => {
    setEditingIngredient(ingredient);
    setIsModalVisible(true);
  };

  const handleDelete = async (id) => {
    try {
      await ingredientService.deleteIngredient(id, token);
      toast.success('Ingredient deleted successfully');
      window.location.reload();
    } catch (error) {
      toast.error('Failed to delete ingredient');
    }
  };

  const handleSearch = useCallback((value) => {
    setSearchTerm(value);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const lastY = lastScrollYRef.current;

      if (currentScrollY > lastY && currentScrollY > 100) {
        setIsHeaderVisible(false);
      } else {
        setIsHeaderVisible(true);
      }

      lastScrollYRef.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (!token) {
    return <Navigate to="/login" />;
  }

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        title="Ingredients"
        isVisible={isHeaderVisible}
        action={
          <Button
            onClick={openCreateDialog}
            className="w-full sm:w-auto"
            size="default"
          >
            <PlusCircle className="mr-2 size-6" />
            Add Ingredient
          </Button>
        }
        searchComponent={
          <>
            <SearchInput
              value={searchTerm}
              onChange={handleSearch}
              placeholder="Search ingredients..."
              debounceMs={300}
              inputClassName="pl-10"
            />
            {data && data.length > 0 && (
              <p className="text-sm text-foreground-muted mt-2">
                Showing {ingredients.length} of {data.length} ingredients
              </p>
            )}
          </>
        }
      />

      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 md:py-8">
        {status === 'pending' ? (
          <LoadingState />
        ) : status === 'error' ? (
          <EmptyState
            title="Error Loading Ingredients"
            description={error?.message || 'Failed to load ingredients'}
            variant="error"
          />
        ) : ingredients.length === 0 ? (
          <EmptyState
            title={searchTerm ? 'No Ingredients Found' : 'No Ingredients Found'}
            description={
              searchTerm
                ? `No ingredients found matching "${searchTerm}"`
                : 'Get started by adding your first ingredient to begin managing your inventory'
            }
            variant={searchTerm ? 'search' : 'info'}
            actions={
              <>
                {searchTerm && (
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={() => setSearchTerm('')}
                  >
                    Clear Search
                  </Button>
                )}
                {!searchTerm && (
                  <Button size="lg" onClick={openCreateDialog}>
                    <PlusCircle className="mr-2" />
                    Add First Ingredient
                  </Button>
                )}
              </>
            }
          />
        ) : (
          <div className="space-y-2">
            <VirtualizedList
              items={ingredients}
              estimatedSize={100}
              renderItem={(ingredient) => {
                const parentGroup = ingredient.parentGroupId
                  ? ingredients.find(
                      (ing) => ing.id === ingredient.parentGroupId,
                    )
                  : null;

                return (
                  <div className="px-2 sm:px-4 py-1.5 sm:py-2">
                    <ListCard
                      title={ingredient.name}
                      badges={
                        ingredient.inBar && (
                          <Badge
                            variant="default"
                            className="text-sm flex-shrink-0"
                          >
                            In Bar
                          </Badge>
                        )
                      }
                      metadata={
                        <>
                          <Badge
                            variant={
                              ingredient.type === 'automated'
                                ? 'default'
                                : 'secondary'
                            }
                            className="text-sm"
                          >
                            {ingredient.type === 'automated'
                              ? 'Automated'
                              : 'Manual'}
                          </Badge>
                          {parentGroup && (
                            <Badge variant="outline" className="text-sm">
                              {parentGroup.name}
                            </Badge>
                          )}
                          {ingredient.alcoholContent > 0 && (
                            <span className="text-sm text-foreground-muted">
                              {ingredient.alcoholContent}% ABV
                            </span>
                          )}
                        </>
                      }
                      actions={
                        <ActionButtons
                          actions={[
                            {
                              icon: <Edit className="size-6" />,
                              label: 'Edit ingredient',
                              onClick: (e) => {
                                e.stopPropagation();
                                openEditDialog(ingredient);
                              },
                            },
                            {
                              icon: <Trash2 className="size-6 text-danger" />,
                              label: 'Delete ingredient',
                              onClick: (e) => {
                                e.stopPropagation();
                                handleDelete(ingredient.id);
                              },
                            },
                          ]}
                        />
                      }
                    />
                  </div>
                );
              }}
            />

            {!isFetching && ingredients.length > 0 && (
              <div className="flex items-center justify-center py-8">
                <p className="text-center text-foreground-muted text-sm">
                  Showing all {ingredients.length} ingredients
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      <IngredientFormDialog
        open={isModalVisible}
        onOpenChange={setIsModalVisible}
        editingIngredient={editingIngredient}
        ingredients={ingredients}
        token={token}
      />

      <ScrollToTopButton />
    </div>
  );
};

export default Ingredients;
