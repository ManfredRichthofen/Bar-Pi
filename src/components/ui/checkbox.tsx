'use client';

import { Checkbox as CheckboxPrimitive } from '@base-ui/react/checkbox';
import { CheckIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

function Checkbox({ className, ...props }: CheckboxPrimitive.Root.Props) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        'peer relative flex size-6 shrink-0 items-center justify-center rounded-sm border-2 border-border-strong bg-surface shadow-inset transition-shadow after:absolute after:-inset-3 data-checked:border-primary data-checked:bg-primary data-checked:text-primary-foreground aria-invalid:border-danger group-has-disabled/field:opacity-45 disabled:cursor-not-allowed disabled:opacity-45',
        className,
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className="[&>svg]:size-4 grid place-content-center text-current transition-none"
      >
        <CheckIcon />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
}

export { Checkbox };
