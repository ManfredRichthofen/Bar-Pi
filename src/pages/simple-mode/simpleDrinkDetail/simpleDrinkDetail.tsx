import { useLocation, useNavigate } from '@tanstack/react-router';
import { ArrowLeft, Beaker } from 'lucide-react';
import { useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import DrinkImage from './components/DrinkImage';
import DrinkInfo from './components/DrinkInfo';
import IngredientsList from './components/IngredientsList';

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
  hasImage?: boolean;
  alcoholic: boolean;
  defaultGlass?: Glass;
  ingredients: Ingredient[];
}

const SimpleDrinkDetail = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const recipe = (location.state as any)?.recipe as Recipe | undefined;

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (!recipe) {
      navigate({ to: '/simple/drinks' });
    }
  }, [recipe, navigate]);

  if (!recipe) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-20 border-b-hairline border-border bg-background">
        <div className="mx-auto max-w-4xl px-4 py-4 sm:px-6 flex items-center justify-between gap-3">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => navigate({ to: '/simple/drinks' })}
          >
            <ArrowLeft className="size-6" />
          </Button>
          <h1 className="text-xl font-bold truncate flex-1 text-center text-foreground">
            {recipe.name}
          </h1>
          {recipe.alcoholic ? (
            <Badge variant="destructive" className="shrink-0">
              21+
            </Badge>
          ) : (
            <div className="size-control-md" />
          )}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-4xl px-4 pt-6 pb-32 sm:px-6 space-y-6">
          <DrinkImage
            recipeId={recipe.id}
            hasImage={recipe.hasImage || false}
            name={recipe.name}
          />

          <DrinkInfo
            description={recipe.description}
            alcoholic={recipe.alcoholic}
            defaultGlass={recipe.defaultGlass}
          />

          <IngredientsList ingredients={recipe.ingredients} />
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-[calc(var(--control-lg)+1rem+1px)] z-40 border-t-hairline border-border bg-background shadow-lg">
        <div className="mx-auto max-w-4xl px-4 py-3 sm:px-6">
          <Button
            type="button"
            size="lg"
            className="w-full"
            onClick={() => {
              navigate({
                to: '/simple/order',
                state: { recipe },
              } as any);
            }}
          >
            <Beaker className="size-6" />
            Make Drink
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SimpleDrinkDetail;
