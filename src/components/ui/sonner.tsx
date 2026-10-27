import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from 'lucide-react';
import { Toaster as Sonner, type ToasterProps } from 'sonner';
import useThemeStore from '@/store/themeStore';

const Toaster = ({ ...props }: ToasterProps) => {
  const theme = useThemeStore((state) => state.theme);
  const toasterTheme: ToasterProps['theme'] =
    theme === 'dark' ? 'dark' : 'light';

  return (
    <Sonner
      theme={toasterTheme}
      className="toaster group"
      position="top-center"
      richColors
      icons={{
        success: <CircleCheckIcon className="size-5" />,
        info: <InfoIcon className="size-5" />,
        warning: <TriangleAlertIcon className="size-5" />,
        error: <OctagonXIcon className="size-5" />,
        loading: <Loader2Icon className="size-5 animate-spin" />,
      }}
      style={
        {
          // Map Sonner CSS vars onto Bar-Pi design tokens (not shadcn's --popover / --radius)
          '--normal-bg': 'var(--surface)',
          '--normal-text': 'var(--foreground)',
          '--normal-border': 'var(--border)',
          '--border-radius': 'var(--radius-md)',
          '--success-bg': 'var(--success-tint)',
          '--success-border': 'var(--success)',
          '--success-text': 'var(--success-tint-ink)',
          '--info-bg': 'var(--info-tint)',
          '--info-border': 'var(--info)',
          '--info-text': 'var(--info-tint-ink)',
          '--warning-bg': 'var(--warning-tint)',
          '--warning-border': 'var(--warning)',
          '--warning-text': 'var(--warning-tint-ink)',
          '--error-bg': 'var(--danger-tint)',
          '--error-border': 'var(--danger)',
          '--error-text': 'var(--danger-tint-ink)',
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: 'font-sans shadow-md',
          title: 'font-semibold',
          description: 'text-sm opacity-90',
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
