import { Switch as SwitchPrimitive } from '@base-ui/react/switch';

import { cn } from '@/lib/utils';

function Switch({
  className,
  size = 'default',
  ...props
}: SwitchPrimitive.Root.Props & {
  size?: 'sm' | 'default';
}) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      data-size={size}
      className={cn(
        'data-checked:bg-primary data-checked:border-primary data-unchecked:bg-muted data-unchecked:border-border-strong shadow-inset aria-invalid:border-destructive shrink-0 rounded-full border-2 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ring data-[size=default]:h-8 data-[size=default]:w-14 data-[size=sm]:h-6 data-[size=sm]:w-10 peer group/switch relative inline-flex items-center transition-all after:absolute after:-inset-x-1 after:-inset-y-2 data-disabled:cursor-not-allowed data-disabled:opacity-50',
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className="shadow-sm data-unchecked:bg-muted-foreground data-checked:bg-primary-foreground rounded-full group-data-[size=default]/switch:size-6 group-data-[size=sm]/switch:size-4 group-data-[size=default]/switch:data-checked:translate-x-6 group-data-[size=sm]/switch:data-checked:translate-x-4 group-data-[size=default]/switch:data-unchecked:translate-x-0 group-data-[size=sm]/switch:data-unchecked:translate-x-0 pointer-events-none block ring-0 transition-transform"
      />
    </SwitchPrimitive.Root>
  );
}

export { Switch };
