import { Link, useLocation } from '@tanstack/react-router';
import { Clock, GlassWater, Settings } from 'lucide-react';
import { motion } from 'motion/react';
import type React from 'react';
import { useTranslation } from 'react-i18next';
import { useSimplePress } from '@/hooks/useSimplePress';
import { cn } from '@/lib/utils';

const NAV = [
  { to: '/simple/drinks', icon: GlassWater, label: 'navigation.drinks' },
  { to: '/simple/order-status', icon: Clock, label: 'navigation.order_status' },
  { to: '/simple/settings', icon: Settings, label: 'navigation.settings' },
] as const;

const MotionLink = motion.create(Link);

/** Drink detail and order own the bottom edge with their Make Drink bar, so the dock hides there. */
export const isDocklessPath = (pathname: string) =>
  pathname.startsWith('/simple/drink/') || pathname === '/simple/order';

const isActive = (to: string, pathname: string) =>
  pathname.startsWith(to) ||
  (to === '/simple/drinks' && isDocklessPath(pathname));

/** Bottom navigation: three 56px targets; the current page is an ink pill. */
const Dock: React.FC = () => {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const press = useSimplePress({ lift: false });

  return (
    <nav
      aria-label="Main"
      className="pointer-events-auto fixed inset-x-0 bottom-0 z-50 border-t-hairline border-border bg-background pb-[env(safe-area-inset-bottom,0px)]"
    >
      <ul className="mx-auto flex max-w-3xl items-stretch justify-center gap-2 p-2">
        {NAV.map(({ to, icon: Icon, label }) => {
          const active = isActive(to, pathname);
          return (
            <li key={to} className="max-w-44 flex-1">
              <MotionLink
                to={to}
                aria-current={active ? 'page' : undefined}
                {...press}
                className={cn(
                  'flex min-h-control-lg w-full flex-col items-center justify-center gap-0.5 rounded-full px-4 text-sm font-semibold transition-colors duration-150 ease-out',
                  active
                    ? 'bg-primary text-primary-foreground'
                    : 'text-foreground-muted [@media(hover:hover)]:hover:bg-surface-sunken [@media(hover:hover)]:hover:text-foreground',
                )}
              >
                <Icon className="size-6" />
                <span>{t(label)}</span>
              </MotionLink>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};

export default Dock;
