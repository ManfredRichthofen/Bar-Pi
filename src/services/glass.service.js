import axios from 'axios';
import { BaseService } from './base.service';
import { API_PATHS } from '../constants';

const API_PATH = API_PATHS.GLASS;

class GlassService extends BaseService {
  getAuthHeader(token) {
    return {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };
  }

  getGlasses(token) {
    return axios
      .get(API_PATH, this.getAuthHeader(token))
      .then((response) => response.data);
  }

  getGlass(id, token) {
    return axios
      .get(API_PATH + String(id), this.getAuthHeader(token))
      .then((response) => response.data);
  }

  createGlass(glass) {
    return axios.post(API_PATH, glass);
  }

  updateGlass(glass) {
    return axios.put(API_PATH + String(glass.id), glass);
  }

  deleteGlass(glassId) {
    return axios.delete(API_PATH + String(glassId));
  }
}

export default new GlassService();
