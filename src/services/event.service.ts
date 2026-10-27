import BaseService from './base.service';

export type EventTrigger =
  | 'APPLICATION_STARTUP'
  | 'COCKTAIL_PRODUCTION_STARTED'
  | 'COCKTAIL_PRODUCTION_MANUAL_INTERACTION_REQUESTED'
  | 'COCKTAIL_PRODUCTION_MANUAL_INTERACTION_COMPLETED'
  | 'COCKTAIL_PRODUCTION_FINISHED'
  | 'COCKTAIL_PRODUCTION_CANCELED';

/** playAudio and execPy exist in CocktailPi but are not supported by the Go backend. */
export type EventActionType = 'doNothing' | 'callUrl' | 'gpio';

export type RequestMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

export interface EventAction {
  id: number;
  type: EventActionType;
  comment: string;
  description?: string;
  trigger: EventTrigger;
  executionGroups: string[];
  recipeId?: number | null;
  url?: string;
  requestMethod?: RequestMethod;
  pin?: { boardId: number | null; nr: number | null };
  powerStateHigh?: boolean;
  durationInMs?: number | null;
}

export type EventActionInput = Omit<EventAction, 'id' | 'description'>;

const API_PATH = 'api/eventaction/';

class EventService extends BaseService {
  getEvents(): Promise<EventAction[]> {
    return this.get(API_PATH);
  }

  getExecutionGroups(): Promise<string[]> {
    return this.get(`${API_PATH}executiongroup`);
  }

  createEvent(event: EventActionInput): Promise<EventAction> {
    return this.post(API_PATH, event);
  }

  updateEvent(id: number, event: EventActionInput): Promise<EventAction> {
    return this.put(`${API_PATH}${id}`, event);
  }

  deleteEvent(id: number) {
    return this.delete(`${API_PATH}${id}`);
  }

  startEvent(id: number) {
    return this.post(`${API_PATH}${id}/start`, {});
  }
}

export default new EventService();
