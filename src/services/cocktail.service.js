import axios from 'axios';
import config from './config';
axios.defaults.baseURL = config.API_BASE_URL;

import JsUtils from './JsUtils.js';

const API_PATH = 'api/cocktail/';

class CocktailService {
  getAuthHeader(token) {
    return {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };
  }

  order(recipeId, orderConfig, isIngredient = false, token) {
    let params = {
      isIngredient,
    };
    params = JsUtils.cleanObject(params);
    return axios.put(API_PATH + String(recipeId), orderConfig, {
      ...this.getAuthHeader(token),
      params,
    });
  }

  checkFeasibility(recipeId, orderConfig, isIngredient = false, token) {
    let params = {
      isIngredient,
    };
    params = JsUtils.cleanObject(params);
    return axios
      .put(API_PATH + String(recipeId) + '/feasibility', orderConfig, {
        ...this.getAuthHeader(token),
        params,
      })
      .then((response) => response.data);
  }

  cancelCocktail(token) {
    return axios.delete(API_PATH, this.getAuthHeader(token));
  }

  continueProduction(token) {
    return axios.post(
      API_PATH + 'continueproduction',
      null,
      this.getAuthHeader(token),
    );
  }
}

export default new CocktailService();
