import React, { useState, useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import {
  X,
  Save,
  AlertCircle,
  CheckCircle,
  Droplet,
  Hexagon,
  Settings,
  Zap,
  Timer,
  Package,
  Loader2,
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import useAuthStore from '../../../../store/authStore';
import { usePumpStore } from '../../../../store/pumpStore';
import PumpService from '../../../../services/pump.service';
import IngredientService from '../../../../services/ingredient.service';
import GpioService from '../../../../services/gpio.service';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
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

const AddPumpModal = ({ show, onClose, pumpType = null }) => {
  const navigate = useNavigate({ from: '/pumps' });
  const { t } = useTranslation();
  const token = useAuthStore((state) => state.token);
  const { addPump } = usePumpStore();

  // Form state
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

  // Component state
  const [ingredients, setIngredients] = useState([]);
  const [boards, setBoards] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Watch form values for conditional rendering
  const pumpTypeValue = watch('type');

  // Load data when modal opens
  useEffect(() => {
    if (show && token) {
      loadData();
    }
  }, [show, token]);

  // Reset form when pump type changes
  useEffect(() => {
    if (pumpType) {
      setValue('type', pumpType);
    }
  }, [pumpType, setValue]);

  // Load ingredients and boards
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

  // Handle form submission
  const onSubmit = async (data) => {
    if (!token) return;

    try {
      setSaving(true);
      setError(null);

      // Create pump via API
      const response = await PumpService.createPump(data, token);
      const newPump = response.data;

      // Add to local store
      addPump(newPump);

      setSuccess('Pump created successfully');
      toast.success('Pump created successfully');

      // Reset form
      reset();

      // Close modal after a short delay
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

  // Handle modal close
  const handleClose = () => {
    if (!saving && onClose) {
      reset();
      setError(null);
      setSuccess(null);
      onClose();
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

  if (!show) return null;

  return (
    <Dialog open={show} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            {getPumpTypeIcon(pumpTypeValue)}
            <div>
              <DialogTitle>Add New Pump</DialogTitle>
              <p className="text-sm text-muted-foreground">
                {getPumpTypeName(pumpTypeValue)}
              </p>
            </div>
          </div>
        </DialogHeader>

        {/* Success/Error Messages */}
        {success && (
          <Alert className="mb-4">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        )}

        {/* Form */}
        {!loading && (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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
                      {...register('name', {
                        required: 'Pump name is required',
                      })}
                      className={errors.name ? 'border-destructive' : ''}
                    />
                    {errors.name && (
                      <p className="text-sm text-destructive">
                        {errors.name.message}
                      </p>
                    )}
                  </div>

                  {!pumpType && (
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
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="ingredient">Current Ingredient</Label>
                    <Select
                      value={watch('currentIngredientId')?.toString() || ''}
                      onValueChange={(value) =>
                        setValue(
                          'currentIngredientId',
                          value ? parseInt(value) : null,
                        )
                      }
                    >
                      <SelectTrigger id="ingredient">
                        <SelectValue placeholder="No ingredient assigned" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">No ingredient assigned</SelectItem>
                        {ingredients.map((ingredient) => (
                          <SelectItem
                            key={ingredient.id}
                            value={ingredient.id.toString()}
                          >
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
                  {(pumpTypeValue === 'dc' || pumpTypeValue === 'valve') && (
                    <div className="space-y-2">
                      <Label htmlFor="controlPin">Control Pin</Label>
                      <Select
                        value={watch('pin.boardId')?.toString() || ''}
                        onValueChange={(value) =>
                          setValue(
                            'pin.boardId',
                            value ? parseInt(value) : null,
                          )
                        }
                      >
                        <SelectTrigger id="controlPin">
                          <SelectValue placeholder="Select board" />
                        </SelectTrigger>
                        <SelectContent>
                          {boards.map((board) => (
                            <SelectItem
                              key={board.id}
                              value={board.id.toString()}
                            >
                              {board.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Stepper Motor Pins */}
                  {pumpTypeValue === 'stepper' && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="enablePin">Enable Pin</Label>
                        <Select
                          value={watch('enablePin.boardId')?.toString() || ''}
                          onValueChange={(value) =>
                            setValue(
                              'enablePin.boardId',
                              value ? parseInt(value) : null,
                            )
                          }
                        >
                          <SelectTrigger id="enablePin">
                            <SelectValue placeholder="Select board" />
                          </SelectTrigger>
                          <SelectContent>
                            {boards.map((board) => (
                              <SelectItem
                                key={board.id}
                                value={board.id.toString()}
                              >
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
                          onValueChange={(value) =>
                            setValue(
                              'stepPin.boardId',
                              value ? parseInt(value) : null,
                            )
                          }
                        >
                          <SelectTrigger id="stepPin">
                            <SelectValue placeholder="Select board" />
                          </SelectTrigger>
                          <SelectContent>
                            {boards.map((board) => (
                              <SelectItem
                                key={board.id}
                                value={board.id.toString()}
                              >
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
                      onCheckedChange={(checked) =>
                        setValue('isPowerStateHigh', checked)
                      }
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
                      className={
                        errors.timePerClInMs ? 'border-destructive' : ''
                      }
                    />
                    {errors.timePerClInMs && (
                      <p className="text-sm text-destructive">
                        {errors.timePerClInMs.message}
                      </p>
                    )}
                  </div>

                  {/* Stepper-specific timing */}
                  {pumpTypeValue === 'stepper' && (
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
                          className={
                            errors.acceleration ? 'border-destructive' : ''
                          }
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
                          className={
                            errors.maxStepsPerSecond ? 'border-destructive' : ''
                          }
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
                          className={
                            errors.stepsPerCl ? 'border-destructive' : ''
                          }
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
                      className={
                        errors.tubeCapacityInMl ? 'border-destructive' : ''
                      }
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
                      className={
                        errors.fillingLevelInMl ? 'border-destructive' : ''
                      }
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
                      onCheckedChange={(checked) =>
                        setValue('isPumpedUp', checked)
                      }
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            <DialogFooter className="pt-6 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Create Pump
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AddPumpModal;
