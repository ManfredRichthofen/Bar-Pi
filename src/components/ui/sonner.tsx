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
    theme === 'night' ? 'dark' : 'light';

  return (
    <Sonner
      theme={toasterTheme}
      className="toaster group"
      icons={{
        success: <CircleCheckIcon className="size-6" />,
        info: <InfoIcon className="size-6" />,
        warning: <TriangleAlertIcon className="size-6" />,
        error: <OctagonXIcon className="size-6" />,
        loading: <Loader2Icon className="size-6 animate-spin" />,
      }}
      style={
        {
          '--normal-bg': 'var(--popover)',
          '--normal-text': 'var(--popover-foreground)',
          '--normal-border': 'var(--border)',
          '--border-radius': 'var(--radius)',
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: 'cn-toast',
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
