import axios from 'axios';
import config from './config';

const API_PATH = 'api/ingredient/';
axios.defaults.baseURL = config.API_BASE_URL;

class IngredientService {
  // Add auth token to headers for all requests
  getAuthHeader(token) {
    return {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };
  }

  getIngredients(token) {
    return axios.get(API_PATH, this.getAuthHeader(token)).then((response) => {
      response.data = response.data.map((x) => this.afterIngredientLoad(x));
      return response.data;
    });
  }

  getIngredientsFilter(
    token,
    autocomplete,
    filterManualIngredients,
    filterAutomaticIngredients,
    filterIngredientGroups,
    groupChildrenGroupId,
    inBar,
    onPump,
    inBarOrOnPump,
  ) {
    return axios
      .get(API_PATH, {
        ...this.getAuthHeader(token),
        params: {
          autocomplete,
          filterManualIngredients,
          filterAutomaticIngredients,
          filterIngredientGroups,
          groupChildrenGroupId,
          inBar,
          onPump,
          inBarOrOnPump,
        },
      })
      .then((response) => {
        response.data = response.data.map((x) => this.afterIngredientLoad(x));
        return response.data;
      });
  }

  updateIngredient(id, updateIngredient, image, token, removeImage = false) {
    const uploadData = new FormData();
    const stringIngredient = JSON.stringify(updateIngredient);
    const blobIngredient = new Blob([stringIngredient], {
      type: 'application/json',
    });
    uploadData.append('ingredient', blobIngredient);
    if (image) {
      uploadData.append('image', image);
    }
    return axios.put(
      API_PATH + String(id) + '?removeImage=' + String(removeImage),
      uploadData,
      {
        ...this.getAuthHeader(token),
        headers: {
          ...this.getAuthHeader(token).headers,
          'Content-Type': 'multipart/form-data',
        },
      },
    );
  }

  createIngredient(createIngredient, image, token) {
    // Always use FormData, just like the original implementation
    const uploadData = new FormData();
    const stringIngredient = JSON.stringify(createIngredient);
    console.log('Stringified ingredient:', stringIngredient);
    const blobIngredient = new Blob([stringIngredient], {
      type: 'application/json',
    });
    uploadData.append('ingredient', blobIngredient);
    if (image) {
      uploadData.append('image', image);
    }

    return axios
      .post(API_PATH, uploadData, {
        ...this.getAuthHeader(token),
        headers: {
          ...this.getAuthHeader(token).headers,
          'Content-Type': 'multipart/form-data',
        },
      })
      .then((response) => {
        console.log('Create response:', response);
        return response;
      })
      .catch((error) => {
        if (error.response) {
          console.error('Server error details:', {
            status: error.response.status,
            data: error.response.data,
            headers: error.response.headers,
            requestData: createIngredient,
          });
        }
        console.error('Error config:', error.config);
        console.error('Full error:', error);
        throw error;
      });
  }

  deleteIngredient(id, token) {
    return axios.delete(API_PATH + String(id), this.getAuthHeader(token));
  }

  addToBar(ingredientId, token) {
    return axios.put(
      API_PATH + String(ingredientId) + '/bar',
      null,
      this.getAuthHeader(token),
    );
  }

  removeFromBar(ingredientId, token) {
    return axios.delete(
      API_PATH + String(ingredientId) + '/bar',
      this.getAuthHeader(token),
    );
  }

  afterIngredientLoad(ingredient) {
    if (ingredient.lastUpdate) {
      ingredient.lastUpdate = new Date(ingredient.lastUpdate);
    }
    return ingredient;
  }
}

export default new IngredientService();

class IngredientDtoMapper {
  toIngredientCreateDto(ingredient) {
    // Match the original DTO mapper exactly
    if (ingredient.type === 'group') {
      return {
        type: ingredient.type,
        name: ingredient.name,
        parentGroupId: ingredient.parentGroupId,
      };
    } else if (ingredient.type === 'manual') {
      return {
        name: ingredient.name,
        parentGroupId: ingredient.parentGroupId,
        type: ingredient.type,
        unit: ingredient.unit,
        alcoholContent: ingredient.alcoholContent,
      };
    } else if (ingredient.type === 'automated') {
      return {
        type: ingredient.type,
        alcoholContent: ingredient.alcoholContent,
        name: ingredient.name,
        bottleSize: ingredient.bottleSize,
        parentGroupId: ingredient.parentGroupId,
        pumpTimeMultiplier: ingredient.pumpTimeMultiplier,
      };
    }
    throw new Error('Unknown ingredient type: ' + ingredient.type);
  }

  toIngredientUpdateDto(ingredient) {
    // For updates, include all fields
    const baseDto = {
      id: ingredient.id,
      type: ingredient.type,
      name: ingredient.name.trim(),
      parentGroupId: ingredient.parentGroupId
        ? Number(ingredient.parentGroupId)
        : null,
      parentGroupName: ingredient.parentGroupName || null,
      inBar: ingredient.inBar ?? false,
      hasImage: ingredient.hasImage ?? false,
    };

    if (ingredient.type === 'group') {
      return baseDto;
    } else if (ingredient.type === 'manual') {
      return {
        ...baseDto,
        unit: ingredient.unit || 'ml',
        alcoholContent: Number(ingredient.alcoholContent) || 0,
        bottleSize: null,
        pumpTimeMultiplier: null,
        onPump: false,
        pumpNumber: null,
      };
    } else if (ingredient.type === 'automated') {
      return {
        ...baseDto,
        alcoholContent: Number(ingredient.alcoholContent) || 0,
        bottleSize: Number(ingredient.bottleSize) || 0,
        pumpTimeMultiplier: Number(ingredient.pumpTimeMultiplier) || 1,
        unit: 'ml',
        onPump: ingredient.onPump ?? false,
        pumpNumber: ingredient.pumpNumber || null,
      };
    }
    throw new Error('Unknown ingredient type: ' + ingredient.type);
  }

  afterIngredientLoad(ingredient) {
    if (ingredient.lastUpdate) {
      ingredient.lastUpdate = new Date(ingredient.lastUpdate);
    }
    return ingredient;
  }
}

export const ingredientDtoMapper = new IngredientDtoMapper();
