import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Download, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';
import updateService from '../services/update.service';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

const UpdateChecker: React.FC = () => {
  const { t } = useTranslation();
  const [updateInfo, setUpdateInfo] = useState<any>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const checkForUpdates = async () => {
    setIsChecking(true);
    try {
      const info = await updateService.checkForUpdates();
      setUpdateInfo(info);
    } catch (error) {
      console.error('Error checking for updates:', error);
    } finally {
      setIsChecking(false);
    }
  };

  const handleUpdate = async () => {
    if (!updateInfo?.hasUpdate) return;

    setIsUpdating(true);
    try {
      const success = await updateService.performUpdate();
      if (success) {
        setUpdateInfo((prev: any) => ({ ...prev, updateDownloaded: true }));
      }
    } catch (error) {
      console.error('Error during update:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            {t('settings.updates.title', 'Updates')}
          </CardTitle>
          {updateInfo?.hasUpdate && (
            <Badge variant="default">
              {t('settings.updates.new_version_available', 'Update Available')}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium">
              {t('settings.updates.current_version', 'Current Version')}
            </p>
            <p className="text-sm text-muted-foreground">
              {updateInfo?.currentVersion || 'Unknown'}
            </p>
            {updateInfo?.hasUpdate && (
              <p className="text-sm font-medium text-primary">
                {t('settings.updates.new_version_available', 'New Version')}: {updateInfo.latestVersion}
              </p>
            )}
          </div>
          <Button
            onClick={checkForUpdates}
            disabled={isChecking}
            variant="outline"
          >
            {isChecking ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Checking...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4" />
                {t('settings.updates.check', 'Check for Updates')}
              </>
            )}
          </Button>
        </div>

        {updateInfo?.hasUpdate && (
          <>
            <Separator />
            <div className="space-y-3">
              <div>
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  {t('settings.updates.release_notes', 'Release Notes')}
                </h3>
                <div className="bg-muted rounded-lg p-4 space-y-3">
                  {updateInfo.releaseNotes
                    .split('\n\n')
                    .map((section: string, index: number) => {
                      const lines = section.split('\n');
                      const title = lines[0];
                      const content = lines.slice(1).join('\n');

                      return (
                        <div key={index} className="space-y-1">
                          <h4 className="font-semibold text-sm text-primary">
                            {title}
                          </h4>
                          <div className="whitespace-pre-wrap text-sm text-muted-foreground">
                            {content}
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
              <div className="flex justify-end">
                <Button
                  onClick={handleUpdate}
                  disabled={isUpdating || updateInfo.updateDownloaded}
                  variant={updateInfo.updateDownloaded ? "outline" : "default"}
                >
                  {isUpdating ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : updateInfo.updateDownloaded ? (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      {t('settings.updates.downloaded', 'Update Downloaded')}
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4" />
                      {t('settings.updates.update_now', 'Update Now')}
                    </>
                  )}
                </Button>
              </div>
              {updateInfo.updateDownloaded && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    {t(
                      'settings.updates.manual_install_required',
                      'Please check your downloads folder for the update package. Extract and replace your current installation files with the new ones.',
                    )}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default UpdateChecker;
