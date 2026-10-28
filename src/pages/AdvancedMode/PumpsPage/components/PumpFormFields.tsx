import { Package, Timer, Zap } from 'lucide-react';
import type React from 'react';
import { useState } from 'react';
import type {
  FieldErrors,
  UseFormRegister,
  UseFormSetValue,
  UseFormWatch,
} from 'react-hook-form';
import { useTranslation } from 'react-i18next';
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
import {
  type Board,
  type Pin,
  PinSelector,
} from '@/pages/AdvancedMode/PumpsPage/components/PinSelector';

export interface PumpFormValues {
  name: string;
  type: string;
  pin: Pin | null;
  enablePin: Pin | null;
  stepPin: Pin | null;
  timePerClInMs: number;
  isPowerStateHigh: boolean;
  tubeCapacityInMl: number;
  fillingLevelInMl: number;
  isPumpedUp: boolean;
  currentIngredientId: number | null;
  acceleration: number;
  maxStepsPerSecond: number;
  stepsPerCl: number;
}

export interface IngredientOption {
  id: number;
  name: string;
}

interface PumpFormFieldsProps {
  register: UseFormRegister<PumpFormValues>;
  setValue: UseFormSetValue<PumpFormValues>;
  watch: UseFormWatch<PumpFormValues>;
  errors: FieldErrors<PumpFormValues>;
  boards: Board[];
  ingredients: IngredientOption[];
  /** When false, the pump type select is hidden (e.g. type was pre-selected). */
  showTypeSelector?: boolean;
  /** When true, ingredient dropdown includes a search filter. */
  enableIngredientSearch?: boolean;
}

const emptyPin: Pin = { boardId: null, nr: null };

export const PumpFormFields: React.FC<PumpFormFieldsProps> = ({
  register,
  setValue,
  watch,
  errors,
  boards,
  ingredients,
  showTypeSelector = true,
  enableIngredientSearch = false,
}) => {
  const { t } = useTranslation();
  const [ingredientSearch, setIngredientSearch] = useState('');
  const pumpType = watch('type');
  const currentIngredientId = watch('currentIngredientId');

  const filteredIngredients = enableIngredientSearch
    ? ingredients.filter((ingredient) =>
        ingredient.name.toLowerCase().includes(ingredientSearch.toLowerCase()),
      )
    : ingredients;

  const selectedIngredientName = currentIngredientId
    ? ingredients.find((i) => i.id === currentIngredientId)?.name ||
      'No ingredient assigned'
    : 'No ingredient assigned';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 lg:gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">{t('add_pump_modal.name')}</Label>
            <Input
              id="name"
              type="text"
              placeholder="Enter pump name"
              {...register('name', { required: 'Pump name is required' })}
              className={errors.name ? 'border-danger' : ''}
            />
            {errors.name && (
              <p className="text-sm text-danger">{errors.name.message}</p>
            )}
          </div>

          {showTypeSelector && (
            <div className="space-y-2">
              <Label htmlFor="type">{t('add_pump_modal.type')}</Label>
              <Select
                value={watch('type')}
                onValueChange={(value) => {
                  if (value) setValue('type', value);
                }}
              >
                <SelectTrigger id="type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dc">DC Pump</SelectItem>
                  <SelectItem value="stepper">Stepper Motor</SelectItem>
                  <SelectItem value="valve">Control Valve</SelectItem>
                  <SelectItem value="virtual">Virtual Pump (testing)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="ingredient">
              {t('add_pump_modal.current_ingredient')}
            </Label>
            <Select
              value={currentIngredientId?.toString() || 'none'}
              onValueChange={(value) => {
                if (!value) return;
                setValue(
                  'currentIngredientId',
                  value === 'none' ? null : parseInt(value, 10),
                );
              }}
            >
              <SelectTrigger id="ingredient">
                <SelectValue>{selectedIngredientName}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {enableIngredientSearch && (
                  <div className="px-2 py-1.5">
                    <Input
                      placeholder="Search ingredients..."
                      value={ingredientSearch}
                      onChange={(e) => setIngredientSearch(e.target.value)}
                      className="h-8"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                )}
                <SelectItem value="none">No ingredient assigned</SelectItem>
                {filteredIngredients.map((ingredient) => (
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

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="size-6" />
            Hardware Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {(pumpType === 'dc' || pumpType === 'valve') && (
            <PinSelector
              label={t('add_pump_modal.control_pin')}
              pin={watch('pin') || emptyPin}
              boards={boards}
              onPinChange={(pin) => setValue('pin', pin)}
            />
          )}

          {pumpType === 'stepper' && (
            <>
              <PinSelector
                label={t('add_pump_modal.enable_pin')}
                pin={watch('enablePin') || emptyPin}
                boards={boards}
                onPinChange={(pin) => setValue('enablePin', pin)}
              />
              <PinSelector
                label={t('add_pump_modal.step_pin')}
                pin={watch('stepPin') || emptyPin}
                boards={boards}
                onPinChange={(pin) => setValue('stepPin', pin)}
              />
            </>
          )}

          <div className="flex items-center justify-between">
            <Label htmlFor="powerState">
              {t('add_pump_modal.power_state_high')}
            </Label>
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

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Timer className="size-6" />
            Timing Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="timePerCl">
              {t('add_pump_modal.time_per_cl_ms')}
            </Label>
            <Input
              id="timePerCl"
              type="number"
              placeholder="1000"
              {...register('timePerClInMs', {
                min: { value: 1, message: 'Must be at least 1ms' },
                required: 'Time per CL is required',
              })}
              className={errors.timePerClInMs ? 'border-danger' : ''}
            />
            {errors.timePerClInMs && (
              <p className="text-sm text-danger">
                {errors.timePerClInMs.message}
              </p>
            )}
          </div>

          {pumpType === 'stepper' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="acceleration">
                  {t('add_pump_modal.acceleration')}
                </Label>
                <Input
                  id="acceleration"
                  type="number"
                  placeholder="1000"
                  {...register('acceleration', {
                    min: { value: 1, message: 'Must be at least 1' },
                  })}
                  className={errors.acceleration ? 'border-danger' : ''}
                />
                {errors.acceleration && (
                  <p className="text-sm text-danger">
                    {errors.acceleration.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxSteps">
                  {t('add_pump_modal.max_steps_per_second')}
                </Label>
                <Input
                  id="maxSteps"
                  type="number"
                  placeholder="2000"
                  {...register('maxStepsPerSecond', {
                    min: { value: 1, message: 'Must be at least 1' },
                  })}
                  className={errors.maxStepsPerSecond ? 'border-danger' : ''}
                />
                {errors.maxStepsPerSecond && (
                  <p className="text-sm text-danger">
                    {errors.maxStepsPerSecond.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="stepsPerCl">
                  {t('add_pump_modal.steps_per_cl')}
                </Label>
                <Input
                  id="stepsPerCl"
                  type="number"
                  placeholder="100"
                  {...register('stepsPerCl', {
                    min: { value: 1, message: 'Must be at least 1' },
                  })}
                  className={errors.stepsPerCl ? 'border-danger' : ''}
                />
                {errors.stepsPerCl && (
                  <p className="text-sm text-danger">
                    {errors.stepsPerCl.message}
                  </p>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="size-6" />
            Capacity Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="tubeCapacity">
              {t('add_pump_modal.tube_capacity_ml')}
            </Label>
            <Input
              id="tubeCapacity"
              type="number"
              placeholder="100"
              {...register('tubeCapacityInMl', {
                min: { value: 0, message: 'Must be at least 0' },
                required: 'Tube capacity is required',
              })}
              className={errors.tubeCapacityInMl ? 'border-danger' : ''}
            />
            {errors.tubeCapacityInMl && (
              <p className="text-sm text-danger">
                {errors.tubeCapacityInMl.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="fillingLevel">
              {t('add_pump_modal.filling_level_ml')}
            </Label>
            <Input
              id="fillingLevel"
              type="number"
              placeholder="0"
              {...register('fillingLevelInMl', {
                min: { value: 0, message: 'Must be at least 0' },
              })}
              className={errors.fillingLevelInMl ? 'border-danger' : ''}
            />
            {errors.fillingLevelInMl && (
              <p className="text-sm text-danger">
                {errors.fillingLevelInMl.message}
              </p>
            )}
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="pumpedUp">{t('add_pump_modal.pumped_up')}</Label>
            <Switch
              id="pumpedUp"
              checked={watch('isPumpedUp')}
              onCheckedChange={(checked) => setValue('isPumpedUp', checked)}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PumpFormFields;
