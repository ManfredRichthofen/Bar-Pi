import type { EventTrigger } from '../../../services/event.service';

export const EVENT_TRIGGERS: { value: EventTrigger; label: string }[] = [
  { value: 'COCKTAIL_PRODUCTION_STARTED', label: 'Production started' },
  { value: 'COCKTAIL_PRODUCTION_FINISHED', label: 'Production finished' },
  { value: 'COCKTAIL_PRODUCTION_CANCELLED', label: 'Production cancelled' },
];

export const triggerLabel = (trigger: EventTrigger): string =>
  EVENT_TRIGGERS.find((t) => t.value === trigger)?.label ?? trigger;

export const getErrorMessage = (error: unknown, fallback: string): string => {
  const err = error as {
    response?: { data?: { message?: string } };
    message?: string;
  };
  return err?.response?.data?.message || err?.message || fallback;
};
