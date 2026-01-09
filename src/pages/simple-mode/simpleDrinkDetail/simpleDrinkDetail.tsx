import { useLocation, useNavigate, Navigate } from '@tanstack/react-router';
import { Beaker, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import DrinkImage from './components/DrinkImage';
import IngredientsList from './components/IngredientsList';
import DrinkInfo from './components/DrinkInfo';

interface Ingredient {
  name: string;
  amount: number;
  unit: string;
}

interface Glass {
  name: string;
  sizeInMl: number;
}

interface Recipe {
  id: string;
  name: string;
  description?: string;
  image?: string;
  alcoholic: boolean;
  defaultGlass?: Glass;
  ingredients: Ingredient[];
}

const SimpleDrinkDetail = () => {
  const location = useLocation();
  const navigate = useNavigate({ from: '/simple/drinks/$drinkId' });
  const recipe = (location.state as any)?.recipe as Recipe | undefined;

  // Redirect if no recipe data
  if (!recipe) {
    return <Navigate to="/simple/drinks" />;
  }

  return (
    <div className="min-h-screen bg-base-100 flex flex-col pb-20 sm:pb-0">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-base-100/95 backdrop-blur-md border-b border-base-200 shadow-sm">
        <div className="px-3 sm:px-4 py-3 sm:py-4 flex items-center justify-between">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="rounded-xl transition-all duration-200"
            onClick={() => navigate({ to: '/simple/drinks' })}
          >
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          </Button>
          <h1 className="text-base sm:text-lg font-bold truncate flex-1 mx-2 sm:mx-3 text-center">
            {recipe.name}
          </h1>
          {recipe.alcoholic && (
            <Badge variant="destructive" className="shrink-0 text-xs">
              21+
            </Badge>
          )}
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-3 sm:p-4 space-y-4 sm:space-y-6 max-w-4xl mx-auto">
          {/* Image */}
          <DrinkImage image={recipe.image} name={recipe.name} />

          {/* Make Drink Button - Below Image */}
          <Button
            type="button"
            size="lg"
            className="w-full h-12 sm:h-14 gap-2 sm:gap-3 text-sm sm:text-base font-semibold shadow-lg hover:shadow-xl transition-all duration-200 active:scale-95"
            onClick={() => navigate({ to: '/simple/order', state: { recipe } })}
          >
            <Beaker className="w-4 h-4 sm:w-5 sm:h-5" />
            Make Drink
          </Button>

          {/* Description and Info */}
          <DrinkInfo
            description={recipe.description}
            alcoholic={recipe.alcoholic}
            defaultGlass={recipe.defaultGlass}
          />

          {/* Ingredients */}
          <IngredientsList ingredients={recipe.ingredients} />
        </div>
      </div>
    </div>
  );
};

export default SimpleDrinkDetail;
