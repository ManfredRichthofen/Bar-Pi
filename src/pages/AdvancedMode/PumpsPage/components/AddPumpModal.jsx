import {
  AlertCircle,
  CheckCircle,
  Droplet,
  Hexagon,
  Loader2,
  Save,
  Settings,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { PumpFormFields } from '@/pages/AdvancedMode/PumpsPage/components/PumpFormFields';
import { StepperMotorIcon } from '@/pages/AdvancedMode/PumpsPage/components/StepperMotorIcon';
import GpioService from '../../../../services/gpio.service';
import IngredientService from '../../../../services/ingredient.service';
import PumpService from '../../../../services/pump.service';
import useAuthStore from '../../../../store/authStore';
import { usePumpStore } from '../../../../store/pumpStore';

const AddPumpModal = ({ show, onClose, pumpType = null }) => {
  const { t } = useTranslation();
  const token = useAuthStore((state) => state.token);
  const { addPump } = usePumpStore();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: '',
      type: pumpType || 'dc',
      pin: null,
      enablePin: null,
      stepPin: null,
      timePerClInMs: 1000,
      isPowerStateHigh: false,
      tubeCapacityInMl: 100,
      fillingLevelInMl: 0,
      isPumpedUp: false,
      currentIngredientId: null,
      acceleration: 1000,
      maxStepsPerSecond: 2000,
      stepsPerCl: 100,
    },
  });

  const [ingredients, setIngredients] = useState([]);
  const [boards, setBoards] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const pumpTypeValue = watch('type');

  useEffect(() => {
    if (show && token) {
      loadData();
    }
  }, [show, token]);

  useEffect(() => {
    if (pumpType) {
      setValue('type', pumpType);
    }
  }, [pumpType, setValue]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [ingredientsData, boardsData] = await Promise.all([
        IngredientService.getIngredients(token),
        GpioService.getBoards(token),
      ]);

      setIngredients(ingredientsData);
      setBoards(boardsData);
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data) => {
    if (!token) return;

    try {
      setSaving(true);
      setError(null);

      const response = await PumpService.createPump(data, token);
      const newPump = response.data;

      addPump(newPump);

      setSuccess('Pump created successfully');
      toast.success('Pump created successfully');

      reset();

      setTimeout(() => {
        handleClose();
      }, 1500);
    } catch (err) {
      console.error('Error creating pump:', err);
      setError('Failed to create pump');
      toast.error('Failed to create pump');
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    if (!saving && onClose) {
      reset();
      setError(null);
      setSuccess(null);
      onClose();
    }
  };

  const getPumpTypeIcon = (type) => {
    switch (type) {
      case 'dc':
        return <Droplet size={20} />;
      case 'stepper':
        return <StepperMotorIcon width={20} height={20} />;
      case 'valve':
        return <Hexagon size={20} />;
      default:
        return <Settings size={20} />;
    }
  };

  const getPumpTypeName = (type) => {
    switch (type) {
      case 'dc':
        return 'DC Pump';
      case 'stepper':
        return 'Stepper Motor';
      case 'valve':
        return 'Control Valve';
      default:
        return 'Unknown';
    }
  };

  if (!show) return null;

  return (
    <Dialog open={show} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            {getPumpTypeIcon(pumpTypeValue)}
            <div>
              <DialogTitle>Add New Pump</DialogTitle>
              <p className="text-sm text-foreground-muted">
                {getPumpTypeName(pumpTypeValue)}
              </p>
            </div>
          </div>
        </DialogHeader>

        {success && (
          <Alert className="mb-4">
            <CheckCircle className="size-6" />
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="size-6" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {loading && (
          <div className="flex justify-center items-center py-8">
            <Skeleton className="h-8 w-8 rounded-full" />
          </div>
        )}

        {!loading && (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <PumpFormFields
              register={register}
              setValue={setValue}
              watch={watch}
              errors={errors}
              boards={boards}
              ingredients={ingredients}
              showTypeSelector={!pumpType}
            />

            <DialogFooter className="pt-6 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={saving}
              >
                {t('add_pump_modal.cancel')}
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? (
                  <Loader2 className="size-6 animate-spin mr-2" />
                ) : (
                  <Save className="size-6 mr-2" />
                )}
                {t('add_pump_modal.create_pump')}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AddPumpModal;
