import { useNavigate, useParams } from '@tanstack/react-router';
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle,
  Droplet,
  Hexagon,
  Loader2,
  Save,
  Settings,
  Trash2,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from '@/components/ui/toast';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { PumpFormFields } from '@/pages/AdvancedMode/PumpsPage/components/PumpFormFields';
import { StepperMotorIcon } from '@/pages/AdvancedMode/PumpsPage/components/StepperMotorIcon';
import GpioService from '../../../services/gpio.service';
import IngredientService from '../../../services/ingredient.service';
import PumpService from '../../../services/pump.service';
import useAuthStore from '../../../store/authStore';
import { usePumpStore } from '../../../store/pumpStore';

const EditPumpPage = () => {
  const navigate = useNavigate({ from: '/pumps/$pumpId/edit' });
  const params = useParams({ strict: false });
  const pumpId = params?.pumpId;
  console.log('EditPumpPage rendering, pumpId:', pumpId);
  const token = useAuthStore((state) => state.token);
  const { updatePump, removePump } = usePumpStore();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: '',
      type: 'dc',
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

  const [pump, setPump] = useState(null);
  const [ingredients, setIngredients] = useState([]);
  const [boards, setBoards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    const loadPumpData = async () => {
      console.log('loadPumpData called, token:', !!token, 'pumpId:', pumpId);
      if (!token || !pumpId) {
        console.log('Aborting load - missing token or pumpId');
        return;
      }

      try {
        setLoading(true);
        console.log('Fetching pump data for pumpId:', pumpId);
        const [pumpData, ingredientsData, boardsData] = await Promise.all([
          PumpService.getPump(pumpId, token),
          IngredientService.getIngredients(token),
          GpioService.getBoards(token),
        ]);

        console.log('Pump data loaded:', pumpData);
        setPump(pumpData);
        setIngredients(ingredientsData);
        setBoards(boardsData);

        setValue('name', pumpData.name || '');
        setValue('type', pumpData.type || 'dc');
        setValue('pin', pumpData.pin || null);
        setValue('enablePin', pumpData.enablePin || null);
        setValue('stepPin', pumpData.stepPin || null);
        setValue('timePerClInMs', pumpData.timePerClInMs || 1000);
        setValue('isPowerStateHigh', pumpData.isPowerStateHigh || false);
        setValue('tubeCapacityInMl', pumpData.tubeCapacityInMl || 100);
        setValue('fillingLevelInMl', pumpData.fillingLevelInMl || 0);
        setValue('isPumpedUp', pumpData.isPumpedUp || false);
        setValue('currentIngredientId', pumpData.currentIngredient?.id || null);
        setValue('acceleration', pumpData.acceleration || 1000);
        setValue('maxStepsPerSecond', pumpData.maxStepsPerSecond || 2000);
        setValue('stepsPerCl', pumpData.stepsPerCl || 100);
      } catch (err) {
        console.error('Error loading pump data:', err);
        setError('Failed to load pump data');
      } finally {
        setLoading(false);
      }
    };

    loadPumpData();
  }, [pumpId, token, setValue]);

  const onSubmit = async (data) => {
    if (!token || !pumpId) return;

    try {
      setSaving(true);
      setError(null);

      const pumpData = {
        ...data,
        removeFields: [],
      };

      const updatedPump = await PumpService.patchPump(pumpId, pumpData, token);

      updatePump(pumpId, updatedPump);

      setSuccess('Pump updated successfully');
      toast.success('Pump updated successfully');

      setTimeout(() => {
        navigate({ to: '/pumps' });
      }, 1500);
    } catch (err) {
      console.error('Error updating pump:', err);
      setError('Failed to update pump');
      toast.error('Failed to update pump');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!token || !pumpId) return;

    if (
      !confirm(
        'Are you sure you want to delete this pump? This action cannot be undone.',
      )
    ) {
      return;
    }

    try {
      setDeleting(true);
      setError(null);

      await PumpService.deletePump(pumpId, token);

      removePump(pumpId);

      toast.success('Pump deleted successfully');

      navigate({ to: '/pumps' });
    } catch (err) {
      console.error('Error deleting pump:', err);
      setError('Failed to delete pump');
      toast.error('Failed to delete pump');
    } finally {
      setDeleting(false);
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
      case 'virtual':
        return 'Virtual Pump';
      default:
        return 'Unknown';
    }
  };

  console.log(
    'Render state - loading:',
    loading,
    'pump:',
    !!pump,
    'pumpId:',
    pumpId,
  );

  if (loading) {
    console.log('Rendering loading state');
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Skeleton className="h-8 w-8 rounded-full" />
      </div>
    );
  }

  if (!pump) {
    console.log('Rendering pump not found state');
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-danger mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Pump Not Found</h2>
          <p className="text-foreground-muted mb-4">
            The pump you're looking for doesn't exist.
          </p>
          <Button onClick={() => navigate({ to: '/pumps' })}>
            <ArrowLeft className="size-6 mr-2" />
            Back to Pumps
          </Button>
        </div>
      </div>
    );
  }

  console.log('Rendering main edit form');

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-20 bg-background border-b shadow-sm pt-2">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-3">
              <Button
                onClick={() => navigate({ to: '/pumps' })}
                variant="ghost"
                size="icon-sm"
                title="Back to Pumps"
              >
                <ArrowLeft className="size-6" />
              </Button>
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Edit Pump</h1>
                <p className="text-sm text-foreground-muted flex items-center gap-2 mt-1">
                  {getPumpTypeIcon(pump.type)}
                  <span>{getPumpTypeName(pump.type)}</span>
                  {pump.name && (
                    <>
                      <span className="text-foreground-muted">•</span>
                      <span>{pump.name}</span>
                    </>
                  )}
                </p>
              </div>
            </div>

            <div className="flex gap-2 flex-shrink-0">
              <Button
                type="button"
                variant="destructive"
                size="default"
                onClick={handleDelete}
                disabled={deleting}
                className="gap-2"
              >
                {deleting ? (
                  <Loader2 className="size-6 animate-spin" />
                ) : (
                  <Trash2 className="size-6" />
                )}
                Delete
              </Button>
              <Button
                type="submit"
                form="pump-form"
                size="default"
                disabled={saving}
                className="gap-2"
              >
                {saving ? (
                  <Loader2 className="size-6 animate-spin" />
                ) : (
                  <Save className="size-6" />
                )}
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {success && (
          <Alert className="mb-6">
            <CheckCircle className="size-6" />
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="size-6" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form
          id="pump-form"
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-6"
        >
          <PumpFormFields
            register={register}
            setValue={setValue}
            watch={watch}
            errors={errors}
            boards={boards}
            ingredients={ingredients}
            showTypeSelector
            enableIngredientSearch
          />

          <div className="flex justify-end gap-3 pt-8 border-t mt-8">
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={() => navigate({ to: '/pumps' })}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving} size="lg" className="gap-2">
              {saving ? (
                <Loader2 className="size-6 animate-spin" />
              ) : (
                <Save className="size-6" />
              )}
              Save Changes
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditPumpPage;
