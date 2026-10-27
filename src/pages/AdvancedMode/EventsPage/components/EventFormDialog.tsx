import { useQuery } from '@tanstack/react-query';
import type React from 'react';
import { useEffect, useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import EventService, {
  type EventAction,
  type EventActionInput,
  type EventActionType,
  type EventTrigger,
  type RequestMethod,
} from '../../../../services/event.service';
import GpioService from '../../../../services/gpio.service';
import useAuthStore from '../../../../store/authStore';
import type { GpioBoard } from '../../GpioPage/types';
import { EVENT_TRIGGERS, EVENT_TYPES } from '../types';

interface EventFormDialogProps {
  open: boolean;
  event: EventAction | null;
  saving: boolean;
  error: string | null;
  onClose: () => void;
  onSave: (input: EventActionInput) => void;
}

const REQUEST_METHODS: RequestMethod[] = ['GET', 'POST', 'PUT', 'DELETE'];
const MAX_COMMENT_LENGTH = 40;

export const EventFormDialog: React.FC<EventFormDialogProps> = ({
  open,
  event,
  saving,
  error,
  onClose,
  onSave,
}) => {
  const token = useAuthStore((state) => state.token);
  const [type, setType] = useState<EventActionType>('doNothing');
  const [comment, setComment] = useState('');
  const [trigger, setTrigger] = useState<EventTrigger>(
    'COCKTAIL_PRODUCTION_STARTED',
  );
  const [groups, setGroups] = useState<string[]>([]);
  const [groupDraft, setGroupDraft] = useState('');
  const [url, setUrl] = useState('');
  const [requestMethod, setRequestMethod] = useState<RequestMethod>('GET');
  const [boardId, setBoardId] = useState<number | null>(null);
  const [pinNr, setPinNr] = useState<number | null>(null);
  const [powerStateHigh, setPowerStateHigh] = useState(true);
  const [duration, setDuration] = useState('0');

  const { data: boards = [] } = useQuery<GpioBoard[]>({
    queryKey: ['gpio', 'boards'],
    queryFn: () => GpioService.getBoards(token),
    enabled: open && !!token,
  });
  const { data: knownGroups = [] } = useQuery({
    queryKey: ['events', 'execution-groups'],
    queryFn: () => EventService.getExecutionGroups(),
    enabled: open && !!token,
  });
  const localBoards = boards.filter((b) => b.type === 'local');

  useEffect(() => {
    if (!open) return;
    setType(event?.type ?? 'doNothing');
    setComment(event?.comment ?? '');
    setTrigger(event?.trigger ?? 'COCKTAIL_PRODUCTION_STARTED');
    setGroups(event?.executionGroups ?? []);
    setGroupDraft('');
    setUrl(event?.url ?? '');
    setRequestMethod(event?.requestMethod ?? 'GET');
    setBoardId(event?.pin?.boardId ?? null);
    setPinNr(event?.pin?.nr ?? null);
    setPowerStateHigh(event?.powerStateHigh ?? true);
    setDuration(String(event?.durationInMs ?? 0));
  }, [open, event]);

  useEffect(() => {
    if (open && type === 'gpio' && boardId === null && localBoards.length > 0) {
      setBoardId(localBoards[0].id);
    }
  }, [open, type, boardId, localBoards]);

  const addGroup = (name: string) => {
    const trimmed = name.trim();
    if (trimmed && !groups.includes(trimmed)) setGroups([...groups, trimmed]);
    setGroupDraft('');
  };

  const durationMs = Number(duration);
  const durationValid =
    Number.isInteger(durationMs) && durationMs >= 0 && durationMs <= 3600000;
  const board = localBoards.find((b) => b.id === boardId);
  const pins = [...(board?.pins ?? [])].sort((a, b) => a.nr - b.nr);

  const typeValid =
    type === 'doNothing' ||
    (type === 'callUrl' && /^https?:\/\/\S+$/.test(url.trim())) ||
    (type === 'gpio' && boardId !== null && pinNr !== null && durationValid);
  const canSave = typeValid && !saving;

  const buildInput = (): EventActionInput => {
    const base = {
      type,
      comment: comment.trim(),
      trigger,
      executionGroups: groupDraft.trim()
        ? [...new Set([...groups, groupDraft.trim()])]
        : groups,
    };
    if (type === 'callUrl') {
      return { ...base, url: url.trim(), requestMethod };
    }
    if (type === 'gpio') {
      return {
        ...base,
        pin: { boardId, nr: pinNr },
        powerStateHigh,
        durationInMs: durationMs,
      };
    }
    return base;
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{event ? 'Edit event' : 'New event'}</DialogTitle>
          <DialogDescription>
            Run an action when something happens during a drink.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label>Trigger</Label>
            <Select
              value={trigger}
              onValueChange={(v) => v && setTrigger(v as EventTrigger)}
            >
              <SelectTrigger>
                <SelectValue>
                  {EVENT_TRIGGERS.find((t) => t.value === trigger)?.label}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {EVENT_TRIGGERS.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Action type</Label>
            <Select
              value={type}
              onValueChange={(v) => v && setType(v as EventActionType)}
            >
              <SelectTrigger>
                <SelectValue>
                  {EVENT_TYPES.find((t) => t.value === type)?.label}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {EVENT_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {type === 'callUrl' && (
            <>
              <div className="space-y-2">
                <Label>Request method</Label>
                <Select
                  value={requestMethod}
                  onValueChange={(v) =>
                    v && setRequestMethod(v as RequestMethod)
                  }
                >
                  <SelectTrigger>
                    <SelectValue>{requestMethod}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {REQUEST_METHODS.map((m) => (
                      <SelectItem key={m} value={m}>
                        {m}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="event-url">URL</Label>
                <Input
                  id="event-url"
                  value={url}
                  maxLength={255}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="http://homeassistant.local:8123/api/webhook/..."
                  aria-invalid={url !== '' && !typeValid}
                />
              </div>
            </>
          )}

          {type === 'gpio' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Board</Label>
                  <Select
                    value={boardId === null ? '' : String(boardId)}
                    onValueChange={(v) => {
                      setBoardId(v ? Number(v) : null);
                      setPinNr(null);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue>{board?.name ?? 'Select board'}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {localBoards.map((b) => (
                        <SelectItem key={b.id} value={String(b.id)}>
                          {b.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Pin</Label>
                  <Select
                    value={pinNr === null ? '' : String(pinNr)}
                    onValueChange={(v) => setPinNr(v ? Number(v) : null)}
                  >
                    <SelectTrigger>
                      <SelectValue>
                        {pinNr === null ? 'Select pin' : `BCM ${pinNr}`}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {pins.map((p) => (
                        <SelectItem key={p.nr} value={String(p.nr)}>
                          BCM {p.nr}
                          {p.inUse ? ' (in use)' : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <Label>Set pin high</Label>
                <Switch
                  checked={powerStateHigh}
                  onCheckedChange={setPowerStateHigh}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="event-duration">Duration (ms)</Label>
                <Input
                  id="event-duration"
                  type="number"
                  min={0}
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  aria-invalid={!durationValid}
                />
                <p className="text-sm text-foreground-muted">
                  The pin returns to its previous state afterwards. 0 keeps the
                  new state until another event changes it.
                </p>
              </div>
            </>
          )}

          <div className="space-y-2">
            <Label htmlFor="event-comment">Comment</Label>
            <Input
              id="event-comment"
              value={comment}
              maxLength={MAX_COMMENT_LENGTH}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Turn on bar lights"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="event-groups">Execution groups</Label>
            <div className="flex flex-wrap gap-2">
              {groups.map((group) => (
                <Badge key={group} variant="secondary">
                  {group}
                  <button
                    type="button"
                    aria-label={`Remove ${group}`}
                    onClick={() => setGroups(groups.filter((g) => g !== group))}
                  >
                    ×
                  </button>
                </Badge>
              ))}
            </div>
            <Input
              id="event-groups"
              value={groupDraft}
              maxLength={MAX_COMMENT_LENGTH}
              onChange={(e) => setGroupDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addGroup(groupDraft);
                }
              }}
              placeholder="Type a group and press Enter"
            />
            <div className="flex flex-wrap gap-2">
              {knownGroups
                .filter((g) => !groups.includes(g))
                .map((group) => (
                  <Button
                    key={group}
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => addGroup(group)}
                  >
                    {group}
                  </Button>
                ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button disabled={!canSave} onClick={() => onSave(buildInput())}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
