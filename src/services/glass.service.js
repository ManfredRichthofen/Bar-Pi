import axios from 'axios';
axios.defaults.baseURL = 'http://localhost:8080';

const API_PATH = 'api/glass/';

class GlassService {
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
