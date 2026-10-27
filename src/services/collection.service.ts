import { API_PATHS } from '../constants';
import BaseService from './base.service';

export interface CollectionRecipe {
  id: number;
  name: string;
  description?: string;
}

export interface Collection {
  id: number;
  name: string;
  description?: string;
  ownerId: number;
  owner?: { id: number; username: string };
  recipes?: CollectionRecipe[];
}

export interface CollectionInput {
  name: string;
  description?: string;
}

const API_PATH = API_PATHS.COLLECTION;

class CollectionService extends BaseService {
  getCollections(): Promise<Collection[]> {
    return this.get(API_PATH);
  }

  createCollection(collection: CollectionInput): Promise<Collection> {
    return this.post(API_PATH, collection);
  }

  updateCollection(
    id: number,
    collection: CollectionInput,
  ): Promise<Collection> {
    return this.put(`${API_PATH}${id}`, collection);
  }

  deleteCollection(id: number) {
    return this.delete(`${API_PATH}${id}`);
  }

  addRecipe(collectionId: number, recipeId: number) {
    return this.post(`${API_PATH}${collectionId}/add`, { recipeId });
  }

  removeRecipe(collectionId: number, recipeId: number) {
    return this.delete(`${API_PATH}${collectionId}/${recipeId}`);
  }
}

export default new CollectionService();
