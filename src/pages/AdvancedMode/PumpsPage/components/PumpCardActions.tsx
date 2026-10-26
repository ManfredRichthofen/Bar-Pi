import { CornerUpLeft, CornerUpRight, PlayCircle, StopCircle } from 'lucide-react';
import type React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';

interface PumpCardActionsProps {
  canControlDirection: boolean;
  isRunning: boolean;
  pumpDownLoading: boolean;
  pumpUpLoading: boolean;
  runningLoading: boolean;
  onPumpDown: () => void;
  onPumpUp: () => void;
  onToggleRunning: () => void;
}

export const PumpCardActions: React.FC<PumpCardActionsProps> = ({
  canControlDirection,
  isRunning,
  pumpDownLoading,
  pumpUpLoading,
  runningLoading,
  onPumpDown,
  onPumpUp,
  onToggleRunning,
}) => {
  const { t } = useTranslation();

  return (
    <>
      {canControlDirection && (
        <>
          <Button
            onClick={(e) => {
              e.stopPropagation();
              onPumpDown();
            }}
            disabled={isRunning || pumpDownLoading}
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
              onPumpUp();
            }}
            disabled={isRunning || pumpUpLoading}
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
          onToggleRunning();
        }}
        disabled={runningLoading}
        variant={isRunning ? 'destructive' : 'default'}
        size="sm"
        title={isRunning ? t('pump_card.stop') : t('pump_card.start')}
        className="flex-1"
      >
        {isRunning ? (
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
    </>
  );
};

export default PumpCardActions;
