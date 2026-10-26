import axios from '../lib/apiClient';
import { authHeaders } from '../lib/apiClient';

/**
 * Base service class with common functionality for all API services
 */
export class BaseService {
  /**
   * Get authorization headers with token (flat object for axios `headers`)
   * @param {string} token - JWT token
   * @returns {object} Headers object
   */
  getAuthHeader(token = null) {
    return authHeaders(token);
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
        ...config,
        headers: { ...this.getAuthHeader(token), ...config.headers },
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
        ...config,
        headers: { ...this.getAuthHeader(token), ...config.headers },
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
        ...config,
        headers: { ...this.getAuthHeader(token), ...config.headers },
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
        ...config,
        headers: { ...this.getAuthHeader(token), ...config.headers },
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
