import { Button as ButtonPrimitive } from '@base-ui/react/button';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const buttonVariants = cva(
  "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:aria-invalid:border-destructive/50 rounded-full border border-transparent bg-clip-padding text-base font-bold shadow-sm active:shadow-pressed active:scale-[0.98] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ring aria-invalid:ring-[3px] [&_svg:not([class*='size-'])]:size-6 inline-flex items-center justify-center whitespace-nowrap transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none shrink-0 [&_svg]:shrink-0 outline-none group/button select-none",
  {
    variants: {
      variant: {
        default:
          'bg-primary text-primary-foreground [@media(hover:hover)]:hover:brightness-110 active:brightness-90',
        outline:
          'border-border-strong bg-surface text-foreground [@media(hover:hover)]:hover:bg-muted aria-expanded:bg-muted',
        secondary:
          'bg-surface text-foreground [@media(hover:hover)]:hover:bg-muted aria-expanded:bg-muted',
        ghost:
          'shadow-none bg-transparent text-foreground [@media(hover:hover)]:hover:bg-muted active:bg-muted aria-expanded:bg-muted',
        destructive:
          'bg-destructive text-destructive-foreground [@media(hover:hover)]:hover:brightness-110 active:brightness-90',
        link: 'shadow-none text-primary underline underline-offset-4 rounded-md',
      },
      size: {
        default:
          'min-h-control-md gap-2 px-5 in-data-[slot=button-group]:rounded-md has-data-[icon=inline-end]:pr-4 has-data-[icon=inline-start]:pl-4',
        xs: 'min-h-control-sm gap-1.5 px-4 text-sm in-data-[slot=button-group]:rounded-md',
        sm: 'min-h-control-sm gap-1.5 px-4 in-data-[slot=button-group]:rounded-md',
        lg: 'min-h-control-lg gap-2 px-6 text-lg has-data-[icon=inline-end]:pr-5 has-data-[icon=inline-start]:pl-5',
        icon: 'size-control-md',
        'icon-xs': 'size-control-sm in-data-[slot=button-group]:rounded-md',
        'icon-sm': 'size-control-sm in-data-[slot=button-group]:rounded-md',
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
