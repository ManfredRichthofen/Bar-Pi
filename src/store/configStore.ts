import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { DEFAULT_VALUES } from '../constants';

interface ConfigState {
  apiBaseUrl: string;
  setApiBaseUrl: (newUrl: string) => void;
  resetApiUrl: () => void;
  loading: boolean;
  error: string | null;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}

const useConfigStore = create<ConfigState>()(
  persist(
    (set: any) => ({
      // Standard state
      loading: false as boolean,
      error: null as string | null,
      apiBaseUrl: DEFAULT_VALUES.API_URL,

      // Standard actions
      setLoading: (loading: boolean) => set({ loading }),
      setError: (error: string | null) => set({ error }),
      clearError: () => set({ error: null }),

      // Custom actions
      setApiBaseUrl: (newUrl: string) => {
        // Just store the raw value as-is
        set({ apiBaseUrl: newUrl });
      },

      resetApiUrl: () => set({ apiBaseUrl: DEFAULT_VALUES.API_URL }),
    }),
    {
      name: 'config-storage',
      // Only persist non-default values
      partialize: (state: any) => ({
        apiBaseUrl:
          state.apiBaseUrl === DEFAULT_VALUES.API_URL
            ? undefined
            : state.apiBaseUrl,
      }),
    },
  ),
);

export default useConfigStore;
