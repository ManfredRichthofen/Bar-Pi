const config = {
  API_BASE_URL: '', // Empty by default, requiring explicit setting
  setApiBaseUrl(newUrl) {
    this.API_BASE_URL = newUrl;
  },
};

export default config;
