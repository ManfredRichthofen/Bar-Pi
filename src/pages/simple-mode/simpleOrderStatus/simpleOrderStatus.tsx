import { useNavigate } from '@tanstack/react-router';
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  GlassWater,
  Loader2,
  XCircle,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { Progress } from '@/components/ui/progress';
import { useWebSocket } from '../../../hooks/useWebSocket';
import CocktailService from '../../../services/cocktail.service';
import useAuthStore from '../../../store/authStore';
import useCocktailProgressStore from '../../../store/cocktailProgressStore';
import { enforcePinAfterDrinkIfRequired } from '../../../utils/orderingPolicy';

// Progress arrives over the WebSocket right after subscribing when an order is running.
const CONNECT_GRACE_MS = 1500;

const SimpleOrderStatus = () => {
  const { t } = useTranslation();
  const [confirming, setConfirming] = useState(false);
  const [canceling, setCanceling] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const navigate = useNavigate();

  const progress = useCocktailProgressStore((state) => state.progress);
  const token = useAuthStore((state) => state.token);

  useWebSocket(token, { keepAlive: true });

  useEffect(() => {
    if (progress) {
      setIsLoading(false);
      return;
    }

    const timer = setTimeout(() => {
      setIsLoading(false);
    }, CONNECT_GRACE_MS);

    return () => clearTimeout(timer);
  }, [progress]);

  const goToDrinks = useCallback(async () => {
    const locked = await enforcePinAfterDrinkIfRequired(navigate);
    if (locked) {
      return;
    }
    navigate({ to: '/simple/drinks' });
  }, [navigate]);

  const handleCancelConfirm = useCallback(async () => {
    if (!token) return;
    setShowCancelDialog(false);
    setCanceling(true);
    try {
      await CocktailService.cancelCocktail(token);
    } catch (error) {
      console.error('Failed to cancel cocktail:', error);
      toast.error(
        t('simple_status.cancel_failed', 'Could not cancel the order'),
      );
    } finally {
      setCanceling(false);
    }
  }, [token, t]);

  const handleConfirmManualAdd = useCallback(async () => {
    if (!token) return;
    setConfirming(true);
    try {
      await CocktailService.continueProduction(token);
    } catch (error) {
      console.error('Failed to confirm manual ingredient add:', error);
      toast.error(
        t('simple_status.continue_failed', 'Could not continue the order'),
      );
    } finally {
      setConfirming(false);
    }
  }, [token, t]);

  const getStateDisplay = (state: string) => {
    const stateMap: Record<string, { label: string; color: string }> = {
      PREPARING: {
        label: t('simple_status.state_preparing', 'Preparing'),
        color: 'text-primary',
      },
      PUMPING: {
        label: t('simple_status.state_pumping', 'Pumping'),
        color: 'text-primary',
      },
      MANUAL_INGREDIENT_ADD: {
        label: t('simple_status.state_manual', 'Manual Add Required'),
        color: 'text-warning',
      },
      COMPLETED: {
        label: t('simple_status.state_completed', 'Completed'),
        color: 'text-success',
      },
      CANCELLED: {
        label: t('simple_status.state_cancelled', 'Cancelled'),
        color: 'text-danger',
      },
    };
    return stateMap[state] || { label: state, color: 'text-foreground-muted' };
  };

  const header = (
    <header className="sticky top-0 z-20 border-b-hairline border-border bg-background">
      <div className="mx-auto max-w-4xl px-4 py-4 sm:px-6 flex items-center justify-between">
        <Button
          variant="ghost"
          size="icon"
          aria-label={t('common.back', 'Back')}
          onClick={goToDrinks}
        >
          <ArrowLeft className="size-6" />
        </Button>
        <h1 className="text-xl font-bold truncate flex-1 mx-3 text-center text-foreground">
          {t('navigation.order_status', 'Order Status')}
        </h1>
        <div className="size-control-md" />
      </div>
    </header>
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        {header}
        <div className="flex-1 flex flex-col items-center justify-center p-4">
          <Loader2 className="size-12 animate-spin text-primary mb-4" />
          <h2 className="text-xl font-semibold mb-2">
            {t('simple_status.connecting', 'Connecting...')}
          </h2>
          <p className="text-sm text-foreground-muted">
            {t('simple_status.connecting_hint', 'Fetching your order status')}
          </p>
        </div>
      </div>
    );
  }

  if (!progress) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        {header}
        <div className="flex-1 flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardContent className="pt-6 text-center">
              <Clock className="size-16 mx-auto mb-4 text-foreground-muted" />
              <h2 className="text-xl font-bold mb-2">
                {t('simple_status.no_order_title', 'No Active Order')}
              </h2>
              <p className="text-foreground-muted mb-6">
                {t(
                  'simple_status.no_order_description',
                  'There is currently no cocktail being prepared',
                )}
              </p>
              <Button size="lg" className="w-full" onClick={goToDrinks}>
                <GlassWater className="size-6" />
                {t('simple_status.order_a_drink', 'Order a Drink')}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const stateDisplay = getStateDisplay(progress.state);
  const isCompleted = progress.state === 'COMPLETED';
  const isCancelled = progress.state === 'CANCELLED';
  const isFinished = isCompleted || isCancelled;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {header}

      <div className="flex-1 overflow-y-auto pb-8">
        <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <CardTitle className="text-2xl">
                  {progress.recipe.name}
                </CardTitle>
                {isCompleted && (
                  <CheckCircle2 className="size-8 shrink-0 text-success" />
                )}
                {isCancelled && (
                  <XCircle className="size-8 shrink-0 text-danger" />
                )}
              </div>
              <span
                className={`mt-2 text-base font-semibold ${stateDisplay.color}`}
                aria-live="polite"
              >
                {stateDisplay.label}
              </span>
            </CardHeader>
            <CardContent className="space-y-4">
              {!isCancelled && (
                <div
                  className={`space-y-2 ${
                    progress.state === 'PREPARING' ||
                    progress.state === 'PUMPING'
                      ? 'running-progress'
                      : ''
                  }`}
                >
                  <div className="flex justify-between text-base">
                    <span className="text-foreground-muted">
                      {t('simple_status.progress', 'Progress')}
                    </span>
                    <span className="font-mono font-semibold">
                      {Math.round(progress.progress)}%
                    </span>
                  </div>
                  <Progress value={progress.progress} />
                </div>
              )}

              {progress.state === 'MANUAL_INGREDIENT_ADD' &&
                progress.currentIngredientsToAddManually && (
                  <Card className="bg-warning-tint border-warning">
                    <CardContent className="pt-6">
                      <h3 className="font-semibold mb-3">
                        {t(
                          'simple_status.manual_add_title',
                          'Please add the following ingredients by hand:',
                        )}
                      </h3>
                      <ul className="space-y-2 mb-4">
                        {progress.currentIngredientsToAddManually.map(
                          (ing: any) => (
                            <li
                              key={ing.id ?? ing.name}
                              className="flex items-center gap-2 text-base"
                            >
                              <span
                                aria-hidden="true"
                                className="size-2 shrink-0 rounded-full bg-warning"
                              />
                              <span className="font-medium flex-1">
                                {ing.name}
                              </span>
                              <span className="font-semibold">
                                {ing.amount} {ing.unit ?? 'ml'}
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
                            <Loader2 className="size-6 animate-spin" />
                            {t('simple_status.confirming', 'Confirming...')}
                          </>
                        ) : (
                          t(
                            'simple_status.confirm_added',
                            "I've Added the Ingredients",
                          )
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                )}

              {progress.recipe.description && (
                <div className="pt-2">
                  <h3 className="font-semibold mb-2 text-sm text-foreground-muted">
                    {t('simple_status.about', 'About')}
                  </h3>
                  <p className="text-base">{progress.recipe.description}</p>
                </div>
              )}

              {progress.recipe.ingredients &&
                progress.recipe.ingredients.length > 0 && (
                  <div className="pt-2">
                    <h3 className="font-semibold mb-2 text-sm text-foreground-muted">
                      {t('ingredients_list.title', 'Ingredients')}
                    </h3>
                    <div className="grid grid-cols-2 gap-2">
                      {progress.recipe.ingredients.map((ing: any) => (
                        <div
                          key={ing.id ?? ing.name}
                          className="flex items-center gap-2 text-base bg-surface-sunken rounded-lg p-2"
                        >
                          <span
                            aria-hidden="true"
                            className="size-1.5 shrink-0 rounded-full bg-primary"
                          />
                          <span className="truncate">{ing.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              {isFinished ? (
                <Button onClick={goToDrinks} className="w-full mt-4" size="lg">
                  <GlassWater className="size-6" />
                  {t('simple_status.order_another', 'Order another drink')}
                </Button>
              ) : (
                <Button
                  variant="destructive"
                  onClick={() => setShowCancelDialog(true)}
                  disabled={canceling}
                  className="w-full mt-4"
                  size="lg"
                >
                  {canceling ? (
                    <>
                      <Loader2 className="size-6 animate-spin" />
                      {t('simple_status.canceling', 'Canceling...')}
                    </>
                  ) : (
                    t('simple_status.cancel_order', 'Cancel Order')
                  )}
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <ConfirmationDialog
        open={showCancelDialog}
        onOpenChange={setShowCancelDialog}
        title={t('simple_status.cancel_title', 'Cancel Order?')}
        description={t(
          'simple_status.cancel_description',
          'Are you sure you want to cancel this drink order? This action cannot be undone.',
        )}
        confirmText={t('simple_status.cancel_confirm', 'Yes, Cancel Order')}
        cancelText={t('simple_status.cancel_keep', 'Keep Order')}
        onConfirm={handleCancelConfirm}
        variant="destructive"
      />
    </div>
  );
};

export default SimpleOrderStatus;
