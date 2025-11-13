import React, { useState, useEffect, lazy, Suspense } from 'react';
import { Navigate } from '@tanstack/react-router';
import { PlusCircle } from 'lucide-react';
import useAuthStore from '../../../store/authStore';
import RecipeService from '../../../services/recipe.service';
import ingredientService from '../../../services/ingredient.service';
import glassService from '../../../services/glass.service';
import useFavoritesStore from '../../../store/favoritesStore';

// Lazy load components for code splitting
const RecipeCard = lazy(() => import('./components/RecipeCard'));
const RecipeModal = lazy(() => import('./components/RecipeModal'));

const Recipes = ({ sidebarCollapsed = false }) => {
  const token = useAuthStore((state) => state.token);
  const { isFavorite } = useFavoritesStore();
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState(null);
  const [ingredients, setIngredients] = useState([]);
  const [glasses, setGlasses] = useState([]);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    defaultGlass: null,
    defaultAmountToFill: 250,
    productionSteps: [],
    image: null,
    imagePreview: null,
    removeImage: false,
  });

  useEffect(() => {
    if (token) {
      fetchRecipes();
      fetchIngredients();
      fetchGlasses();
    }
  }, [token]);

  const fetchRecipes = async () => {
    try {
      setLoading(true);
      const data = await RecipeService.getRecipes(
        0, null, null, null, null, null, null, null, token
      );
      setRecipes(data.content || []);
    } catch (error) {
      showToast('Failed to fetch recipes', 'error');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchIngredients = async () => {
    try {
      // Fetch ALL ingredients without filters to ensure recipe ingredients are available
      const data = await ingredientService.getIngredients(token);
      console.log('Fetched ingredients:', data.length, 'ingredients');
      console.log('Sample ingredient IDs:', data.slice(0, 5).map(i => ({ id: i.id, name: i.name })));
      setIngredients(data);
    } catch (error) {
      console.error('Failed to fetch ingredients:', error);
    }
  };

  const fetchGlasses = async () => {
    try {
      const data = await glassService.getGlasses(token);
      setGlasses(data);
    } catch (error) {
      console.error('Failed to fetch glasses:', error);
    }
  };

  const showToast = (message, type = 'error') => {
    const toast = document.createElement('div');
    toast.className = 'toast toast-top toast-end';
    const alert = document.createElement('div');
    alert.className = `alert ${type === 'error' ? 'alert-error' : 'alert-success'}`;
    alert.textContent = message;
    toast.appendChild(alert);
    document.body.appendChild(toast);
    setTimeout(() => document.body.removeChild(toast), 3000);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      defaultGlass: null,
      defaultAmountToFill: 250,
      productionSteps: [],
      image: null,
      imagePreview: null,
      removeImage: false,
    });
  };

  const handleAdd = () => {
    setEditingRecipe(null);
    resetForm();
    setIsModalVisible(true);
  };

  const handleEdit = async (recipe) => {
    setEditingRecipe(recipe);
    
    // Fetch the full recipe details to ensure we have all ingredient data
    try {
      const fullRecipe = await RecipeService.getRecipe(recipe.id, false, token);
      
      // Deep clone production steps to ensure ingredient objects are properly loaded
      const productionSteps = fullRecipe.productionSteps?.map(step => {
        if (step.type === 'addIngredients') {
          return {
            ...step,
            stepIngredients: step.stepIngredients?.map(si => {
              // Ensure ingredient has an id property
              const ingredient = si.ingredient || {};
              return {
                ingredient: {
                  id: ingredient.id,
                  name: ingredient.name,
                  ...ingredient
                },
                amount: si.amount || 0,
                scale: si.scale || 'ml',
                boostable: si.boostable || false
              };
            }) || []
          };
        }
        return { ...step };
      }) || [];
      
      console.log('Loaded production steps:', productionSteps);
      
      setFormData({
        name: fullRecipe.name || '',
        description: fullRecipe.description || '',
        defaultGlass: fullRecipe.defaultGlass || null,
        defaultAmountToFill: fullRecipe.defaultAmountToFill || 250,
        productionSteps: productionSteps,
        image: null,
        imagePreview: fullRecipe.image || null,
        removeImage: false,
      });
      setIsModalVisible(true);
    } catch (error) {
      console.error('Error loading recipe details:', error);
      showToast('Failed to load recipe details', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this recipe?')) {
      try {
        await RecipeService.deleteRecipe(id);
        showToast('Recipe deleted successfully', 'success');
        fetchRecipes();
      } catch (error) {
        showToast('Failed to delete recipe', 'error');
      }
    }
  };

  const handleSave = async () => {
    try {
      if (!formData.name?.trim()) {
        showToast('Recipe name is required', 'error');
        return;
      }

      const recipeDto = {
        name: formData.name.trim(),
        description: formData.description?.trim() || '',
        defaultGlassId: formData.defaultGlass?.id || null,
        defaultAmountToFill: formData.defaultAmountToFill || 250,
        productionSteps: formData.productionSteps || [],
        categoryIds: [],
      };

      if (editingRecipe) {
        await RecipeService.updateRecipe(
          editingRecipe.id,
          recipeDto,
          formData.image,
          formData.removeImage
        );
        showToast('Recipe updated successfully', 'success');
      } else {
        await RecipeService.createRecipe(recipeDto, formData.image);
        showToast('Recipe created successfully', 'success');
      }

      setIsModalVisible(false);
      resetForm();
      fetchRecipes();
    } catch (error) {
      console.error('Error saving recipe:', error);
      showToast('Failed to save recipe', 'error');
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({ ...prev, image: file }));
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, imagePreview: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const addProductionStep = (type) => {
    const newStep = type === 'addIngredients'
      ? { type: 'addIngredients', stepIngredients: [] }
      : { type: 'writtenInstruction', message: '' };
    
    setFormData(prev => ({
      ...prev,
      productionSteps: [...prev.productionSteps, newStep]
    }));
  };

  const removeProductionStep = (index) => {
    setFormData(prev => ({
      ...prev,
      productionSteps: prev.productionSteps.filter((_, i) => i !== index)
    }));
  };

  const updateProductionStep = (index, updatedStep) => {
    setFormData(prev => ({
      ...prev,
      productionSteps: prev.productionSteps.map((step, i) => 
        i === index ? updatedStep : step
      )
    }));
  };

  const addIngredientToStep = (stepIndex) => {
    const step = formData.productionSteps[stepIndex];
    if (step.type === 'addIngredients') {
      const updatedStep = {
        ...step,
        stepIngredients: [
          ...step.stepIngredients,
          { ingredient: null, amount: 30, scale: 'ml', boostable: false }
        ]
      };
      updateProductionStep(stepIndex, updatedStep);
    }
  };

  const removeIngredientFromStep = (stepIndex, ingredientIndex) => {
    const step = formData.productionSteps[stepIndex];
    if (step.type === 'addIngredients') {
      const updatedStep = {
        ...step,
        stepIngredients: step.stepIngredients.filter((_, i) => i !== ingredientIndex)
      };
      updateProductionStep(stepIndex, updatedStep);
    }
  };

  const updateStepIngredient = (stepIndex, ingredientIndex, field, value) => {
    const step = formData.productionSteps[stepIndex];
    if (step.type === 'addIngredients') {
      const updatedStep = {
        ...step,
        stepIngredients: step.stepIngredients.map((ing, i) => 
          i === ingredientIndex ? { ...ing, [field]: value } : ing
        )
      };
      updateProductionStep(stepIndex, updatedStep);
    }
  };

  if (!token) {
    return <Navigate to="/login" />;
  }

  return (
    <div className="min-h-screen bg-base-100">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-base-100/95 backdrop-blur-md border-b border-base-200 shadow-sm">
        <div className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold">Recipes</h1>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={handleAdd}
            >
              <PlusCircle size={16} className="mr-2" />
              Add Recipe
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="max-w-screen-2xl mx-auto">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <span className="loading loading-spinner loading-lg"></span>
            </div>
          ) : recipes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4">
              <div className="text-base-content/40 mb-4">
                <svg
                  className="w-16 h-16"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  aria-labelledby="no-recipes-title"
                >
                  <title id="no-recipes-title">No recipes icon</title>
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2">No recipes found</h3>
              <p className="text-base-content/60 text-center text-sm mb-4">
                Get started by creating your first recipe
              </p>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleAdd}
              >
                <PlusCircle size={16} className="mr-2" />
                Add Recipe
              </button>
            </div>
          ) : (
            <Suspense fallback={<div className="flex justify-center items-center py-12"><span className="loading loading-spinner loading-lg"></span></div>}>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 sm:gap-5 lg:gap-6">
                {recipes.map((recipe) => (
                  <RecipeCard
                    key={recipe.id}
                    recipe={recipe}
                    isFavorite={isFavorite(recipe.id)}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            </Suspense>
          )}
        </div>
      </div>

      {/* Recipe Modal */}
      {isModalVisible && (
        <dialog open className="modal modal-open">
          <div className="modal-box max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b pb-4 mb-6">
              <h3 className="text-xl font-bold">
                {editingRecipe ? 'Edit Recipe' : 'Add Recipe'}
              </h3>
              <button
                type="button"
                className="btn btn-sm btn-circle btn-ghost"
                onClick={() => setIsModalVisible(false)}
              >
                ✕
              </button>
            </div>

            <div className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-control w-full">
                  <label className="label">
                    <span className="label-text font-medium">Recipe Name *</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Enter recipe name"
                    className="input input-bordered w-full"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>

                <div className="form-control w-full">
                  <label className="label">
                    <span className="label-text font-medium">Default Glass</span>
                  </label>
                  <select
                    className="select select-bordered w-full"
                    value={formData.defaultGlass?.id || ''}
                    onChange={(e) => {
                      const glass = glasses.find(g => g.id === parseInt(e.target.value));
                      setFormData(prev => ({ ...prev, defaultGlass: glass || null }));
                    }}
                  >
                    <option value="">Select a glass</option>
                    {glasses.map((glass) => (
                      <option key={glass.id} value={glass.id}>
                        {glass.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-control w-full">
                <label className="label">
                  <span className="label-text font-medium">Description</span>
                </label>
                <textarea
                  className="textarea textarea-bordered h-24"
                  placeholder="Enter recipe description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                ></textarea>
              </div>

              <div className="form-control w-full">
                <label className="label">
                  <span className="label-text font-medium">Default Amount (ml)</span>
                </label>
                <input
                  type="number"
                  className="input input-bordered w-full"
                  value={formData.defaultAmountToFill}
                  onChange={(e) => setFormData(prev => ({ ...prev, defaultAmountToFill: parseInt(e.target.value) || 0 }))}
                />
              </div>

              {/* Image Upload */}
              <div className="form-control w-full">
                <label className="label">
                  <span className="label-text font-medium">Recipe Image</span>
                </label>
                <div className="flex items-center gap-4">
                  {formData.imagePreview ? (
                    <div className="relative w-32 h-32">
                      <img
                        src={formData.imagePreview}
                        alt="Recipe preview"
                        className="w-full h-full object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        className="btn btn-circle btn-xs absolute -top-2 -right-2 bg-base-100"
                        onClick={() => setFormData(prev => ({ ...prev, image: null, imagePreview: null }))}
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
                        </p>
                      </div>
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={handleImageChange}
                      />
                    </label>
                  )}
                  {editingRecipe?.hasImage && !formData.imagePreview && (
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        className="checkbox checkbox-sm"
                        checked={formData.removeImage}
                        onChange={(e) => setFormData(prev => ({ ...prev, removeImage: e.target.checked }))}
                      />
                      <span className="text-sm">Remove existing image</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Production Steps */}
              <div className="border-t pt-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-bold text-lg">Production Steps</h4>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      className="btn btn-sm btn-ghost"
                      onClick={() => addProductionStep('addIngredients')}
                    >
                      + Add Ingredients
                    </button>
                    <button
                      type="button"
                      className="btn btn-sm btn-ghost"
                      onClick={() => addProductionStep('writtenInstruction')}
                    >
                      + Add Instruction
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  {formData.productionSteps.map((step, stepIndex) => (
                    <div key={stepIndex} className="card bg-base-200 p-4">
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-semibold">
                          Step {stepIndex + 1}: {step.type === 'addIngredients' ? 'Add Ingredients' : 'Instruction'}
                        </span>
                        <button
                          type="button"
                          className="btn btn-ghost btn-xs text-error"
                          onClick={() => removeProductionStep(stepIndex)}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>

                      {step.type === 'addIngredients' ? (
                        <div className="space-y-2">
                          {step.stepIngredients.map((ing, ingIndex) => {
                            const ingredientId = ing.ingredient?.id;
                            console.log(`Step ${stepIndex}, Ingredient ${ingIndex}:`, ing.ingredient);
                            console.log(`Trying to match ID: ${ingredientId}, Available ingredients: ${ingredients.length}`);
                            const matchFound = ingredients.some(i => i.id === ingredientId);
                            console.log(`Match found for ID ${ingredientId}: ${matchFound}`);
                            return (
                              <div key={ingIndex} className="flex gap-2 items-center">
                                <select
                                  className="select select-bordered select-sm flex-1"
                                  value={ingredientId || ''}
                                  onChange={(e) => {
                                    const ingredient = ingredients.find(i => i.id === parseInt(e.target.value));
                                    updateStepIngredient(stepIndex, ingIndex, 'ingredient', ingredient);
                                  }}
                                >
                                  <option value="">Select ingredient</option>
                                  {ingredients.map((ingredient) => (
                                    <option key={ingredient.id} value={ingredient.id}>
                                      {ingredient.name}
                                    </option>
                                  ))}
                                </select>
                              <input
                                type="number"
                                className="input input-bordered input-sm w-20"
                                value={ing.amount}
                                onChange={(e) => updateStepIngredient(stepIndex, ingIndex, 'amount', parseFloat(e.target.value) || 0)}
                              />
                              <select
                                className="select select-bordered select-sm w-20"
                                value={ing.scale}
                                onChange={(e) => updateStepIngredient(stepIndex, ingIndex, 'scale', e.target.value)}
                              >
                                <option value="ml">ml</option>
                                <option value="cl">cl</option>
                                <option value="oz">oz</option>
                                <option value="dash">dash</option>
                              </select>
                              <button
                                type="button"
                                className="btn btn-ghost btn-sm btn-circle"
                                onClick={() => removeIngredientFromStep(stepIndex, ingIndex)}
                              >
                                <X size={16} />
                              </button>
                            </div>
                            );
                          })}
                          <button
                            type="button"
                            className="btn btn-sm btn-ghost w-full"
                            onClick={() => addIngredientToStep(stepIndex)}
                          >
                            + Add Ingredient
                          </button>
                        </div>
                      ) : (
                        <textarea
                          className="textarea textarea-bordered w-full"
                          placeholder="Enter instruction"
                          value={step.message || ''}
                          onChange={(e) => updateProductionStep(stepIndex, { ...step, message: e.target.value })}
                        ></textarea>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="modal-action pt-6 border-t mt-6">
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setIsModalVisible(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleSave}
              >
                {editingRecipe ? 'Update Recipe' : 'Create Recipe'}
              </button>
            </div>
          </div>
          <form method="dialog" className="modal-backdrop">
            <button type="button" onClick={() => setIsModalVisible(false)}>close</button>
          </form>
        </dialog>
      )}
    </div>
  );
};

export default Recipes;
