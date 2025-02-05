import { create } from 'zustand';
import AuthService from '../services/auth.service.js';

const useAuthStore = create((set) => ({
  token: null,
  user: null,
  setToken: (token) => set({ token }),
  setUser: (user) => set({ user }),
  logout: () => set({ token: null, user: null }),
  error: null,
  loading: false,

  loginUser: async (credentials) => {
    set({ loading: true, error: null });

    try {
      const response = await AuthService.login(credentials);
      console.log('Login response:', response);

      localStorage.setItem('token', response.accessToken);
      localStorage.setItem('tokenExpiration', response.tokenExpiration);

      set({
        token: response.accessToken,
        tokenExpiration: response.tokenExpiration,
        loading: false,
      });

      return true;
    } catch (error) {
      console.error('Login error:', error);
      set({
        error: error.message,
        loading: false,
      });
      return false;
    }
  },

  logoutUser: () => {
    try {
      localStorage.removeItem('token');
      localStorage.removeItem('tokenExpiration');
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('tokenExpiration');
      set({
        token: null,
        tokenExpiration: null,
        error: null,
        loading: false,
      });
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  },

  reinitializeAuthState: () => {
    const token = localStorage.getItem('token');
    const tokenExpiration = localStorage.getItem('tokenExpiration');
    console.log('Reinitializing auth state:', { token, tokenExpiration });

    if (token && tokenExpiration) {
      const isTokenValid =
        new Date().getTime() < new Date(tokenExpiration).getTime();
      console.log('Token valid:', isTokenValid);

      if (isTokenValid) {
        set({
          token,
          tokenExpiration,
        });
      } else {
        localStorage.removeItem('token');
        localStorage.removeItem('tokenExpiration');
        set({
          token: null,
          tokenExpiration: null,
        });
      }
    }
  },
}));

export default useAuthStore;
