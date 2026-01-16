import type React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export interface Pin {
  boardId: number | null;
  nr: number | null;
  boardName?: string;
  pinName?: string;
}

export interface Board {
  id: number;
  name: string;
}

interface PinSelectorProps {
  label: string;
  pin: Pin;
  boards: Board[];
  onPinChange: (pin: Pin) => void;
  disabled?: boolean;
  className?: string;
}

export const PinSelector: React.FC<PinSelectorProps> = ({
  label,
  pin,
  boards,
  onPinChange,
  disabled = false,
  className = '',
}) => {
  const selectedBoard = boards.find((board) => board.id === pin.boardId);

  const handleBoardChange = (boardId: string | null) => {
    const newBoardId = boardId ? parseInt(boardId) : null;
    onPinChange({
      ...pin,
      boardId: newBoardId,
      nr: null, // Reset pin number when board changes
    });
  };

  const handlePinNumberChange = (pinNumber: string) => {
    const newPinNr = pinNumber ? parseInt(pinNumber) : null;
    onPinChange({
      ...pin,
      nr: newPinNr,
    });
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <Label>{label} - Board</Label>
      <Select
        value={pin.boardId?.toString() || ''}
        onValueChange={handleBoardChange}
        disabled={disabled}
      >
        <SelectTrigger>
          <SelectValue>{selectedBoard?.name || 'Select board'}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          {boards.map((board) => (
            <SelectItem key={board.id} value={board.id.toString()}>
              {board.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {pin.boardId && (
        <>
          <Label>{label} - Number</Label>
          <Input
            type="number"
            placeholder="Pin number"
            value={pin.nr || ''}
            onChange={(e) => handlePinNumberChange(e.target.value)}
            disabled={disabled}
          />
        </>
      )}
    </div>
  );
};

export default PinSelector;
