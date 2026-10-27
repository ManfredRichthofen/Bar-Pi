import { Pencil, Play, PlusCircle, Trash2, Zap } from 'lucide-react';
import type React from 'react';
import { useState } from 'react';
import {
  EmptyState,
  LoadingState,
  PageHeader,
} from '@/components/AdvancedMode';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { toast } from '@/components/ui/toast';
import { useEventMutations, useEventsList } from '../../../hooks/useEvents';
import type {
  EventAction,
  EventActionInput,
} from '../../../services/event.service';
import { EventFormDialog } from './components/EventFormDialog';
import { getErrorMessage, triggerLabel, typeLabel } from './types';

export const EventsPage: React.FC = () => {
  const { data: events = [], isLoading } = useEventsList();
  const { saveEvent, deleteEvent, startEvent } = useEventMutations();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<EventAction | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [toDelete, setToDelete] = useState<EventAction | null>(null);

  const openForm = (event: EventAction | null) => {
    setEditing(event);
    setFormError(null);
    setFormOpen(true);
  };

  const handleSave = async (input: EventActionInput) => {
    try {
      await saveEvent.mutateAsync({ ...input, id: editing?.id });
      toast.success(editing ? 'Event updated' : 'Event created');
      setFormOpen(false);
    } catch (error) {
      setFormError(getErrorMessage(error, 'Failed to save event'));
    }
  };

  const handleDelete = async () => {
    if (!toDelete) return;
    try {
      await deleteEvent.mutateAsync(toDelete.id);
      toast.success('Event deleted');
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to delete event'));
    } finally {
      setToDelete(null);
    }
  };

  const handleStart = async (event: EventAction) => {
    try {
      await startEvent.mutateAsync(event.id);
      toast.success('Event started');
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to start event'));
    }
  };

  const newButton = (
    <Button onClick={() => openForm(null)}>
      <PlusCircle />
      New event
    </Button>
  );

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        title="Events"
        subtitle="Run actions when the app starts or a drink is made"
        action={newButton}
      />

      <div className="container mx-auto px-4 py-6 sm:px-6 sm:py-8">
        {isLoading ? (
          <LoadingState message="Loading events..." />
        ) : events.length === 0 ? (
          <EmptyState
            icon={<Zap className="h-16 w-16" />}
            title="No Events Yet"
            description="Create an event to call a URL or switch a relay during production"
            actions={newButton}
          />
        ) : (
          <div className="mx-auto max-w-3xl space-y-3">
            {events.map((event) => (
              <Card key={event.id}>
                <CardContent className="flex items-center justify-between gap-3 py-4">
                  <div className="min-w-0 space-y-1">
                    <p className="truncate text-lg font-bold">
                      {event.comment ||
                        event.description ||
                        typeLabel(event.type)}
                    </p>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="info">
                        {triggerLabel(event.trigger)}
                      </Badge>
                      <Badge variant="secondary">{typeLabel(event.type)}</Badge>
                      {event.recipeId != null && (
                        <Badge variant="outline">
                          Recipe #{event.recipeId}
                        </Badge>
                      )}
                      {event.executionGroups.map((group) => (
                        <Badge key={group} variant="outline">
                          {group}
                        </Badge>
                      ))}
                    </div>
                    {event.description && event.comment && (
                      <p className="truncate text-sm text-foreground-muted">
                        {event.description}
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      title="Start now"
                      onClick={() => handleStart(event)}
                    >
                      <Play className="size-5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      title="Edit"
                      onClick={() => openForm(event)}
                    >
                      <Pencil className="size-5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      title="Delete"
                      onClick={() => setToDelete(event)}
                    >
                      <Trash2 className="size-5 text-danger" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <EventFormDialog
        open={formOpen}
        event={editing}
        saving={saveEvent.isPending}
        error={formError}
        onClose={() => setFormOpen(false)}
        onSave={handleSave}
      />
      <ConfirmationDialog
        open={!!toDelete}
        onOpenChange={(o) => !o && setToDelete(null)}
        title="Delete event"
        description={`Delete "${toDelete?.comment || toDelete?.description}"?`}
        confirmText="Delete"
        variant="destructive"
        onConfirm={handleDelete}
      />
    </div>
  );
};
