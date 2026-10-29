import { API_PATHS } from '../constants';
import { BaseService } from './base.service';

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
    if (userData.pin && userData.pin.trim() !== '') {
      if (!/^\d{4,8}$/.test(userData.pin.trim())) {
        throw new Error('PIN must be 4 to 8 digits');
      }
    }
  }

  createUserDto(userData) {
    const dto = {
      username: userData.username,
      adminLevel: userData.adminLevel || 0,
      accountNonLocked: userData.accountNonLocked !== false,
    };

    if (userData.pin && userData.pin.trim() !== '') {
      dto.pin = userData.pin.trim();
    }
    if (userData.clearPin) {
      dto.clearPin = true;
    }
    if (
      userData.maxDrinksPerDay !== undefined &&
      userData.maxDrinksPerDay !== null &&
      userData.maxDrinksPerDay !== ''
    ) {
      dto.maxDrinksPerDay = Number(userData.maxDrinksPerDay) || 0;
    }

    return dto;
  }

  getAllUsers() {
    const token = localStorage.getItem('token');
    return this.get(API_PATH, token);
  }

  getUser(userId) {
    return this.get(API_PATH + String(userId));
  }

  getMe(headers = {}) {
    const token = localStorage.getItem('token');
    return this.get(API_PATH + 'current', token || undefined);
  }

  getOrderingStatus(token = null) {
    const authToken = token || localStorage.getItem('token');
    return this.get(API_PATH + 'current/ordering', authToken || undefined);
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

    // Java CocktailPi reads `password` from the top level, the Go backend from userDto
    const requestBody = {
      updatePassword: !!(
        updateRequest.password && updateRequest.password.trim() !== ''
      ),
      password: userDto.password,
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

    return this.post(
      API_PATH,
      { password: userDto.password, userDto },
      authToken,
    );
  }
}

export default new UserService();
