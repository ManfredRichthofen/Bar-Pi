import { Input as InputPrimitive } from '@base-ui/react/input';
import type * as React from 'react';

import { cn } from '@/lib/utils';

function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        'bg-surface border-border-strong shadow-inset aria-invalid:border-destructive aria-invalid:border-2 min-h-control-md rounded-md border px-4 py-2 text-base transition-[color,box-shadow] file:h-8 file:text-sm file:font-medium focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ring file:text-foreground placeholder:text-muted-foreground w-full min-w-0 outline-none file:inline-flex file:border-0 file:bg-transparent disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    />
  );
}

export { Input };
