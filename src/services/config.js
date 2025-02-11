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
    }
  },
  getStoredApiUrl() {
    return getStoredUrl();
  }
};

export default config;
