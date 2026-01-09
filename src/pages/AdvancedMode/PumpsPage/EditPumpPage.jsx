import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft,
  Save,
  Trash2,
  AlertCircle,
  CheckCircle,
  Droplet,
  Hexagon,
  Settings,
  Zap,
  Thermometer,
  Timer,
  Package,
  TestTube,
  Loader2,
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import useAuthStore from '../../../store/authStore';
import { usePumpStore } from '../../../store/pumpStore';
import PumpService from '../../../services/pump.service';
import IngredientService from '../../../services/ingredient.service';
import GpioService from '../../../services/gpio.service';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';

// Stepper Motor Icon Component
const StepperMotorIcon = ({ width = 24, height = 24, className = '' }) => (
  <svg
    width={width}
    height={height}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <circle cx="12" cy="12" r="10" />
    <path d="M12 6v12" />
    <path d="M8 10l8 4" />
    <path d="M16 10l-8 4" />
  </svg>
);

const EditPumpPage = () => {
  const { pumpId } = useParams({ from: '/pumps/$pumpId/edit' });
  const navigate = useNavigate();
  const { t } = useTranslation();
  const token = useAuthStore((state) => state.token);
  const { updatePump, removePump } = usePumpStore();

  // Form state
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
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

  // Component state
  const [pump, setPump] = useState(null);
  const [ingredients, setIngredients] = useState([]);
  const [boards, setBoards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Watch form values for conditional rendering
  const pumpType = watch('type');
  const selectedBoardId = watch('pin.boardId');

  // Load pump data
  useEffect(() => {
    const loadPumpData = async () => {
      if (!token || !pumpId) return;

      try {
        setLoading(true);
        const [pumpData, ingredientsData, boardsData] = await Promise.all([
          PumpService.getPump(pumpId, token),
          IngredientService.getIngredients(token),
          GpioService.getBoards(token),
        ]);

        setPump(pumpData);
        setIngredients(ingredientsData);
        setBoards(boardsData);

        // Populate form with pump data
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

  // Show toast notification
  const showToast = (message, type = 'success') => {
    if (type === 'success') {
      toast.success(message);
    } else {
      toast.error(message);
    }
  };

  // Handle form submission
  const onSubmit = async (data) => {
    if (!token || !pumpId) return;

    try {
      setSaving(true);
      setError(null);

      // Prepare pump data for API
      const pumpData = {
        ...data,
        removeFields: [],
      };

      // Update pump via API
      const updatedPump = await PumpService.patchPump(pumpId, pumpData, token);

      // Update local store
      updatePump(pumpId, updatedPump);

      setSuccess('Pump updated successfully');
      showToast('Pump updated successfully', 'success');

      // Navigate back after a short delay
      setTimeout(() => {
        navigate({ to: '/pumps' });
      }, 1500);
    } catch (err) {
      console.error('Error updating pump:', err);
      setError('Failed to update pump');
      showToast('Failed to update pump', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Handle pump deletion
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

      // Update local store
      removePump(pumpId);

      showToast('Pump deleted successfully', 'success');

      // Navigate back
      navigate({ to: '/pumps' });
    } catch (err) {
      console.error('Error deleting pump:', err);
      setError('Failed to delete pump');
      showToast('Failed to delete pump', 'error');
    } finally {
      setDeleting(false);
    }
  };

  // Get pump type icon
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

  // Get pump type name
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

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!pump) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Pump Not Found</h2>
          <p className="text-muted-foreground mb-4">
            The pump you're looking for doesn't exist.
          </p>
          <Button onClick={() => navigate({ to: '/pumps' })}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Pumps
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b shadow-sm">
        <div className="px-4 sm:px-6 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <Button
              onClick={() => navigate({ to: '/pumps' })}
              variant="ghost"
              size="sm"
              title="Back to Pumps"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold break-words">
                Edit Pump
              </h1>
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                {getPumpTypeIcon(pump.type)}
                {getPumpTypeName(pump.type)}
                {pump.name && (
                  <>
                    <span>•</span>
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
              size="sm"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              <span className="hidden sm:inline ml-2">Delete</span>
            </Button>
            <Button
              type="submit"
              form="pump-form"
              size="sm"
              disabled={saving}
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              <span className="hidden sm:inline ml-2">Save</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <Alert className="mx-4 mt-4">
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive" className="mx-4 mt-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Main Content */}
      <div className="p-4 sm:p-6">
        <form
          id="pump-form"
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-6"
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Pump Name</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Enter pump name"
                    {...register('name', { required: 'Pump name is required' })}
                    className={errors.name ? 'border-destructive' : ''}
                  />
                  {errors.name && (
                    <p className="text-sm text-destructive">
                      {errors.name.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="type">Pump Type</Label>
                  <Select
                    value={watch('type')}
                    onValueChange={(value) => setValue('type', value)}
                  >
                    <SelectTrigger id="type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dc">DC Pump</SelectItem>
                      <SelectItem value="stepper">Stepper Motor</SelectItem>
                      <SelectItem value="valve">Control Valve</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ingredient">Current Ingredient</Label>
                  <Select
                    value={watch('currentIngredientId')?.toString() || ''}
                    onValueChange={(value) => setValue('currentIngredientId', value ? parseInt(value) : null)}
                  >
                    <SelectTrigger id="ingredient">
                      <SelectValue placeholder="No ingredient assigned" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">No ingredient assigned</SelectItem>
                      {ingredients.map((ingredient) => (
                        <SelectItem key={ingredient.id} value={ingredient.id.toString()}>
                          {ingredient.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Hardware Configuration */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Hardware Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">

                {/* DC Pump / Valve Pin */}
                {(pumpType === 'dc' || pumpType === 'valve') && (
                  <div className="space-y-2">
                    <Label htmlFor="controlPin">Control Pin</Label>
                    <Select
                      value={watch('pin.boardId')?.toString() || ''}
                      onValueChange={(value) => setValue('pin.boardId', value ? parseInt(value) : null)}
                    >
                      <SelectTrigger id="controlPin">
                        <SelectValue placeholder="Select board" />
                      </SelectTrigger>
                      <SelectContent>
                        {boards.map((board) => (
                          <SelectItem key={board.id} value={board.id.toString()}>
                            {board.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Stepper Motor Pins */}
                {pumpType === 'stepper' && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="enablePin">Enable Pin</Label>
                      <Select
                        value={watch('enablePin.boardId')?.toString() || ''}
                        onValueChange={(value) => setValue('enablePin.boardId', value ? parseInt(value) : null)}
                      >
                        <SelectTrigger id="enablePin">
                          <SelectValue placeholder="Select board" />
                        </SelectTrigger>
                        <SelectContent>
                          {boards.map((board) => (
                            <SelectItem key={board.id} value={board.id.toString()}>
                              {board.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="stepPin">Step Pin</Label>
                      <Select
                        value={watch('stepPin.boardId')?.toString() || ''}
                        onValueChange={(value) => setValue('stepPin.boardId', value ? parseInt(value) : null)}
                      >
                        <SelectTrigger id="stepPin">
                          <SelectValue placeholder="Select board" />
                        </SelectTrigger>
                        <SelectContent>
                          {boards.map((board) => (
                            <SelectItem key={board.id} value={board.id.toString()}>
                              {board.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}

                <div className="flex items-center justify-between">
                  <Label htmlFor="powerState">Power State High</Label>
                  <Switch
                    id="powerState"
                    checked={watch('isPowerStateHigh')}
                    onCheckedChange={(checked) => setValue('isPowerStateHigh', checked)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Timing Configuration */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Timer className="h-5 w-5" />
                  Timing Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="timePerCl">Time per CL (ms)</Label>
                  <Input
                    id="timePerCl"
                    type="number"
                    placeholder="1000"
                    {...register('timePerClInMs', {
                      min: { value: 1, message: 'Must be at least 1ms' },
                      required: 'Time per CL is required',
                    })}
                    className={errors.timePerClInMs ? 'border-destructive' : ''}
                  />
                  {errors.timePerClInMs && (
                    <p className="text-sm text-destructive">
                      {errors.timePerClInMs.message}
                    </p>
                  )}
                </div>

                {/* Stepper-specific timing */}
                {pumpType === 'stepper' && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="acceleration">Acceleration</Label>
                      <Input
                        id="acceleration"
                        type="number"
                        placeholder="1000"
                        {...register('acceleration', {
                          min: { value: 1, message: 'Must be at least 1' },
                        })}
                        className={errors.acceleration ? 'border-destructive' : ''}
                      />
                      {errors.acceleration && (
                        <p className="text-sm text-destructive">
                          {errors.acceleration.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="maxSteps">Max Steps per Second</Label>
                      <Input
                        id="maxSteps"
                        type="number"
                        placeholder="2000"
                        {...register('maxStepsPerSecond', {
                          min: { value: 1, message: 'Must be at least 1' },
                        })}
                        className={errors.maxStepsPerSecond ? 'border-destructive' : ''}
                      />
                      {errors.maxStepsPerSecond && (
                        <p className="text-sm text-destructive">
                          {errors.maxStepsPerSecond.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="stepsPerCl">Steps per CL</Label>
                      <Input
                        id="stepsPerCl"
                        type="number"
                        placeholder="100"
                        {...register('stepsPerCl', {
                          min: { value: 1, message: 'Must be at least 1' },
                        })}
                        className={errors.stepsPerCl ? 'border-destructive' : ''}
                      />
                      {errors.stepsPerCl && (
                        <p className="text-sm text-destructive">
                          {errors.stepsPerCl.message}
                        </p>
                      )}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Capacity Configuration */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Capacity Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="tubeCapacity">Tube Capacity (ml)</Label>
                  <Input
                    id="tubeCapacity"
                    type="number"
                    placeholder="100"
                    {...register('tubeCapacityInMl', {
                      min: { value: 0, message: 'Must be at least 0' },
                      required: 'Tube capacity is required',
                    })}
                    className={errors.tubeCapacityInMl ? 'border-destructive' : ''}
                  />
                  {errors.tubeCapacityInMl && (
                    <p className="text-sm text-destructive">
                      {errors.tubeCapacityInMl.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fillingLevel">Filling Level (ml)</Label>
                  <Input
                    id="fillingLevel"
                    type="number"
                    placeholder="0"
                    {...register('fillingLevelInMl', {
                      min: { value: 0, message: 'Must be at least 0' },
                    })}
                    className={errors.fillingLevelInMl ? 'border-destructive' : ''}
                  />
                  {errors.fillingLevelInMl && (
                    <p className="text-sm text-destructive">
                      {errors.fillingLevelInMl.message}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="pumpedUp">Pumped Up</Label>
                  <Switch
                    id="pumpedUp"
                    checked={watch('isPumpedUp')}
                    onCheckedChange={(checked) => setValue('isPumpedUp', checked)}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-4 pt-6 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate({ to: '/pumps' })}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
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
