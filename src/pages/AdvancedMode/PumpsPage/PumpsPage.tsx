import type React from 'react';
import { useState, useEffect } from 'react';
import useAuthStore from '../../../store/authStore';
import { usePumpStore } from '../../../store/pumpStore';
import PumpService from '../../../services/pump.service';
import { PumpStatus } from './components/PumpStatus';
import { PumpCard } from './components/PumpCard';
import { PumpSelector } from './components/PumpSelector';
import { PlusCircle, PlayCircle, StopCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { Spinner } from '@/components/ui/spinner';

export const PumpsPage: React.FC = () => {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const token = useAuthStore((state) => state.token);

  const { pumps, loading, error, fetchPumps } = usePumpStore();

  useEffect(() => {
    if (token) {
      fetchPumps(token);
    }
  }, [token, fetchPumps]);

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
        <div className="fixed inset-0 bg-background/50 flex justify-center items-center z-50">
          <Spinner className="h-8 w-8" />
        </div>
      )}

      <div className="sticky top-0 z-20 bg-background border-b shadow-sm pt-2">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <h1 className="text-2xl font-bold">Pump Management</h1>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="default"
                size="sm"
                onClick={() => setShowAddDialog(true)}
              >
                <PlusCircle />
                Add Pump
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={onClickTurnOnAllPumps}
                className="bg-success hover:bg-success/90"
              >
                <PlayCircle />
                Start All
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={onClickTurnOffAllPumps}
              >
                <StopCircle />
                Stop All
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 sm:py-8">
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6">
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <PumpStatus />
          </aside>

          <main>
            {pumps && pumps.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-4">
                {pumps.map((pump: any) => (
                  <PumpCard key={pump.id} pump={pump} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 px-4 min-h-[400px]">
                <AlertCircle className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">No Pumps Found</h3>
                <p className="text-muted-foreground text-center mb-6 max-w-sm">
                  Get started by adding your first pump to begin managing your
                  system
                </p>
                <Button
                  variant="default"
                  size="lg"
                  onClick={() => setShowAddDialog(true)}
                >
                  <PlusCircle className="mr-2" />
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
