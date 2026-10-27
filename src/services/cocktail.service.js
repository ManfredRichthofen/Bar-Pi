import { API_PATHS } from '../constants';
import axios from '../lib/apiClient';
import { BaseService } from './base.service';
import JsUtils from './JsUtils.js';

const API_PATH = API_PATHS.COCKTAIL;

class CocktailService extends BaseService {
  order(recipeId, orderConfig, isIngredient = false, token) {
    return axios
      .put(`${API_PATH}${recipeId}`, orderConfig, {
        headers: this.getAuthHeader(token),
      })
      .catch((error) => {
        const errorMessage =
          error.response?.data?.message || 'Failed to order drink';
        error.userMessage = errorMessage;
        throw error;
      });
  }

  checkFeasibility(recipeId, orderConfig, isIngredient = false, token) {
    let params = {
      isIngredient,
    };
    params = JsUtils.cleanObject(params);
    return axios
      .put(API_PATH + String(recipeId) + '/feasibility', orderConfig, {
        headers: this.getAuthHeader(token),
        params,
      })
      .then((response) => response.data)
      .catch((error) => {
        throw error;
      });
  }

  cancelCocktail(token) {
    return this.delete(API_PATH, token);
  }

  continueProduction(token) {
    return this.post(API_PATH + 'continueproduction', null, token);
  }
}

export default new CocktailService();
