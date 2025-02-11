import { create } from 'zustand';
import config from '../services/config';

const isValidUrl = (url) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

const formatUrl = (url, validate = false) => {
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
