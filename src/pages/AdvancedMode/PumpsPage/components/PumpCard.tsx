import { useNavigate } from '@tanstack/react-router';
import {
  Activity,
  CornerUpLeft,
  CornerUpRight,
  Droplet,
  Hexagon,
  Pencil,
  PlayCircle,
  StopCircle,
} from 'lucide-react';
import { motion } from 'motion/react';
import type React from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { StepperMotorIcon } from '@/pages/AdvancedMode/PumpsPage/components/StepperMotorIcon';
import PumpService from '../../../../services/pump.service';
import WebSocketService from '../../../../services/websocket.service';
import useAuthStore from '../../../../store/authStore';

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

  const wsTopic = useMemo(
    () => `/user/topic/pump/runningstate/${pump.id}`,
    [pump.id],
  );

  useEffect(() => {
    const handleWebSocketMessage = (data: any) => {
      console.log(`Pump ${pump.id} received WebSocket message:`, data);
      try {
        const parsed = JSON.parse(data.body);
        console.log(`Pump ${pump.id} parsed state:`, parsed);
        setPumpJobState(parsed);
      } catch (err) {
        console.error('Error parsing pump job state', err);
      }
    };

    console.log(`Pump ${pump.id} subscribing to WebSocket topic:`, wsTopic);
    console.log(
      `Pump ${pump.id} WebSocket service connected:`,
      WebSocketService.connected,
    );

    WebSocketService.subscribe(
      `pump-${pump.id}`,
      wsTopic,
      handleWebSocketMessage,
      true,
    );

    return () => {
      console.log(
        `Pump ${pump.id} unsubscribing from WebSocket topic:`,
        wsTopic,
      );
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
    console.log(
      `Pump ${pump.id} current running state:`,
      pumpJobState.runningState,
    );

    if (pumpJobState.runningState) {
      console.log(`Stopping pump ${pump.id}...`);
      PumpService.stopPump(pump.id, token)
        .then(() => {
          console.log(`Pump ${pump.id} stop command sent successfully`);
          toast.success(`Pump "${displayName}" stopped successfully`);
        })
        .catch((error) => {
          console.error('Failed to stop pump:', error);
          toast.error(`Failed to stop pump "${displayName}"`);
        })
        .finally(() => setRunningBtnLoading(false));
    } else {
      console.log(`Starting pump ${pump.id}...`);
      PumpService.startPump(pump.id, token)
        .then(() => {
          console.log(`Pump ${pump.id} start command sent successfully`);
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
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className="h-full"
    >
      <Card className="group h-full flex flex-col overflow-hidden border-border/50 hover:border-primary/20 hover:shadow-lg transition-all duration-300">
        <CardHeader className="p-4 pb-3 space-y-0">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <CardTitle className="text-lg font-bold truncate">
                  {displayName}
                </CardTitle>
                {pumpJobState.runningState && (
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{
                      duration: 1.5,
                      repeat: Number.POSITIVE_INFINITY,
                      ease: 'easeInOut',
                    }}
                  >
                    <Activity className="h-4 w-4 text-primary" />
                  </motion.div>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                {pumpTypeInfo.PumpTypeIcon}
                <span>{pumpTypeInfo.printPumpType}</span>
              </div>
            </div>
            <Button
              onClick={(e) => {
                e.stopPropagation();
                navigate({ to: `/pumps/${pump.id}/edit` });
              }}
              variant="ghost"
              size="icon-sm"
              title={t('common.edit')}
              className="shrink-0"
            >
              <Pencil className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="flex-1 p-4 pt-0 space-y-3">
          {/* Status Badges */}
          <div className="flex gap-2">
            <Badge
              variant={stateInfo.pumpState.variant}
              className="text-xs h-5"
            >
              {stateInfo.pumpState.label}
            </Badge>
            <Badge
              variant={stateInfo.pumpedUpState.variant}
              className="text-xs h-5"
            >
              {stateInfo.pumpedUpState.label}
            </Badge>
          </div>

          {/* Main Info */}
          <div className="space-y-2">
            <div className="flex items-center justify-between p-2.5 rounded-md bg-muted/50">
              <span className="text-xs text-muted-foreground font-medium">
                {t('pump_card.ingredient')}
              </span>
              <span className="text-sm font-semibold truncate ml-2">
                {printIngredient}
              </span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-md bg-muted/50">
              <span className="text-xs text-muted-foreground font-medium">
                {t('pump_card.filling_level')}
              </span>
              <span
                className={cn(
                  'text-sm font-semibold',
                  displayAttributes.fillingLevel.className,
                )}
              >
                {displayAttributes.fillingLevel.label}
              </span>
            </div>
          </div>
        </CardContent>

        <CardFooter className="p-4 pt-0 flex gap-2">
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
                className="flex-1"
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
                className="flex-1"
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
            className="flex-1"
          >
            {pumpJobState.runningState ? (
              <>
                <StopCircle className="h-4 w-4 mr-1.5" />
                Stop
              </>
            ) : (
              <>
                <PlayCircle className="h-4 w-4 mr-1.5" />
                Start
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
};
