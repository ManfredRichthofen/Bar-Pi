import axios from 'axios';

import config from './config';
axios.defaults.baseURL = config.API_BASE_URL;

const API_PATH = 'api/user/';

class UserService {
  getAllUsers() {
    return axios.get(API_PATH).then((response) => response.data);
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

  deleteUser(userId) {
    return axios.delete(API_PATH + String(userId));
  }

  updateUser(updateRequest, id) {
    return axios.put(API_PATH + String(id), updateRequest);
  }

  createUser(createUser) {
    return axios.post(API_PATH, createUser);
  }
}

export default new UserService();
