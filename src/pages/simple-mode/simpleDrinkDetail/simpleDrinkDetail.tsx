import { useQuery } from '@tanstack/react-query';
import { useLocation, useNavigate, useParams } from '@tanstack/react-router';
import { ArrowLeft, Beaker, Loader2 } from 'lucide-react';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import SimplePageEnter from '@/components/simple-mode/SimplePageEnter';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useBackNavigation } from '@/hooks/useBackNavigation';
import RecipeService from '@/services/recipe.service';
import useAuthStore from '@/store/authStore';
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
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const goBack = useBackNavigation('/simple/drinks');
  const { id } = useParams({ from: '/simple/drink/$id' });
  const token = useAuthStore((state) => state.token);
  const stateRecipe = (location.state as any)?.recipe as Recipe | undefined;

  // Navigation state is lost on refresh or deep link, so fall back to the API.
  const {
    data: fetchedRecipe,
    isPending,
    isError,
  } = useQuery({
    queryKey: ['recipe', id],
    queryFn: () => RecipeService.getRecipe(id, false, token) as Promise<Recipe>,
    enabled: !stateRecipe && !!token,
    staleTime: 30000,
  });

  const recipe = stateRecipe ?? fetchedRecipe;

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (!stateRecipe && isError) {
      navigate({ to: '/simple/drinks' });
    }
  }, [stateRecipe, isError, navigate]);

  if (!recipe) {
    return isPending ? (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="size-10 animate-spin text-foreground-muted" />
      </div>
    ) : null;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-20 border-b-hairline border-border bg-background">
        <div className="mx-auto max-w-4xl px-4 py-4 sm:px-6 flex items-center justify-between gap-3">
          <div className="flex w-control-md shrink-0">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={t('common.back', 'Back')}
              onClick={goBack}
            >
              <ArrowLeft className="size-6" />
            </Button>
          </div>
          <h1 className="text-xl font-bold truncate flex-1 text-center text-foreground">
            {recipe.name}
          </h1>
          <div className="flex w-control-md shrink-0 justify-end">
            {recipe.alcoholic && <Badge variant="destructive">21+</Badge>}
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto">
        <SimplePageEnter className="mx-auto max-w-4xl px-4 pt-6 pb-32 sm:px-6 space-y-6">
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
        </SimplePageEnter>
      </div>

      <div className="fixed inset-x-0 bottom-[var(--dock-height)] z-40 border-t-hairline border-border bg-background shadow-lg">
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
            {t('simple_order.make_drink', 'Make Drink')}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SimpleDrinkDetail;
