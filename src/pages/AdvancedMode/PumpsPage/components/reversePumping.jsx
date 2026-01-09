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
      setDirectorPins([]);
      return;
    }
    setLoadingPins(true);
    // Reset pin selection when board changes
    setValue('settings.directorPin.pinId', null);
    GpioService.getBoardPins(selectedDirectorBoardId, token)
      .then((pins) => {
        setDirectorPins(Array.isArray(pins) ? pins : []);
      })
      .catch(() => {
        setDirectorPins([]);
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


  const onSubmit = (formData) => {
    if (!token) return;
    setSaving(true);
    setError(null);
    setSuccess(null);
    PumpSettingsService.setReversePumpSettings(formData, token)
      .then(() => {
        setSuccess('Settings updated successfully');
        toast.success('Settings updated successfully');
        setTimeout(() => navigate({ to: '/pumps' }), 1000);
      })
      .catch((err) => {
        console.error('Failed to save reverse pump settings:', err);
        setError('Failed to save settings');
        toast.error('Failed to save settings');
      })
      .finally(() => setSaving(false));
  };

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-xl sm:text-2xl font-bold mb-4">
          {t('component.reverse_pump_settings.headline', {
            defaultValue: 'Reverse Pump Settings',
          })}
        </h1>

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
                    <Switch
                      id="enable"
                      checked={watch('enable')}
                      onCheckedChange={(checked) => setValue('enable', checked)}
                    />
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
                              ''
                            }
                            onValueChange={(value) =>
                              setValue(
                                'settings.directorPin.pinId',
                                value || null,
                              )
                            }
                            disabled={!selectedDirectorBoardId}
                          >
                            <SelectTrigger id="gpioPin">
                              <SelectValue
                                placeholder={t('common.select_pin', {
                                  defaultValue: 'Select pin',
                                })}
                              />
                            </SelectTrigger>
                            <SelectContent>
                              {directorPins.map((pin) => (
                                <SelectItem
                                  key={pin.id ?? pin.pinId ?? pin.name}
                                  value={(
                                    pin.id ??
                                    pin.pinId ??
                                    pin.name
                                  ).toString()}
                                >
                                  {(pin.pinName ??
                                    pin.name ??
                                    String(pin.id ?? pin.pinId)) +
                                    (pin.inUse ? ' (In use)' : '')}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            disabled={!selectedDirectorBoardId || saving}
                            onClick={() =>
                              setValue('settings.directorPin.pinId', null)
                            }
                            title={t('common.clear', { defaultValue: 'Clear' })}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        {!selectedDirectorBoardId && (
                          <p className="text-sm text-muted-foreground">
                            {t('common.select_board_first', {
                              defaultValue: 'Select a board first.',
                            })}
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
                            watch('settings.forwardStateHigh')?.toString() ||
                            'false'
                          }
                          onValueChange={(value) =>
                            setValue(
                              'settings.forwardStateHigh',
                              value === 'true',
                            )
                          }
                        >
                          <SelectTrigger id="forwardState">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="true">
                              {t(
                                'component.reverse_pump_settings.form.forward_state.high',
                                { defaultValue: 'High' },
                              )}
                            </SelectItem>
                            <SelectItem value="false">
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
          </div>
        )}
      </div>
    </div>
  );
};

export default ReversePumping;
