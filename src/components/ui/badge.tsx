import { mergeProps } from '@base-ui/react/merge-props';
import { useRender } from '@base-ui/react/use-render';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex min-h-7 w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-full border border-transparent px-3 text-sm font-semibold whitespace-nowrap [&>svg]:pointer-events-none [&>svg]:size-4 [&>svg]:shrink-0',
  {
    variants: {
      variant: {
        default: 'bg-primary-tint text-primary-tint-ink',
        solid: 'bg-primary text-primary-foreground',
        secondary: 'bg-surface-sunken text-foreground',
        outline: 'border-border-strong bg-transparent text-foreground',
        success: 'bg-success-tint text-success-tint-ink',
        warning: 'bg-warning-tint text-warning-tint-ink',
        destructive: 'bg-danger-tint text-danger-tint-ink',
        info: 'bg-info-tint text-info-tint-ink',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

function Badge({
  className,
  variant = 'default',
  render,
  ...props
}: useRender.ComponentProps<'span'> & VariantProps<typeof badgeVariants>) {
  return useRender({
    defaultTagName: 'span',
    props: mergeProps<'span'>(
      {
        className: cn(badgeVariants({ className, variant })),
      },
      props,
    ),
    render,
    state: {
      slot: 'badge',
      variant,
    },
  });
}

export { Badge, badgeVariants };
