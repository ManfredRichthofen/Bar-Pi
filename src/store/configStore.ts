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

const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

const formatUrl = (url: string, validate = false): string => {
  if (!url || url.trim() === '') {
    return '';
  }

  // During editing, just return the raw value
  if (!validate) {
    return url;
  }

  try {
    // Only format when validating/saving
    let formattedUrl = url.trim().replace(/\/+$/, '');

    // Special handling for localhost
    if (formattedUrl.includes('localhost')) {
      // If it's just 'localhost' or 'localhost:port', add http://
      if (!/^https?:\/\//i.test(formattedUrl)) {
        formattedUrl = 'http://' + formattedUrl;
      }
    } else {
      // For non-localhost URLs, default to https://
      if (!/^https?:\/\//i.test(formattedUrl)) {
        formattedUrl = 'https://' + formattedUrl;
      }
    }

    // Validate the URL
    new URL(formattedUrl);
    return formattedUrl;
  } catch (e) {
    return ''; // Return empty string for invalid URLs
  }
};

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
        // During editing, use raw value for display
        const rawUrl = formatUrl(newUrl, false);
        set({ apiBaseUrl: rawUrl });

        // Only format and store if it's a complete, valid URL
        const formattedUrl = formatUrl(rawUrl, true);
        if (formattedUrl && isValidUrl(formattedUrl)) {
          set({ apiBaseUrl: formattedUrl });
        }
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
