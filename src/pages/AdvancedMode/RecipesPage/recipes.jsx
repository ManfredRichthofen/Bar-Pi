import React, { useState, useEffect, lazy, Suspense, useMemo, useCallback } from 'react';
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
  const favorites = useFavoritesStore((state) => state.favorites);
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

  const fetchRecipes = useCallback(async () => {
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
  }, [token]);

  useEffect(() => {
    if (token) {
      fetchRecipes();
      fetchIngredients();
      fetchGlasses();
    }
  }, [token, fetchRecipes]);

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

  const handleAdd = useCallback(() => {
    setEditingRecipe(null);
    resetForm();
    setIsModalVisible(true);
  }, [resetForm]);

  const handleEdit = useCallback(async (recipe) => {
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
  }, [token, showToast]);

  const handleDelete = useCallback(async (id) => {
    if (window.confirm('Are you sure you want to delete this recipe?')) {
      try {
        await RecipeService.deleteRecipe(id);
        showToast('Recipe deleted successfully', 'success');
        fetchRecipes();
      } catch (error) {
        showToast('Failed to delete recipe', 'error');
      }
    }
  }, [fetchRecipes, showToast]);

  const handleSave = useCallback(async () => {
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
  }, [editingRecipe, formData, fetchRecipes, showToast, resetForm]);

  const handleImageChange = useCallback((e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({ ...prev, image: file }));
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, imagePreview: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const addProductionStep = useCallback((type) => {
    const newStep = type === 'addIngredients'
      ? { type: 'addIngredients', stepIngredients: [] }
      : { type: 'writtenInstruction', message: '' };
    
    setFormData(prev => ({
      ...prev,
      productionSteps: [...prev.productionSteps, newStep]
    }));
  }, []);

  const removeProductionStep = useCallback((index) => {
    setFormData(prev => ({
      ...prev,
      productionSteps: prev.productionSteps.filter((_, i) => i !== index)
    }));
  }, []);

  const updateProductionStep = useCallback((index, updatedStep) => {
    setFormData(prev => ({
      ...prev,
      productionSteps: prev.productionSteps.map((step, i) => 
        i === index ? updatedStep : step
      )
    }));
  }, []);

  const addIngredientToStep = useCallback((stepIndex) => {
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
  }, [formData.productionSteps, updateProductionStep]);

  const removeIngredientFromStep = useCallback((stepIndex, ingredientIndex) => {
    const step = formData.productionSteps[stepIndex];
    if (step.type === 'addIngredients') {
      const updatedStep = {
        ...step,
        stepIngredients: step.stepIngredients.filter((_, i) => i !== ingredientIndex)
      };
      updateProductionStep(stepIndex, updatedStep);
    }
  }, [formData.productionSteps, updateProductionStep]);

  const updateStepIngredient = useCallback((stepIndex, ingredientIndex, field, value) => {
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
  }, [formData.productionSteps, updateProductionStep]);

  const favoriteIds = useMemo(() => new Set((favorites || []).map((fav) => fav.id)), [favorites]);

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
                    isFavorite={favoriteIds.has(recipe.id)}
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
      <Suspense fallback={null}>
        <RecipeModal
          isVisible={isModalVisible}
          onClose={() => setIsModalVisible(false)}
          editingRecipe={editingRecipe}
          formData={formData}
          setFormData={setFormData}
          ingredients={ingredients}
          glasses={glasses}
          onSave={handleSave}
          onImageChange={handleImageChange}
          addProductionStep={addProductionStep}
          removeProductionStep={removeProductionStep}
          updateProductionStep={updateProductionStep}
          addIngredientToStep={addIngredientToStep}
          removeIngredientFromStep={removeIngredientFromStep}
          updateStepIngredient={updateStepIngredient}
        />
      </Suspense>
    </div>
  );
};

export default Recipes;
