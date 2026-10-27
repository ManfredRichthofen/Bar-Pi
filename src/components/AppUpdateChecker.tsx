import {
  AlertCircle,
  CheckCircle2,
  Download,
  ExternalLink,
  MonitorSmartphone,
  RefreshCw,
} from 'lucide-react';
import type React from 'react';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from '@/components/ui/toast';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  ChannelSelect,
  formatRelativeTime,
  ReleaseNotes,
  SettingRow,
  UpdateSettingsSection,
} from '@/components/updates/UpdateSettings';
import { useCurrentUser } from '../hooks/useCurrentUser';
import appUpdateService, {
  type AppRelease,
  type AppUpdateTarget,
  compareVersions,
} from '../services/appUpdate.service';
import useAppUpdateStore from '../store/appUpdateStore';

const ADMIN_LEVEL = 3;

type AppUpdateState = 'idle' | 'checking' | 'downloading';

const getErrorMessage = (error: unknown, fallback: string) =>
  (error instanceof Error ? error.message : String(error ?? '')) || fallback;

/** Updates the Tauri client itself (Android APK / Windows installer). */
const AppUpdateChecker: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { user } = useCurrentUser();
  const isAdmin = (user?.adminLevel ?? 0) >= ADMIN_LEVEL;
  const { channel, autoCheck, setChannel, setAutoCheck } = useAppUpdateStore();

  const [target, setTarget] = useState<AppUpdateTarget | null>(null);
  const [currentVersion, setCurrentVersion] = useState('');
  const [latest, setLatest] = useState<AppRelease | null>(null);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [state, setState] = useState<AppUpdateState>('idle');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAdmin || !appUpdateService.isAvailable()) return;
    Promise.all([
      appUpdateService.getTarget(),
      appUpdateService.getCurrentVersion(),
    ])
      .then(([nextTarget, version]) => {
        setTarget(nextTarget);
        setCurrentVersion(version);
      })
      .catch(() => setTarget(null));
  }, [isAdmin]);

  const checkForUpdates = useCallback(
    async (silent = false) => {
      if (!target) return;
      setState('checking');
      setError(null);
      try {
        setLatest(
          await appUpdateService.fetchLatestRelease(channel, target.asset),
        );
        setLastChecked(new Date());
      } catch (err) {
        const message = getErrorMessage(
          err,
          t('settings.updates.check_failed', 'Could not check for updates'),
        );
        setError(message);
        if (!silent) toast.error(message);
      } finally {
        setState('idle');
      }
    },
    [target, channel, t],
  );

  useEffect(() => {
    if (autoCheck) checkForUpdates(true);
  }, [autoCheck, checkForUpdates]);

  if (!target) return null;

  const isBusy = state !== 'idle';
  const hasUpdate =
    !!latest && compareVersions(latest.version, currentVersion) > 0;
  const canInstall = hasUpdate && !target.devBuild;

  const changeChannel = (next: typeof channel) => {
    setLatest(null);
    setChannel(next);
  };

  const installUpdate = async () => {
    if (!latest) return;
    setState('downloading');
    setProgress(0);
    setError(null);
    try {
      await appUpdateService.install(latest, ({ downloaded, total }) => {
        if (total) setProgress(Math.round((downloaded / total) * 100));
      });
      toast.info(
        t(
          'settings.app_updates.install_prompt',
          'Follow the system prompt to finish installing the update.',
        ),
      );
    } catch (err) {
      const message = getErrorMessage(
        err,
        t('settings.updates.install_failed', 'Update failed'),
      );
      setError(message);
      toast.error(message);
    } finally {
      setState('idle');
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <MonitorSmartphone className="size-6" />
            {t('settings.app_updates.title', 'App Updates')}
          </CardTitle>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
            {hasUpdate && (
              <Badge variant="default" className="w-fit">
                {t(
                  'settings.updates.new_version_available',
                  'Update Available',
                )}
              </Badge>
            )}
            <span className="text-sm text-foreground-muted sm:ml-2">
              {lastChecked
                ? formatRelativeTime(lastChecked, i18n.resolvedLanguage)
                : t('settings.updates.never_checked', 'Never checked')}
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
              {currentVersion || 'Unknown'}
            </p>
            {hasUpdate ? (
              <p className="text-sm font-medium text-primary">
                {t('settings.updates.latest_version', 'New Version')}:{' '}
                {latest.version}
                {latest.prerelease && (
                  <Badge variant="outline" className="ml-2">
                    {t('settings.updates.prerelease', 'Pre-release')}
                  </Badge>
                )}
              </p>
            ) : (
              lastChecked &&
              !error && (
                <p className="text-sm text-foreground-muted flex items-center gap-1">
                  <CheckCircle2 className="size-4" />
                  {t('settings.updates.up_to_date', 'You are up to date')}
                </p>
              )
            )}
          </div>
          <Button
            onClick={() => checkForUpdates()}
            disabled={isBusy}
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

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="size-6" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {target.devBuild && (
          <Alert variant="warning">
            <AlertCircle className="size-6" />
            <AlertDescription>
              {t(
                'settings.app_updates.dev_build',
                'This is a development build of the app. Install a release build to receive updates.',
              )}
            </AlertDescription>
          </Alert>
        )}

        {state === 'downloading' && (
          <div className="space-y-2">
            <p className="text-sm font-medium flex items-center gap-2">
              <RefreshCw className="size-4 animate-spin" />
              {t('settings.updates.downloading', 'Downloading update...')}
            </p>
            <Progress value={progress} />
          </div>
        )}

        {hasUpdate && (
          <>
            <Separator />
            <div className="space-y-4">
              <ReleaseNotes notes={latest.notes} />
              <div className="flex flex-col sm:flex-row justify-end gap-2">
                <Button
                  variant="outline"
                  className="w-full sm:w-auto"
                  onClick={() =>
                    window.open(latest.releaseUrl, '_blank', 'noopener')
                  }
                >
                  <ExternalLink className="size-6 mr-2" />
                  {t('settings.updates.view_release', 'View on GitHub')}
                </Button>
                {canInstall && (
                  <Button
                    onClick={installUpdate}
                    disabled={isBusy}
                    className="w-full sm:w-auto min-w-[140px]"
                  >
                    <Download className="size-6 mr-2" />
                    {t('settings.updates.update_now', 'Update Now')}
                  </Button>
                )}
              </div>
            </div>
          </>
        )}

        <Separator />
        <UpdateSettingsSection>
          <ChannelSelect
            value={channel}
            disabled={isBusy}
            onChange={changeChannel}
          />
          <SettingRow
            title={t('settings.updates.auto_check', 'Automatic checks')}
            description={t(
              'settings.app_updates.auto_check_desc',
              'Look for a new app version whenever settings are opened.',
            )}
            checked={autoCheck}
            onChange={setAutoCheck}
          />
        </UpdateSettingsSection>
      </CardContent>
    </Card>
  );
};

export default AppUpdateChecker;
