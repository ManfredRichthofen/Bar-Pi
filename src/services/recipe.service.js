import axios from 'axios';
import qs from 'qs';
import config from './config';

// Validate API URL before making requests
const validateApiUrl = () => {
  const url = config.API_BASE_URL;
  if (!url) {
    throw new Error('API URL is not configured. Please configure it in settings.');
  }
  // Update axios base URL in case it changed
  axios.defaults.baseURL = url;
};

// Set initial base URL
axios.defaults.baseURL = config.API_BASE_URL;

import JsUtils from './JsUtils.js';

const API_PATH = 'api/recipe/';

class RecipeService {
  createRecipe(createRecipe, image) {
    const uploadData = new FormData();
    const stringRecipe = JSON.stringify(createRecipe);
    const blobRecipe = new Blob([stringRecipe], {
      type: 'application/json',
    });
    uploadData.append('recipe', blobRecipe);
    if (image) {
      uploadData.append('image', image);
    }
    return axios
      .post(API_PATH, uploadData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((response) => this.afterRecipeLoad(response.data));
  }

  getRecipes(
    page,
    ownerId,
    inCollection,
    fabricable,
    containsIngredients,
    searchName,
    inCategoryId,
    orderBy,
    token,
  ) {
    validateApiUrl(); // Add validation check
    
    const inCategory = inCategoryId;
    let params = {
      page,
      ownerId,
      inCollection,
      fabricable,
      containsIngredients,
      searchName,
      inCategory,
      orderBy,
      includeImage: true,
    };
    params = JsUtils.cleanObject(params);

    return axios
      .get(API_PATH, {
        params,
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          Accept: '*/*',
        },
        responseType: 'json',
      })
      .then(async (response) => {
        if (response.data.content && response.data.content.length > 0) {
          const processedContent = await Promise.all(
            response.data.content.map(async (recipe) => {
              if (recipe.hasImage) {
                try {
                  const imageResponse = await axios.get(
                    `${API_PATH}${recipe.id}/image`,
                    {
                      headers: {
                        Authorization: `Bearer ${token}`,
                        Accept: 'image/jpeg, image/png, image/*',
                      },
                      responseType: 'arraybuffer',
                    },
                  );

                  const uint8Array = new Uint8Array(imageResponse.data);
                  const base64String = btoa(
                    uint8Array.reduce(
                      (data, byte) => data + String.fromCharCode(byte),
                      '',
                    ),
                  );
                  const contentType =
                    imageResponse.headers['content-type'] || 'image/jpeg';
                  recipe.image = `data:${contentType};base64,${base64String}`;
                } catch (error) {}
              }
              return this.afterRecipeLoad(recipe);
            }),
          );

          response.data.content = processedContent;
        }

        return response.data;
      })
      .catch((error) => {
        throw error;
      });
  }

  getIngredientRecipes() {
    return axios.get(API_PATH + 'ingredient').then((response) => {
      response.data = response.data.map((x) => this.afterRecipeLoad(x));
      return response.data;
    });
  }

  getRecipe(id, isIngredient = false, token) {
    let params = {
      isIngredient,
      includeImage: true,
    };
    params = JsUtils.cleanObject(params);

    return axios
      .get(API_PATH + String(id), {
        params,
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: '*/*',
        },
      })
      .then(async (response) => {
        const recipe = response.data;

        if (recipe.hasImage) {
          try {
            const imageResponse = await axios.get(`${API_PATH}${id}/image`, {
              headers: {
                Authorization: `Bearer ${token}`,
                Accept: 'image/jpeg, image/png, image/*',
              },
              responseType: 'arraybuffer',
            });

            const uint8Array = new Uint8Array(imageResponse.data);
            const base64String = btoa(
              uint8Array.reduce(
                (data, byte) => data + String.fromCharCode(byte),
                '',
              ),
            );
            const contentType =
              imageResponse.headers['content-type'] || 'image/jpeg';
            recipe.image = `data:${contentType};base64,${base64String}`;
          } catch (error) {}
        }

        return this.afterRecipeLoad(recipe);
      });
  }

  updateRecipe(id, createRecipe, image, removeImage) {
    const uploadData = new FormData();
    const stringRecipe = JSON.stringify(createRecipe);
    const blobRecipe = new Blob([stringRecipe], {
      type: 'application/json',
    });
    uploadData.append('recipe', blobRecipe);
    if (image) {
      uploadData.append('image', image);
    }
    return axios
      .put(
        API_PATH + String(id) + '?removeImage=' + String(removeImage),
        uploadData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
        },
      )
      .then((response) => this.afterRecipeLoad(response.data));
  }

  deleteRecipe(recipeId) {
    return axios.delete(API_PATH + String(recipeId));
  }

  afterRecipeLoad(recipe) {
    if (recipe) {
      recipe.lastUpdate = new Date(recipe.lastUpdate);
    }
    return recipe;
  }
}

export class RecipeDtoMapper {
  toRecipeCreateDto(detailed) {
    const createDto = {
      name: detailed.name,
      ownerId: detailed.ownerId,
      defaultAmountToFill: detailed.defaultAmountToFill,
      description: detailed.description,
      productionSteps: [],
      defaultGlassId: detailed.defaultGlass?.id,
      categoryIds: [],
    };
    if (detailed.categories) {
      for (const category of detailed.categories) {
        createDto.categoryIds.push(category.id);
      }
    }
    if (detailed.productionSteps) {
      for (const prodStep of detailed.productionSteps) {
        createDto.productionSteps.push(
          this.toProductionStepCreateDto(prodStep),
        );
      }
    }
    return createDto;
  }

  toProductionStepCreateDto(prodStep) {
    if (prodStep.type === 'addIngredients') {
      const stepIngredients = [];
      for (const addedIngredient of prodStep.stepIngredients) {
        stepIngredients.push(
          this.toProductionStepIngredientCreateDto(addedIngredient),
        );
      }
      return {
        type: prodStep.type,
        stepIngredients,
      };
    }

    if (prodStep.type === 'writtenInstruction') {
      return {
        type: prodStep.type,
        message: prodStep.message,
      };
    }
    throw new Error('ProductionStep-Type unknown: ' + prodStep.type);
  }

  toProductionStepIngredientCreateDto(pStepIngredient) {
    return {
      amount: pStepIngredient.amount,
      scale: pStepIngredient.scale,
      boostable: pStepIngredient.boostable,
      ingredientId: pStepIngredient.ingredient.id,
    };
  }
}

export default new RecipeService();

export const recipeDtoMapper = new RecipeDtoMapper();
