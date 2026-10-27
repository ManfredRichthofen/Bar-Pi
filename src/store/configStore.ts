import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getDefaultApiUrl } from '../constants';

interface ConfigState {
  apiBaseUrl: string;
  setApiBaseUrl: (newUrl: string) => void;
  resetApiUrl: () => void;
}

const useConfigStore = create<ConfigState>()(
  persist(
    (set: any) => ({
      apiBaseUrl: getDefaultApiUrl(),

      setApiBaseUrl: (newUrl: string) => {
        set({ apiBaseUrl: newUrl });
      },

      resetApiUrl: () => set({ apiBaseUrl: getDefaultApiUrl() }),
    }),
    {
      name: 'config-storage',
      // Omit default API URL from storage so it always tracks the current origin
      partialize: (state: any) => {
        const defaultUrl = getDefaultApiUrl();
        return {
          apiBaseUrl:
            !state.apiBaseUrl || state.apiBaseUrl === defaultUrl
              ? undefined
              : state.apiBaseUrl,
        };
      },
    },
  ),
);

export default useConfigStore;
