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
  Loader2,
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
import { Progress } from '@/components/ui/progress';
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
  const navigate = useNavigate();
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

  const wsTopic = useMemo(
    () => `/user/topic/pump/runningstate/${pump.id}`,
    [pump.id],
  );

  useEffect(() => {
    if (!token) return;

    if (!WebSocketService.connected) {
      WebSocketService.connectWebsocket(token);
    }

    const handleWebSocketMessage = (data: any) => {
      try {
        const parsed = JSON.parse(data.body);
        setPumpJobState(Object.assign({}, parsed));
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
  }, [pump.id, wsTopic, token]);

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
    () => pump.name || t('pump_card.unnamed', { id: pump.id }),
    [pump.name, pump.id, t],
  );

  const pumpTypeInfo = useMemo(() => {
    const printPumpType = (() => {
      switch (pump.type) {
        case 'dc':
          return t('pump_card.type_dc');
        case 'stepper':
          return t('pump_card.type_stepper');
        case 'valve':
          return t('pump_card.type_valve');
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

  const progressBar = useMemo(() => {
    const abortVal = {
      value: pump.pumpedUp ? 1 : 0,
      query: false,
      reverse: false,
    };
    if (!pumpJobState.runningState) {
      return abortVal;
    }
    const runningState = pumpJobState.runningState;
    let value = runningState.forward
      ? runningState.percentage
      : 100 - runningState.percentage;
    value = value / 100;
    return {
      value,
      query: runningState.runInfinity,
      reverse: runningState.forward && runningState.runInfinity,
    };
  }, [pumpJobState.runningState, pump.pumpedUp]);

  const printIngredient = useMemo(
    () =>
      pump.currentIngredient
        ? pump.currentIngredient.name
        : t('pump_card.no_ingredient'),
    [pump.currentIngredient, t],
  );

  const stateInfo = useMemo(() => {
    const pumpedUpState = (() => {
      if (pump.pumpedUp) {
        return {
          variant: 'default' as const,
          label: t('pump_card.state_pumped_up'),
        };
      } else {
        return {
          variant: 'destructive' as const,
          label: t('pump_card.state_pumped_down'),
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
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className="h-full"
    >
      <Card 
        className={cn(
          "group h-full flex flex-col overflow-hidden transition-all duration-300",
          pumpJobState.runningState 
            ? "ring-2 ring-primary shadow-[0_10px_15px_-3px_rgba(124,58,237,0.3)]" 
            : "hover:shadow-lg"
        )}
      >
        <CardHeader className="space-y-0 pb-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <CardTitle className="text-xl font-bold leading-tight">
                  {displayName}
                </CardTitle>
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (pump?.id) {
                      navigate({ to: `/pumps/$pumpId/edit`, params: { pumpId: pump.id.toString() } });
                    }
                  }}
                  variant="ghost"
                  size="icon-sm"
                  title={t('common.edit')}
                  className="shrink-0 -mt-1 -mr-2"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                {pumpTypeInfo.PumpTypeIcon}
                <span className="font-medium">
                  {pumpTypeInfo.printPumpType}
                </span>
              </div>
              
              <div className="flex items-center gap-2 flex-wrap">
                <Badge
                  variant={stateInfo.pumpedUpState.variant}
                  className="text-xs font-medium"
                >
                  {stateInfo.pumpedUpState.label}
                </Badge>
                <Badge
                  variant={stateInfo.pumpState.variant}
                  className="text-xs font-medium"
                >
                  {stateInfo.pumpState.label}
                </Badge>
              </div>
            </div>
          </div>
        </CardHeader>

        <motion.div 
          className={cn(
            "px-6 pb-4",
            pumpJobState.runningState && "progress-scrolling"
          )}
          animate={pumpJobState.runningState ? {
            opacity: [1, 0.8, 1],
          } : {}}
          transition={{
            duration: 2,
            repeat: pumpJobState.runningState ? Infinity : 0,
            ease: "easeInOut"
          }}
        >
          <Progress 
            value={progressBar.value * 100}
            className={pumpJobState.runningState ? "running-progress" : ""}
          />
        </motion.div>

        <CardContent className="flex-1 space-y-3 pt-0">
          <div className="space-y-2">
            <div className="flex items-center justify-between py-2.5 px-3 rounded-lg bg-muted/40 border border-border/50">
              <span className="text-sm text-muted-foreground font-medium">
                {t('pump_card.ingredient')}
              </span>
              <span className="text-sm font-semibold truncate ml-3 max-w-[60%] text-right">
                {printIngredient}
              </span>
            </div>
            <div className="flex items-center justify-between py-2.5 px-3 rounded-lg bg-muted/40 border border-border/50">
              <span className="text-sm text-muted-foreground font-medium">
                {t('pump_card.filling_level')}
              </span>
              <span
                className={`text-sm font-semibold ${displayAttributes.fillingLevel.className}`}
              >
                {displayAttributes.fillingLevel.label}
              </span>
            </div>
          </div>
        </CardContent>

        <CardFooter className="mt-auto border-t pt-4">
          <div className="flex gap-2 w-full">
            {pump.canControlDirection && (
              <div className="flex gap-2">
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    onClickPumpUp(true);
                  }}
                  disabled={!!pumpJobState.runningState || pumpDownBtnLoading}
                  variant="outline"
                  size="sm"
                  title={t('pump_card.pump_down')}
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
                >
                  <CornerUpRight className="h-4 w-4" />
                </Button>
              </div>
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
              className="ml-auto min-w-20"
            >
              {runningBtnLoading ? (
                <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
              ) : pumpJobState.runningState ? (
                <StopCircle className="h-4 w-4 mr-1.5" />
              ) : (
                <PlayCircle className="h-4 w-4 mr-1.5" />
              )}
              {pumpJobState.runningState ? t('pump_card.stop') : t('pump_card.start')}
            </Button>
          </div>
        </CardFooter>
      </Card>
    </motion.div>
  );
};
