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
}

export default new AuthService();
