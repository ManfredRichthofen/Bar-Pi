import type * as React from 'react';

import { cn } from '@/lib/utils';

function Textarea({ className, ...props }: React.ComponentProps<'textarea'>) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        'bg-surface border-border-strong shadow-inset aria-invalid:border-destructive aria-invalid:border-2 rounded-md border px-4 py-3 text-base transition-[color,box-shadow] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ring placeholder:text-muted-foreground flex field-sizing-content min-h-16 w-full outline-none disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
