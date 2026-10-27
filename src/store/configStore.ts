import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { DEFAULT_VALUES } from '../constants';

interface ConfigState {
  apiBaseUrl: string;
  setApiBaseUrl: (newUrl: string) => void;
  resetApiUrl: () => void;
}

const useConfigStore = create<ConfigState>()(
  persist(
    (set: any) => ({
      apiBaseUrl: DEFAULT_VALUES.API_URL,

      setApiBaseUrl: (newUrl: string) => {
        set({ apiBaseUrl: newUrl });
      },

      resetApiUrl: () => set({ apiBaseUrl: DEFAULT_VALUES.API_URL }),
    }),
    {
      name: 'config-storage',
      // Omit default API URL from storage
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
