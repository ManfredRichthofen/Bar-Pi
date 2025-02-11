const config = {
  API_BASE_URL: 'https://demo.cocktailpi.org', // Default value
  setApiBaseUrl(newUrl) {
    this.API_BASE_URL = newUrl;
  },
};

export default config;
