import { Input as InputPrimitive } from '@base-ui/react/input';
import type * as React from 'react';

import { cn } from '@/lib/utils';

function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        'min-h-control-md w-full min-w-0 rounded-md border-control border-border-strong bg-surface px-4 text-base text-foreground shadow-inset transition-[box-shadow] file:mr-3 file:border-0 file:bg-transparent file:text-base file:font-semibold placeholder:text-foreground-muted aria-invalid:border-2 aria-invalid:border-danger disabled:cursor-not-allowed disabled:opacity-45',
        className,
      )}
      {...props}
    />
  );
}

export { Input };
