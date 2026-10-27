import {
  AlertCircle,
  CheckCircle2,
  Download,
  ExternalLink,
  RefreshCw,
} from 'lucide-react';
import type React from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import {
  ChannelSelect,
  formatRelativeTime,
  ReleaseNotes,
  SettingRow,
  UpdateSettingsSection,
} from '@/components/updates/UpdateSettings';
import { useCurrentUser } from '../hooks/useCurrentUser';
import updateService, {
  UPDATE_STATUS_TOPIC,
  type UpdaterSettings,
  type UpdateStatus,
} from '../services/update.service';
import WebsocketService from '../services/websocket.service';

const ADMIN_LEVEL = 3;
const BUSY_STATES = ['checking', 'downloading', 'installing', 'restarting'];
const HOURS = Array.from({ length: 24 }, (_, h) => h);

type ApiError = {
  message?: string;
  response?: { data?: { error?: string; status?: UpdateStatus } };
};

const getErrorMessage = (error: unknown, fallback: string) => {
  const err = error as ApiError;
  return err?.response?.data?.error || err?.message || fallback;
};

const getErrorStatus = (error: unknown) =>
  (error as ApiError)?.response?.data?.status;

const UpdateChecker: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { user } = useCurrentUser();
  const isAdmin = (user?.adminLevel ?? 0) >= ADMIN_LEVEL;

  const [status, setStatus] = useState<UpdateStatus | null>(null);
  const [settings, setSettings] = useState<UpdaterSettings | null>(null);
  const [unavailable, setUnavailable] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);
  const versionBeforeRestart = useRef<string | null>(null);

  const loadStatus = useCallback(async () => {
    const next = await updateService.getStatus();
    setStatus(next);
    return next;
  }, []);

  useEffect(() => {
    if (!isAdmin) return;
    Promise.all([updateService.getStatus(), updateService.getSettings()])
      .then(([s, cfg]) => {
        setStatus(s);
        setSettings(cfg);
      })
      .catch(() => setUnavailable(true));
  }, [isAdmin]);

  useEffect(() => {
    if (!isAdmin) return;
    WebsocketService.subscribe(
      'updateChecker',
      UPDATE_STATUS_TOPIC,
      (message: { body: string }) => {
        try {
          setStatus(JSON.parse(message.body));
        } catch {
          // ignore malformed frames
        }
      },
    );
    return () =>
      WebsocketService.unsubscribe('updateChecker', UPDATE_STATUS_TOPIC);
  }, [isAdmin]);

  const state = status?.state ?? 'idle';
  const isBusy = BUSY_STATES.includes(state);

  // Websocket drops while the server restarts, so poll until the new version answers
  useEffect(() => {
    if (!isBusy) return;
    if (state === 'restarting' && !versionBeforeRestart.current) {
      versionBeforeRestart.current = status?.currentVersion ?? null;
    }
    const id = setInterval(() => {
      loadStatus().catch(() => {
        // server is restarting
      });
    }, 2000);
    return () => clearInterval(id);
  }, [isBusy, state, status?.currentVersion, loadStatus]);

  useEffect(() => {
    const previous = versionBeforeRestart.current;
    if (!previous || !status || BUSY_STATES.includes(status.state)) return;
    if (status.currentVersion === previous) {
      versionBeforeRestart.current = null;
      if (status.state === 'idle') {
        toast.error(
          t(
            'settings.updates.restart_same_version',
            'Bar-Pi restarted but is still running {{version}}. Check the server logs.',
            { version: previous },
          ),
        );
      }
      return;
    }
    versionBeforeRestart.current = null;
    toast.success(
      t('settings.updates.restart_complete', {
        version: status.currentVersion,
        defaultValue: 'Updated to {{version}}. Reloading...',
      }),
    );
    setTimeout(() => window.location.reload(), 1500);
  }, [status, t]);

  if (!isAdmin || unavailable || !status || status.disabled) {
    return null;
  }

  const checkForUpdates = async () => {
    setIsRequesting(true);
    try {
      const next = await updateService.checkForUpdates();
      setStatus(next);
    } catch (error) {
      const errorStatus = getErrorStatus(error);
      if (errorStatus) setStatus(errorStatus);
      toast.error(
        getErrorMessage(
          error,
          t('settings.updates.check_failed', 'Could not check for updates'),
        ),
      );
    } finally {
      setIsRequesting(false);
    }
  };

  const installUpdate = async () => {
    setIsRequesting(true);
    versionBeforeRestart.current = status.currentVersion;
    try {
      const next = await updateService.install();
      setStatus(next);
      toast.info(
        t(
          'settings.updates.install_started',
          'Installing update. Bar-Pi will restart automatically.',
        ),
      );
    } catch (error) {
      versionBeforeRestart.current = null;
      const errorStatus = getErrorStatus(error);
      if (errorStatus) setStatus(errorStatus);
      toast.error(
        getErrorMessage(
          error,
          t('settings.updates.install_failed', 'Update failed'),
        ),
      );
    } finally {
      setIsRequesting(false);
    }
  };

  const updateSetting = async (patch: Partial<UpdaterSettings>) => {
    if (!settings) return;
    const previous = settings;
    const next = { ...settings, ...patch };
    setSettings(next);
    try {
      setSettings(await updateService.saveSettings(next));
    } catch (error) {
      setSettings(previous);
      toast.error(
        getErrorMessage(
          error,
          t(
            'settings.updates.settings_failed',
            'Failed to save update settings',
          ),
        ),
      );
    }
  };

  const formatLastChecked = () =>
    status.lastChecked
      ? formatRelativeTime(new Date(status.lastChecked), i18n.resolvedLanguage)
      : t('settings.updates.never_checked', 'Never checked');

  const unsupportedMessage = () => {
    switch (status.unsupportedReason) {
      case 'dev_build':
        return t(
          'settings.updates.unsupported_dev_build',
          'This is a development build. Automatic installation is only available for release builds.',
        );
      case 'unsupported_os':
        return t(
          'settings.updates.unsupported_os',
          'Automatic installation is only supported on Linux.',
        );
      default:
        return t(
          'settings.updates.unsupported_no_restart',
          'Automatic installation is not available for this server.',
        );
    }
  };

  const stateLabel = () => {
    switch (state) {
      case 'checking':
        return t('settings.updates.checking', 'Checking...');
      case 'downloading':
        return t('settings.updates.downloading', 'Downloading update...');
      case 'installing':
        return t('settings.updates.installing', 'Installing update...');
      case 'restarting':
        return t('settings.updates.restarting', 'Restarting Bar-Pi...');
      default:
        return '';
    }
  };

  const formatHour = (h: number) => `${String(h).padStart(2, '0')}:00`;

  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <Download className="size-6" />
            {t('settings.updates.title', 'Updates')}
          </CardTitle>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
            {status.hasUpdate && (
              <Badge variant="default" className="w-fit">
                {t(
                  'settings.updates.new_version_available',
                  'Update Available',
                )}
              </Badge>
            )}
            <span className="text-sm text-foreground-muted sm:ml-2">
              {formatLastChecked()}
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1 flex-1">
            <p className="text-sm font-medium">
              {t('settings.updates.current_version', 'Current Version')}
            </p>
            <p className="text-sm text-foreground-muted">
              {status.currentVersion || 'Unknown'}
            </p>
            {status.hasUpdate ? (
              <p className="text-sm font-medium text-primary">
                {t('settings.updates.latest_version', 'New Version')}:{' '}
                {status.latestVersion}
                {status.prerelease && (
                  <Badge variant="outline" className="ml-2">
                    {t('settings.updates.prerelease', 'Pre-release')}
                  </Badge>
                )}
              </p>
            ) : (
              status.latestVersion && (
                <p className="text-sm text-foreground-muted flex items-center gap-1">
                  <CheckCircle2 className="size-4" />
                  {t('settings.updates.up_to_date', 'You are up to date')}
                </p>
              )
            )}
          </div>
          <Button
            onClick={checkForUpdates}
            disabled={isBusy || isRequesting}
            variant="outline"
            size="sm"
            className="w-full sm:w-auto min-w-[140px]"
          >
            <RefreshCw
              className={`size-6 mr-2 ${state === 'checking' ? 'animate-spin' : ''}`}
            />
            {state === 'checking'
              ? t('settings.updates.checking', 'Checking...')
              : t('settings.updates.check', 'Check for Updates')}
          </Button>
        </div>

        {state === 'error' && status.error && (
          <Alert variant="destructive">
            <AlertCircle className="size-6" />
            <AlertDescription>{status.error}</AlertDescription>
          </Alert>
        )}

        {!status.supported && (
          <Alert variant="warning">
            <AlertCircle className="size-6" />
            <AlertDescription>{unsupportedMessage()}</AlertDescription>
          </Alert>
        )}

        {(state === 'downloading' ||
          state === 'installing' ||
          state === 'restarting') && (
          <div className="space-y-2">
            <p className="text-sm font-medium flex items-center gap-2">
              <RefreshCw className="size-4 animate-spin" />
              {stateLabel()}
            </p>
            <Progress value={state === 'downloading' ? status.progress : 100} />
          </div>
        )}

        {status.hasUpdate && (
          <>
            <Separator />
            <div className="space-y-4">
              <ReleaseNotes notes={status.releaseNotes} />
              <div className="flex flex-col sm:flex-row justify-end gap-2">
                {status.releaseUrl && (
                  <Button
                    variant="outline"
                    className="w-full sm:w-auto"
                    onClick={() =>
                      window.open(status.releaseUrl, '_blank', 'noopener')
                    }
                  >
                    <ExternalLink className="size-6 mr-2" />
                    {t('settings.updates.view_release', 'View on GitHub')}
                  </Button>
                )}
                {status.supported && (
                  <Button
                    onClick={installUpdate}
                    disabled={isBusy || isRequesting}
                    className="w-full sm:w-auto min-w-[140px]"
                  >
                    <Download className="size-6 mr-2" />
                    {t('settings.updates.update_now', 'Update Now')}
                  </Button>
                )}
              </div>
              {status.supported && (
                <p className="text-xs text-foreground-muted text-right">
                  {t(
                    'settings.updates.order_active_note',
                    'Updates are not installed while a cocktail is being prepared.',
                  )}
                </p>
              )}
            </div>
          </>
        )}

        {settings && (
          <>
            <Separator />
            <UpdateSettingsSection>
              <ChannelSelect
                value={settings.includePrerelease ? 'prerelease' : 'release'}
                onChange={(channel) =>
                  updateSetting({
                    includePrerelease: channel === 'prerelease',
                  })
                }
              />

              <SettingRow
                title={t('settings.updates.auto_check', 'Automatic checks')}
                description={t(
                  'settings.updates.auto_check_desc',
                  'Periodically look for new releases on GitHub.',
                )}
                checked={settings.autoCheck}
                onChange={(v) => updateSetting({ autoCheck: v })}
              />

              <SettingRow
                title={t(
                  'settings.updates.auto_install',
                  'Install automatically',
                )}
                description={t(
                  'settings.updates.auto_install_desc',
                  'Download and install new releases without asking.',
                )}
                checked={settings.autoInstall}
                disabled={!settings.autoCheck || !status.supported}
                onChange={(v) => updateSetting({ autoInstall: v })}
              />

              <SettingRow
                title={t('settings.updates.window', 'Install window')}
                description={t(
                  'settings.updates.window_desc',
                  'Only install automatic updates during these hours.',
                )}
                checked={settings.windowEnabled}
                disabled={!settings.autoInstall}
                onChange={(v) => updateSetting({ windowEnabled: v })}
              />

              {settings.windowEnabled && settings.autoInstall && (
                <div className="grid grid-cols-2 gap-4 pl-1">
                  <HourSelect
                    label={t('settings.updates.window_start', 'From')}
                    value={settings.windowStartHour}
                    format={formatHour}
                    onChange={(h) => updateSetting({ windowStartHour: h })}
                  />
                  <HourSelect
                    label={t('settings.updates.window_end', 'Until')}
                    value={settings.windowEndHour}
                    format={formatHour}
                    onChange={(h) => updateSetting({ windowEndHour: h })}
                  />
                </div>
              )}
            </UpdateSettingsSection>
          </>
        )}
      </CardContent>
    </Card>
  );
};

const HourSelect: React.FC<{
  label: string;
  value: number;
  format: (h: number) => string;
  onChange: (hour: number) => void;
}> = ({ label, value, format, onChange }) => (
  <div className="space-y-2">
    <p className="text-sm font-medium">{label}</p>
    <Select
      value={String(value)}
      onValueChange={(v) => v !== null && onChange(Number(v))}
    >
      <SelectTrigger className="w-full">
        <SelectValue>{format(value)}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        {HOURS.map((h) => (
          <SelectItem key={h} value={String(h)}>
            {format(h)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  </div>
);

export default UpdateChecker;
