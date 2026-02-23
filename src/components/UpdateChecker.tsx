import { AlertCircle, CheckCircle2, Download, RefreshCw } from 'lucide-react';
import type React from 'react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import updateService from '../services/update.service';

const UpdateChecker: React.FC = () => {
  const { t } = useTranslation();
  const [updateInfo, setUpdateInfo] = useState<any>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  // Auto-check for updates on component mount
  useEffect(() => {
    checkForUpdates();
  }, []);

  const checkForUpdates = async () => {
    setIsChecking(true);
    try {
      const info = await updateService.checkForUpdates();
      setUpdateInfo(info);
      setLastChecked(new Date());
    } catch (error) {
      console.error('Error checking for updates:', error);
    } finally {
      setIsChecking(false);
    }
  };

  // Enhanced release notes parsing with categorization
  const parseReleaseNotes = (notes: string) => {
    if (!notes) return [];

    const sections = notes.split(/(?=^#{1,6}\s)/m);
    const parsedSections: Array<{
      type: 'feature' | 'bug' | 'improvement' | 'other';
      title: string;
      content: string[];
    }> = [];

    sections.forEach((section) => {
      const trimmedSection = section.trim();
      if (!trimmedSection) return;

      const lines = trimmedSection.split('\n');
      const headerLine = lines[0];
      const contentLines = lines.slice(1);

      if (headerLine.startsWith('#')) {
        const title = headerLine.replace(/^#+\s+/, '');
        const content = contentLines
          .filter((line) => line.trim())
          .map((line) => {
            // Convert markdown lists to bullet points
            if (line.trim().startsWith('- ')) {
              return `• ${line.trim().substring(2)}`;
            }
            // Remove markdown links
            return line.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
          });

        // Categorize section based on title keywords
        let type: 'feature' | 'bug' | 'improvement' | 'other' = 'other';

        const titleLower = title.toLowerCase();
        if (
          titleLower.includes('feature') ||
          titleLower.includes('new') ||
          titleLower.includes('add')
        ) {
          type = 'feature';
        } else if (
          titleLower.includes('fix') ||
          titleLower.includes('bug') ||
          titleLower.includes('issue')
        ) {
          type = 'bug';
        } else if (
          titleLower.includes('improve') ||
          titleLower.includes('update') ||
          titleLower.includes('enhance')
        ) {
          type = 'improvement';
        }

        parsedSections.push({ type, title, content });
      }
    });

    return parsedSections;
  };

  const formatLastChecked = () => {
    if (!lastChecked) return '';
    const now = new Date();
    const diff = now.getTime() - lastChecked.getTime();
    const minutes = Math.floor(diff / 60000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    const days = Math.floor(hours / 24);
    return `${days} day${days > 1 ? 's' : ''} ago`;
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
    <Card className="w-full">
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <Download className="h-5 w-5" />
            {t('settings.updates.title', 'Updates')}
          </CardTitle>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
            {updateInfo?.hasUpdate && (
              <Badge variant="default" className="w-fit">
                {t(
                  'settings.updates.new_version_available',
                  'Update Available',
                )}
              </Badge>
            )}
            {lastChecked && (
              <span className="text-xs text-muted-foreground sm:ml-2">
                {formatLastChecked()}
              </span>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1 flex-1">
            <p className="text-sm font-medium">
              {t('settings.updates.current_version', 'Current Version')}
            </p>
            <p className="text-sm text-muted-foreground">
              {updateInfo?.currentVersion || 'Unknown'}
            </p>
            {updateInfo?.hasUpdate && (
              <p className="text-sm font-medium text-primary">
                {t('settings.updates.new_version_available', 'New Version')}:{' '}
                {updateInfo.latestVersion}
              </p>
            )}
          </div>
          <Button
            onClick={checkForUpdates}
            disabled={isChecking}
            variant="outline"
            size="sm"
            className="w-full sm:w-auto min-w-[140px]"
          >
            {isChecking ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                Checking...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                {t('settings.updates.check', 'Check for Updates')}
              </>
            )}
          </Button>
        </div>

        {updateInfo?.hasUpdate && (
          <>
            <Separator />
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  {t('settings.updates.release_notes', 'Release Notes')}
                </h3>
                <div className="bg-muted rounded-lg p-4 space-y-4">
                  {parseReleaseNotes(updateInfo.releaseNotes).map(
                    (section, index) => (
                      <div key={index} className="space-y-2">
                        <h4 className="font-semibold text-sm text-primary">
                          {section.title}
                        </h4>
                        <div className="space-y-1 ml-4">
                          {section.content.map((line, lineIndex) => (
                            <div
                              key={lineIndex}
                              className="text-sm text-muted-foreground"
                            >
                              {line}
                            </div>
                          ))}
                        </div>
                      </div>
                    ),
                  )}
                </div>
              </div>
              <div className="flex flex-col sm:flex-row justify-end gap-2">
                <Button
                  onClick={handleUpdate}
                  disabled={isUpdating || updateInfo.updateDownloaded}
                  variant={updateInfo.updateDownloaded ? 'outline' : 'default'}
                  className="w-full sm:w-auto min-w-[140px]"
                >
                  {isUpdating ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                      Updating...
                    </>
                  ) : updateInfo.updateDownloaded ? (
                    <>
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      {t('settings.updates.downloaded', 'Update Downloaded')}
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-2" />
                      {t('settings.updates.update_now', 'Update Now')}
                    </>
                  )}
                </Button>
              </div>
              {updateInfo.updateDownloaded && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-sm">
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
