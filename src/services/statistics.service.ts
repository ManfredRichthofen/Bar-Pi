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

class StatisticsService extends BaseService {
  /**
   * Fetch aggregated statistics overview
   * @param days - Timeline window in days (default: 14)
   * @param token - Optional JWT token
   */
  getOverview(
    days = 14,
    token: string | null = null,
  ): Promise<StatisticsOverview> {
    return this.get(API_PATH, (token ?? undefined) as any, {
      params: { days },
    });
  }

  /**
   * Fetch top recipes by orders and volume
   */
  getTopRecipes(
    limit = 15,
    token: string | null = null,
  ): Promise<RecipeStat[]> {
    return this.get(`${API_PATH}/recipes`, (token ?? undefined) as any, {
      params: { limit },
    });
  }

  /**
   * Fetch top ingredients by usage and recipe coverage
   */
  getTopIngredients(
    limit = 20,
    token: string | null = null,
  ): Promise<IngredientUsageStat[]> {
    return this.get(`${API_PATH}/ingredients`, (token ?? undefined) as any, {
      params: { limit },
    });
  }

  /**
   * Fetch recent cocktail order records
   */
  getRecentOrders(
    limit = 30,
    token: string | null = null,
  ): Promise<CocktailOrderRecord[]> {
    return this.get(`${API_PATH}/orders`, (token ?? undefined) as any, {
      params: { limit },
    });
  }

  /**
   * Clear all recorded cocktail order history (requires admin role)
   */
  clearOrderHistory(
    token: string | null = null,
  ): Promise<{ message: string }> {
    return this.delete(`${API_PATH}/orders`, (token ?? undefined) as any);
  }
}

export default new StatisticsService();
