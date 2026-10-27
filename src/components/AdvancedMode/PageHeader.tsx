import type React from 'react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  /** Small mono figure after the title, e.g. a total. */
  count?: number | string;
  /** Primary actions, right-aligned; wrap on narrow widths. */
  action?: ReactNode;
  searchComponent?: ReactNode;
  /** Extra rows under the search, e.g. a filter panel. */
  children?: ReactNode;
  isVisible?: boolean;
  className?: string;
}

/** Sticky page header for Advanced mode: title block left, actions right, search below. */
export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  count,
  action,
  searchComponent,
  children,
  isVisible = true,
  className,
}) => {
  return (
    <header
      className={cn(
        'sticky top-16 z-30 border-b-hairline border-border bg-background transition-transform',
        !isVisible && '-translate-y-full',
        className,
      )}
    >
      <div className="mx-auto max-w-7xl space-y-4 px-4 py-5 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
          <div className="min-w-0">
            <h1 className="flex items-baseline gap-3 text-3xl sm:text-4xl">
              <span className="truncate">{title}</span>
              {count !== undefined && (
                <span className="font-mono text-xl font-normal tracking-normal text-foreground-muted">
                  {count}
                </span>
              )}
            </h1>
            {subtitle && (
              <p className="mt-1 text-base text-foreground-muted">{subtitle}</p>
            )}
          </div>
          {action && (
            <div className="flex flex-wrap items-center gap-2">{action}</div>
          )}
        </div>
        {searchComponent}
        {children}
      </div>
    </header>
  );
};
