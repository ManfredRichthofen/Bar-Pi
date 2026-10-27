import { API_PATHS } from '../constants';
import { BaseService } from './base.service';

const API_PATH = API_PATHS.GLASS;

class GlassService extends BaseService {
  getGlasses(token) {
    return this.get(API_PATH, token);
  }

  getGlass(id, token) {
    return this.get(API_PATH + String(id), token);
  }

  createGlass(glass, token = null) {
    return this.post(API_PATH, glass, token);
  }

  updateGlass(glass, token = null) {
    return this.put(API_PATH + String(glass.id), glass, token);
  }

  deleteGlass(glassId, token = null) {
    return this.delete(API_PATH + String(glassId), token);
  }
}

export default new GlassService();
