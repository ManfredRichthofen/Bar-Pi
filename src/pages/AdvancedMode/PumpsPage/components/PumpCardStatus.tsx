import type React from 'react';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface DisplayAttribute {
  className: string;
  label: string;
}

interface StateBadge {
  variant: 'default' | 'destructive';
  label: string;
}

interface PumpCardStatusProps {
  printIngredient: string;
  fillingLevel: DisplayAttribute;
  pumpState: StateBadge;
  pumpedUpState: StateBadge;
}

export const PumpCardStatus: React.FC<PumpCardStatusProps> = ({
  printIngredient,
  fillingLevel,
  pumpState,
  pumpedUpState,
}) => {
  const { t } = useTranslation();

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Badge variant={pumpState.variant} className="text-xs h-5">
          {pumpState.label}
        </Badge>
        <Badge variant={pumpedUpState.variant} className="text-xs h-5">
          {pumpedUpState.label}
        </Badge>
      </div>

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
          <span className={cn('text-sm font-semibold', fillingLevel.className)}>
            {fillingLevel.label}
          </span>
        </div>
      </div>
    </div>
  );
};

export default PumpCardStatus;
