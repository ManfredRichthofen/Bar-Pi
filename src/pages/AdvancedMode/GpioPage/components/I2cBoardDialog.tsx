import type React from 'react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
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
import GpioService, {
  gpioBoardDtoMapper,
} from '../../../../services/gpio.service';
import useAuthStore from '../../../../store/authStore';
import {
  formatAddress,
  type GpioBoard,
  getErrorMessage,
  I2C_BOARD_MODELS,
} from '../types';

interface I2cBoardDialogProps {
  open: boolean;
  board: GpioBoard | null;
  onClose: () => void;
  onSaved: () => void;
}

const DEFAULT_MODEL = 'MCP23017';

const parseAddress = (raw: string): number | null => {
  const v = raw.trim().toLowerCase();
  if (!v) return null;
  const n = /^0x[0-9a-f]+$/.test(v) ? parseInt(v, 16) : Number(v);
  return Number.isInteger(n) ? n : null;
};

export const I2cBoardDialog: React.FC<I2cBoardDialogProps> = ({
  open,
  board,
  onClose,
  onSaved,
}) => {
  const token = useAuthStore((state) => state.token);
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [model, setModel] = useState<string>(DEFAULT_MODEL);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setName(board?.name ?? '');
    setAddress(board ? formatAddress(board.address) : '0x20');
    setModel(board?.boardModel ?? DEFAULT_MODEL);
    setError(null);
  }, [open, board]);

  const parsedAddress = parseAddress(address);
  const addressValid =
    parsedAddress !== null && parsedAddress >= 0x03 && parsedAddress <= 0x77;
  const canSave = name.trim().length > 0 && addressValid && !saving;

  const handleSave = async () => {
    if (!canSave) return;
    setSaving(true);
    setError(null);
    const dto = gpioBoardDtoMapper.toGpioBoardDto({
      name: name.trim(),
      address: parsedAddress,
      boardModel: model,
      type: 'i2c',
    });
    try {
      if (board) {
        await GpioService.updateGpioBoard(board.id, dto, token);
      } else {
        await GpioService.createGpioBoard(dto, token);
      }
      toast.success(board ? 'Board updated' : 'Board added');
      onSaved();
      onClose();
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to save board'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {board ? 'Edit I2C board' : 'Add I2C board'}
          </DialogTitle>
          <DialogDescription>
            Expander boards add extra pins that pumps can use.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <div className="space-y-2">
            <Label htmlFor="i2c-name">Name</Label>
            <Input
              id="i2c-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Expander 1"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="i2c-address">Address</Label>
            <Input
              id="i2c-address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="0x20"
              aria-invalid={address !== '' && !addressValid}
            />
            <p className="text-sm text-foreground-muted">
              Hex (0x20) or decimal, between 0x03 and 0x77.
            </p>
          </div>
          <div className="space-y-2">
            <Label>Board model</Label>
            <Select value={model} onValueChange={(v) => v && setModel(v)}>
              <SelectTrigger>
                <SelectValue>{model}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {I2C_BOARD_MODELS.map((m) => (
                  <SelectItem key={m} value={m}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!canSave}>
            {board ? 'Save' : 'Add board'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
