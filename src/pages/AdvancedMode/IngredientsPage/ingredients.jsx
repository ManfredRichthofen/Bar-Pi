import React, { useState, useEffect } from 'react';
import { PlusCircle, Edit, Trash2, Image as ImageIcon, X, AlertCircle } from 'lucide-react';
import { Navigate } from '@tanstack/react-router';
import useAuthStore from '../../../store/authStore';
import ingredientService, {
  ingredientDtoMapper,
} from '../../../services/ingredient.service';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

const Ingredients = () => {
  const [ingredients, setIngredients] = useState([]);
  const [loading, setLoading] = useState(true);
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

  useEffect(() => {
    fetchIngredients();
  }, [token]);

  const fetchIngredients = async () => {
    try {
      const data = await ingredientService.getIngredientsFilter(
        token,
        null,
        true,
        true,
        false,
        null,
        null,
        null,
        null,
      );
      setIngredients(data);
    } catch (error) {
      toast.error('Failed to fetch ingredients');
    } finally {
      setLoading(false);
    }
  };


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
      fetchIngredients();
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
      fetchIngredients();
    } catch (error) {
      toast.error('Failed to delete ingredient');
    }
  };

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
        return parentGroup ? (
          <div className="badge badge-primary">{parentGroup.name}</div>
        ) : null;
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
          <button
            className="btn btn-ghost btn-sm"
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
          </button>
          <button
            className="btn btn-ghost btn-sm text-error"
            onClick={() => handleDelete(record.id)}
          >
            <Trash2 size={16} />
          </button>
        </div>
      ),
    },
  ];

  if (!token) {
    return <Navigate to="/login" />;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-20 bg-background border-b shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
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
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 sm:py-8">
        {ingredients.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 min-h-[400px]">
            <AlertCircle className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Ingredients Found</h3>
            <p className="text-muted-foreground text-center mb-6 max-w-sm">
              Get started by adding your first ingredient to begin managing your inventory
            </p>
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
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
            {ingredients.map((ingredient) => (
              <Card key={ingredient.id} className="hover:shadow-lg transition-all">
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base line-clamp-1 flex-1">
                      {ingredient.name}
                    </CardTitle>
                    {ingredient.inBar && (
                      <Badge variant="default">In Bar</Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  {ingredient.parentGroupId && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-muted-foreground">Group:</span>
                      <Badge variant="secondary">
                        {ingredients.find((ing) => ing.id === ingredient.parentGroupId)?.name || 'Unknown'}
                      </Badge>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground">Type:</span>
                    <Badge variant={ingredient.type === 'automated' ? 'default' : 'outline'}>
                      {ingredient.type || 'manual'}
                    </Badge>
                  </div>
                  {ingredient.alcoholContent > 0 && (
                    <div className="text-sm text-muted-foreground">
                      Alcohol: {ingredient.alcoholContent}%
                    </div>
                  )}
                </CardContent>
                <CardFooter className="flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="icon-sm"
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
                    size="icon-sm"
                    onClick={() => handleDelete(ingredient.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>

      {isModalVisible && (
        <dialog className="modal modal-open">
          <div className="modal-box max-w-2xl">
            <div className="flex justify-between items-center border-b pb-4 mb-6">
              <h3 className="text-xl font-bold">
                {editingIngredient ? 'Edit Ingredient' : 'Add Ingredient'}
              </h3>
              <button
                className="btn btn-sm btn-circle btn-ghost"
                onClick={() => setIsModalVisible(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit(handleAddEdit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="form-control w-full">
                  <label className="label">
                    <span className="label-text font-medium">Name</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Enter ingredient name"
                    className="input input-bordered w-full"
                    {...register('name', { required: true })}
                  />
                </div>

                <div className="form-control w-full">
                  <label className="label">
                    <span className="label-text font-medium">Parent Group</span>
                  </label>
                  <select
                    className="select select-bordered w-full"
                    {...register('parentGroupId')}
                  >
                    <option value="">Select a group</option>
                    {ingredients
                      .filter((ing) => ing.type === 'group')
                      .map((group) => (
                        <option key={group.id} value={group.id}>
                          {group.name}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <div className="form-control w-full">
                <label className="label">
                  <span className="label-text font-medium">
                    Ingredient Image
                  </span>
                </label>
                <div className="flex items-center gap-4">
                  {watch('imagePreview') ? (
                    <div className="relative w-32 h-32">
                      <img
                        src={watch('imagePreview')}
                        alt="Ingredient preview"
                        className="w-full h-full object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        className="btn btn-circle btn-xs absolute -top-2 -right-2 bg-base-100"
                        onClick={() => {
                          setValue('image', null);
                          setValue('imagePreview', null);
                        }}
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center w-32 h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-base-200">
                      <div className="flex flex-col items-center justify-center p-3">
                        <ImageIcon size={24} className="mb-2" />
                        <p className="text-xs text-center">
                          <span className="font-semibold">Upload</span>
                          <br />
                          image
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
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        className="checkbox checkbox-sm"
                        {...register('removeImage')}
                      />
                      <span className="text-sm">Remove existing image</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Type</span>
                </label>
                <div className="tabs tabs-boxed justify-center bg-base-200 p-1">
                  <button
                    type="button"
                    className={`tab flex-1 ${watch('type') === 'manual' ? 'tab-active' : ''}`}
                    onClick={() => setValue('type', 'manual')}
                  >
                    Manual
                  </button>
                  <button
                    type="button"
                    className={`tab flex-1 ${watch('type') === 'automated' ? 'tab-active' : ''}`}
                    onClick={() => setValue('type', 'automated')}
                  >
                    Automated
                  </button>
                </div>
              </div>

              <div className="border-t pt-6">
                {watch('type') === 'manual' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="form-control w-full">
                      <label className="label">
                        <span className="label-text font-medium">
                          Alcohol Content (%)
                        </span>
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="100"
                        placeholder="Enter alcohol content"
                        className="input input-bordered w-full"
                        {...register('alcoholContent', {
                          required: true,
                          valueAsNumber: true,
                          min: 0,
                          max: 100,
                        })}
                      />
                    </div>
                    <div className="form-control w-full">
                      <label className="label">
                        <span className="label-text font-medium">Unit</span>
                      </label>
                      <select
                        className="select select-bordered w-full"
                        {...register('unit', { required: true })}
                      >
                        <option value="ml">Milliliter (ml)</option>
                        <option value="cl">Centiliter (cl)</option>
                        <option value="oz">Ounce (oz)</option>
                        <option value="dash">Dash</option>
                        <option value="piece">Piece</option>
                      </select>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="form-control w-full">
                      <label className="label">
                        <span className="label-text font-medium">
                          Alcohol Content (%)
                        </span>
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="100"
                        placeholder="Enter alcohol content"
                        className="input input-bordered w-full"
                        {...register('alcoholContent', {
                          required: true,
                          valueAsNumber: true,
                          min: 0,
                          max: 100,
                        })}
                      />
                    </div>
                    <div className="form-control w-full">
                      <label className="label">
                        <span className="label-text font-medium">
                          Bottle Size (ml)
                        </span>
                      </label>
                      <input
                        type="number"
                        step="1"
                        min="0"
                        placeholder="Enter bottle size"
                        className="input input-bordered w-full"
                        {...register('bottleSize', {
                          required: true,
                          valueAsNumber: true,
                          min: 0,
                        })}
                      />
                    </div>
                    <div className="form-control w-full md:col-span-2">
                      <label className="label">
                        <span className="label-text font-medium">
                          Pump Time Multiplier
                        </span>
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        placeholder="Enter pump time multiplier"
                        className="input input-bordered w-full"
                        {...register('pumpTimeMultiplier', {
                          required: true,
                          valueAsNumber: true,
                          min: 0,
                        })}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="modal-action pt-6 border-t">
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setIsModalVisible(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingIngredient ? 'Update Ingredient' : 'Add Ingredient'}
                </button>
              </div>
            </form>
          </div>
          <form method="dialog" className="modal-backdrop">
            <button onClick={() => setIsModalVisible(false)}>close</button>
          </form>
        </dialog>
      )}
    </div>
  );
};

export default Ingredients;
