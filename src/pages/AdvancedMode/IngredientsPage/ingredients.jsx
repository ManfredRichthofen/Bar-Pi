import React, { useState, useEffect } from 'react';
import { PlusCircle, Edit, Trash2, Image as ImageIcon, X } from 'lucide-react';
import { Navigate } from '@tanstack/react-router';
import useAuthStore from '../../../store/authStore';
import ingredientService, {
  ingredientDtoMapper,
} from '../../../services/ingredient.service';
import { useForm } from 'react-hook-form';

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
      showToast('Failed to fetch ingredients');
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message, type = 'error') => {
    const toast = document.createElement('div');
    toast.className = `toast toast-top toast-end`;

    const alert = document.createElement('div');
    alert.className = `alert ${type === 'error' ? 'alert-error' : 'alert-success'}`;
    alert.textContent = message;

    toast.appendChild(alert);
    document.body.appendChild(toast);

    setTimeout(() => {
      document.body.removeChild(toast);
    }, 3000);
  };

  const handleAddEdit = async (values) => {
    try {
      if (!values.name?.trim()) {
        showToast('Name is required');
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
        showToast('Alcohol content must be between 0 and 100');
        return;
      }

      if (processedValues.bottleSize < 0) {
        showToast('Bottle size must be positive');
        return;
      }

      if (processedValues.pumpTimeMultiplier <= 0) {
        showToast('Pump time multiplier must be greater than 0');
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
        showToast('Ingredient updated successfully', 'success');
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
          showToast('Ingredient added successfully', 'success');
        } catch (error) {
          if (error.response?.data?.message) {
            showToast(`Server error: ${error.response.data.message}`);
          } else if (error.response?.status === 400) {
            showToast('Invalid input data. Please check all fields.');
          } else {
            showToast('Failed to create ingredient');
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
        showToast(`Error: ${error.response.data.message}`);
      } else {
        showToast(
          'Failed to save ingredient. Please check your input and try again.',
        );
      }
    }
  };

  const handleDelete = async (id) => {
    try {
      await ingredientService.deleteIngredient(id, token);
      showToast('Ingredient deleted successfully', 'success');
      fetchIngredients();
    } catch (error) {
      showToast('Failed to delete ingredient');
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
    <div className="min-h-screen bg-base-100">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-base-100/95 backdrop-blur-md border-b border-base-200 shadow-sm">
        <div className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold">Ingredients</h1>
            <button
              className="btn btn-primary btn-sm"
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
              <PlusCircle size={16} className="mr-2" />
              Add Ingredient
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="max-w-screen-2xl mx-auto">
          {ingredients.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4">
              <div className="text-base-content/40 mb-4">
                <svg
                  className="w-16 h-16"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  aria-labelledby="no-ingredients-title"
                >
                  <title id="no-ingredients-title">No ingredients icon</title>
                  <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2">No ingredients found</h3>
              <p className="text-base-content/60 text-center text-sm mb-4">
                Get started by adding your first ingredient
              </p>
              <button
                className="btn btn-primary"
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
                <PlusCircle size={16} className="mr-2" />
                Add Ingredient
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 sm:gap-5 lg:gap-6">
              {ingredients.map((ingredient) => (
                <div
                  key={ingredient.id}
                  className="card bg-base-100 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border border-base-200"
                >
                  <div className="card-body p-4">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="card-title text-base font-bold text-base-content/90 line-clamp-1 flex-1">
                        {ingredient.name}
                      </h3>
                      {ingredient.inBar && (
                        <div className="badge badge-success badge-sm">In Bar</div>
                      )}
                    </div>
                    
                    <div className="space-y-1 text-sm flex-1">
                      {ingredient.parentGroupId && (
                        <div className="flex items-center gap-2">
                          <span className="text-base-content/60">Group:</span>
                          <div className="badge badge-primary badge-sm">
                            {ingredients.find((ing) => ing.id === ingredient.parentGroupId)?.name || 'Unknown'}
                          </div>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <span className="text-base-content/60">Type:</span>
                        <div className={`badge badge-sm ${ingredient.type === 'automated' ? 'badge-info' : 'badge-ghost'}`}>
                          {ingredient.type || 'manual'}
                        </div>
                      </div>
                      {ingredient.alcoholContent > 0 && (
                        <div className="text-base-content/70">
                          Alcohol: {ingredient.alcoholContent}%
                        </div>
                      )}
                    </div>

                    <div className="card-actions justify-end mt-4 pt-4 border-t border-base-200">
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => {
                          setEditingIngredient(ingredient);
                          Object.entries(ingredient).forEach(([key, value]) => {
                            setValue(key, value);
                          });
                          setValue('type', ingredient.type || 'manual');
                          setIsModalVisible(true);
                        }}
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        className="btn btn-ghost btn-sm text-error"
                        onClick={() => handleDelete(ingredient.id)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
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
