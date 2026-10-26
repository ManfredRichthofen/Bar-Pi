import type * as React from 'react';

import { cn } from '@/lib/utils';

function Textarea({ className, ...props }: React.ComponentProps<'textarea'>) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        'field-sizing-content min-h-24 w-full rounded-md border-control border-border-strong bg-surface px-4 py-3 text-base text-foreground shadow-inset placeholder:text-foreground-muted aria-invalid:border-2 aria-invalid:border-danger disabled:cursor-not-allowed disabled:opacity-45',
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
