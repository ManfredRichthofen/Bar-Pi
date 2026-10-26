'use client';

import { Toggle as TogglePrimitive } from '@base-ui/react/toggle';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const toggleVariants = cva(
  "group/toggle inline-flex items-center justify-center gap-2 rounded-control text-base font-semibold whitespace-nowrap text-foreground transition-[background-color,box-shadow] tint-hover tint-press aria-pressed:bg-primary-tint aria-pressed:text-primary-tint-ink aria-invalid:border-danger disabled:pointer-events-none disabled:opacity-45 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-6",
  {
    variants: {
      variant: {
        default: 'bg-transparent',
        outline: 'border-control border-border-strong bg-surface shadow-sm',
      },
      size: {
        default: 'min-h-control-md min-w-control-md px-4',
        sm: 'min-h-control-sm min-w-control-sm px-3',
        lg: 'min-h-control-lg min-w-control-lg px-5',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

function Toggle({
  className,
  variant = 'default',
  size = 'default',
  ...props
}: TogglePrimitive.Props & VariantProps<typeof toggleVariants>) {
  return (
    <TogglePrimitive
      data-slot="toggle"
      className={cn(toggleVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Toggle, toggleVariants };
