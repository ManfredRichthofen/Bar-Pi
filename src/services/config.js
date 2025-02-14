import axios from 'axios';

const getStoredUrl = () => {
  const stored = localStorage.getItem('API_BASE_URL');
  return stored || '';
};

const config = {
  API_BASE_URL: getStoredUrl(), // Initialize with stored URL
  setApiBaseUrl(newUrl) {
    this.API_BASE_URL = newUrl;
    if (newUrl) {
      localStorage.setItem('API_BASE_URL', newUrl);
      axios.defaults.baseURL = newUrl;
    }
  },
  getStoredApiUrl() {
    return getStoredUrl();
  },
  initializeAxios() {
    const url = this.getStoredApiUrl();
    if (url) {
      axios.defaults.baseURL = url;
    }
  }
};

// Initialize axios defaults on import
config.initializeAxios();

export default config;
