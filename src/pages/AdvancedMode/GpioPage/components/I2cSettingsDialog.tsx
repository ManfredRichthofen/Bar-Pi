import type React from 'react';
import { useEffect, useState } from 'react';
import { toast } from '@/components/ui/toast';
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
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import SystemService, {
  type I2CSettings,
} from '../../../../services/system.service';
import useAuthStore from '../../../../store/authStore';
import { type GpioBoard, getErrorMessage } from '../types';

interface I2cSettingsDialogProps {
  open: boolean;
  settings: I2CSettings | null;
  localBoard: GpioBoard | undefined;
  onClose: () => void;
  onSaved: () => void;
}

const PinSelect: React.FC<{
  label: string;
  value: number | null;
  options: { nr: number; inUse: boolean }[];
  onChange: (nr: number | null) => void;
}> = ({ label, value, options, onChange }) => (
  <div className="space-y-2">
    <Label>{label}</Label>
    <Select
      value={value === null ? '' : String(value)}
      onValueChange={(v) => onChange(v ? Number(v) : null)}
    >
      <SelectTrigger>
        <SelectValue>
          {value === null ? 'Select pin' : `BCM ${value}`}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {options.map((p) => (
          <SelectItem key={p.nr} value={String(p.nr)} disabled={p.inUse}>
            BCM {p.nr}
            {p.inUse ? ' (in use)' : ''}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  </div>
);

export const I2cSettingsDialog: React.FC<I2cSettingsDialogProps> = ({
  open,
  settings,
  localBoard,
  onClose,
  onSaved,
}) => {
  const token = useAuthStore((state) => state.token);
  const [enable, setEnable] = useState(false);
  const [sda, setSda] = useState<number | null>(null);
  const [scl, setScl] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setEnable(!!(settings?.enable || settings?.enabled));
    setSda(settings?.sdaPin?.nr ?? null);
    setScl(settings?.sclPin?.nr ?? null);
    setError(null);
  }, [open, settings]);

  const options = (localBoard?.pins ?? [])
    .map((p) => ({ nr: p.nr, inUse: p.inUse }))
    .sort((a, b) => a.nr - b.nr);
  const valid = !enable || (sda !== null && scl !== null && sda !== scl);

  const handleSave = async () => {
    if (!valid) return;
    setSaving(true);
    setError(null);
    try {
      await SystemService.setI2CSettings(
        {
          enable,
          enabled: enable,
          busId: settings?.busId,
          sdaPin:
            enable && localBoard ? { boardId: localBoard.id, nr: sda } : null,
          sclPin:
            enable && localBoard ? { boardId: localBoard.id, nr: scl } : null,
        },
        token,
      );
      toast.success('I2C settings saved');
      onSaved();
      onClose();
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to save I2C settings'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>I2C configuration</DialogTitle>
          <DialogDescription>
            Enable I2C to use expander boards. Make sure I2C is also enabled on
            the Raspberry Pi.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <div className="flex items-center justify-between">
            <Label>Enable I2C</Label>
            <Switch checked={enable} onCheckedChange={setEnable} />
          </div>
          {enable && (
            <>
              <PinSelect
                label="SDA pin"
                value={sda}
                options={options}
                onChange={setSda}
              />
              <PinSelect
                label="SCL pin"
                value={scl}
                options={options}
                onChange={setScl}
              />
              {sda !== null && sda === scl && (
                <p className="text-sm text-danger">
                  SDA and SCL must be different pins.
                </p>
              )}
            </>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!valid || saving}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
