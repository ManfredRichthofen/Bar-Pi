import type React from 'react';
import { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export interface ActionButton {
  icon: ReactNode;
  label: string;
  onClick: (e: React.MouseEvent) => void;
  variant?: 'ghost' | 'default' | 'destructive' | 'outline' | 'secondary';
  className?: string;
  disabled?: boolean;
}

interface ActionButtonsProps {
  actions: ActionButton[];
  className?: string;
}

export const ActionButtons: React.FC<ActionButtonsProps> = ({
  actions,
  className = '',
}) => {
  return (
    <div className={`flex items-center gap-1 sm:gap-2 ${className}`}>
      {actions.map((action, index) => (
        <Tooltip key={index}>
          <TooltipTrigger>
            <Button
              variant={action.variant || 'ghost'}
              size="icon"
              onClick={action.onClick}
              className={`h-9 w-9 sm:h-10 sm:w-10 ${action.className || ''}`}
              aria-label={action.label}
              disabled={action.disabled}
            >
              {action.icon}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{action.label}</p>
          </TooltipContent>
        </Tooltip>
      ))}
    </div>
  );
};
