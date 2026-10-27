import { useQuery } from '@tanstack/react-query';
import type React from 'react';
import { useEffect, useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
import type {
  EventAction,
  EventActionInput,
  EventTrigger,
} from '../../../../services/event.service';
import GpioService from '../../../../services/gpio.service';
import RecipeService from '../../../../services/recipe.service';
import useAuthStore from '../../../../store/authStore';
import type { GpioBoard } from '../../GpioPage/types';
import { EVENT_TRIGGERS } from '../types';

interface EventFormDialogProps {
  open: boolean;
  event: EventAction | null;
  saving: boolean;
  error: string | null;
  onClose: () => void;
  onSave: (input: EventActionInput) => void;
}

const ALL_RECIPES = 'all';

export const EventFormDialog: React.FC<EventFormDialogProps> = ({
  open,
  event,
  saving,
  error,
  onClose,
  onSave,
}) => {
  const token = useAuthStore((state) => state.token);
  const [name, setName] = useState('');
  const [trigger, setTrigger] = useState<EventTrigger>(
    'COCKTAIL_PRODUCTION_STARTED',
  );
  const [recipeId, setRecipeId] = useState<number | null>(null);
  const [recipeSearch, setRecipeSearch] = useState('');
  const [boardId, setBoardId] = useState<number | null>(null);
  const [pinNr, setPinNr] = useState<number | null>(null);
  const [powerStateHigh, setPowerStateHigh] = useState(true);
  const [duration, setDuration] = useState('0');

  const { data: boards = [] } = useQuery<GpioBoard[]>({
    queryKey: ['gpio', 'boards'],
    queryFn: () => GpioService.getBoards(token),
    enabled: open && !!token,
  });
  const localBoards = boards.filter((b) => b.type === 'local');

  const { data: recipePage } = useQuery({
    queryKey: ['event-recipe-search', recipeSearch],
    queryFn: () =>
      RecipeService.getRecipes(
        0,
        null,
        null,
        null,
        null,
        recipeSearch.trim() || null,
        null,
        null,
        token,
        false,
      ),
    enabled: open && !!token,
  });
  const recipes: { id: number; name: string }[] = recipePage?.content ?? [];

  useEffect(() => {
    if (!open) return;
    setName(event?.name ?? '');
    setTrigger(event?.trigger ?? 'COCKTAIL_PRODUCTION_STARTED');
    setRecipeId(event?.recipeId ?? null);
    setRecipeSearch('');
    setBoardId(event?.pin?.boardId ?? null);
    setPinNr(event?.pin?.nr ?? null);
    setPowerStateHigh(event?.powerStateHigh ?? true);
    setDuration(String(event?.durationInMs ?? 0));
  }, [open, event]);

  useEffect(() => {
    if (open && boardId === null && localBoards.length > 0) {
      setBoardId(localBoards[0].id);
    }
  }, [open, boardId, localBoards]);

  const durationMs = Number(duration);
  const durationValid =
    Number.isInteger(durationMs) && durationMs >= 0 && durationMs <= 3600000;
  const board = localBoards.find((b) => b.id === boardId);
  const pins = [...(board?.pins ?? [])].sort((a, b) => a.nr - b.nr);
  const canSave =
    name.trim().length > 0 &&
    boardId !== null &&
    pinNr !== null &&
    durationValid &&
    !saving;

  const selectedRecipeName =
    recipes.find((r) => r.id === recipeId)?.name ??
    (recipeId !== null ? `Recipe #${recipeId}` : 'All recipes');

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{event ? 'Edit event' : 'New event'}</DialogTitle>
          <DialogDescription>
            Switch a GPIO pin when a drink starts, finishes or is cancelled.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <div className="space-y-2">
            <Label htmlFor="event-name">Name</Label>
            <Input
              id="event-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Turn on bar lights"
            />
          </div>

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
            <Label>Recipe</Label>
            <Select
              value={recipeId === null ? ALL_RECIPES : String(recipeId)}
              onValueChange={(v) =>
                setRecipeId(!v || v === ALL_RECIPES ? null : Number(v))
              }
            >
              <SelectTrigger>
                <SelectValue>{selectedRecipeName}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <div className="p-2">
                  <Input
                    value={recipeSearch}
                    onChange={(e) => setRecipeSearch(e.target.value)}
                    onKeyDown={(e) => e.stopPropagation()}
                    placeholder="Search recipes"
                  />
                </div>
                <SelectItem value={ALL_RECIPES}>All recipes</SelectItem>
                {recipes.map((r) => (
                  <SelectItem key={r.id} value={String(r.id)}>
                    {r.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

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
              The pin returns to its previous state afterwards. 0 keeps the new
              state until another event changes it.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            disabled={!canSave}
            onClick={() =>
              onSave({
                name: name.trim(),
                trigger,
                recipeId,
                pin: { boardId, nr: pinNr },
                powerStateHigh,
                durationInMs: durationMs,
              })
            }
          >
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
