export interface User {
  id: number;
  username: string;
  adminLevel: number;
  accountNonLocked: boolean;
  hasPin?: boolean;
  maxDrinksPerDay?: number;
}

export interface OrderingStatus {
  drinksToday: number;
  maxDrinksPerDay: number;
  requirePinAfterDrink: boolean;
  hasPin: boolean;
}
