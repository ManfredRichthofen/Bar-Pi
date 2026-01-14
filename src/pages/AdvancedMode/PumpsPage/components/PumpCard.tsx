import type React from 'react';
import { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { motion } from 'motion/react';
import {
  Pencil,
  PlayCircle,
  StopCircle,
  CornerUpLeft,
  CornerUpRight,
  Droplet,
  Hexagon,
} from 'lucide-react';
import WebSocketService from '../../../../services/websocket.service';
import PumpService from '../../../../services/pump.service';
import useAuthStore from '../../../../store/authStore';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Progress,
  ProgressTrack,
  ProgressIndicator,
} from '@/components/ui/progress';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const StepperMotorIcon = ({ width = 24, height = 24, className = '' }) => (
  <svg
    width={width}
    height={height}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <circle cx="12" cy="12" r="10" />
    <path d="M12 6v12" />
    <path d="M8 10l8 4" />
    <path d="M16 10l-8 4" />
  </svg>
);

interface PumpCardProps {
  pump: any;
}

export const PumpCard: React.FC<PumpCardProps> = ({ pump }) => {
  const { t } = useTranslation();
  const navigate = useNavigate({ from: '/pumps' });
  const token = useAuthStore((state) => state.token);

  const [pumpDownBtnLoading, setPumpDownBtnLoading] = useState(false);
  const [pumpUpBtnLoading, setPumpUpBtnLoading] = useState(false);
  const [runningBtnLoading, setRunningBtnLoading] = useState(false);
  const [pumpJobState, setPumpJobState] = useState<{
    lastJobId: string | null;
    runningState: any;
  }>({
    lastJobId: null,
    runningState: null,
  });
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const wsTopic = useMemo(
    () => `/user/topic/pump/runningstate/${pump.id}`,
    [pump.id],
  );

  useEffect(() => {
    const handleWebSocketMessage = (data: any) => {
      try {
        const parsed = JSON.parse(data.body);
        setPumpJobState(parsed);
        setLastUpdate(new Date());
      } catch (err) {
        console.error('Error parsing pump job state', err);
      }
    };

    WebSocketService.subscribe(
      `pump-${pump.id}`,
      wsTopic,
      handleWebSocketMessage,
      true,
    );

    return () => {
      WebSocketService.unsubscribe(`pump-${pump.id}`, wsTopic);
    };
  }, [pump.id, wsTopic]);

  const displayAttributes = useMemo(() => {
    const getDisplayAttribute = (attr: any, suffix = '') => {
      const missingText = 'Missing';
      if ((attr === undefined || attr === null) && attr !== 0) {
        return { className: 'text-destructive', label: missingText };
      } else {
        return {
          className: 'text-inherit',
          label: `${attr}${suffix ? ' ' + suffix : ''}`,
        };
      }
    };

    const getDisplayPin = (pin: any) => {
      const missingText = 'Missing';
      if (!pin) {
        return { className: 'text-destructive', label: missingText };
      } else {
        return {
          className: 'text-inherit',
          label: `${pin.boardName} / ${pin.pinName}`,
        };
      }
    };

    return {
      fillingLevel: getDisplayAttribute(pump.fillingLevelInMl, 'ml'),
      pin: getDisplayPin(pump.pin),
    };
  }, [pump.fillingLevelInMl, pump.pin]);

  const displayName = useMemo(
    () => pump.name || t('pump.pump_card.unnamed', { id: pump.id }),
    [pump.name, pump.id, t],
  );

  const pumpTypeInfo = useMemo(() => {
    const printPumpType = (() => {
      switch (pump.type) {
        case 'dc':
          return t('pump.pump_card.type_dc');
        case 'stepper':
          return t('pump.pump_card.type_stepper');
        case 'valve':
          return t('pump.pump_card.type_valve');
        default:
          return '';
      }
    })();

    const PumpTypeIcon = (() => {
      if (pump.type === 'dc') {
        return <Droplet size={16} className="inline-block mr-1" />;
      } else if (pump.type === 'stepper') {
        return (
          <StepperMotorIcon
            width={16}
            height={16}
            className="inline-block mr-1"
          />
        );
      } else {
        return <Hexagon size={16} className="inline-block mr-1" />;
      }
    })();

    return { printPumpType, PumpTypeIcon };
  }, [pump.type, t]);

  const printIngredient = useMemo(
    () =>
      pump.currentIngredient
        ? pump.currentIngredient.name
        : t('pump.pump_card.no_ingredient'),
    [pump.currentIngredient, t],
  );

  const stateInfo = useMemo(() => {
    const pumpedUpState = (() => {
      if (pump.pumpedUp) {
        return {
          variant: 'default' as const,
          label: t('pump.pump_card.state_pumped_up'),
        };
      } else {
        return {
          variant: 'destructive' as const,
          label: t('pump.pump_card.state_pumped_down'),
        };
      }
    })();

    const pumpState = (() => {
      let state: { variant: 'default' | 'destructive'; label: string } = {
        variant: 'default',
        label: '',
      };
      if (pumpJobState.runningState) {
        state = { variant: 'default', label: t('pump_card.state_running') };
      } else {
        switch (pump.state) {
          case 'READY':
            state = {
              variant: 'default',
              label: t('pump_card.state_ready'),
            };
            break;
          case 'INCOMPLETE':
          case 'TESTABLE':
            state = {
              variant: 'destructive',
              label: t('pump_card.state_incomplete'),
            };
            break;
          default:
            state = { variant: 'default', label: pump.state };
        }
      }
      return state;
    })();

    return { pumpedUpState, pumpState };
  }, [pump.pumpedUp, pumpJobState.runningState, pump.state, t]);

  const onClickTurnOnOrOffPump = useCallback(() => {
    setRunningBtnLoading(true);
    if (pumpJobState.runningState) {
      PumpService.stopPump(pump.id, token)
        .then(() => {
          toast.success(`Pump "${displayName}" stopped successfully`);
        })
        .catch((error) => {
          console.error('Failed to stop pump:', error);
          toast.error(`Failed to stop pump "${displayName}"`);
        })
        .finally(() => setRunningBtnLoading(false));
    } else {
      PumpService.startPump(pump.id, token)
        .then(() => {
          toast.success(`Pump "${displayName}" started successfully`);
        })
        .catch((error) => {
          console.error('Failed to start pump:', error);
          toast.error(`Failed to start pump "${displayName}"`);
        })
        .finally(() => setRunningBtnLoading(false));
    }
  }, [pumpJobState.runningState, pump.id, token, displayName]);

  const onClickPumpUp = useCallback(
    (reverse: boolean) => {
      if (reverse) {
        setPumpDownBtnLoading(true);
        PumpService.pumpDown(pump.id, token)
          .catch((error) => {
            console.error('Failed to pump down:', error);
            toast.error(`Failed to pump down "${displayName}"`);
          })
          .finally(() => setPumpDownBtnLoading(false));
      } else {
        setPumpUpBtnLoading(true);
        PumpService.pumpUp(pump.id, token)
          .catch((error) => {
            console.error('Failed to pump up:', error);
            toast.error(`Failed to pump up "${displayName}"`);
          })
          .finally(() => setPumpUpBtnLoading(false));
      }
    },
    [pump.id, token, displayName],
  );

  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className="h-full"
    >
      <Card className="group h-full flex flex-col overflow-hidden border-border/50 hover:border-border hover:shadow-xl transition-all duration-300 p-0">
        <CardHeader className="bg-gradient-to-br from-muted/50 to-accent/20 border-b relative p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-lg sm:text-xl font-bold truncate mb-2">
                {displayName}
              </CardTitle>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                {pumpTypeInfo.PumpTypeIcon}
                <span className="font-medium">
                  {pumpTypeInfo.printPumpType}
                </span>
              </div>
              {lastUpdate && (
                <div className="text-xs text-muted-foreground/60 mt-1.5">
                  Updated {lastUpdate.toLocaleTimeString()}
                </div>
              )}
            </div>
            <div className="flex flex-col items-end gap-2 flex-shrink-0">
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  navigate({ to: `/pumps/${pump.id}/edit` });
                }}
                variant="ghost"
                size="icon-sm"
                title={t('common.edit')}
                className="hover:bg-background/80 backdrop-blur-sm transition-all"
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <div className="flex flex-col gap-1.5">
                <Badge
                  variant={stateInfo.pumpedUpState.variant}
                  className="shadow-sm backdrop-blur-sm text-xs"
                >
                  {stateInfo.pumpedUpState.label}
                </Badge>
                <Badge
                  variant={stateInfo.pumpState.variant}
                  className="shadow-sm backdrop-blur-sm text-xs"
                >
                  {stateInfo.pumpState.label}
                </Badge>
              </div>

              <div className="w-full h-1 bg-muted/40 overflow-hidden relative rounded-full">
                <motion.div
                  className={cn(
                    'h-full w-[30%] absolute top-0 rounded-full',
                    pumpJobState.runningState
                      ? 'bg-primary'
                      : 'bg-muted-foreground/20',
                  )}
                  animate={
                    pumpJobState.runningState
                      ? {
                          left: [`-30%`, `100%`],
                        }
                      : {
                          left: `-30%`,
                        }
                  }
                  transition={
                    pumpJobState.runningState
                      ? {
                          duration: 2,
                          repeat: Number.POSITIVE_INFINITY,
                          ease: 'linear',
                        }
                      : {
                          duration: 0,
                        }
                  }
                />
              </div>
            </div>
          </div>
        </CardHeader>

        <div className="flex-shrink-0 relative">
          {pumpJobState.runningState ? (
            <div className="relative w-full">
              <Progress value={30}>
                <ProgressTrack>
                  <ProgressIndicator className="bg-gradient-to-r from-primary to-primary/80" />
                </ProgressTrack>
              </Progress>
              <div
                className="absolute left-0 top-0 h-full pointer-events-none"
                style={{ width: '30%', overflow: 'hidden' }}
              >
                <div
                  className="h-full w-[200%]"
                  style={{
                    backgroundImage:
                      'repeating-linear-gradient(45deg, rgba(255,255,255,0.25) 0px, rgba(255,255,255,0.25) 10px, transparent 10px, transparent 20px)',
                    animation: 'progressScroll 1s linear infinite',
                  }}
                />
              </div>
              <style>{`@keyframes progressScroll { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }`}</style>
            </div>
          ) : (
            <Progress value={0}>
              <ProgressTrack>
                <ProgressIndicator className="transition-all duration-300" />
              </ProgressTrack>
            </Progress>
          )}
        </div>

        <CardContent className="flex-1 flex flex-col gap-4 p-4">
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
              <span className="text-muted-foreground font-medium">
                {t('pump_card.ingredient')}
              </span>
              <span className="font-semibold truncate ml-2 text-foreground">
                {printIngredient}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
              <span className="text-muted-foreground font-medium">
                {t('pump_card.filling_level')}
              </span>
              <span
                className={`font-semibold ${displayAttributes.fillingLevel.className}`}
              >
                {displayAttributes.fillingLevel.label}
              </span>
            </div>
          </div>
        </CardContent>

        <CardFooter className="mt-auto border-t p-4 bg-muted/20">
          <div className="flex gap-2 ml-auto">
            {pump.canControlDirection && (
              <>
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    onClickPumpUp(true);
                  }}
                  disabled={!!pumpJobState.runningState || pumpDownBtnLoading}
                  variant="outline"
                  size="sm"
                  title={t('pump_card.pump_down')}
                  className="hover:bg-background transition-all"
                >
                  <CornerUpLeft className="h-4 w-4" />
                </Button>
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    onClickPumpUp(false);
                  }}
                  disabled={!!pumpJobState.runningState || pumpUpBtnLoading}
                  variant="outline"
                  size="sm"
                  title={t('pump_card.pump_up')}
                  className="hover:bg-background transition-all"
                >
                  <CornerUpRight className="h-4 w-4" />
                </Button>
              </>
            )}
            <Button
              onClick={(e) => {
                e.stopPropagation();
                onClickTurnOnOrOffPump();
              }}
              disabled={runningBtnLoading}
              variant={pumpJobState.runningState ? 'destructive' : 'default'}
              size="sm"
              title={
                pumpJobState.runningState
                  ? t('pump_card.stop')
                  : t('pump_card.start')
              }
              className="shadow-sm"
            >
              {pumpJobState.runningState ? (
                <StopCircle className="h-4 w-4" />
              ) : (
                <PlayCircle className="h-4 w-4" />
              )}
            </Button>
          </div>
        </CardFooter>
      </Card>
    </motion.div>
  );
};
