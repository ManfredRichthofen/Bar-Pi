import axios from 'axios';

class AuthService {
  login(credentials, apiBaseUrl) {
    const api = axios.create({
      baseURL: apiBaseUrl,
    });

    return api.post('api/auth/login', credentials).then((response) => {
      response.data.tokenExpiration = new Date(response.data.tokenExpiration);
      return response.data;
    });
  }

  /**
   * @param {{ pin: string, remember?: boolean }} credentials
   * @param {string} apiBaseUrl
   */
  loginWithPin(credentials, apiBaseUrl) {
    const api = axios.create({
      baseURL: apiBaseUrl,
    });

    return api
      .post('api/auth/login/pin', {
        pin: credentials.pin,
        remember: !!credentials.remember,
      })
      .then((response) => {
        response.data.tokenExpiration = new Date(response.data.tokenExpiration);
        return response.data;
      });
  }
}

export default new AuthService();
