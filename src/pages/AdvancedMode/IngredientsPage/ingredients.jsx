import { Navigate } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { useWindowVirtualizer } from '@tanstack/react-virtual';
import {
  AlertCircle,
  ArrowUp,
  Edit,
  Image as ImageIcon,
  Loader2,
  PlusCircle,
  Trash2,
  X,
} from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import ingredientService, {
  ingredientDtoMapper,
} from '../../../services/ingredient.service';
import useAuthStore from '../../../store/authStore';

const Ingredients = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [showScrollTop, setShowScrollTop] = useState(false);
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
  
  const listRef = useRef();
  const parentOffsetRef = useRef(0);
  const [rowHeight, setRowHeight] = React.useState(100);
  
  React.useLayoutEffect(() => {
    parentOffsetRef.current = listRef.current?.offsetTop || 0;
  }, []);
  
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
    return data.filter(ingredient => 
      ingredient.name.toLowerCase().includes(searchLower)
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

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Hide header when scrolling down, show when scrolling up
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsHeaderVisible(false);
      } else {
        setIsHeaderVisible(true);
      }
      
      setLastScrollY(currentScrollY);
      setShowScrollTop(currentScrollY > 400);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);
  
  // Window virtualizer setup
  const virtualizer = useWindowVirtualizer({
    count: ingredients.length,
    estimateSize: () => rowHeight,
    overscan: 5,
    scrollMargin: parentOffsetRef.current,
  });
  
  const virtualItems = virtualizer.getVirtualItems();

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
      <div className={`sticky top-16 z-40 bg-background/95 backdrop-blur-sm border-b shadow-sm transition-all duration-300 ${
        isHeaderVisible ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'
      }`}>
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <h1 className="text-2xl font-bold">Ingredients</h1>
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
            >
              <PlusCircle />
              Add Ingredient
            </Button>
          </div>
          
          {/* Search Bar */}
          <div className="mt-4">
            <SearchInput
            value={searchTerm}
            onChange={handleSearch}
            placeholder="Search ingredients..."
            debounceMs={300}
            inputClassName="pl-10"
          />
            {data && data.length > 0 && (
              <p className="text-sm text-muted-foreground mt-2">
                Showing {ingredients.length} of {data.length} ingredients
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 sm:py-8">
        {status === 'pending' ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : status === 'error' ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 min-h-[400px]">
            <AlertCircle className="h-16 w-16 text-destructive mb-4" />
            <h3 className="text-xl font-semibold mb-2">Error Loading Ingredients</h3>
            <p className="text-muted-foreground text-center mb-6 max-w-sm">
              {error?.message || 'Failed to load ingredients'}
            </p>
          </div>
        ) : ingredients.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 min-h-[400px]">
            <AlertCircle className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">
              {searchTerm ? 'No Ingredients Found' : 'No Ingredients Found'}
            </h3>
            <p className="text-muted-foreground text-center mb-6 max-w-sm">
              {searchTerm 
                ? `No ingredients found matching "${searchTerm}"`
                : 'Get started by adding your first ingredient to begin managing your inventory'
              }
            </p>
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
          </div>
        ) : (
          <div className="space-y-2">
            {/* Virtual List Container */}
            <div ref={listRef} className="relative">
              <div
                style={{
                  height: `${virtualizer.getTotalSize()}px`,
                  width: '100%',
                  position: 'relative',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    transform: `translateY(${(virtualItems[0]?.start ?? 0) - virtualizer.options.scrollMargin}px)`,
                  }}
                >
                  {virtualItems.map((virtualItem) => {
                    const ingredient = ingredients[virtualItem.index];
                    if (!ingredient) return null;
                    
                    const parentGroup = ingredient.parentGroupId
                      ? ingredients.find((ing) => ing.id === ingredient.parentGroupId)
                      : null;

                    return (
                      <div
                        key={ingredient.id}
                        data-index={virtualItem.index}
                        ref={virtualizer.measureElement}
                        className="px-4 py-2"
                      >
                        <div className="flex items-center justify-between p-4 bg-card border rounded-lg hover:shadow-md transition-all duration-200">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold text-base">
                                {ingredient.name}
                              </h3>
                              {ingredient.inBar && (
                                <Badge variant="default" className="text-xs">
                                  In Bar
                                </Badge>
                              )}
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                              <Badge
                                variant={
                                  ingredient.type === 'automated'
                                    ? 'default'
                                    : 'secondary'
                                }
                                className="text-xs"
                              >
                                {ingredient.type === 'automated'
                                  ? 'Automated'
                                  : 'Manual'}
                              </Badge>
                              {parentGroup && (
                                <Badge variant="outline" className="text-xs">
                                  {parentGroup.name}
                                </Badge>
                              )}
                              {ingredient.alcoholContent > 0 && (
                                <span className="text-xs text-muted-foreground">
                                  {ingredient.alcoholContent}% ABV
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 ml-4">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setEditingIngredient(ingredient);
                                Object.entries(ingredient).forEach(([key, value]) => {
                                  setValue(key, value);
                                });
                                setValue('type', ingredient.type || 'manual');
                                setIsModalVisible(true);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(ingredient.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
            
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
      
      {/* Scroll to top button */}
      {showScrollTop && (
        <Button
          onClick={scrollToTop}
          size="icon"
          className="fixed bottom-24 right-4 z-[100] rounded-full shadow-lg hover:shadow-xl transition-all duration-200"
          aria-label="Scroll to top"
        >
          <ArrowUp className="w-5 h-5" />
        </Button>
      )}
    </div>
  );
};

export default Ingredients;
