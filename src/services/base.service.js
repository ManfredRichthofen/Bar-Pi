import axios, { authHeaders } from '../lib/apiClient';

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

  get(path, token = null, config = {}) {
    return axios
      .get(path, {
        ...config,
        headers: { ...this.getAuthHeader(token), ...config.headers },
      })
      .then((response) => response.data);
  }

  post(path, data = {}, token = null, config = {}) {
    return axios
      .post(path, data, {
        ...config,
        headers: { ...this.getAuthHeader(token), ...config.headers },
      })
      .then((response) => response.data);
  }

  put(path, data = {}, token = null, config = {}) {
    return axios
      .put(path, data, {
        ...config,
        headers: { ...this.getAuthHeader(token), ...config.headers },
      })
      .then((response) => response.data);
  }

  delete(path, token = null, config = {}) {
    return axios
      .delete(path, {
        ...config,
        headers: { ...this.getAuthHeader(token), ...config.headers },
      })
      .then((response) => response.data);
  }
}

export default BaseService;
