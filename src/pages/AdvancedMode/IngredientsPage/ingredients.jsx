import { Navigate } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { Edit, Image as ImageIcon, PlusCircle, Trash2, X } from 'lucide-react';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import SearchInput from '@/components/ui/search-input.jsx';
import {
  PageHeader,
  EmptyState,
  ListCard,
  ActionButtons,
  ScrollToTopButton,
  LoadingState,
  VirtualizedList,
} from '@/components/AdvancedMode';
import ingredientService, {
  ingredientDtoMapper,
} from '../../../services/ingredient.service';
import useAuthStore from '../../../store/authStore';

const Ingredients = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const lastScrollYRef = useRef(0);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingIngredient, setEditingIngredient] = useState(null);
  const { register, handleSubmit, setValue, watch, reset } = useForm({
    defaultValues: {
      type: 'manual',
      alcoholContent: 0,
      bottleSize: 0,
      pumpTimeMultiplier: 1,
      unit: 'ml',
      image: null,
      imagePreview: null,
      removeImage: false,
    },
  });
  const token = useAuthStore((state) => state.token);

  // Query for all ingredients
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

  // Client-side filtering for search
  const ingredients = useMemo(() => {
    if (!data) return [];
    if (!searchTerm) return data;

    const searchLower = searchTerm.toLowerCase();
    return data.filter((ingredient) =>
      ingredient.name.toLowerCase().includes(searchLower),
    );
  }, [data, searchTerm]);

  const handleAddEdit = async (values) => {
    try {
      if (!values.name?.trim()) {
        toast.error('Name is required');
        return;
      }

      const processedValues = {
        ...values,
        name: values.name.trim(),
        alcoholContent: values.alcoholContent
          ? parseFloat(values.alcoholContent)
          : 0,
        bottleSize: values.bottleSize ? parseInt(values.bottleSize) : 0,
        pumpTimeMultiplier: values.pumpTimeMultiplier
          ? parseFloat(values.pumpTimeMultiplier)
          : 1,
        parentGroupId: values.parentGroupId || null,
        type: values.type || 'manual',
        unit: values.unit || 'ml',
      };

      if (
        processedValues.alcoholContent < 0 ||
        processedValues.alcoholContent > 100
      ) {
        toast.error('Alcohol content must be between 0 and 100');
        return;
      }

      if (processedValues.bottleSize < 0) {
        toast.error('Bottle size must be positive');
        return;
      }

      if (processedValues.pumpTimeMultiplier <= 0) {
        toast.error('Pump time multiplier must be greater than 0');
        return;
      }

      console.log('Processed values:', processedValues);

      if (editingIngredient) {
        const updateDto =
          ingredientDtoMapper.toIngredientCreateDto(processedValues);
        await ingredientService.updateIngredient(
          editingIngredient.id,
          updateDto,
          values.image,
          token,
          values.removeImage,
        );
        toast.success('Ingredient updated successfully');
      } else {
        const createDto =
          ingredientDtoMapper.toIngredientCreateDto(processedValues);
        console.log('Create DTO:', createDto);
        try {
          const response = await ingredientService.createIngredient(
            createDto,
            values.image,
            token,
          );
          console.log('Create response:', response);
          toast.success('Ingredient added successfully');
        } catch (error) {
          if (error.response?.data?.message) {
            toast.error(`Server error: ${error.response.data.message}`);
          } else if (error.response?.status === 400) {
            toast.error('Invalid input data. Please check all fields.');
          } else {
            toast.error('Failed to create ingredient');
          }
          console.error('Create error details:', {
            data: error.response?.data,
            status: error.response?.status,
            headers: error.response?.headers,
            request: createDto,
          });
          return;
        }
      }

      setIsModalVisible(false);
      reset({
        type: 'manual',
        alcoholContent: 0,
        bottleSize: 0,
        pumpTimeMultiplier: 1,
        unit: 'ml',
        image: null,
        imagePreview: null,
        removeImage: false,
      });
      // Refetch the query to refresh the list
      window.location.reload();
    } catch (error) {
      console.error('Error saving ingredient:', error);
      if (error.response?.data?.message) {
        toast.error(`Error: ${error.response.data.message}`);
      } else {
        toast.error(
          'Failed to save ingredient. Please check your input and try again.',
        );
      }
    }
  };

  const handleDelete = async (id) => {
    try {
      await ingredientService.deleteIngredient(id, token);
      toast.success('Ingredient deleted successfully');
      // Refetch the query to refresh the list
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

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    {
      title: 'Group',
      dataIndex: 'parentGroupId',
      key: 'group',
      render: (parentGroupId) => {
        const parentGroup = ingredients.find((ing) => ing.id === parentGroupId);
        return parentGroup ? <Badge>{parentGroup.name}</Badge> : null;
      },
    },
    {
      title: 'In Bar',
      dataIndex: 'inBar',
      key: 'inBar',
      render: (inBar) => (
        <div className={`badge ${inBar ? 'badge-success' : 'badge-error'}`}>
          {inBar ? 'Yes' : 'No'}
        </div>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => {
              setEditingIngredient(record);
              Object.entries(record).forEach(([key, value]) => {
                setValue(key, value);
              });
              setValue('type', record.type || 'manual');
              setIsModalVisible(true);
            }}
          >
            <Edit size={16} />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => handleDelete(record.id)}
          >
            <Trash2 size={16} className="text-destructive" />
          </Button>
        </div>
      ),
    },
  ];

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
            onClick={() => {
              setEditingIngredient(null);
              reset({
                type: 'manual',
                alcoholContent: 0,
                bottleSize: 0,
                pumpTimeMultiplier: 1,
              });
              setIsModalVisible(true);
            }}
            className="w-full sm:w-auto"
            size="default"
          >
            <PlusCircle className="mr-2 h-4 w-4" />
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
              inputClassName="pl-10 h-10 sm:h-11"
            />
            {data && data.length > 0 && (
              <p className="text-xs sm:text-sm text-muted-foreground mt-2">
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
                  <Button
                    size="lg"
                    onClick={() => {
                      setEditingIngredient(null);
                      reset({
                        type: 'manual',
                        alcoholContent: 0,
                        bottleSize: 0,
                        pumpTimeMultiplier: 1,
                      });
                      setIsModalVisible(true);
                    }}
                  >
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
                            className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 flex-shrink-0"
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
                            className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5"
                          >
                            {ingredient.type === 'automated'
                              ? 'Automated'
                              : 'Manual'}
                          </Badge>
                          {parentGroup && (
                            <Badge
                              variant="outline"
                              className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5"
                            >
                              {parentGroup.name}
                            </Badge>
                          )}
                          {ingredient.alcoholContent > 0 && (
                            <span className="text-xs text-muted-foreground">
                              {ingredient.alcoholContent}% ABV
                            </span>
                          )}
                        </>
                      }
                      actions={
                        <ActionButtons
                          actions={[
                            {
                              icon: <Edit className="h-4 w-4" />,
                              label: 'Edit ingredient',
                              onClick: (e) => {
                                e.stopPropagation();
                                setEditingIngredient(ingredient);
                                Object.entries(ingredient).forEach(
                                  ([key, value]) => {
                                    setValue(key, value);
                                  },
                                );
                                setValue('type', ingredient.type || 'manual');
                                setIsModalVisible(true);
                              },
                            },
                            {
                              icon: (
                                <Trash2 className="h-4 w-4 text-destructive" />
                              ),
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
                <p className="text-center text-muted-foreground text-sm">
                  Showing all {ingredients.length} ingredients
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      <Dialog open={isModalVisible} onOpenChange={setIsModalVisible}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl">
              {editingIngredient ? 'Edit Ingredient' : 'Add Ingredient'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit(handleAddEdit)} className="space-y-8">
            {/* Basic Information Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Basic Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium">
                    Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="e.g., Vodka, Lime Juice"
                    {...register('name', { required: true })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="parentGroup" className="text-sm font-medium">
                    Parent Group
                  </Label>
                  <Select
                    value={watch('parentGroupId')?.toString() || ''}
                    onValueChange={(value) =>
                      setValue('parentGroupId', value ? parseInt(value) : null)
                    }
                  >
                    <SelectTrigger id="parentGroup">
                      <SelectValue placeholder="Select a group (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">None</SelectItem>
                      {ingredients
                        .filter((ing) => ing.type === 'group')
                        .map((group) => (
                          <SelectItem
                            key={group.id}
                            value={group.id.toString()}
                          >
                            {group.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Image Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Image
              </h3>
              <div className="flex items-start gap-6">
                {watch('imagePreview') ? (
                  <div className="relative w-40 h-40 flex-shrink-0">
                    <img
                      src={watch('imagePreview')}
                      alt="Ingredient preview"
                      className="w-full h-full object-cover rounded-lg border-2 border-border"
                    />
                    <Button
                      type="button"
                      size="icon"
                      variant="destructive"
                      className="h-7 w-7 absolute -top-2 -right-2 rounded-full shadow-md"
                      onClick={() => {
                        setValue('image', null);
                        setValue('imagePreview', null);
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-40 h-40 border-2 border-dashed rounded-lg cursor-pointer hover:bg-accent hover:border-primary transition-all flex-shrink-0">
                    <div className="flex flex-col items-center justify-center p-4">
                      <ImageIcon
                        size={32}
                        className="mb-2 text-muted-foreground"
                      />
                      <p className="text-xs text-center text-muted-foreground">
                        <span className="font-semibold">Click to upload</span>
                        <br />
                        PNG, JPG (max 5MB)
                      </p>
                    </div>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          setValue('image', file);
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setValue('imagePreview', reader.result);
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </label>
                )}
                {editingIngredient?.hasImage && !watch('imagePreview') && (
                  <div className="flex items-center gap-2 mt-4">
                    <Checkbox
                      id="removeImage"
                      checked={watch('removeImage')}
                      onCheckedChange={(checked) =>
                        setValue('removeImage', checked)
                      }
                    />
                    <Label
                      htmlFor="removeImage"
                      className="text-sm font-normal cursor-pointer"
                    >
                      Remove existing image
                    </Label>
                  </div>
                )}
              </div>
            </div>

            {/* Type Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Ingredient Type
              </h3>
              <Tabs
                value={watch('type')}
                onValueChange={(value) => setValue('type', value)}
                className="w-full"
              >
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="manual" className="gap-2">
                    <span>Manual</span>
                  </TabsTrigger>
                  <TabsTrigger value="automated" className="gap-2">
                    <span>Automated</span>
                  </TabsTrigger>
                </TabsList>
              </Tabs>
              <p className="text-xs text-muted-foreground">
                {watch('type') === 'manual'
                  ? 'Manually added ingredients (e.g., garnishes, ice)'
                  : 'Automated dispensing via pump system'}
              </p>
            </div>

            {/* Properties Section */}
            <div className="space-y-4 bg-muted/30 p-4 rounded-lg">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Properties
              </h3>
              {watch('type') === 'manual' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label
                      htmlFor="alcoholContent"
                      className="text-sm font-medium"
                    >
                      Alcohol Content (%){' '}
                      <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="alcoholContent"
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      placeholder="e.g., 40"
                      {...register('alcoholContent', {
                        required: true,
                        valueAsNumber: true,
                        min: 0,
                        max: 100,
                      })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="unit" className="text-sm font-medium">
                      Unit <span className="text-destructive">*</span>
                    </Label>
                    <Select
                      value={watch('unit')}
                      onValueChange={(value) => setValue('unit', value)}
                    >
                      <SelectTrigger id="unit">
                        <SelectValue placeholder="Select unit" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ml">Milliliter (ml)</SelectItem>
                        <SelectItem value="cl">Centiliter (cl)</SelectItem>
                        <SelectItem value="oz">Ounce (oz)</SelectItem>
                        <SelectItem value="dash">Dash</SelectItem>
                        <SelectItem value="piece">Piece</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label
                        htmlFor="alcoholContentAuto"
                        className="text-sm font-medium"
                      >
                        Alcohol Content (%){' '}
                        <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="alcoholContentAuto"
                        type="number"
                        step="0.1"
                        min="0"
                        max="100"
                        placeholder="e.g., 40"
                        {...register('alcoholContent', {
                          required: true,
                          valueAsNumber: true,
                          min: 0,
                          max: 100,
                        })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label
                        htmlFor="bottleSize"
                        className="text-sm font-medium"
                      >
                        Bottle Size (ml){' '}
                        <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="bottleSize"
                        type="number"
                        step="1"
                        min="0"
                        placeholder="e.g., 750"
                        {...register('bottleSize', {
                          required: true,
                          valueAsNumber: true,
                          min: 0,
                        })}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label
                      htmlFor="pumpTimeMultiplier"
                      className="text-sm font-medium"
                    >
                      Pump Time Multiplier{' '}
                      <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="pumpTimeMultiplier"
                      type="number"
                      step="0.1"
                      min="0"
                      placeholder="e.g., 1.0"
                      {...register('pumpTimeMultiplier', {
                        required: true,
                        valueAsNumber: true,
                        min: 0,
                      })}
                    />
                    <p className="text-xs text-muted-foreground">
                      Adjusts pump timing for viscosity differences
                    </p>
                  </div>
                </div>
              )}
            </div>

            <DialogFooter className="pt-6 border-t gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsModalVisible(false)}
                className="flex-1 sm:flex-none"
              >
                Cancel
              </Button>
              <Button type="submit" className="flex-1 sm:flex-none">
                {editingIngredient ? 'Update Ingredient' : 'Add Ingredient'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ScrollToTopButton />
    </div>
  );
};

export default Ingredients;
