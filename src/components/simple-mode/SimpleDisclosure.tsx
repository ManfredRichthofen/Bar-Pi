import { ChevronDown, type LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';

type SimpleDisclosureProps = {
  title: string;
  hint?: string;
  icon?: LucideIcon;
  defaultOpen?: boolean;
  className?: string;
  children: ReactNode;
};

/** Full-width, touch-sized expandable section for secondary simple-mode content. */
const SimpleDisclosure = ({
  title,
  hint,
  icon: Icon,
  defaultOpen = false,
  className,
  children,
}: SimpleDisclosureProps) => (
  <Collapsible
    defaultOpen={defaultOpen}
    className={cn(
      'rounded-lg border-hairline border-border bg-surface',
      className,
    )}
  >
    <CollapsibleTrigger className="group flex min-h-control-lg w-full items-center gap-3 rounded-lg px-4 py-3 text-left outline-none focus-visible:ring-[3px] [@media(hover:hover)]:hover:bg-surface-sunken">
      {Icon && <Icon className="size-6 shrink-0 text-primary" />}
      <span className="flex-1 min-w-0">
        <span className="block font-semibold text-base">{title}</span>
        {hint && (
          <span className="block text-sm text-foreground-muted">{hint}</span>
        )}
      </span>
      <ChevronDown className="size-6 shrink-0 text-foreground-muted transition-transform group-data-[panel-open]:rotate-180" />
    </CollapsibleTrigger>
    <CollapsibleContent className="h-[var(--collapsible-panel-height)] overflow-hidden transition-[height] duration-200 ease-out data-[ending-style]:h-0 data-[starting-style]:h-0">
      <div className="px-4 pb-4 pt-1">{children}</div>
    </CollapsibleContent>
  </Collapsible>
);

export default SimpleDisclosure;
