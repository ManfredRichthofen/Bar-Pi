import type React from 'react';
import { ReactNode } from 'react';

interface ListCardProps {
  title: string;
  description?: string;
  badges?: ReactNode;
  metadata?: ReactNode;
  actions: ReactNode;
  onClick?: () => void;
  className?: string;
}

export const ListCard: React.FC<ListCardProps> = ({
  title,
  description,
  badges,
  metadata,
  actions,
  onClick,
  className = '',
}) => {
  return (
    <div
      className={`flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 bg-card border rounded-lg hover:shadow-md transition-all duration-200 gap-3 sm:gap-0 ${
        onClick ? 'cursor-pointer' : ''
      } ${className}`}
      onClick={onClick}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 sm:gap-3">
          <h3 className="font-semibold text-sm sm:text-base truncate">
            {title}
          </h3>
          {badges}
        </div>
        {description && (
          <p className="text-xs sm:text-sm text-muted-foreground line-clamp-1 mt-1">
            {description}
          </p>
        )}
        {metadata && (
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mt-2">
            {metadata}
          </div>
        )}
      </div>
      <div className="flex items-center gap-1 sm:gap-2 sm:ml-4 justify-end sm:justify-start">
        {actions}
      </div>
    </div>
  );
};
