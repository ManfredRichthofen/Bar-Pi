import axios from 'axios';
import { BaseService } from './base.service';
import { API_PATHS } from '../constants';

const API_PATH = API_PATHS.CATEGORY;

class CategoryService extends BaseService {
  getAuthHeader(token) {
    return {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };
  }

  getAllCategories(token) {
    return axios
      .get(API_PATH, this.getAuthHeader(token))
      .then((response) => response.data);
  }

  getCategory(id, token) {
    return axios
      .get(API_PATH + String(id), this.getAuthHeader(token))
      .then((response) => response.data);
  }

  createCategory(categoryName, token) {
    return axios.post(
      API_PATH,
      { name: categoryName },
      this.getAuthHeader(token)
    );
  }

  updateCategory(category, token) {
    return axios.put(
      API_PATH + String(category.id),
      category,
      this.getAuthHeader(token)
    );
  }

  deleteCategory(categoryId, token) {
    return axios.delete(
      API_PATH + String(categoryId),
      this.getAuthHeader(token)
    );
  }
}

export default new CategoryService();
