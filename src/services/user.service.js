import { BaseService } from './base.service';
import { API_PATHS } from '../constants';

const API_PATH = API_PATHS.USER;

class UserService extends BaseService {
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
    return this.get(API_PATH, token);
  }

  getUser(userId) {
    return this.get(API_PATH + String(userId));
  }

  getMe() {
    return this.get(API_PATH + 'current');
  }

  updateMe(updateRequest) {
    return this.put(API_PATH + 'current', updateRequest);
  }

  deleteUser(userId, token = null) {
    const authToken = token || localStorage.getItem('token');
    return this.delete(API_PATH + String(userId), authToken);
  }

  updateUser(userId, updateRequest, token = null) {
    const authToken = token || localStorage.getItem('token');

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

    return this.put(API_PATH + String(userId), requestBody, authToken);
  }

  createUser(createUser, token = null) {
    const authToken = token || localStorage.getItem('token');

    this.validateUserData(createUser, true);

    const userDto = {
      ...this.createUserDto(createUser),
      password: createUser.password,
    };

    return this.post(API_PATH, { userDto }, authToken);
  }
}

export default new UserService();
