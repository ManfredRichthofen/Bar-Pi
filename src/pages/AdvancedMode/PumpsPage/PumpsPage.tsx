import { AlertCircle, PlayCircle, PlusCircle, StopCircle } from 'lucide-react';
import type React from 'react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import PumpService from '../../../services/pump.service';
import WebSocketService from '../../../services/websocket.service';
import useAuthStore from '../../../store/authStore';
import { usePumpStore } from '../../../store/pumpStore';
import { PumpCard } from './components/PumpCard';
import { PumpSelector } from './components/PumpSelector';
import { PumpStatus } from './components/PumpStatus';
import { StepperMotorIcon } from './components/StepperMotorIcon';

export const PumpsPage: React.FC = () => {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const token = useAuthStore((state) => state.token);

  const { pumps, loading, error, fetchPumps } = usePumpStore();

  useEffect(() => {
    if (token) {
      fetchPumps(token);
      // Initialize WebSocket connection for real-time pump updates
      if (!WebSocketService.connected) {
        WebSocketService.connectWebsocket(token);
      }
    }
  }, [token, fetchPumps]);

  // Cleanup WebSocket on unmount
  useEffect(() => {
    return () => {
      // Don't disconnect WebSocket as other components might be using it
    };
  }, []);

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
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex justify-center items-center z-50">
          <div className="flex flex-col items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <p className="text-sm text-muted-foreground">Loading pumps...</p>
          </div>
        </div>
      )}

      <div className="sticky top-16 z-40 bg-background/95 backdrop-blur-md border-b shadow-sm pt-2">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                Pump Management
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Manage and monitor your pump system
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="default"
                size="default"
                onClick={() => setShowAddDialog(true)}
                className="gap-2"
              >
                <PlusCircle className="h-4 w-4" />
                Add Pump
              </Button>
              <Button
                variant="default"
                size="default"
                onClick={onClickTurnOnAllPumps}
                className="bg-primary hover:bg-primary/90 gap-2"
              >
                <PlayCircle className="h-4 w-4" />
                Start All
              </Button>
              <Button
                variant="destructive"
                size="default"
                onClick={onClickTurnOffAllPumps}
                className="gap-2"
              >
                <StopCircle className="h-4 w-4" />
                Stop All
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6 lg:gap-8">
          <aside className="lg:sticky lg:top-28 lg:self-start">
            <PumpStatus />
          </aside>

          <main>
            {pumps && pumps.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-3 gap-5">
                {pumps.map((pump: any) => (
                  <PumpCard key={pump.id} pump={pump} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 px-4 min-h-[500px]">
                <div className="rounded-full bg-muted/50 p-6 mb-6">
                  <StepperMotorIcon className="h-12 w-12 text-muted-foreground" />
                </div>
                <h3 className="text-2xl font-bold mb-2">No Pumps Found</h3>
                <p className="text-muted-foreground text-center mb-8 max-w-md">
                  Get started by adding your first pump to begin managing your
                  cocktail system
                </p>
                <Button
                  variant="default"
                  size="lg"
                  onClick={() => setShowAddDialog(true)}
                  className="gap-2"
                >
                  <PlusCircle className="h-5 w-5" />
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
