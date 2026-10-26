import type React from 'react';
import type { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  searchComponent?: ReactNode;
  isVisible?: boolean;
  className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  action,
  searchComponent,
  isVisible = true,
  className = '',
}) => {
  return (
    <div
      className={`sticky top-16 z-40 border-b-hairline border-border bg-background transition-colors ${
        isVisible ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'
      } ${className}`}
    >
      <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl">{title}</h1>
            {subtitle && (
              <p className="text-sm text-foreground-muted mt-1">{subtitle}</p>
            )}
          </div>
          {action && <div className="flex w-full flex-wrap gap-2 sm:w-auto">{action}</div>}
        </div>

        {searchComponent && (
          <div className="mt-3 sm:mt-4">{searchComponent}</div>
        )}
      </div>
    </div>
  );
};
