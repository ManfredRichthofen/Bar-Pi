import { API_PATHS } from '../constants';
import BaseService from './base.service';

export interface SummaryStats {
  totalOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  totalVolumeDispensedMl: number;
  ordersLast24h: number;
  ordersLast7d: number;
  ordersLast30d: number;
  averageDrinkSizeMl: number;
}

export interface InventoryStats {
  totalRecipes: number;
  totalIngredients: number;
  automatedIngredients: number;
  manualIngredients: number;
  ingredientsInBar: number;
  totalPumps: number;
  activePumps: number;
  pumpedUpPumps: number;
  totalPumpFillingMl: number;
  lowLiquidPumps: number;
  totalUsers: number;
  totalCategories: number;
  totalGlasses: number;
}

export interface RecipeStat {
  recipeId: number;
  recipeName: string;
  orderCount: number;
  totalVolumeMl: number;
  lastOrderedAt?: string;
}

export interface IngredientUsageStat {
  ingredientId: number;
  ingredientName: string;
  dtype: string;
  inBar: boolean;
  orderCount: number;
  totalVolumeMl: number;
  recipeCount: number;
}

export interface CategoryStat {
  categoryId: number;
  categoryName: string;
  recipeCount: number;
  orderCount: number;
}

export interface UserOrderStat {
  userId: number;
  username: string;
  orderCount: number;
  totalVolumeMl: number;
}

export interface PumpStat {
  pumpId: number;
  pumpName: string;
  dtype: string;
  ingredientName: string;
  fillingLevelInMl: number;
  bottleSizeMl: number;
  fillPercentage: number;
  isPumpedUp: boolean;
  completed: boolean;
}

export interface DailyOrderStat {
  date: string;
  orderCount: number;
  totalVolumeMl: number;
}

export interface HourlyOrderStat {
  hour: number;
  orderCount: number;
}

export interface CocktailOrderIngredient {
  id: number;
  orderId: number;
  ingredientId?: number;
  ingredientName: string;
  dtype: string;
  amountMl: number;
}

export interface CocktailOrderRecord {
  id: number;
  recipeId?: number;
  recipeName: string;
  userId?: number;
  username: string;
  amountOrderedMl: number;
  status: 'in_progress' | 'completed' | 'cancelled' | 'error' | string;
  startedAt: string;
  completedAt?: string;
  ingredients?: CocktailOrderIngredient[];
}

export interface StatisticsOverview {
  summary: SummaryStats;
  inventory: InventoryStats;
  topRecipes: RecipeStat[];
  topIngredients: IngredientUsageStat[];
  categories: CategoryStat[];
  topUsers: UserOrderStat[];
  pumpStats: PumpStat[];
  dailyTimeline: DailyOrderStat[];
  hourlyDistribution: HourlyOrderStat[];
  recentOrders: CocktailOrderRecord[];
}

const API_PATH = API_PATHS.STATISTICS || 'api/statistics';

export class LegacyBackendStatisticsError extends Error {
  readonly isLegacyBackendError = true;
  constructor(
    message = 'Statistics endpoint is not supported by the original CocktailPi backend',
  ) {
    super(message);
    this.name = 'LegacyBackendStatisticsError';
  }
}

export function isLegacyBackendStatisticsError(error: unknown): boolean {
  if (!error) return false;
  if (
    error instanceof LegacyBackendStatisticsError ||
    (error as any)?.isLegacyBackendError === true
  ) {
    return true;
  }
  const status = (error as any)?.response?.status;
  return status === 404 || status === 405 || status === 501;
}

class StatisticsService extends BaseService {
  async getOverview(
    days = 14,
    token: string | null = null,
  ): Promise<StatisticsOverview> {
    const data = await this.get(API_PATH, (token ?? undefined) as any, {
      params: { days },
    });
    if (
      !data ||
      typeof data !== 'object' ||
      !('summary' in data) ||
      !('inventory' in data)
    ) {
      throw new LegacyBackendStatisticsError();
    }
    return data as StatisticsOverview;
  }

  clearOrderHistory(token: string | null = null): Promise<{ message: string }> {
    return this.delete(`${API_PATH}/orders`, (token ?? undefined) as any);
  }
}

export default new StatisticsService();
