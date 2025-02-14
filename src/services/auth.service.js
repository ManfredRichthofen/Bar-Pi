import axios from 'axios';
import config from './config';

class AuthService {
  login(credentials, apiBaseUrl) {
    // Create axios instance with current baseURL
    const api = axios.create({
      baseURL: apiBaseUrl,
    });

    return api.post('api/auth/login', credentials).then((response) => {
      // JwtResponse
      response.data.tokenExpiration = new Date(response.data.tokenExpiration);
      return response.data;
    });
  }

  refreshToken(apiBaseUrl) {
    // Create axios instance with current baseURL
    const api = axios.create({
      baseURL: apiBaseUrl,
    });

    return api.get('api/auth/refreshToken').then((response) => {
      // JwtResponse
      response.data.tokenExpiration = new Date(response.data.tokenExpiration);
      return response.data;
    });
  }

  validateToken() {
    // Use the current axios instance with the token in headers
    return axios.get('api/auth/validate').then((response) => {
      return response.data;
    });
  }

  async validateTokenSilently() {
    try {
      await this.validateToken();
      return true;
    } catch (error) {
      return false;
    }
  }
}

export default new AuthService();
