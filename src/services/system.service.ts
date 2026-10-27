import { API_PATHS } from '../constants';
import BaseService from './base.service';

export type BackendType = 'go' | 'cocktailpi' | 'unknown';

export interface BackendInfo {
  type: BackendType;
  isGoBackend: boolean;
  isOriginalCocktailPi: boolean;
  version?: string;
  appName?: string;
}

export interface GlobalSystemSettings {
  backend?: string;
  appName?: string;
  appVersion?: string;
  disableDonation?: boolean;
  hideProjectLinks?: boolean;
  disableUpdater?: boolean;
  donationDisclaimer?: boolean;
  donated?: boolean;
  allowReversePumping?: boolean;
  projectUrls?: Record<string, string>;
}

export interface OrderingPolicySettings {
  requirePinAfterDrink: boolean;
}

export interface LoginSettings {
  pinLoginEnabled: boolean;
}

const API_PATH = API_PATHS.SYSTEM || 'api/system/';
const HEALTH_PATH = API_PATHS.HEALTH || 'health';

class SystemService extends BaseService {
  getGlobalSettings(
    token: string | null = null,
  ): Promise<GlobalSystemSettings> {
    return this.get(`${API_PATH}settings/global`, (token ?? undefined) as any);
  }

  getOrderingPolicy(
    token: string | null = null,
  ): Promise<OrderingPolicySettings> {
    return this.get(
      `${API_PATH}settings/ordering`,
      (token ?? undefined) as any,
    );
  }

  setOrderingPolicy(
    settings: OrderingPolicySettings,
    token: string | null = null,
  ): Promise<OrderingPolicySettings> {
    return this.put(
      `${API_PATH}settings/ordering`,
      settings,
      (token ?? undefined) as any,
    );
  }

  /** Public endpoint: readable from the login screen before authentication. */
  getLoginSettings(): Promise<LoginSettings> {
    return this.get('api/auth/login/settings');
  }

  setLoginSettings(
    settings: LoginSettings,
    token: string | null = null,
  ): Promise<LoginSettings> {
    return this.put(
      `${API_PATH}settings/login`,
      settings,
      (token ?? undefined) as any,
    );
  }

  getHealth(token: string | null = null): Promise<{
    status?: string;
    backend?: string;
    version?: string;
    name?: string;
  }> {
    return this.get(HEALTH_PATH, (token ?? undefined) as any);
  }

  /**
   * Detect whether the connected server is the new Bar-Pi Go backend (`'go'`)
   * or the original CocktailPi Java/Spring Boot service (`'cocktailpi'`).
   */
  async detectBackend(token: string | null = null): Promise<BackendInfo> {
    // 1. Check /api/system/settings/global when authenticated (works behind /api reverse proxies too)
    if (token || localStorage.getItem('token')) {
      try {
        const globalSettings = await this.getGlobalSettings(token);
        if (globalSettings && typeof globalSettings === 'object') {
          if (
            globalSettings.backend === 'go' ||
            'disableUpdater' in globalSettings
          ) {
            return {
              type: 'go',
              isGoBackend: true,
              isOriginalCocktailPi: false,
              version: globalSettings.appVersion,
              appName: globalSettings.appName,
            };
          }

          if (
            'projectUrls' in globalSettings ||
            'appVersion' in globalSettings ||
            'donated' in globalSettings
          ) {
            return {
              type: 'cocktailpi',
              isGoBackend: false,
              isOriginalCocktailPi: true,
              version: globalSettings.appVersion,
              appName: globalSettings.appName,
            };
          }
        }
      } catch {
        // Fall through to /health check
      }
    }

    // 2. Check /health endpoint (present in all Bar-Pi Go backend builds, absent in original CocktailPi)
    try {
      const health = await this.getHealth(token);
      if (
        health &&
        typeof health === 'object' &&
        (health.status === 'ok' || health.backend === 'go')
      ) {
        return {
          type: 'go',
          isGoBackend: true,
          isOriginalCocktailPi: false,
          version: health.version,
          appName: health.name,
        };
      }

      // If /health returned HTML (e.g. Spring Boot SPA index.html fallback), it's the original CocktailPi service
      if (typeof health === 'string') {
        return {
          type: 'cocktailpi',
          isGoBackend: false,
          isOriginalCocktailPi: true,
        };
      }
    } catch (err: any) {
      // If server responded with 404/401/403 on /health, it's reachable but not the Go backend
      const status = err?.response?.status;
      if (
        status === 404 ||
        status === 401 ||
        status === 403 ||
        status === 405
      ) {
        return {
          type: 'cocktailpi',
          isGoBackend: false,
          isOriginalCocktailPi: true,
        };
      }
    }

    return {
      type: 'unknown',
      isGoBackend: false,
      isOriginalCocktailPi: false,
    };
  }
}

export default new SystemService();
