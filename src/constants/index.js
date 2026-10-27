export const API_PATHS = {
  USER: 'api/user/',
  RECIPE: 'api/recipe/',
  COCKTAIL: 'api/cocktail/',
  GLASS: 'api/glass/',
  CATEGORY: 'api/category/',
  SYSTEM: 'api/system/',
  STATISTICS: 'api/statistics',
  HEALTH: 'health',
};

export const getDefaultApiUrl = () =>
  typeof window !== 'undefined' && window.location?.origin
    ? window.location.origin
    : '';

export const DEFAULT_VALUES = {
  get API_URL() {
    return getDefaultApiUrl();
  },
  UI_MODE: 'simple',
  TIMEOUT: 10000,
};

export const UI_MODES = {
  SIMPLE: 'simple',
  ADVANCED: 'advanced',
};

export default {
  API_PATHS,
  DEFAULT_VALUES,
  UI_MODES,
  getDefaultApiUrl,
};
