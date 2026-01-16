import axios from 'axios';
import config from './config';

axios.defaults.baseURL = config.API_BASE_URL;

const API_PATH = 'api/user/';

class UserService {
  getAuthHeaders(token = null) {
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  validateUserData(userData, requirePassword = false) {
    if (!userData || !userData.username) {
      throw new Error('Username is required');
    }
    if (
      requirePassword &&
      (!userData.password || userData.password.trim() === '')
    ) {
      throw new Error('Password is required');
    }
  }

  createUserDto(userData) {
    return {
      username: userData.username,
      adminLevel: userData.adminLevel || 0,
      accountNonLocked: userData.accountNonLocked !== false,
    };
  }

  getAllUsers() {
    const token = localStorage.getItem('token');
    const headers = this.getAuthHeaders(token);
    return axios.get(API_PATH, { headers }).then((response) => response.data);
  }

  getUser(userId) {
    return axios
      .get(API_PATH + String(userId))
      .then((response) => response.data);
  }

  getMe(headers = {}) {
    return axios
      .get(API_PATH + 'current', { headers })
      .then((response) => response.data);
  }

  updateMe(updateRequest) {
    return axios.put(API_PATH + 'current', updateRequest);
  }

  deleteUser(userId, token = null) {
    const headers = this.getAuthHeaders(token);
    return axios.delete(API_PATH + String(userId), { headers });
  }

  updateUser(userId, updateRequest, token = null) {
    const headers = this.getAuthHeaders(token);

    this.validateUserData(updateRequest, false);

    const userDto = this.createUserDto(updateRequest);

    userDto.password =
      updateRequest.password && updateRequest.password.trim() !== ''
        ? updateRequest.password
        : 'dummy_password_for_update';

    const requestBody = {
      updatePassword: !!(
        updateRequest.password && updateRequest.password.trim() !== ''
      ),
      userDto,
    };

    return axios.put(API_PATH + String(userId), requestBody, { headers });
  }

  // CREATE user
  createUser(createUser, token = null) {
    const headers = this.getAuthHeaders(token);

    this.validateUserData(createUser, true);

    const userDto = {
      ...this.createUserDto(createUser),
      password: createUser.password,
    };

    return axios.post(API_PATH, { userDto }, { headers });
  }
}

export default new UserService();
