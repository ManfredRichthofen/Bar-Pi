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
  logoutUser: () => void;
  reinitializeAuthState: () => void;
  setToken: (token: string | null) => void;
  setUser: (user: User | null) => void;
}

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

      localStorage.setItem('token', response.accessToken);
      localStorage.setItem('tokenExpiration', response.tokenExpiration);

      set({
        token: response.accessToken,
        tokenExpiration: response.tokenExpiration,
        loading: false,
      });

      return true;
    } catch (error: any) {
      console.error('Login error:', error);
      set({
        error: error.message || 'Failed to connect to server',
        loading: false,
      });
      return false;
    }
  },

  logoutUser: () => {
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

      const configStore = useConfigStore.getState();
      configStore.resetApiUrl();
      useCocktailProgressStore.getState().clearProgress();
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
