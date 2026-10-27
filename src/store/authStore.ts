import { create } from 'zustand';
import { currentUserQueryKey } from '../hooks/useCurrentUser';
import { queryClient } from '../lib/queryClient';
import AuthService from '../services/auth.service.js';
import websocketService from '../services/websocket.service';
import type { User } from '../types/user';
import useCocktailProgressStore from './cocktailProgressStore';
import useConfigStore from './configStore';
import useFilterStore from './filterStore';
import { usePumpStore } from './pumpStore';

interface AuthState {
  token: string | null;
  tokenExpiration: string | null;
  user: User | null;
  error: string | null;
  loading: boolean;
  loginUser: (credentials: any, apiBaseUrl: string) => Promise<boolean>;
  loginWithPin: (
    credentials: { pin: string; remember?: boolean },
    apiBaseUrl: string,
  ) => Promise<boolean>;
  logoutUser: (options?: { keepApiUrl?: boolean }) => void;
  reinitializeAuthState: () => void;
  setToken: (token: string | null) => void;
  setUser: (user: User | null) => void;
}

const extractErrorMessage = (error: any, fallback: string) =>
  error?.response?.data?.message ||
  error?.response?.data?.error ||
  error?.message ||
  fallback;

const applyLoginSuccess = (
  set: (partial: Partial<AuthState>) => void,
  response: { accessToken: string; tokenExpiration: string | Date },
) => {
  localStorage.setItem('token', response.accessToken);
  localStorage.setItem('tokenExpiration', String(response.tokenExpiration));

  set({
    token: response.accessToken,
    tokenExpiration: String(response.tokenExpiration),
    loading: false,
    error: null,
  });
};

const useAuthStore = create<AuthState>((set) => ({
  token: null,
  tokenExpiration: null,
  user: null,
  setToken: (token) => set({ token }),
  setUser: (user) => set({ user }),
  error: null,
  loading: false,

  loginUser: async (credentials, apiBaseUrl) => {
    set({ loading: true, error: null });

    try {
      if (apiBaseUrl) {
        const configStore = useConfigStore.getState();
        configStore.setApiBaseUrl(apiBaseUrl);
      }

      const response = await AuthService.login(credentials, apiBaseUrl);
      applyLoginSuccess(set, response);
      useCocktailProgressStore.getState().clearPendingPinAfterDrink();
      return true;
    } catch (error: any) {
      console.error('Login error:', error);
      set({
        error: extractErrorMessage(error, 'Failed to connect to server'),
        loading: false,
      });
      return false;
    }
  },

  loginWithPin: async (credentials, apiBaseUrl) => {
    set({ loading: true, error: null });

    try {
      if (apiBaseUrl) {
        const configStore = useConfigStore.getState();
        configStore.setApiBaseUrl(apiBaseUrl);
      }

      const response = await AuthService.loginWithPin(credentials, apiBaseUrl);
      applyLoginSuccess(set, response);
      useCocktailProgressStore.getState().clearPendingPinAfterDrink();
      return true;
    } catch (error: any) {
      console.error('PIN login error:', error);
      set({
        error: extractErrorMessage(error, 'Invalid PIN'),
        loading: false,
      });
      return false;
    }
  },

  logoutUser: (options) => {
    try {
      localStorage.removeItem('token');
      localStorage.removeItem('tokenExpiration');
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('tokenExpiration');

      set({
        token: null,
        tokenExpiration: null,
        user: null,
        error: null,
        loading: false,
      });

      queryClient.removeQueries({ queryKey: currentUserQueryKey });
      queryClient.removeQueries({ queryKey: ['pumps'] });
      queryClient.removeQueries({ queryKey: ['glasses'] });
      queryClient.removeQueries({ queryKey: ['categories'] });

      if (!options?.keepApiUrl) {
        const configStore = useConfigStore.getState();
        configStore.resetApiUrl();
      }
      useCocktailProgressStore.getState().clearProgress();
      useCocktailProgressStore.getState().clearPendingPinAfterDrink();
      useCocktailProgressStore.getState().setShowProgressDialog(false);
      useFilterStore.getState().clearFilters();
      usePumpStore.getState().setPumps([]);
      usePumpStore.getState().setAllowReversePumping(false);
      usePumpStore.getState().clearError();

      websocketService.disconnectWebsocket();
    } catch (error: any) {
      console.error('Logout error:', error);
      throw error;
    }
  },

  reinitializeAuthState: () => {
    const token = localStorage.getItem('token');
    const tokenExpiration = localStorage.getItem('tokenExpiration');

    if (token && tokenExpiration) {
      const isTokenValid =
        new Date().getTime() < new Date(tokenExpiration).getTime();

      if (isTokenValid) {
        set({
          token,
          tokenExpiration,
        });
      } else {
        localStorage.removeItem('token');
        localStorage.removeItem('tokenExpiration');
        set({
          token: null,
          tokenExpiration: null,
        });
      }
    }
  },
}));

export default useAuthStore;
