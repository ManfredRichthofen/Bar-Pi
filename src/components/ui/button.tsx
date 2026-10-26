import { Button as ButtonPrimitive } from '@base-ui/react/button';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center gap-2 rounded-control border-control border-transparent text-base font-semibold whitespace-nowrap shadow-sm transition-[background-color,box-shadow] select-none tint-hover tint-press active:shadow-pressed disabled:pointer-events-none disabled:opacity-45 aria-invalid:border-danger [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-6",
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground',
        secondary: 'bg-surface-sunken text-foreground',
        outline: 'bg-surface text-foreground border-border-strong',
        ghost: 'bg-transparent text-foreground shadow-none',
        destructive: 'bg-danger text-danger-foreground',
        link: 'min-h-0 rounded-sm px-0 text-primary underline underline-offset-4 shadow-none',
      },
      size: {
        default: 'min-h-control-md px-5',
        sm: 'min-h-control-sm px-4',
        lg: 'min-h-control-lg px-6 text-lg',
        icon: 'size-control-md',
        'icon-sm': 'size-control-sm',
        'icon-lg': 'size-control-lg',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

function Button({
  className,
  variant = 'default',
  size = 'default',
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
