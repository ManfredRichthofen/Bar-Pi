import axios from 'axios';
import { DEFAULT_VALUES } from '../constants';
import useConfigStore from '../store/configStore';

/**
 * Shared axios setup: dynamic baseURL from configStore and Bearer token
 * from localStorage when a request does not already set Authorization.
 * Import this module once (via base.service) so interceptors are registered.
 */
axios.defaults.timeout = DEFAULT_VALUES.TIMEOUT;

axios.interceptors.request.use(
  (config) => {
    const currentBaseUrl = useConfigStore.getState().apiBaseUrl;
    config.baseURL = currentBaseUrl;

    const existingAuth = config.headers?.Authorization;
    if (!existingAuth) {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers = config.headers ?? {};
        config.headers.Authorization = `Bearer ${token}`;
      }
    }

    return config;
  },
  (error) => Promise.reject(error),
);

/** Flat auth headers for `{ headers: authHeaders(token) }`. */
export function authHeaders(token: string | null | undefined = null) {
  const authToken = token ?? localStorage.getItem('token');
  if (authToken) {
    return {
      Authorization: `Bearer ${authToken}`,
      'Content-Type': 'application/json',
    };
  }
  return {
    'Content-Type': 'application/json',
  };
}

export default axios;
