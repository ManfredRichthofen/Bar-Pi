import axios from 'axios';
import useConfigStore from '../store/configStore';
import { DEFAULT_VALUES } from '../constants';

// Set global axios defaults
axios.defaults.baseURL = useConfigStore.getState().apiBaseUrl;
axios.defaults.timeout = DEFAULT_VALUES.TIMEOUT;

// Add request interceptor to dynamically update baseURL from config store
axios.interceptors.request.use(
  (config) => {
    // Get the current API base URL from the store
    const currentBaseUrl = useConfigStore.getState().apiBaseUrl;
    
    // Update the baseURL for this request
    config.baseURL = currentBaseUrl;
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Base service class with common functionality for all API services
 */
export class BaseService {
  /**
   * Get authorization headers with token
   * @param {string} token - JWT token
   * @returns {object} Headers object
   */
  getAuthHeader(token = null) {
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  /**
   * Make GET request with optional auth
   * @param {string} path - API endpoint path
   * @param {string} token - JWT token (optional)
   * @param {object} config - Additional axios config (optional)
   * @returns {Promise} Axios response
   */
  get(path, token = null, config = {}) {
    return axios
      .get(path, {
        headers: this.getAuthHeader(token),
        ...config,
      })
      .then((response) => response.data);
  }

  /**
   * Make POST request with optional auth
   * @param {string} path - API endpoint path
   * @param {object} data - Request body data
   * @param {string} token - JWT token (optional)
   * @param {object} config - Additional axios config (optional)
   * @returns {Promise} Axios response
   */
  post(path, data = {}, token = null, config = {}) {
    return axios
      .post(path, data, {
        headers: this.getAuthHeader(token),
        ...config,
      })
      .then((response) => response.data);
  }

  /**
   * Make PUT request with optional auth
   * @param {string} path - API endpoint path
   * @param {object} data - Request body data
   * @param {string} token - JWT token (optional)
   * @param {object} config - Additional axios config (optional)
   * @returns {Promise} Axios response
   */
  put(path, data = {}, token = null, config = {}) {
    return axios
      .put(path, data, {
        headers: this.getAuthHeader(token),
        ...config,
      })
      .then((response) => response.data);
  }

  /**
   * Make DELETE request with optional auth
   * @param {string} path - API endpoint path
   * @param {string} token - JWT token (optional)
   * @param {object} config - Additional axios config (optional)
   * @returns {Promise} Axios response
   */
  delete(path, token = null, config = {}) {
    return axios
      .delete(path, {
        headers: this.getAuthHeader(token),
        ...config,
      })
      .then((response) => response.data);
  }

  /**
   * Handle API errors consistently
   * @param {Error} error - Error object
   * @throws {Error} Formatted error
   */
  handleError(error) {
    const message =
      error.response?.data?.message || error.message || 'An error occurred';
    console.error('API Error:', error);
    throw new Error(message);
  }
}

export default BaseService;
