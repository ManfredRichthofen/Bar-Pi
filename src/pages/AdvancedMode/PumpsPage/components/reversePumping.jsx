import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { Save, AlertCircle, CheckCircle } from 'lucide-react';
import useAuthStore from '../../../../store/authStore';
import PumpSettingsService from '../../../../services/pumpsettings.service';
import GpioService from '../../../../services/gpio.service';

const ReversePumping = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
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

  const showToast = (message, type = 'success') => {
    const toastContainer = document.createElement('div');
    toastContainer.className = 'toast toast-top toast-end z-50';
    const alert = document.createElement('div');
    alert.className = `alert ${type === 'success' ? 'alert-success' : 'alert-error'}`;
    const content = document.createElement('div');
    content.className = 'flex items-center gap-2';
    const icon = document.createElement('span');
    icon.innerHTML =
      type === 'success'
        ? `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" /></svg>`
        : `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" /></svg>`;
    const text = document.createElement('span');
    text.textContent = message;
    content.appendChild(icon);
    content.appendChild(text);
    alert.appendChild(content);
    toastContainer.appendChild(alert);
    document.body.appendChild(toastContainer);
    setTimeout(() => {
      toastContainer.style.opacity = '1';
      toastContainer.style.transform = 'translateY(0)';
    }, 100);
    setTimeout(() => {
      toastContainer.style.opacity = '0';
      toastContainer.style.transform = 'translateY(-1rem)';
      setTimeout(() => {
        if (document.body.contains(toastContainer)) {
          document.body.removeChild(toastContainer);
        }
      }, 300);
    }, 3000);
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
    <div className="min-h-screen bg-base-100 p-4 sm:p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-xl sm:text-2xl font-bold mb-4">
          {t('component.reverse_pump_settings.headline', {
            defaultValue: 'Reverse Pump Settings',
          })}
        </h1>

        {success && (
          <div className="alert alert-success mb-4">
            <CheckCircle className="h-5 w-5" />
            <span className="font-medium">{success}</span>
          </div>
        )}
        {error && (
          <div className="alert alert-error mb-4">
            <AlertCircle className="h-5 w-5" />
            <span className="font-medium">{error}</span>
          </div>
        )}

        <div className="card bg-base-100 shadow-lg border border-base-300">
          <div className="card-body">
            <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
              {/* Enable toggle */}
              <div className="card bg-base-200">
                <div className="card-body">
                  <label className="label cursor-pointer justify-start gap-4">
                    <span className="label-text font-medium">
                      {t('component.reverse_pump_settings.form.enable_label', {
                        defaultValue: 'Enable Reverse Pumping',
                      })}
                    </span>
                    <input
                      type="checkbox"
                      className="toggle toggle-success"
                      {...register('enable')}
                    />
                  </label>
                </div>
              </div>

              {/* Director Pin and Forward State */}
              {enable && (
                <div className="card bg-base-200">
                  <div className="card-body">
                    <h2 className="card-title text-base mb-2">
                      {t(
                        'component.reverse_pump_settings.form.vd_pin_headline',
                        { defaultValue: 'Direction/Driver Pin' },
                      )}
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="form-control">
                        <label className="label">
                          <span className="label-text font-medium">
                            {t(
                              'component.reverse_pump_settings.form.vd_pin_label',
                              { defaultValue: 'GPIO Board' },
                            )}
                          </span>
                        </label>
                        <select
                          className="select select-bordered w-full"
                          {...register('settings.directorPin.boardId')}
                        >
                          <option value="">
                            {t('common.select_board', {
                              defaultValue: 'Select board',
                            })}
                          </option>
                          {boards.map((board) => (
                            <option key={board.id} value={board.id}>
                              {board.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="form-control">
                        <label className="label">
                          <span className="label-text font-medium">
                            {t(
                              'component.reverse_pump_settings.form.vd_pin_gpio',
                              { defaultValue: 'GPIO Pin' },
                            )}
                          </span>
                        </label>
                        <div className="flex items-center gap-2">
                          <select
                            className="select select-bordered w-full"
                            disabled={!selectedDirectorBoardId}
                            {...register('settings.directorPin.pinId')}
                          >
                            <option value="">
                              {t('common.select_pin', {
                                defaultValue: 'Select pin',
                              })}
                            </option>
                            {directorPins.map((pin) => (
                              <option
                                key={pin.id ?? pin.pinId ?? pin.name}
                                value={pin.id ?? pin.pinId ?? pin.name}
                              >
                                {(pin.pinName ??
                                  pin.name ??
                                  String(pin.id ?? pin.pinId)) +
                                  (pin.inUse ? ' (In use)' : '')}
                              </option>
                            ))}
                          </select>
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            disabled={!selectedDirectorBoardId || saving}
                            onClick={() =>
                              setValue('settings.directorPin.pinId', null)
                            }
                            title={t('common.clear', { defaultValue: 'Clear' })}
                          >
                            ✕
                          </button>
                        </div>
                        {!selectedDirectorBoardId && (
                          <label className="label">
                            <span className="label-text-alt">
                              {t('common.select_board_first', {
                                defaultValue: 'Select a board first.',
                              })}
                            </span>
                          </label>
                        )}
                        {loadingPins && (
                          <div className="mt-1">
                            <progress className="progress progress-info w-full" />
                            <div className="text-xs text-base-content/60 mt-1">
                              {t('common.loading_pins', {
                                defaultValue: 'Loading pins...',
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="form-control">
                        <label className="label">
                          <span className="label-text font-medium">
                            {t(
                              'component.reverse_pump_settings.form.forward_state_high_label',
                              { defaultValue: 'Forward State' },
                            )}
                          </span>
                        </label>
                        <select
                          className="select select-bordered w-full"
                          {...register('settings.forwardStateHigh')}
                        >
                          <option value="true">
                            {t(
                              'component.reverse_pump_settings.form.forward_state.high',
                              { defaultValue: 'High' },
                            )}
                          </option>
                          <option value="false">
                            {t(
                              'component.reverse_pump_settings.form.forward_state.low',
                              { defaultValue: 'Low' },
                            )}
                          </option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Overshoot and Timer */}
              {enable && (
                <div className="card bg-base-200">
                  <div className="card-body">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="form-control">
                        <label className="label">
                          <span className="label-text font-medium">
                            {t(
                              'component.reverse_pump_settings.form.overshoot_label',
                              { defaultValue: 'Overshoot' },
                            )}
                          </span>
                        </label>
                        <div className="join w-full">
                          <input
                            type="number"
                            className="input input-bordered join-item w-full"
                            placeholder="0"
                            {...register('settings.overshoot', {
                              min: 0,
                              max: 200,
                            })}
                          />
                          <span className="btn btn-ghost join-item no-animation">
                            %
                          </span>
                        </div>
                        {errors.settings?.overshoot && (
                          <label className="label">
                            <span className="label-text-alt text-error">
                              {t('common.validation_invalid', {
                                defaultValue: 'Invalid value',
                              })}
                            </span>
                          </label>
                        )}
                      </div>
                      <div className="form-control">
                        <label className="label">
                          <span className="label-text font-medium">
                            {t(
                              'component.reverse_pump_settings.form.auto_pump_back_timer_label',
                              { defaultValue: 'Auto Pump Back Timer' },
                            )}
                          </span>
                        </label>
                        <select
                          className="select select-bordered w-full"
                          {...register('settings.autoPumpBackTimer')}
                        >
                          {timerOptions.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={saving}
                >
                  {saving ? (
                    <div className="loading loading-spinner loading-sm"></div>
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  <span className="ml-2">
                    {t('component.reverse_pump_settings.form.save_btn_label', {
                      defaultValue: 'Save',
                    })}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>

        {loading && (
          <div className="fixed inset-0 bg-base-100/50 backdrop-blur-sm flex justify-center items-center z-50">
            <div className="loading loading-spinner loading-lg text-primary"></div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReversePumping;
