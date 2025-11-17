import { useState, useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BentoGrid } from '@/components/ui/bento-grid';
import CocktailService from '../../../services/cocktail.service';
import useCocktailProgressStore from '../../../store/cocktailProgressStore';
import useAuthStore from '../../../store/authStore';
import { useWebSocket } from '../../../hooks/useWebSocket';
import StatusCard from './components/StatusCard';
import ManualIngredientPrompt from './components/ManualIngredientPrompt';
import RecipeDetails from './components/RecipeDetails';
import NoActiveOrder from './components/NoActiveOrder';
import Loader from '@/components/kokonutui/loader';

const SimpleOrderStatus = () => {
  const [confirming, setConfirming] = useState(false);
  const [canceling, setCanceling] = useState(false);
  const [isWaitingForProgress, setIsWaitingForProgress] = useState(true);
  const navigate = useNavigate();

  const progress = useCocktailProgressStore((state) => state.progress);
  const token = useAuthStore((state) => state.token);

  // Maintain constant WebSocket connection for real-time updates
  // keepAlive=true ensures connection stays active even if component temporarily unmounts
  useWebSocket(token, true);

  // Give WebSocket time to receive progress update after ordering
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsWaitingForProgress(false);
    }, 2000); // Wait 2 seconds for WebSocket to update
    return () => clearTimeout(timer);
  }, []);

  // Stop waiting once we receive progress
  useEffect(() => {
    if (progress) {
      setIsWaitingForProgress(false);
    }
  }, [progress]);

  const handleCancel = async () => {
    if (!token) return;

    setCanceling(true);
    try {
      await CocktailService.cancelCocktail(token);
    } catch (error) {
      console.error('Failed to cancel cocktail:', error);
    } finally {
      setCanceling(false);
    }
  };

  const handleConfirmManualAdd = async () => {
    if (!token) return;

    setConfirming(true);
    try {
      await CocktailService.continueProduction(token);
    } catch (error) {
      console.error('Failed to confirm manual ingredient add:', error);
    } finally {
      setConfirming(false);
    }
  };

  // Show loading while waiting for WebSocket to update
  if (isWaitingForProgress && !progress) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader
          title="Connecting to order..."
          subtitle="Please wait while we fetch your drink status"
          size="md"
        />
      </div>
    );
  }

  if (!progress) {
    return (
      <NoActiveOrder onOrderDrink={() => navigate({ to: '/simple/drinks' })} />
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-md border-b border-border shadow-sm">
        <div className="px-3 sm:px-4 py-3 sm:py-4 flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate({ to: '/simple/drinks' })}
            className="rounded-xl"
          >
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          </Button>
          <h1 className="text-base sm:text-lg font-bold truncate flex-1 mx-2 sm:mx-3 text-center">
            Order Status
          </h1>
          <div className="w-8 sm:w-10" /> {/* Spacer for centering */}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-3 sm:p-4 max-w-7xl mx-auto">
          {/* Bento Grid Layout */}
          <BentoGrid className="grid-cols-1 md:grid-cols-2 lg:grid-cols-3 auto-rows-[minmax(180px,auto)] gap-3 sm:gap-4">
            
            {/* Status and Progress - Large featured card */}
            <div className="md:col-span-2 lg:col-span-2">
              <StatusCard
                recipeName={progress.recipe.name}
                state={progress.state}
                progress={progress.progress}
                onCancel={handleCancel}
                canceling={canceling}
              />
            </div>

            {/* Manual Ingredient Add Confirmation - Spans appropriately */}
            {progress.state === 'MANUAL_INGREDIENT_ADD' && (
              <div className="md:col-span-2 lg:col-span-3">
                <ManualIngredientPrompt
                  ingredients={progress.currentIngredientsToAddManually || []}
                  onConfirm={handleConfirmManualAdd}
                  confirming={confirming}
                />
              </div>
            )}

            {/* Recipe Information - Spans full width */}
            <div className="md:col-span-2 lg:col-span-3">
              <RecipeDetails recipe={progress.recipe} />
            </div>
          </BentoGrid>
        </div>
      </div>
    </div>
  );
};

export default SimpleOrderStatus;
