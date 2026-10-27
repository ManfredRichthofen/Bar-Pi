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
import GpioService from '../../../../services/gpio.service';
import useAuthStore from '../../../../store/authStore';
import { type GpioBoard, getErrorMessage } from '../types';

interface DeleteBoardDialogProps {
  board: GpioBoard | null;
  onClose: () => void;
  onDeleted: () => void;
}

/** Keeps the dialog open on failure so the server's reason (e.g. pins in use) is shown. */
export const DeleteBoardDialog: React.FC<DeleteBoardDialogProps> = ({
  board,
  onClose,
  onDeleted,
}) => {
  const token = useAuthStore((state) => state.token);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (board) setError(null);
  }, [board]);

  const handleDelete = async () => {
    if (!board) return;
    setDeleting(true);
    try {
      await GpioService.deleteGpioBoard(board.id, token);
      toast.success('Board deleted');
      onDeleted();
      onClose();
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to delete board'));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Dialog open={!!board} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete I2C board</DialogTitle>
          <DialogDescription>
            Delete "{board?.name}"? This cannot be undone.
          </DialogDescription>
        </DialogHeader>
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={deleting}
          >
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
