import { create } from 'zustand';
import config from '../services/config';

const formatUrl = (url, shouldFormat = true) => {
  if (!url) return '';
  const trimmedUrl = url.trim();
  if (!shouldFormat) return trimmedUrl;
  return trimmedUrl.startsWith('http') ? trimmedUrl : `https://${trimmedUrl}`;
};

const isValidUrl = (url) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

const useConfigStore = create((set) => ({
  apiBaseUrl: config.getStoredApiUrl() || '',
  setApiBaseUrl: (newUrl) => {
    // During editing, use raw value for display
    const rawUrl = formatUrl(newUrl, false);
    set({ apiBaseUrl: rawUrl });

    // Only format and store if it's a complete, valid URL
    const formattedUrl = formatUrl(rawUrl, true);
    if (formattedUrl && isValidUrl(formattedUrl)) {
      config.setApiBaseUrl(formattedUrl);
    }
  },
}));

export default useConfigStore;
