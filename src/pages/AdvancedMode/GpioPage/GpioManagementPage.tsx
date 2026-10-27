import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertCircle, Cpu, Pencil, PlusCircle } from 'lucide-react';
import type React from 'react';
import { useState } from 'react';
import { PageHeader } from '@/components/AdvancedMode/PageHeader';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import GpioService from '../../../services/gpio.service';
import SystemService from '../../../services/system.service';
import useAuthStore from '../../../store/authStore';
import { DeleteBoardDialog } from './components/DeleteBoardDialog';
import { GpioBoardCard } from './components/GpioBoardCard';
import { I2cBoardDialog } from './components/I2cBoardDialog';
import { I2cSettingsDialog } from './components/I2cSettingsDialog';
import { type GpioBoard, type GpioStatus, getErrorMessage } from './types';

const boardsKey = ['gpio', 'boards'] as const;
const statusKey = ['gpio', 'status'] as const;
const i2cKey = ['gpio', 'i2c-settings'] as const;

const StatRow: React.FC<{ label: string; children: React.ReactNode }> = ({
  label,
  children,
}) => (
  <div className="flex items-center justify-between rounded-lg bg-surface-sunken px-3 py-2">
    <span className="text-sm font-medium">{label}</span>
    {children}
  </div>
);

export const GpioManagementPage: React.FC = () => {
  const token = useAuthStore((state) => state.token);
  const queryClient = useQueryClient();

  const [boardDialog, setBoardDialog] = useState<{
    open: boolean;
    board: GpioBoard | null;
  }>({ open: false, board: null });
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [boardToDelete, setBoardToDelete] = useState<GpioBoard | null>(null);

  const boardsQuery = useQuery<GpioBoard[]>({
    queryKey: boardsKey,
    queryFn: () => GpioService.getBoards(token),
    enabled: !!token,
  });
  const statusQuery = useQuery<GpioStatus>({
    queryKey: statusKey,
    queryFn: () => GpioService.getGpioStatus(token),
    enabled: !!token,
  });
  const i2cQuery = useQuery({
    queryKey: i2cKey,
    queryFn: () => SystemService.getI2CSettings(token),
    enabled: !!token,
  });

  const refreshAll = () => {
    queryClient.invalidateQueries({ queryKey: ['gpio'] });
  };

  const boards = boardsQuery.data ?? [];
  const localBoards = boards.filter((b) => b.type === 'local');
  const i2cBoards = boards.filter((b) => b.type === 'i2c');
  const status = statusQuery.data;
  const i2c = i2cQuery.data;
  const i2cEnabled = !!(i2c?.enable || i2c?.enabled);
  const error = boardsQuery.error || statusQuery.error;

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        title="GPIO"
        subtitle="Manage GPIO boards and I2C expanders"
        action={
          <Button
            onClick={() => setBoardDialog({ open: true, board: null })}
            disabled={!i2cEnabled}
            title={i2cEnabled ? undefined : 'Enable I2C first'}
          >
            <PlusCircle />
            Add I2C board
          </Button>
        }
      />

      <div className="container mx-auto px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="size-6" />
            <AlertDescription>
              {getErrorMessage(error, 'Failed to load GPIO data')}
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[320px_1fr] lg:gap-8">
          <aside className="space-y-6 lg:sticky lg:top-28 lg:self-start">
            <Card>
              <CardHeader className="border-b">
                <CardTitle className="text-lg font-bold">GPIO status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 pt-4">
                {statusQuery.isLoading ? (
                  <Skeleton className="h-20 w-full" />
                ) : (
                  <>
                    <StatRow label="Pins used">
                      <Badge className="font-semibold">
                        {status?.pinsUsed ?? 0} / {status?.maxPins ?? 0}
                      </Badge>
                    </StatRow>
                    <StatRow label="Boards available">
                      <Badge className="font-semibold">
                        {status?.boardsInstalled ?? boards.length}
                      </Badge>
                    </StatRow>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="border-b">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-bold">I2C</CardTitle>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    title="Configure I2C"
                    onClick={() => setSettingsOpen(true)}
                    disabled={i2cQuery.isLoading}
                  >
                    <Pencil className="size-5" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 pt-4">
                {i2cQuery.isLoading ? (
                  <Skeleton className="h-20 w-full" />
                ) : (
                  <>
                    <StatRow label="Status">
                      <Badge
                        variant={i2cEnabled ? 'success' : 'destructive'}
                        className="font-semibold"
                      >
                        {i2cEnabled ? 'Enabled' : 'Disabled'}
                      </Badge>
                    </StatRow>
                    {i2cEnabled && (
                      <>
                        <StatRow label="SDA pin">
                          <Badge variant="outline" className="font-semibold">
                            {i2c?.sdaPin?.nr != null
                              ? `BCM ${i2c.sdaPin.nr}`
                              : '-'}
                          </Badge>
                        </StatRow>
                        <StatRow label="SCL pin">
                          <Badge variant="outline" className="font-semibold">
                            {i2c?.sclPin?.nr != null
                              ? `BCM ${i2c.sclPin.nr}`
                              : '-'}
                          </Badge>
                        </StatRow>
                      </>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </aside>

          <main className="space-y-8">
            <section className="space-y-4">
              <h2 className="text-xl font-bold">Local GPIO boards</h2>
              {boardsQuery.isLoading ? (
                <Skeleton className="h-24 w-full" />
              ) : localBoards.length > 0 ? (
                localBoards.map((b) => <GpioBoardCard key={b.id} board={b} />)
              ) : (
                <p className="text-foreground-muted">No local boards found.</p>
              )}
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-bold">I2C expander boards</h2>
              {!i2cEnabled && !i2cQuery.isLoading && (
                <Alert>
                  <AlertDescription>
                    I2C is disabled. Enable it to add expander boards.
                  </AlertDescription>
                </Alert>
              )}
              {boardsQuery.isLoading ? (
                <Skeleton className="h-24 w-full" />
              ) : i2cBoards.length > 0 ? (
                i2cBoards.map((b) => (
                  <GpioBoardCard
                    key={b.id}
                    board={b}
                    onEdit={(board) => setBoardDialog({ open: true, board })}
                    onDelete={setBoardToDelete}
                  />
                ))
              ) : (
                <div className="flex flex-col items-center py-12 text-center">
                  <Cpu className="mb-3 size-10 text-foreground-muted" />
                  <p className="text-foreground-muted">
                    No I2C boards configured.
                  </p>
                </div>
              )}
            </section>
          </main>
        </div>
      </div>

      <I2cBoardDialog
        open={boardDialog.open}
        board={boardDialog.board}
        onClose={() => setBoardDialog({ open: false, board: null })}
        onSaved={refreshAll}
      />
      <I2cSettingsDialog
        open={settingsOpen}
        settings={i2c ?? null}
        localBoard={localBoards[0]}
        onClose={() => setSettingsOpen(false)}
        onSaved={refreshAll}
      />
      <DeleteBoardDialog
        board={boardToDelete}
        onClose={() => setBoardToDelete(null)}
        onDeleted={refreshAll}
      />
    </div>
  );
};
