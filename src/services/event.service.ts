import BaseService from './base.service';

export type EventTrigger =
  | 'COCKTAIL_PRODUCTION_STARTED'
  | 'COCKTAIL_PRODUCTION_FINISHED'
  | 'COCKTAIL_PRODUCTION_CANCELLED';

export interface EventAction {
  id: number;
  type: 'gpio';
  name: string;
  trigger: EventTrigger;
  recipeId: number | null;
  pin?: { boardId: number | null; nr: number | null };
  powerStateHigh: boolean;
  durationInMs: number | null;
}

export type EventActionInput = Omit<EventAction, 'id' | 'type'>;

const API_PATH = 'api/event/';

class EventService extends BaseService {
  getEvents(): Promise<EventAction[]> {
    return this.get(API_PATH);
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

  runEvent(id: number) {
    return this.post(`${API_PATH}${id}/run`, {});
  }
}

export default new EventService();
