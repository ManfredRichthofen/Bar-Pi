import { API_PATHS } from '../constants';
import BaseService from './base.service';

export type UpdateState =
  | 'idle'
  | 'checking'
  | 'downloading'
  | 'installing'
  | 'restarting'
  | 'error';

export type UnsupportedReason =
  | 'disabled'
  | 'unsupported_os'
  | 'dev_build'
  | 'no_restart';

export interface UpdateStatus {
  supported: boolean;
  unsupportedReason?: UnsupportedReason;
  disabled: boolean;
  currentVersion: string;
  latestVersion?: string;
  hasUpdate: boolean;
  prerelease: boolean;
  releaseNotes?: string;
  releaseUrl?: string;
  publishedAt?: string;
  lastChecked?: string;
  state: UpdateState;
  progress: number;
  error?: string;
  variant: string;
  assetName: string;
}

export interface UpdaterSettings {
  autoCheck: boolean;
  autoInstall: boolean;
  includePrerelease: boolean;
  windowEnabled: boolean;
  windowStartHour: number;
  windowEndHour: number;
}

export const UPDATE_STATUS_TOPIC = '/topic/update/status';

const API_PATH = API_PATHS.SYSTEM || 'api/system/';

class UpdateService extends BaseService {
  getStatus(): Promise<UpdateStatus> {
    return this.get(`${API_PATH}update/status`);
  }

  checkForUpdates(): Promise<UpdateStatus> {
    return this.post(`${API_PATH}update/check`);
  }

  install(): Promise<UpdateStatus> {
    return this.post(`${API_PATH}update/install`);
  }

  getSettings(): Promise<UpdaterSettings> {
    return this.get(`${API_PATH}settings/updater`);
  }

  saveSettings(settings: UpdaterSettings): Promise<UpdaterSettings> {
    return this.put(`${API_PATH}settings/updater`, settings);
  }
}

export default new UpdateService();
