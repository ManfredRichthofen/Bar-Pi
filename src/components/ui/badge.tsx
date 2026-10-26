import { mergeProps } from '@base-ui/react/merge-props';
import { useRender } from '@base-ui/react/use-render';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'min-h-7 gap-1 rounded-full border border-transparent px-3 py-0.5 text-sm font-semibold transition-all has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&>svg]:size-4! inline-flex items-center justify-center w-fit whitespace-nowrap shrink-0 [&>svg]:pointer-events-none focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ring transition-colors overflow-hidden group/badge',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground [a]:hover:brightness-110',
        live: 'bg-live text-live-foreground',
        success: 'bg-success-tint text-success-tint-ink',
        warning: 'bg-warning-tint text-warning-tint-ink',
        info: 'bg-info-tint text-info-tint-ink',
        secondary:
          'bg-muted text-foreground',
        destructive:
          'bg-danger-tint text-danger-tint-ink',
        outline:
          'border-border text-foreground [a]:hover:bg-muted [a]:hover:text-muted-foreground',
        ghost:
          'hover:bg-muted hover:text-muted-foreground dark:hover:bg-muted/50',
        link: 'text-primary underline-offset-4 hover:underline',
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
