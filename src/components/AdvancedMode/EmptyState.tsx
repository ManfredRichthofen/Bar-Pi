import { AlertCircle } from 'lucide-react';
import type React from 'react';
import { ReactNode } from 'react';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description: string;
  actions?: ReactNode;
  variant?: 'info' | 'error' | 'search';
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actions,
  variant = 'info',
}) => {
  const iconColor =
    variant === 'error'
      ? 'text-destructive'
      : variant === 'search'
        ? 'text-muted-foreground'
        : 'text-muted-foreground';

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 min-h-[400px]">
      <div className={`mb-4 ${iconColor}`}>
        {icon || <AlertCircle className="h-16 w-16" />}
      </div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground text-center mb-6 max-w-sm">
        {description}
      </p>
      {actions && (
        <div className="flex flex-col sm:flex-row gap-3">{actions}</div>
      )}
    </div>
  );
};
