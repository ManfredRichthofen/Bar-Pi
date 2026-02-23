/**
 * API endpoint paths
 */
export const API_PATHS = {
  AUTH: 'api/auth/',
  USER: 'api/user/',
  RECIPE: 'api/recipe/',
  COCKTAIL: 'api/cocktail/',
  INGREDIENT: 'api/ingredient/',
  PUMP: 'api/pump/',
  PUMP_SETTINGS: 'api/pump/settings/',
  GLASS: 'api/glass/',
  GPIO: 'api/gpio/',
  WEBSOCKET: '/websocket',
};

/**
 * Default values for the application
 */
export const DEFAULT_VALUES = {
  API_URL: 'http://localhost:80',
  THEME: 'light',
  UI_MODE: 'simple',
  PAGE_SIZE: 20,
  TIMEOUT: 10000,
};

/**
 * Storage keys for localStorage
 */
export const STORAGE_KEYS = {
  TOKEN: 'token',
  TOKEN_EXPIRATION: 'tokenExpiration',
  LAST_ROUTE: 'lastRoute',
  LANGUAGE: 'i18nextLng',
};

/**
 * Error messages
 */
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  FORBIDDEN: 'Access denied. Please check your permissions.',
  NOT_FOUND: 'The requested resource was not found.',
  SERVER_ERROR: 'Server error. Please try again later.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  API_URL_NOT_CONFIGURED:
    'API URL is not configured. Please configure it in settings.',
  INVALID_CREDENTIALS: 'Invalid username or password.',
  SESSION_EXPIRED: 'Your session has expired. Please log in again.',
};

/**
 * Success messages
 */
export const SUCCESS_MESSAGES = {
  LOGIN_SUCCESS: 'Login successful',
  LOGOUT_SUCCESS: 'Logged out successfully',
  SAVED_SUCCESS: 'Changes saved successfully',
  DELETED_SUCCESS: 'Item deleted successfully',
  UPDATED_SUCCESS: 'Item updated successfully',
  CREATED_SUCCESS: 'Item created successfully',
};

/**
 * UI Mode constants
 */
export const UI_MODES = {
  SIMPLE: 'simple',
  ADVANCED: 'advanced',
};

/**
 * Theme constants
 */
export const THEMES = {
  LIGHT: 'light',
  DARK: 'dark',
  SYSTEM: 'system',
};

/**
 * Admin levels
 */
export const ADMIN_LEVELS = {
  USER: 0,
  ADMIN: 1,
  SUPER_ADMIN: 2,
};

/**
 * Pump types
 */
export const PUMP_TYPES = {
  CONTINUOUS: 'continuous',
  DISCRETE: 'discrete',
};

/**
 * Validation patterns
 */
export const VALIDATION_PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PASSWORD_MIN_LENGTH: 6,
  USERNAME_MIN_LENGTH: 3,
};

export default {
  API_PATHS,
  DEFAULT_VALUES,
  STORAGE_KEYS,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  UI_MODES,
  THEMES,
  ADMIN_LEVELS,
  PUMP_TYPES,
  VALIDATION_PATTERNS,
};
