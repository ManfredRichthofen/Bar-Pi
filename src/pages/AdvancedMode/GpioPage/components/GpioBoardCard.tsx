import { ChevronsUpDown, Cpu, Pencil, Trash2 } from 'lucide-react';
import type React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { formatAddress, type GpioBoard, i2cModelLabel } from '../types';

interface GpioBoardCardProps {
  board: GpioBoard;
  onEdit?: (board: GpioBoard) => void;
  onDelete?: (board: GpioBoard) => void;
}

export const GpioBoardCard: React.FC<GpioBoardCardProps> = ({
  board,
  onEdit,
  onDelete,
}) => {
  const pins = [...(board.pins ?? [])].sort((a, b) => a.nr - b.nr);
  const used = pins.filter((p) => p.inUse).length;

  return (
    <Card>
      <Collapsible>
        <CardHeader className="border-b">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <Cpu className="size-6 shrink-0 text-foreground-muted" />
              <div className="min-w-0">
                <CardTitle className="truncate text-lg font-bold">
                  {board.name}
                </CardTitle>
                {board.type === 'i2c' && (
                  <p className="text-sm text-foreground-muted">
                    {i2cModelLabel(board.boardModel)} ·{' '}
                    {formatAddress(board.address)}
                  </p>
                )}
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <Badge variant={used > 0 ? 'info' : 'secondary'}>
                {used}/{pins.length} used
              </Badge>
              {onEdit && (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  title="Edit"
                  onClick={() => onEdit(board)}
                >
                  <Pencil className="size-5" />
                </Button>
              )}
              {onDelete && (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  title="Delete"
                  onClick={() => onDelete(board)}
                >
                  <Trash2 className="size-5" />
                </Button>
              )}
              <CollapsibleTrigger className="inline-flex h-8 w-8 items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-primary-tint hover:text-primary-tint-ink">
                <ChevronsUpDown className="size-5" />
                <span className="sr-only">Toggle pins</span>
              </CollapsibleTrigger>
            </div>
          </div>
        </CardHeader>
        <CollapsibleContent>
          <CardContent className="pt-4">
            {pins.length === 0 ? (
              <p className="text-sm text-foreground-muted">No pins.</p>
            ) : (
              <div className="grid grid-cols-[repeat(auto-fill,minmax(4.5rem,1fr))] gap-2">
                {pins.map((pin) => (
                  <div
                    key={pin.nr}
                    title={pin.inUse ? 'In use' : 'Free'}
                    className={cn(
                      'rounded-lg px-2 py-1.5 text-center font-mono text-sm',
                      pin.inUse
                        ? 'bg-warning-tint text-warning-tint-ink'
                        : 'bg-surface-sunken text-foreground-muted',
                    )}
                  >
                    {pin.nr}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};
