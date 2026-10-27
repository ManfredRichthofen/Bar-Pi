import { Tabs as TabsPrimitive } from '@base-ui/react/tabs';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

function Tabs({
  className,
  orientation = 'horizontal',
  ...props
}: TabsPrimitive.Root.Props) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      data-orientation={orientation}
      className={cn(
        'group/tabs flex gap-2 data-[orientation=horizontal]:flex-col',
        className,
      )}
      {...props}
    />
  );
}

/* default: a pill track with an ink chip on the selected tab. line: an underlined row. */
const tabsListVariants = cva(
  'group/tabs-list inline-flex w-fit items-center justify-center group-data-[orientation=vertical]/tabs:h-fit group-data-[orientation=vertical]/tabs:flex-col',
  {
    variants: {
      variant: {
        default: 'gap-1 rounded-full bg-surface-sunken p-1 shadow-inset',
        line: 'gap-6 border-b-hairline border-border',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

function TabsList({
  className,
  variant = 'default',
  ...props
}: TabsPrimitive.List.Props & VariantProps<typeof tabsListVariants>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      data-variant={variant}
      className={cn(tabsListVariants({ variant }), className)}
      {...props}
    />
  );
}

function TabsTrigger({ className, ...props }: TabsPrimitive.Tab.Props) {
  return (
    <TabsPrimitive.Tab
      data-slot="tabs-trigger"
      className={cn(
        'relative inline-flex flex-1 items-center justify-center gap-2 text-base font-semibold whitespace-nowrap text-foreground-muted transition-colors disabled:pointer-events-none disabled:opacity-45 data-active:text-foreground [@media(hover:hover)]:hover:text-foreground [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*="size-"])]:size-6',
        'group-data-[variant=default]/tabs-list:min-h-control-sm group-data-[variant=default]/tabs-list:rounded-full group-data-[variant=default]/tabs-list:px-5 group-data-[variant=default]/tabs-list:data-active:bg-primary group-data-[variant=default]/tabs-list:data-active:text-primary-foreground',
        'group-data-[variant=line]/tabs-list:-mb-px group-data-[variant=line]/tabs-list:min-h-control-md group-data-[variant=line]/tabs-list:px-0.5 group-data-[variant=line]/tabs-list:after:absolute group-data-[variant=line]/tabs-list:after:inset-x-0 group-data-[variant=line]/tabs-list:after:bottom-0 group-data-[variant=line]/tabs-list:after:h-[3px] group-data-[variant=line]/tabs-list:after:bg-primary group-data-[variant=line]/tabs-list:after:opacity-0 group-data-[variant=line]/tabs-list:data-active:after:opacity-100',
        'group-data-[orientation=vertical]/tabs:w-full group-data-[orientation=vertical]/tabs:justify-start',
        className,
      )}
      {...props}
    />
  );
}

function TabsContent({ className, ...props }: TabsPrimitive.Panel.Props) {
  return (
    <TabsPrimitive.Panel
      data-slot="tabs-content"
      className={cn('flex-1 text-base outline-none', className)}
      {...props}
    />
  );
}

export { Tabs, TabsList, TabsTrigger, TabsContent, tabsListVariants };
