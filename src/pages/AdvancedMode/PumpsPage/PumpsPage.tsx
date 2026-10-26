import { AlertCircle, PlayCircle, PlusCircle, StopCircle } from 'lucide-react';
import type React from 'react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { PageHeader } from '@/components/AdvancedMode/PageHeader';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { usePumps } from '../../../hooks/usePumps';
import { useWebSocket } from '../../../hooks/useWebSocket';
import PumpService from '../../../services/pump.service';
import useAuthStore from '../../../store/authStore';
import { PumpCard } from './components/PumpCard';
import { PumpSelector } from './components/PumpSelector';
import { PumpStatus } from './components/PumpStatus';
import { StepperMotorIcon } from './components/StepperMotorIcon';

export const PumpsPage: React.FC = () => {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const token = useAuthStore((state) => state.token);
  const { pumps, loading, error } = usePumps();

  // Ensure WS connection for pump card live updates (no progress sub)
  useWebSocket(token, { keepAlive: true, subscribeProgress: false });

  const onClickTurnOnAllPumps = () => {
    PumpService.startPump(null, token)
      .then(() => {
        toast.success('All pumps started successfully');
      })
      .catch((err: any) => {
        toast.error('Failed to start pumps');
        console.error(err);
      });
  };

  const onClickTurnOffAllPumps = () => {
    PumpService.stopPump(null, token)
      .then(() => {
        toast.success('All pumps stopped successfully');
      })
      .catch((err: any) => {
        toast.error('Failed to stop pumps');
        console.error(err);
      });
  };

  return (
    <div className="min-h-screen bg-background">
      {loading && (
        <div className="fixed inset-0 bg-background flex justify-center items-center z-50">
          <div className="flex flex-col items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <p className="text-sm text-foreground-muted">Loading pumps...</p>
          </div>
        </div>
      )}

      <PageHeader
        title="Pumps"
        subtitle="Manage and monitor your pump system"
        action={
          <>
            <Button variant="outline" onClick={() => setShowAddDialog(true)}>
              <PlusCircle />
              Add pump
            </Button>
            <Button onClick={onClickTurnOnAllPumps}>
              <PlayCircle />
              Start all
            </Button>
            <Button variant="destructive" onClick={onClickTurnOffAllPumps}>
              <StopCircle />
              Stop all
            </Button>
          </>
        }
      />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="size-6" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6 lg:gap-8">
          <aside className="lg:sticky lg:top-28 lg:self-start">
            <PumpStatus />
          </aside>

          <main>
            {pumps && pumps.length > 0 ? (
              <div className="grid grid-cols-[repeat(auto-fill,minmax(18rem,1fr))] gap-5">
                {pumps.map((pump: any) => (
                  <PumpCard key={pump.id} pump={pump} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 px-4 min-h-[500px]">
                <div className="rounded-full bg-surface-sunken p-6 mb-6">
                  <StepperMotorIcon className="h-12 w-12 text-foreground-muted" />
                </div>
                <h3 className="text-2xl font-bold mb-2">No Pumps Found</h3>
                <p className="text-foreground-muted text-center mb-8 max-w-md">
                  Get started by adding your first pump to begin managing your
                  cocktail system
                </p>
                <Button
                  variant="default"
                  size="lg"
                  onClick={() => setShowAddDialog(true)}
                  className="gap-2"
                >
                  <PlusCircle className="size-6" />
                  Add First Pump
                </Button>
              </div>
            )}
          </main>
        </div>
      </div>

      <PumpSelector
        show={showAddDialog}
        onClose={() => setShowAddDialog(false)}
      />
    </div>
  );
};
