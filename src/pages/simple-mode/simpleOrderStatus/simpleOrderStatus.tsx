import { useNavigate } from '@tanstack/react-router';
import { ArrowLeft, CheckCircle2, Clock, Loader2 } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useWebSocket } from '../../../hooks/useWebSocket';
import CocktailService from '../../../services/cocktail.service';
import useAuthStore from '../../../store/authStore';
import useCocktailProgressStore from '../../../store/cocktailProgressStore';

const SimpleOrderStatus = () => {
  const [confirming, setConfirming] = useState(false);
  const [canceling, setCanceling] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  const progress = useCocktailProgressStore((state) => state.progress);
  const token = useAuthStore((state) => state.token);

  // Maintain WebSocket connection
  useWebSocket(token, true);

  // Stop loading once we have progress or after timeout
  useEffect(() => {
    if (progress) {
      setIsLoading(false);
      return;
    }

    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 10000); // Wait 10 seconds for WebSocket to receive progress

    return () => clearTimeout(timer);
  }, [progress]);

  const handleCancel = useCallback(async () => {
    if (!token) return;
    setCanceling(true);
    try {
      await CocktailService.cancelCocktail(token);
    } catch (error) {
      console.error('Failed to cancel cocktail:', error);
    } finally {
      setCanceling(false);
    }
  }, [token]);

  const handleConfirmManualAdd = useCallback(async () => {
    if (!token) return;
    setConfirming(true);
    try {
      await CocktailService.continueProduction(token);
    } catch (error) {
      console.error('Failed to confirm manual ingredient add:', error);
    } finally {
      setConfirming(false);
    }
  }, [token]);

  const getStateDisplay = (state: string) => {
    const stateMap: Record<string, { label: string; color: string }> = {
      PREPARING: { label: 'Preparing', color: 'text-primary' },
      PUMPING: { label: 'Pumping', color: 'text-primary' },
      MANUAL_INGREDIENT_ADD: {
        label: 'Manual Add Required',
        color: 'text-accent-foreground',
      },
      COMPLETED: { label: 'Completed', color: 'text-primary' },
      CANCELLED: { label: 'Cancelled', color: 'text-destructive' },
    };
    return stateMap[state] || { label: state, color: 'text-muted-foreground' };
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
        <h2 className="text-xl font-semibold mb-2">Connecting...</h2>
        <p className="text-sm text-muted-foreground">
          Fetching your order status
        </p>
      </div>
    );
  }

  // No active order
  if (!progress) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-md border-b border-border shadow-sm pt-2">
          <div className="px-4 py-4 flex items-center justify-between">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-xl"
              onClick={() => navigate({ to: '/simple/drinks' })}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-lg font-bold">Order Status</h1>
            <div className="w-10" />
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardContent className="pt-6 text-center">
              <Clock className="w-16 h-16 mx-auto mb-4 text-muted-foreground/60" />
              <h2 className="text-xl font-bold mb-2">No Active Order</h2>
              <p className="text-muted-foreground mb-6">
                There is currently no cocktail being prepared
              </p>
              <Button
                size="lg"
                className="w-full"
                onClick={() => navigate({ to: '/simple/drinks' })}
              >
                Order a Drink
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const stateDisplay = getStateDisplay(progress.state);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-md border-b border-border shadow-sm pt-2">
        <div className="px-4 py-4 flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-xl"
            onClick={() => navigate({ to: '/simple/drinks' })}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-bold">Order Status</h1>
          <div className="w-10" />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto pb-20">
        <div className="p-4 max-w-2xl mx-auto space-y-4">
          {/* Status Card */}
          <Card className="border-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-2xl">
                  {progress.recipe.name}
                </CardTitle>
                {progress.state === 'COMPLETED' && (
                  <CheckCircle2 className="w-8 h-8 text-primary" />
                )}
              </div>
              <div className="flex items-center gap-2 mt-2">
                <span className={`text-sm font-semibold ${stateDisplay.color}`}>
                  {stateDisplay.label}
                </span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="font-semibold">
                    {Math.round(progress.progress)}%
                  </span>
                </div>
                <Progress value={progress.progress} className="h-3" />
              </div>

              {/* Manual Ingredient Prompt */}
              {progress.state === 'MANUAL_INGREDIENT_ADD' &&
                progress.currentIngredientsToAddManually && (
                  <Card className="bg-accent/10 border-accent/20">
                    <CardContent className="pt-6">
                      <h3 className="font-semibold mb-3 text-accent-foreground">
                        Please add the following ingredients manually:
                      </h3>
                      <ul className="space-y-2 mb-4">
                        {progress.currentIngredientsToAddManually.map(
                          (ing: any, idx: number) => (
                            <li
                              key={idx}
                              className="flex items-center gap-2 text-sm"
                            >
                              <div className="w-2 h-2 rounded-full bg-accent" />
                              <span className="font-medium">{ing.name}</span>
                              <span className="text-muted-foreground">
                                - {ing.amount}ml
                              </span>
                            </li>
                          ),
                        )}
                      </ul>
                      <Button
                        onClick={handleConfirmManualAdd}
                        disabled={confirming}
                        className="w-full"
                        size="lg"
                      >
                        {confirming ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Confirming...
                          </>
                        ) : (
                          "I've Added the Ingredients"
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                )}

              {/* Recipe Details */}
              {progress.recipe.description && (
                <div className="pt-2">
                  <h3 className="font-semibold mb-2 text-sm text-muted-foreground">
                    About
                  </h3>
                  <p className="text-sm">{progress.recipe.description}</p>
                </div>
              )}

              {/* Ingredients */}
              {progress.recipe.ingredients &&
                progress.recipe.ingredients.length > 0 && (
                  <div className="pt-2">
                    <h3 className="font-semibold mb-2 text-sm text-muted-foreground">
                      Ingredients
                    </h3>
                    <div className="grid grid-cols-2 gap-2">
                      {progress.recipe.ingredients.map(
                        (ing: any, idx: number) => (
                          <div
                            key={idx}
                            className="flex items-center gap-2 text-sm bg-muted/50 rounded-lg p-2"
                          >
                            <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                            <span className="truncate">{ing.name}</span>
                          </div>
                        ),
                      )}
                    </div>
                  </div>
                )}

              {/* Cancel Button */}
              {progress.state !== 'COMPLETED' &&
                progress.state !== 'CANCELLED' && (
                  <Button
                    variant="destructive"
                    onClick={handleCancel}
                    disabled={canceling}
                    className="w-full mt-4"
                    size="lg"
                  >
                    {canceling ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Canceling...
                      </>
                    ) : (
                      'Cancel Order'
                    )}
                  </Button>
                )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SimpleOrderStatus;
