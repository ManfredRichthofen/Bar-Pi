import React, {
  useState,
  useEffect,
  lazy,
  Suspense,
  useMemo,
  useCallback,
} from 'react';
import { Navigate } from '@tanstack/react-router';
import { PlusCircle, AlertCircle } from 'lucide-react';
import useAuthStore from '../../../store/authStore';
import RecipeService from '../../../services/recipe.service';
import ingredientService from '../../../services/ingredient.service';
import glassService from '../../../services/glass.service';
import useFavoritesStore from '../../../store/favoritesStore';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

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
        0,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        token,
      );
      setRecipes(data.content || []);
    } catch (error) {
      toast.error('Failed to fetch recipes');
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
      console.log(
        'Sample ingredient IDs:',
        data.slice(0, 5).map((i) => ({ id: i.id, name: i.name })),
      );
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

  const handleEdit = useCallback(
    async (recipe) => {
      setEditingRecipe(recipe);

      // Fetch the full recipe details to ensure we have all ingredient data
      try {
        const fullRecipe = await RecipeService.getRecipe(
          recipe.id,
          false,
          token,
        );

        // Deep clone production steps to ensure ingredient objects are properly loaded
        const productionSteps =
          fullRecipe.productionSteps?.map((step) => {
            if (step.type === 'addIngredients') {
              return {
                ...step,
                stepIngredients:
                  step.stepIngredients?.map((si) => {
                    // Ensure ingredient has an id property
                    const ingredient = si.ingredient || {};
                    return {
                      ingredient: {
                        id: ingredient.id,
                        name: ingredient.name,
                        ...ingredient,
                      },
                      amount: si.amount || 0,
                      scale: si.scale || 'ml',
                      boostable: si.boostable || false,
                    };
                  }) || [],
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
        toast.error('Failed to load recipe details');
      }
    },
    [token],
  );

  const handleDelete = useCallback(
    async (id) => {
      if (window.confirm('Are you sure you want to delete this recipe?')) {
        try {
          await RecipeService.deleteRecipe(id);
          toast.success('Recipe deleted successfully');
          fetchRecipes();
        } catch (error) {
          toast.error('Failed to delete recipe');
        }
      }
    },
    [fetchRecipes],
  );

  const handleSave = useCallback(async () => {
    try {
      if (!formData.name?.trim()) {
        toast.error('Recipe name is required');
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
          formData.removeImage,
        );
        toast.success('Recipe updated successfully');
      } else {
        await RecipeService.createRecipe(recipeDto, formData.image);
        toast.success('Recipe created successfully');
      }

      setIsModalVisible(false);
      resetForm();
      fetchRecipes();
    } catch (error) {
      console.error('Error saving recipe:', error);
      toast.error('Failed to save recipe');
    }
  }, [editingRecipe, formData, fetchRecipes, resetForm]);

  const handleImageChange = useCallback((e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData((prev) => ({ ...prev, image: file }));
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({ ...prev, imagePreview: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const addProductionStep = useCallback((type) => {
    const newStep =
      type === 'addIngredients'
        ? { type: 'addIngredients', stepIngredients: [] }
        : { type: 'writtenInstruction', message: '' };

    setFormData((prev) => ({
      ...prev,
      productionSteps: [...prev.productionSteps, newStep],
    }));
  }, []);

  const removeProductionStep = useCallback((index) => {
    setFormData((prev) => ({
      ...prev,
      productionSteps: prev.productionSteps.filter((_, i) => i !== index),
    }));
  }, []);

  const updateProductionStep = useCallback((index, updatedStep) => {
    setFormData((prev) => ({
      ...prev,
      productionSteps: prev.productionSteps.map((step, i) =>
        i === index ? updatedStep : step,
      ),
    }));
  }, []);

  const addIngredientToStep = useCallback(
    (stepIndex) => {
      const step = formData.productionSteps[stepIndex];
      if (step.type === 'addIngredients') {
        const updatedStep = {
          ...step,
          stepIngredients: [
            ...step.stepIngredients,
            { ingredient: null, amount: 30, scale: 'ml', boostable: false },
          ],
        };
        updateProductionStep(stepIndex, updatedStep);
      }
    },
    [formData.productionSteps, updateProductionStep],
  );

  const removeIngredientFromStep = useCallback(
    (stepIndex, ingredientIndex) => {
      const step = formData.productionSteps[stepIndex];
      if (step.type === 'addIngredients') {
        const updatedStep = {
          ...step,
          stepIngredients: step.stepIngredients.filter(
            (_, i) => i !== ingredientIndex,
          ),
        };
        updateProductionStep(stepIndex, updatedStep);
      }
    },
    [formData.productionSteps, updateProductionStep],
  );

  const updateStepIngredient = useCallback(
    (stepIndex, ingredientIndex, field, value) => {
      const step = formData.productionSteps[stepIndex];
      if (step.type === 'addIngredients') {
        const updatedStep = {
          ...step,
          stepIngredients: step.stepIngredients.map((ing, i) =>
            i === ingredientIndex ? { ...ing, [field]: value } : ing,
          ),
        };
        updateProductionStep(stepIndex, updatedStep);
      }
    },
    [formData.productionSteps, updateProductionStep],
  );

  const favoriteIds = useMemo(
    () => new Set((favorites || []).map((fav) => fav.id)),
    [favorites],
  );

  if (!token) {
    return <Navigate to="/login" />;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-20 bg-background border-b shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Recipes</h1>
            <Button onClick={handleAdd}>
              <PlusCircle />
              Add Recipe
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 sm:py-8">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <span className="loading loading-spinner loading-lg"></span>
          </div>
        ) : recipes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 min-h-[400px]">
            <AlertCircle className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Recipes Found</h3>
            <p className="text-muted-foreground text-center mb-6 max-w-sm">
              Get started by creating your first recipe to begin mixing drinks
            </p>
            <Button size="lg" onClick={handleAdd}>
              <PlusCircle className="mr-2" />
              Add First Recipe
            </Button>
          </div>
        ) : (
          <Suspense
            fallback={
              <div className="flex justify-center items-center py-12">
                <span className="loading loading-spinner loading-lg"></span>
              </div>
            }
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
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
