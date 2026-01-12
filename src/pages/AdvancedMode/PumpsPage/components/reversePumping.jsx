import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { Save, AlertCircle, CheckCircle, Loader2, X } from 'lucide-react';
import useAuthStore from '../../../../store/authStore';
import PumpSettingsService from '../../../../services/pumpsettings.service';
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
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';

const ReversePumping = () => {
  const { t } = useTranslation();
  const navigate = useNavigate({ from: '/reversepumpsettings' });
  const token = useAuthStore((state) => state.token);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      enable: false,
      settings: {
        overshoot: 0,
        directorPin: null,
        autoPumpBackTimer: 0,
        forwardStateHigh: false,
      },
    },
  });

  const enable = watch('enable');
  const selectedDirectorBoardId = watch('settings.directorPin.boardId');
  const selectedDirectorPinId = watch('settings.directorPin.pinId');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [boards, setBoards] = useState([]);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loadingPins, setLoadingPins] = useState(false);
  const [directorPins, setDirectorPins] = useState([]);

  const timerOptions = useMemo(
    () => [
      {
        label: t('component.reverse_pump_settings.form.timer_options.never', {
          defaultValue: 'Never',
        }),
        value: 0,
      },
      {
        label: t(
          'component.reverse_pump_settings.form.timer_options.in_minutes',
          { nr: 10, defaultValue: '10 min' },
        ),
        value: 10,
      },
      {
        label: t(
          'component.reverse_pump_settings.form.timer_options.in_minutes',
          { nr: 20, defaultValue: '20 min' },
        ),
        value: 20,
      },
      {
        label: t(
          'component.reverse_pump_settings.form.timer_options.in_minutes',
          { nr: 30, defaultValue: '30 min' },
        ),
        value: 30,
      },
      {
        label: t(
          'component.reverse_pump_settings.form.timer_options.in_minutes',
          { nr: 60, defaultValue: '60 min' },
        ),
        value: 60,
      },
    ],
    [t],
  );

  // Fetch pins when a board is selected
  useEffect(() => {
    if (!selectedDirectorBoardId || !token) {
      console.log('No board selected or no token, clearing pins');
      setDirectorPins([]);
      return;
    }
    console.log('Fetching pins for board:', selectedDirectorBoardId);
    setLoadingPins(true);
    // Reset pin selection when board changes
    setValue('settings.directorPin.pinId', null);
    GpioService.getBoardPins(selectedDirectorBoardId, token)
      .then((pins) => {
        console.log('Pins loaded:', pins);
        setDirectorPins(Array.isArray(pins) ? pins : []);
      })
      .catch((error) => {
        console.error('Failed to load pins:', error);
        setDirectorPins([]);
        toast.error('Failed to load pins for selected board');
      })
      .finally(() => setLoadingPins(false));
  }, [selectedDirectorBoardId, token, setValue]);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    Promise.all([
      PumpSettingsService.getReversePumpSettings(token),
      GpioService.getBoards(token),
    ])
      .then(([settings, boardsData]) => {
        setBoards(boardsData || []);
        if (settings) {
          setValue('enable', !!settings.enable);
          setValue('settings.overshoot', settings.settings?.overshoot ?? 0);
          setValue(
            'settings.directorPin',
            settings.settings?.directorPin ?? null,
          );
          setValue(
            'settings.autoPumpBackTimer',
            settings.settings?.autoPumpBackTimer ?? 0,
          );
          setValue(
            'settings.forwardStateHigh',
            !!settings.settings?.forwardStateHigh,
          );
        }
      })
      .catch((err) => {
        console.error('Failed to load reverse pump settings:', err);
        setError('Failed to load settings');
      })
      .finally(() => setLoading(false));
  }, [token, setValue]);

  const showToast = (message, type = 'success') => {
    if (type === 'success') {
      toast.success(message);
    } else {
      toast.error(message);
    }
  };

  const onSubmit = (formData) => {
    if (!token) return;
    setSaving(true);
    setError(null);
    setSuccess(null);
    PumpSettingsService.setReversePumpSettings(formData, token)
      .then(() => {
        setSuccess('Settings updated successfully');
        showToast('Settings updated successfully', 'success');
        setTimeout(() => navigate({ to: '/pumps' }), 1000);
      })
      .catch((err) => {
        console.error('Failed to save reverse pump settings:', err);
        setError('Failed to save settings');
        showToast('Failed to save settings', 'error');
      })
      .finally(() => setSaving(false));
  };

  return (
<<<<<<< Updated upstream
    <div className="min-h-screen bg-background p-4 sm:p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-xl sm:text-2xl font-bold mb-4">
          {t('component.reverse_pump_settings.headline', {
            defaultValue: 'Reverse Pump Settings',
          })}
        </h1>
=======
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-md border-b shadow-sm pt-2">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex items-center gap-3">
            <Button
              onClick={() => navigate({ to: '/pumps' })}
              variant="ghost"
              size="icon-sm"
              title={t('reverse_pumping.back_to_pumps')}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                {t('component.reverse_pump_settings.headline', {
                  defaultValue: 'Reverse Pump Settings',
                })}
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                {t('reverse_pumping.description')}
              </p>
            </div>
          </div>
        </div>
      </div>
>>>>>>> Stashed changes

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

        <Card>
          <CardContent className="pt-6">
            <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
              {/* Enable toggle */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="enable" className="cursor-pointer">
                      {t('component.reverse_pump_settings.form.enable_label', {
                        defaultValue: 'Enable Reverse Pumping',
                      })}
                    </Label>
<<<<<<< Updated upstream
                    <Switch
                      id="enable"
                      checked={watch('enable')}
                      onCheckedChange={(checked) => setValue('enable', checked)}
                    />
=======
                    <p className="text-sm text-muted-foreground mt-1">
                      {t('reverse_pumping.allow_reverse')}
                    </p>
>>>>>>> Stashed changes
                  </div>
                </CardContent>
              </Card>

              {/* Director Pin and Forward State */}
              {enable && (
                <Card>
                  <CardHeader>
                    <CardTitle>
                      {t(
                        'component.reverse_pump_settings.form.vd_pin_headline',
                        { defaultValue: 'Direction/Driver Pin' },
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="gpioBoard">
                          {t(
                            'component.reverse_pump_settings.form.vd_pin_label',
                            { defaultValue: 'GPIO Board' },
                          )}
                        </Label>
                        <Select
                          value={
                            watch('settings.directorPin.boardId')?.toString() ||
                            ''
                          }
                          onValueChange={(value) =>
                            setValue(
                              'settings.directorPin.boardId',
                              value ? parseInt(value) : null,
                            )
                          }
                        >
                          <SelectTrigger id="gpioBoard">
                            <SelectValue
                              placeholder={t('common.select_board', {
                                defaultValue: 'Select board',
                              })}
                            />
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
                        <Label htmlFor="gpioPin">
                          {t(
                            'component.reverse_pump_settings.form.vd_pin_gpio',
                            { defaultValue: 'GPIO Pin' },
                          )}
                        </Label>
                        <div className="flex items-center gap-2">
                          <Select
                            value={
                              watch('settings.directorPin.pinId')?.toString() ||
                              watch('settings.directorPin.nr')?.toString() ||
                              ''
                            }
                            onValueChange={(value) => {
                              const numValue = value ? parseInt(value) : null;
                              setValue('settings.directorPin.pinId', numValue);
                              setValue('settings.directorPin.nr', numValue);
                            }}
                            disabled={!selectedDirectorBoardId || loadingPins}
                          >
                            <SelectTrigger id="gpioPin" className="flex-1">
                              <SelectValue
                                placeholder={
                                  loadingPins
                                    ? 'Loading pins...'
                                    : !selectedDirectorBoardId
                                    ? 'Select a board first'
                                    : directorPins.length === 0
                                    ? 'No pins available'
                                    : t('common.select_pin', {
                                        defaultValue: 'Select pin',
                                      })
                                }
                              />
                            </SelectTrigger>
                            <SelectContent>
                              {loadingPins ? (
                                <div className="flex items-center justify-center py-6">
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                </div>
                              ) : directorPins.length === 0 ? (
                                <div className="py-6 text-center text-sm text-muted-foreground">
                                  {t('reverse_pumping.no_pins_available')}
                                </div>
                              ) : (
                                directorPins.map((pin) => {
                                  const pinValue = pin.nr ?? pin.id ?? pin.pinId ?? '';
                                  const pinLabel = pin.pinName ?? pin.name ?? `Pin ${pin.nr ?? pin.id ?? pin.pinId ?? 'Unknown'}`;
                                  return (
                                    <SelectItem
                                      key={pinValue.toString()}
                                      value={pinValue.toString()}
                                    >
                                      {pinLabel + (pin.inUse ? ' (In use)' : '')}
                                    </SelectItem>
                                  );
                                })
                              )}
                            </SelectContent>
                          </Select>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            disabled={!selectedDirectorBoardId || saving || loadingPins}
                            onClick={() =>
                              setValue('settings.directorPin.pinId', null)
                            }
                            title={t('common.clear', { defaultValue: 'Clear' })}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        {selectedDirectorBoardId && !loadingPins && directorPins.length === 0 && (
                          <p className="text-sm text-muted-foreground">
                            {t('reverse_pumping.no_available_pins')}
                          </p>
                        )}
                        {loadingPins && (
                          <div className="mt-2 space-y-2">
                            <Progress value={50} className="w-full" />
                            <p className="text-xs text-muted-foreground">
                              {t('common.loading_pins', {
                                defaultValue: 'Loading pins...',
                              })}
                            </p>
                          </div>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="forwardState">
                          {t(
                            'component.reverse_pump_settings.form.forward_state_high_label',
                            { defaultValue: 'Forward State' },
                          )}
                        </Label>
                        <Select
                          value={
                            watch('settings.forwardStateHigh') ? 'High' : 'Low'
                          }
                          onValueChange={(value) =>
                            setValue(
                              'settings.forwardStateHigh',
                              value === 'High',
                            )
                          }
                        >
                          <SelectTrigger id="forwardState">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="High">
                              {t(
                                'component.reverse_pump_settings.form.forward_state.high',
                                { defaultValue: 'High' },
                              )}
                            </SelectItem>
                            <SelectItem value="Low">
                              {t(
                                'component.reverse_pump_settings.form.forward_state.low',
                                { defaultValue: 'Low' },
                              )}
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Overshoot and Timer */}
              {enable && (
                <Card>
                  <CardContent className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="overshoot">
                          {t(
                            'component.reverse_pump_settings.form.overshoot_label',
                            { defaultValue: 'Overshoot' },
                          )}
                        </Label>
                        <div className="flex items-center gap-2">
                          <Input
                            id="overshoot"
                            type="number"
                            placeholder="0"
                            {...register('settings.overshoot', {
                              min: 0,
                              max: 200,
                            })}
                            className={`flex-1 ${errors.settings?.overshoot ? 'border-destructive' : ''}`}
                          />
                          <span className="text-sm text-muted-foreground">
                            %
                          </span>
                        </div>
                        {errors.settings?.overshoot && (
                          <p className="text-sm text-destructive">
                            {t('common.validation_invalid', {
                              defaultValue: 'Invalid value',
                            })}
                          </p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="autoPumpBack">
                          {t(
                            'component.reverse_pump_settings.form.auto_pump_back_timer_label',
                            { defaultValue: 'Auto Pump Back Timer' },
                          )}
                        </Label>
                        <Select
                          value={
                            watch('settings.autoPumpBackTimer')?.toString() ||
                            '0'
                          }
                          onValueChange={(value) =>
                            setValue(
                              'settings.autoPumpBackTimer',
                              parseInt(value),
                            )
                          }
                        >
                          <SelectTrigger id="autoPumpBack">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {timerOptions.map((opt) => (
                              <SelectItem
                                key={opt.value}
                                value={opt.value.toString()}
                              >
                                {opt.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

<<<<<<< Updated upstream
              {/* Actions */}
              <div className="flex justify-end">
                <Button type="submit" disabled={saving}>
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  {t('component.reverse_pump_settings.form.save_btn_label', {
                    defaultValue: 'Save',
                  })}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {loading && (
          <div className="fixed inset-0 bg-background/50 backdrop-blur-sm flex justify-center items-center z-50">
            <Loader2 className="h-8 w-8 animate-spin" />
=======
            {/* Actions */}
            <div className="flex justify-end gap-3 pt-8 border-t mt-8">
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={() => navigate({ to: '/pumps' })}
              >
                {t('reverse_pumping.cancel')}
              </Button>
              <Button type="submit" disabled={saving} size="lg" className="gap-2">
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {t('component.reverse_pump_settings.form.save_btn_label', {
                  defaultValue: 'Save Changes',
                })}
              </Button>
            </div>
          </form>
        </div>
      </div>

      {loading && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex justify-center items-center z-50">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-10 w-10 animate-spin" />
            <p className="text-sm text-muted-foreground">{t('reverse_pumping.loading_settings')}</p>
>>>>>>> Stashed changes
          </div>
        )}
      </div>
    </div>
  );
};

export default ReversePumping;
