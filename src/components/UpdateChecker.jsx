import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import updateService from '../services/update.service';

const UpdateChecker = () => {
  const { t } = useTranslation();
  const [updateInfo, setUpdateInfo] = useState(null);
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
        // Update was successful, but we don't reload since the user needs to manually apply the update
        setUpdateInfo(prev => ({ ...prev, updateDownloaded: true }));
      }
    } catch (error) {
      console.error('Error during update:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="card bg-base-200">
      <div className="card-body p-3">
        <h2 className="card-title text-lg mb-3">
          {t('settings.updates.title', 'Updates')}
        </h2>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-70">
                {t('settings.updates.current_version', 'Current Version')}: {updateInfo?.currentVersion || 'Unknown'}
              </p>
              {updateInfo?.hasUpdate && (
                <p className="text-sm text-primary">
                  {t('settings.updates.new_version_available', 'New Version Available')}: {updateInfo.latestVersion}
                </p>
              )}
            </div>
            <button
              className="btn btn-primary"
              onClick={checkForUpdates}
              disabled={isChecking}
            >
              {isChecking ? (
                <span className="loading loading-spinner loading-sm"></span>
              ) : (
                t('settings.updates.check', 'Check for Updates')
              )}
            </button>
          </div>

          {updateInfo?.hasUpdate && (
            <div className="space-y-2">
              <div className="text-sm">
                <h3 className="font-medium mb-1">{t('settings.updates.release_notes', 'Release Notes')}:</h3>
                <div className="whitespace-pre-wrap opacity-70">{updateInfo.releaseNotes}</div>
              </div>
              <div className="flex justify-end">
                <button
                  className="btn btn-success"
                  onClick={handleUpdate}
                  disabled={isUpdating || updateInfo.updateDownloaded}
                >
                  {isUpdating ? (
                    <span className="loading loading-spinner loading-sm"></span>
                  ) : updateInfo.updateDownloaded ? (
                    t('settings.updates.downloaded', 'Update Downloaded')
                  ) : (
                    t('settings.updates.update_now', 'Update Now')
                  )}
                </button>
              </div>
              {updateInfo.updateDownloaded && (
                <div className="alert alert-info mt-2">
                  <span className="text-sm">
                    {t('settings.updates.manual_install_required', 'Please check your downloads folder for the update package. Extract and replace your current installation files with the new ones.')}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UpdateChecker; 