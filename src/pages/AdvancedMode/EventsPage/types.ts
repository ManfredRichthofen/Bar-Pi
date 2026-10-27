import type {
  EventActionType,
  EventTrigger,
} from '../../../services/event.service';

export const EVENT_TRIGGERS: { value: EventTrigger; label: string }[] = [
  { value: 'APPLICATION_STARTUP', label: 'Application started' },
  { value: 'COCKTAIL_PRODUCTION_STARTED', label: 'Production started' },
  {
    value: 'COCKTAIL_PRODUCTION_MANUAL_INTERACTION_REQUESTED',
    label: 'Manual interaction requested',
  },
  {
    value: 'COCKTAIL_PRODUCTION_MANUAL_INTERACTION_COMPLETED',
    label: 'Manual interaction completed',
  },
  { value: 'COCKTAIL_PRODUCTION_FINISHED', label: 'Production finished' },
  { value: 'COCKTAIL_PRODUCTION_CANCELED', label: 'Production canceled' },
];

export const EVENT_TYPES: { value: EventActionType; label: string }[] = [
  { value: 'doNothing', label: 'Do nothing' },
  { value: 'callUrl', label: 'Call URL' },
  { value: 'gpio', label: 'Switch GPIO pin' },
];

export const triggerLabel = (trigger: EventTrigger): string =>
  EVENT_TRIGGERS.find((t) => t.value === trigger)?.label ?? trigger;

export const typeLabel = (type: EventActionType): string =>
  EVENT_TYPES.find((t) => t.value === type)?.label ?? type;

export const getErrorMessage = (error: unknown, fallback: string): string => {
  const err = error as {
    response?: { data?: { message?: string } };
    message?: string;
  };
  return err?.response?.data?.message || err?.message || fallback;
};
