import { cva } from 'class-variance-authority';
import {
  CircleCheckIcon,
  InfoIcon,
  OctagonXIcon,
  TriangleAlertIcon,
  XIcon,
} from 'lucide-react';
import {
  AnimatePresence,
  motion,
  useReducedMotion,
} from 'motion/react';
import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { create } from 'zustand';

import { enterTransition } from '@/lib/simpleMotion';
import { cn } from '@/lib/utils';

type ToastVariant = 'default' | 'success' | 'info' | 'warning' | 'error';

type ToastItem = {
  id: string;
  message: string;
  variant: ToastVariant;
  duration: number;
};

type ToastOptions = {
  duration?: number;
};

type ToastState = {
  toasts: ToastItem[];
  push: (toast: Omit<ToastItem, 'id'> & { id?: string }) => string;
  dismiss: (id?: string) => void;
};

const DEFAULT_DURATION = 4000;
const ERROR_DURATION = 5000;
const MAX_TOASTS = 3;

let toastSeq = 0;
const nextId = () => `toast-${++toastSeq}-${Date.now()}`;

const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  push: ({ id, message, variant, duration }) => {
    const toastId = id ?? nextId();
    set((state) => ({
      toasts: [
        ...state.toasts.filter((t) => t.id !== toastId),
        { id: toastId, message, variant, duration },
      ].slice(-MAX_TOASTS),
    }));
    return toastId;
  },
  dismiss: (id) =>
    set((state) => ({
      toasts: id ? state.toasts.filter((t) => t.id !== id) : [],
    })),
}));

function show(
  variant: ToastVariant,
  message: string,
  options?: ToastOptions,
  defaultDuration = DEFAULT_DURATION,
) {
  return useToastStore.getState().push({
    message: String(message),
    variant,
    duration: options?.duration ?? defaultDuration,
  });
}

export const toast = {
  message: (message: string, options?: ToastOptions) =>
    show('default', message, options),
  success: (message: string, options?: ToastOptions) =>
    show('success', message, options),
  info: (message: string, options?: ToastOptions) =>
    show('info', message, options),
  warning: (message: string, options?: ToastOptions) =>
    show('warning', message, options),
  error: (message: string, options?: ToastOptions) =>
    show('error', message, options, ERROR_DURATION),
  dismiss: (id?: string) => useToastStore.getState().dismiss(id),
};

const toastVariants = cva(
  'pointer-events-auto flex w-full max-w-md items-start gap-3 rounded-lg border-hairline px-4 py-3 text-left text-base shadow-md',
  {
    variants: {
      variant: {
        default: 'border-border bg-surface text-foreground',
        success:
          'border-success bg-success-tint text-success-tint-ink',
        info: 'border-info bg-info-tint text-info-tint-ink',
        warning:
          'border-warning bg-warning-tint text-warning-tint-ink',
        error: 'border-danger bg-danger-tint text-danger-tint-ink',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

const ICONS: Record<ToastVariant, typeof CircleCheckIcon> = {
  default: InfoIcon,
  success: CircleCheckIcon,
  info: InfoIcon,
  warning: TriangleAlertIcon,
  error: OctagonXIcon,
};

function ToastCard({ item }: { item: ToastItem }) {
  const reduceMotion = useReducedMotion();
  const dismiss = useToastStore((s) => s.dismiss);
  const Icon = ICONS[item.variant];

  useEffect(() => {
    if (item.duration <= 0) return;
    const timer = window.setTimeout(() => dismiss(item.id), item.duration);
    return () => window.clearTimeout(timer);
  }, [dismiss, item.duration, item.id]);

  return (
    <motion.div
      layout={!reduceMotion}
      role={item.variant === 'error' ? 'alert' : 'status'}
      aria-live={item.variant === 'error' ? 'assertive' : 'polite'}
      initial={reduceMotion ? false : { opacity: 0, y: -12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={
        reduceMotion
          ? { opacity: 0 }
          : { opacity: 0, y: -8, scale: 0.98 }
      }
      transition={enterTransition}
      className={cn(toastVariants({ variant: item.variant }))}
    >
      <Icon className="mt-0.5 size-6 shrink-0" aria-hidden />
      <p className="min-w-0 flex-1 font-semibold text-balance">{item.message}</p>
      <button
        type="button"
        aria-label="Dismiss"
        onClick={() => dismiss(item.id)}
        className="mt-0.5 -mr-1 inline-flex size-8 shrink-0 items-center justify-center rounded-sm text-current opacity-70 tint-hover tint-press"
      >
        <XIcon className="size-5" />
      </button>
    </motion.div>
  );
}

export function Toaster() {
  const toasts = useToastStore((s) => s.toasts);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div
      data-slot="toaster"
      className="pointer-events-none fixed inset-x-0 top-0 flex flex-col items-center gap-2 p-3 pt-[max(0.75rem,env(safe-area-inset-top))]"
      style={{ zIndex: 'var(--z-toast)' }}
    >
      <AnimatePresence initial={false}>
        {toasts.map((item) => (
          <ToastCard key={item.id} item={item} />
        ))}
      </AnimatePresence>
    </div>,
    document.body,
  );
}
