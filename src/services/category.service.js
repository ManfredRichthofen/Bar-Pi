import { BaseService } from './base.service';
import { API_PATHS } from '../constants';

const API_PATH = API_PATHS.CATEGORY;

class CategoryService extends BaseService {
  getAllCategories(token) {
    return this.get(API_PATH, token);
  }

  getCategory(id, token) {
    return this.get(API_PATH + String(id), token);
  }

  createCategory(categoryName, token) {
    return this.post(API_PATH, { name: categoryName }, token);
  }

  updateCategory(category, token) {
    return this.put(API_PATH + String(category.id), category, token);
  }

  deleteCategory(categoryId, token) {
    return this.delete(API_PATH + String(categoryId), token);
  }
}

export default new CategoryService();
