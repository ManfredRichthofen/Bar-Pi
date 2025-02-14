import { create } from 'zustand';
import AuthService from '../services/auth.service.js';
import config from '../services/config';
import axios from 'axios';

const updateAxiosDefaults = (token) => {
  if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete axios.defaults.headers.common['Authorization'];
  }
};

const useAuthStore = create((set) => ({
  token: null,
  user: null,
  tokenExpiration: null,
  error: null,
  loading: false,

  setToken: (token) => {
    updateAxiosDefaults(token);
    set({ token });
  },
  setUser: (user) => set({ user }),
  
  loginUser: async (credentials, apiBaseUrl) => {
    set({ loading: true, error: null });

    try {
      if (apiBaseUrl) {
        config.setApiBaseUrl(apiBaseUrl);
        axios.defaults.baseURL = apiBaseUrl;
      }

      const response = await AuthService.login(credentials, apiBaseUrl);
      console.log('Login response:', response);

      const tokenExpiration = new Date(response.tokenExpiration);
      
      localStorage.setItem('token', response.accessToken);
      localStorage.setItem('tokenExpiration', tokenExpiration.toISOString());
      localStorage.setItem('user', JSON.stringify(response.user));

      updateAxiosDefaults(response.accessToken);

      set({
        token: response.accessToken,
        tokenExpiration,
        user: response.user,
        loading: false,
        error: null
      });

      return true;
    } catch (error) {
      console.error('Login error:', error);
      updateAxiosDefaults(null);
      set({
        error: error.message || 'Failed to connect to server',
        loading: false,
        token: null,
        tokenExpiration: null,
        user: null
      });
      return false;
    }
  },

  logoutUser: () => {
    try {
      localStorage.removeItem('token');
      localStorage.removeItem('tokenExpiration');
      localStorage.removeItem('user');
      updateAxiosDefaults(null);
      set({
        token: null,
        tokenExpiration: null,
        user: null,
        error: null,
        loading: false,
      });
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  },

  reinitializeAuthState: async () => {
    try {
      const token = localStorage.getItem('token');
      const tokenExpiration = localStorage.getItem('tokenExpiration');
      const storedUser = localStorage.getItem('user');
      console.log('Reinitializing auth state:', { token, tokenExpiration });

      if (!token || !tokenExpiration) {
        return;
      }

      const expirationDate = new Date(tokenExpiration);
      const isTokenValid = new Date() < expirationDate;
      console.log('Token valid:', isTokenValid);

      if (isTokenValid) {
        // Set axios defaults first
        updateAxiosDefaults(token);

        // Try to validate token silently
        const isValid = await AuthService.validateTokenSilently();
        
        if (isValid) {
          // Token is valid
          set({
            token,
            tokenExpiration: expirationDate,
            user: storedUser ? JSON.parse(storedUser) : null,
            error: null
          });
        } else {
          // Token validation failed, clear everything
          localStorage.removeItem('token');
          localStorage.removeItem('tokenExpiration');
          localStorage.removeItem('user');
          updateAxiosDefaults(null);
          set({
            token: null,
            tokenExpiration: null,
            user: null,
            error: null
          });
        }
      } else {
        // Token is expired, clear everything
        localStorage.removeItem('token');
        localStorage.removeItem('tokenExpiration');
        localStorage.removeItem('user');
        updateAxiosDefaults(null);
        set({
          token: null,
          tokenExpiration: null,
          user: null,
          error: null
        });
      }
    } catch (error) {
      console.error('Error reinitializing auth state:', error);
      // On any error, clear everything to be safe
      localStorage.removeItem('token');
      localStorage.removeItem('tokenExpiration');
      localStorage.removeItem('user');
      updateAxiosDefaults(null);
      set({
        token: null,
        tokenExpiration: null,
        user: null,
        error: error.message
      });
    }
  },
}));

export default useAuthStore;
