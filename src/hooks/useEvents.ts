import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import EventService, { type EventActionInput } from '../services/event.service';
import useAuthStore from '../store/authStore';

export const eventsQueryKey = ['events'] as const;

export function useEventsList() {
  const token = useAuthStore((state) => state.token);

  return useQuery({
    queryKey: eventsQueryKey,
    queryFn: () => EventService.getEvents(),
    enabled: !!token,
  });
}

export function useEventMutations() {
  const queryClient = useQueryClient();

  const onSuccess = () => {
    queryClient.invalidateQueries({ queryKey: eventsQueryKey });
    queryClient.invalidateQueries({ queryKey: ['gpio'] });
  };

  const saveEvent = useMutation({
    mutationFn: ({ id, ...input }: EventActionInput & { id?: number }) =>
      id
        ? EventService.updateEvent(id, input)
        : EventService.createEvent(input),
    onSuccess,
  });

  const deleteEvent = useMutation({
    mutationFn: (id: number) => EventService.deleteEvent(id),
    onSuccess,
  });

  const startEvent = useMutation({
    mutationFn: (id: number) => EventService.startEvent(id),
  });

  return { saveEvent, deleteEvent, startEvent };
}
