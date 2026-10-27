import {
  Activity,
  AlertCircle,
  AlertTriangle,
  Award,
  BarChart3,
  BookText,
  CheckCircle2,
  Clock,
  Droplets,
  FlaskConical,
  Gauge,
  GlassWater,
  Martini,
  RefreshCw,
  Tag,
  Trash2,
  TrendingUp,
  Users,
  XCircle,
} from 'lucide-react';
import type React from 'react';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from '@/components/ui/toast';
import { EmptyState, PageHeader } from '@/components/AdvancedMode';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCurrentUser } from '../../../hooks/useCurrentUser';
import { useStatistics } from '../../../hooks/useStatistics';
import { hasPermission, mapAdminLevelToRole } from '../../../utils/roleAccess';

const TIME_RANGES = [
  { value: '7', label: 'Last 7 days' },
  { value: '14', label: 'Last 14 days' },
  { value: '30', label: 'Last 30 days' },
  { value: '90', label: 'Last 90 days' },
];

function formatVolume(ml: number): string {
  if (ml >= 1000) {
    return `${(ml / 1000).toFixed(2)} L`;
  }
  return `${Math.round(ml)} ml`;
}

function formatDateShort(dateStr: string): string {
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[1]}/${parts[2]}`;
  }
  return dateStr;
}

function formatDateTime(iso?: string): string {
  if (!iso) return 'Never';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatDuration(startedAt: string, completedAt?: string): string {
  if (!completedAt) return '—';
  const start = new Date(startedAt).getTime();
  const end = new Date(completedAt).getTime();
  if (Number.isNaN(start) || Number.isNaN(end) || end < start) return '—';
  const diffSec = Math.round((end - start) / 1000);
  if (diffSec < 60) return `${diffSec}s`;
  const mins = Math.floor(diffSec / 60);
  const secs = diffSec % 60;
  return `${mins}m ${secs}s`;
}

export const StatisticsPage: React.FC = () => {
  const { t } = useTranslation();
  const [days, setDays] = useState<number>(14);
  const [confirmClearOpen, setConfirmClearOpen] = useState(false);

  const { user: currentUser } = useCurrentUser();
  const canResetStats = useMemo(() => {
    if (!currentUser) return false;
    const role = mapAdminLevelToRole(currentUser.adminLevel);
    return hasPermission(role, 'canManageUsers');
  }, [currentUser]);

  const {
    statistics,
    loading,
    fetching,
    isLegacyBackend,
    error,
    refetch,
    clearHistory,
    clearingHistory,
  } = useStatistics(days);

  const handleClearHistory = async () => {
    try {
      await clearHistory();
      toast.success(
        t('statistics.history_cleared', 'Order statistics cleared'),
      );
      setConfirmClearOpen(false);
    } catch (err: any) {
      toast.error(
        err?.message ||
          t('statistics.clear_failed', 'Failed to clear statistics'),
      );
    }
  };

  const summary = statistics?.summary;
  const inventory = statistics?.inventory;
  const dailyTimeline = statistics?.dailyTimeline ?? [];
  const hourlyDistribution = statistics?.hourlyDistribution ?? [];
  const topRecipes = statistics?.topRecipes ?? [];
  const topIngredients = statistics?.topIngredients ?? [];
  const categories = statistics?.categories ?? [];
  const topUsers = statistics?.topUsers ?? [];
  const pumpStats = statistics?.pumpStats ?? [];
  const recentOrders = statistics?.recentOrders ?? [];

  const maxDailyOrders = useMemo(
    () => Math.max(1, ...dailyTimeline.map((d) => d.orderCount)),
    [dailyTimeline],
  );

  const maxHourlyOrders = useMemo(
    () => Math.max(1, ...hourlyDistribution.map((h) => h.orderCount)),
    [hourlyDistribution],
  );

  const maxRecipeOrders = useMemo(
    () => Math.max(1, ...topRecipes.map((r) => r.orderCount)),
    [topRecipes],
  );

  const maxIngredientVolume = useMemo(
    () => Math.max(1, ...topIngredients.map((i) => i.totalVolumeMl)),
    [topIngredients],
  );

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        title={t('statistics.title', 'Statistics')}
        subtitle={t(
          'statistics.subtitle',
          'Cocktail production metrics, ingredient usage, and pump telemetry',
        )}
        action={
          <>
            <Select
              value={String(days)}
              onValueChange={(val) => {
                if (val) setDays(Number(val));
              }}
            >
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIME_RANGES.map((range) => (
                  <SelectItem key={range.value} value={range.value}>
                    {range.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              onClick={() => void refetch()}
              disabled={fetching}
            >
              <RefreshCw className={fetching ? 'animate-spin' : ''} />
              {t('statistics.refresh', 'Refresh')}
            </Button>

            {canResetStats && (summary?.totalOrders ?? 0) > 0 && (
              <Button
                variant="destructive"
                onClick={() => setConfirmClearOpen(true)}
                disabled={clearingHistory}
              >
                <Trash2 />
                {t('statistics.clear_history', 'Reset History')}
              </Button>
            )}
          </>
        }
      />

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 space-y-6">
        {isLegacyBackend && (
          <Alert variant="warning">
            <AlertTriangle className="size-6" />
            <AlertTitle>
              {t(
                'statistics.legacy_backend_title',
                'Original CocktailPi Service Detected',
              )}
            </AlertTitle>
            <AlertDescription>
              {t(
                'statistics.legacy_backend_warning',
                'You are currently connected to the original CocktailPi backend service. Statistics tracking, order history, and volume telemetry are only supported by the new Bar-Pi Go backend.',
              )}
            </AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="size-6" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {loading && !statistics ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, idx) => (
                <Card key={idx}>
                  <CardHeader>
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-9 w-24 mt-2" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-4 w-36" />
                  </CardContent>
                </Card>
              ))}
            </div>
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-48" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-64 w-full" />
              </CardContent>
            </Card>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <span className="eyebrow">
                      {t('statistics.kpi.drinks_served', 'Drinks Served')}
                    </span>
                    <Martini className="size-5 text-foreground-muted" />
                  </div>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="font-mono text-3xl sm:text-4xl font-semibold tabular-nums">
                      {summary?.completedOrders ?? 0}
                    </span>
                    <span className="text-sm text-foreground-muted">
                      / {summary?.totalOrders ?? 0} total
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap items-center gap-2 text-sm text-foreground-muted">
                    <Badge variant="success">
                      {summary?.ordersLast24h ?? 0} today
                    </Badge>
                    <span>{summary?.ordersLast7d ?? 0} this week</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <span className="eyebrow">
                      {t('statistics.kpi.volume_dispensed', 'Volume Dispensed')}
                    </span>
                    <Droplets className="size-5 text-info" />
                  </div>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="font-mono text-3xl sm:text-4xl font-semibold tabular-nums">
                      {formatVolume(summary?.totalVolumeDispensedMl ?? 0)}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-foreground-muted">
                    Avg drink size:{' '}
                    <span className="font-mono font-medium text-foreground">
                      {summary?.averageDrinkSizeMl ?? 0} ml
                    </span>
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <span className="eyebrow">
                      {t('statistics.kpi.pump_system', 'Pump Readiness')}
                    </span>
                    <Gauge className="size-5 text-success" />
                  </div>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="font-mono text-3xl sm:text-4xl font-semibold tabular-nums">
                      {inventory?.activePumps ?? 0}
                    </span>
                    <span className="text-sm text-foreground-muted">
                      / {inventory?.totalPumps ?? 0} active
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap items-center gap-2 text-sm text-foreground-muted">
                    <span className="font-mono text-foreground">
                      {formatVolume(inventory?.totalPumpFillingMl ?? 0)}
                    </span>
                    <span>loaded</span>
                    {(inventory?.lowLiquidPumps ?? 0) > 0 && (
                      <Badge variant="warning">
                        {inventory?.lowLiquidPumps} low
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <span className="eyebrow">
                      {t('statistics.kpi.bar_catalog', 'Bar Catalog')}
                    </span>
                    <FlaskConical className="size-5 text-warning" />
                  </div>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="font-mono text-3xl sm:text-4xl font-semibold tabular-nums">
                      {inventory?.totalRecipes ?? 0}
                    </span>
                    <span className="text-sm text-foreground-muted">
                      recipes
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-foreground-muted">
                    <span className="font-mono font-medium text-foreground">
                      {inventory?.ingredientsInBar ?? 0}
                    </span>{' '}
                    of {inventory?.totalIngredients ?? 0} ingredients in bar
                  </p>
                </CardContent>
              </Card>
            </div>

            <Tabs defaultValue="overview" className="space-y-6">
              <div className="overflow-x-auto pb-1">
                <TabsList>
                  <TabsTrigger value="overview">
                    <BarChart3 className="size-5" />
                    {t('statistics.tabs.overview', 'Overview')}
                  </TabsTrigger>
                  <TabsTrigger value="drinks">
                    <Martini className="size-5" />
                    {t('statistics.tabs.drinks', 'Drinks & Ingredients')}
                  </TabsTrigger>
                  <TabsTrigger value="pumps">
                    <Gauge className="size-5" />
                    {t('statistics.tabs.pumps', 'Pumps & Inventory')}
                  </TabsTrigger>
                  <TabsTrigger value="history">
                    <Clock className="size-5" />
                    {t('statistics.tabs.history', 'Order History')}
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="overview" className="space-y-6">
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                  <Card className="lg:col-span-2">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="size-5 text-primary" />
                        {t(
                          'statistics.charts.daily_orders',
                          `Daily Orders (${days} Days)`,
                        )}
                      </CardTitle>
                      <CardDescription>
                        Completed and active cocktail orders per day
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {dailyTimeline.length === 0 ? (
                        <p className="py-12 text-center text-sm text-foreground-muted">
                          No timeline data available
                        </p>
                      ) : (
                        <div className="space-y-3">
                          <div className="flex h-52 items-end gap-1.5 sm:gap-2 pt-6 border-b border-border pb-2 overflow-x-auto">
                            {dailyTimeline.map((day) => {
                              const heightPct =
                                day.orderCount > 0
                                  ? Math.max(
                                      10,
                                      Math.round(
                                        (day.orderCount / maxDailyOrders) * 100,
                                      ),
                                    )
                                  : 4;
                              return (
                                <div
                                  key={day.date}
                                  className="group relative flex flex-1 min-w-[24px] flex-col items-center h-full justify-end"
                                  title={`${day.date}: ${day.orderCount} orders (${day.totalVolumeMl} ml)`}
                                >
                                  {day.orderCount > 0 && (
                                    <span className="mb-1 font-mono text-xs text-foreground-muted tabular-nums">
                                      {day.orderCount}
                                    </span>
                                  )}
                                  <div
                                    className={`w-full max-w-[36px] rounded-t-sm transition-all ${
                                      day.orderCount > 0
                                        ? 'bg-primary group-hover:opacity-80'
                                        : 'bg-surface-sunken'
                                    }`}
                                    style={{ height: `${heightPct}%` }}
                                  />
                                </div>
                              );
                            })}
                          </div>
                          <div className="flex justify-between text-xs font-mono text-foreground-muted">
                            <span>
                              {dailyTimeline[0]
                                ? formatDateShort(dailyTimeline[0].date)
                                : ''}
                            </span>
                            {dailyTimeline.length > 2 && (
                              <span>
                                {formatDateShort(
                                  dailyTimeline[
                                    Math.floor(dailyTimeline.length / 2)
                                  ].date,
                                )}
                              </span>
                            )}
                            <span>
                              {dailyTimeline[dailyTimeline.length - 1]
                                ? formatDateShort(
                                    dailyTimeline[dailyTimeline.length - 1]
                                      .date,
                                  )
                                : ''}
                            </span>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Activity className="size-5 text-info" />
                        {t('statistics.charts.hourly', 'Hourly Activity')}
                      </CardTitle>
                      <CardDescription>
                        Orders grouped by hour of day (UTC)
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex h-52 items-end gap-1 pt-6 border-b border-border pb-2">
                          {hourlyDistribution.map((slot) => {
                            const heightPct =
                              slot.orderCount > 0
                                ? Math.max(
                                    10,
                                    Math.round(
                                      (slot.orderCount / maxHourlyOrders) * 100,
                                    ),
                                  )
                                : 4;
                            return (
                              <div
                                key={slot.hour}
                                className="flex flex-1 flex-col items-center h-full justify-end"
                                title={`${String(slot.hour).padStart(2, '0')}:00 — ${slot.orderCount} orders`}
                              >
                                <div
                                  className={`w-full rounded-t-xs transition-all ${
                                    slot.orderCount > 0
                                      ? 'bg-info'
                                      : 'bg-surface-sunken'
                                  }`}
                                  style={{ height: `${heightPct}%` }}
                                />
                              </div>
                            );
                          })}
                        </div>
                        <div className="flex justify-between text-xs font-mono text-foreground-muted">
                          <span>00:00</span>
                          <span>06:00</span>
                          <span>12:00</span>
                          <span>18:00</span>
                          <span>23:00</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Award className="size-5 text-warning" />
                        {t('statistics.top_recipes', 'Most Popular Drinks')}
                      </CardTitle>
                      <CardDescription>
                        Top recipes ranked by number of orders
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {topRecipes.length === 0 ? (
                        <p className="py-8 text-center text-sm text-foreground-muted">
                          No recipes found
                        </p>
                      ) : (
                        <div className="space-y-4">
                          {topRecipes.slice(0, 6).map((recipe, index) => {
                            const pct =
                              recipe.orderCount > 0
                                ? Math.round(
                                    (recipe.orderCount / maxRecipeOrders) * 100,
                                  )
                                : 0;
                            return (
                              <div
                                key={recipe.recipeId}
                                className="space-y-1.5"
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-2.5 min-w-0">
                                    <span className="font-mono text-sm text-foreground-muted w-6">
                                      #{index + 1}
                                    </span>
                                    <span className="font-medium truncate">
                                      {recipe.recipeName}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2 shrink-0">
                                    <span className="font-mono text-sm text-foreground-muted">
                                      {formatVolume(recipe.totalVolumeMl)}
                                    </span>
                                    <Badge variant="default">
                                      {recipe.orderCount}{' '}
                                      {recipe.orderCount === 1
                                        ? 'order'
                                        : 'orders'}
                                    </Badge>
                                  </div>
                                </div>
                                <Progress value={pct} />
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Users className="size-5 text-primary" />
                        {t('statistics.top_users', 'Top Users')}
                      </CardTitle>
                      <CardDescription>
                        Users ranked by cocktails ordered
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {topUsers.length === 0 ? (
                        <p className="py-8 text-center text-sm text-foreground-muted">
                          No user activity recorded yet
                        </p>
                      ) : (
                        <div className="space-y-3">
                          {topUsers.map((userStat, idx) => (
                            <div
                              key={userStat.userId}
                              className="flex items-center justify-between rounded-md bg-surface-sunken px-4 py-3"
                            >
                              <div className="flex items-center gap-3">
                                <span className="font-mono text-sm text-foreground-muted">
                                  #{idx + 1}
                                </span>
                                <span className="font-medium">
                                  {userStat.username}
                                </span>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="font-mono text-sm text-foreground-muted">
                                  {formatVolume(userStat.totalVolumeMl)}
                                </span>
                                <Badge variant="solid">
                                  {userStat.orderCount}{' '}
                                  {userStat.orderCount === 1
                                    ? 'drink'
                                    : 'drinks'}
                                </Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="drinks" className="space-y-6">
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <BookText className="size-5 text-info" />
                        {t(
                          'statistics.ingredient_usage',
                          'Ingredient Consumption & Coverage',
                        )}
                      </CardTitle>
                      <CardDescription>
                        Volume dispensed across orders and number of recipes
                        using each ingredient
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {topIngredients.length === 0 ? (
                        <p className="py-8 text-center text-sm text-foreground-muted">
                          No ingredients configured
                        </p>
                      ) : (
                        <div className="space-y-4">
                          {topIngredients.map((ing) => {
                            const pct =
                              ing.totalVolumeMl > 0
                                ? Math.round(
                                    (ing.totalVolumeMl / maxIngredientVolume) *
                                      100,
                                  )
                                : 0;
                            const isAutomated =
                              ing.dtype === 'AutomatedIngredient';
                            return (
                              <div
                                key={ing.ingredientId}
                                className="space-y-1.5"
                              >
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                  <div className="flex items-center gap-2 min-w-0">
                                    <span className="font-medium truncate">
                                      {ing.ingredientName}
                                    </span>
                                    <Badge
                                      variant={
                                        isAutomated ? 'info' : 'secondary'
                                      }
                                    >
                                      {isAutomated ? 'Auto' : 'Manual'}
                                    </Badge>
                                    {ing.inBar && (
                                      <Badge variant="success">In Bar</Badge>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2 text-sm font-mono">
                                    <span className="text-foreground-muted">
                                      {ing.recipeCount}{' '}
                                      {ing.recipeCount === 1
                                        ? 'recipe'
                                        : 'recipes'}
                                    </span>
                                    <Badge variant="default">
                                      {formatVolume(ing.totalVolumeMl)}
                                    </Badge>
                                  </div>
                                </div>
                                <Progress value={pct} />
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <div className="space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Tag className="size-5 text-warning" />
                          {t(
                            'statistics.categories',
                            'Categories Distribution',
                          )}
                        </CardTitle>
                        <CardDescription>
                          Recipes and completed orders by drink category
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        {categories.length === 0 ? (
                          <p className="py-6 text-center text-sm text-foreground-muted">
                            No categories defined
                          </p>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {categories.map((cat) => (
                              <div
                                key={cat.categoryId}
                                className="flex items-center justify-between rounded-md bg-surface-sunken px-4 py-3"
                              >
                                <div>
                                  <p className="font-medium">
                                    {cat.categoryName}
                                  </p>
                                  <p className="text-xs text-foreground-muted font-mono">
                                    {cat.recipeCount}{' '}
                                    {cat.recipeCount === 1
                                      ? 'recipe'
                                      : 'recipes'}
                                  </p>
                                </div>
                                <Badge variant="default">
                                  {cat.orderCount}{' '}
                                  {cat.orderCount === 1 ? 'order' : 'orders'}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Martini className="size-5 text-primary" />
                          {t(
                            'statistics.recipe_leaderboard',
                            'Recipe Leaderboard',
                          )}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {topRecipes.length === 0 ? (
                          <p className="py-6 text-center text-sm text-foreground-muted">
                            No recipes available
                          </p>
                        ) : (
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Recipe</TableHead>
                                <TableHead>Orders</TableHead>
                                <TableHead>Volume</TableHead>
                                <TableHead>Last Ordered</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {topRecipes.map((rec) => (
                                <TableRow key={rec.recipeId}>
                                  <TableCell className="font-medium">
                                    {rec.recipeName}
                                  </TableCell>
                                  <TableCell className="font-mono">
                                    {rec.orderCount}
                                  </TableCell>
                                  <TableCell className="font-mono">
                                    {formatVolume(rec.totalVolumeMl)}
                                  </TableCell>
                                  <TableCell className="text-sm text-foreground-muted">
                                    {formatDateTime(rec.lastOrderedAt)}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="pumps" className="space-y-6">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <Card>
                    <CardHeader className="pb-2">
                      <span className="eyebrow">Automated Ingredients</span>
                      <div className="mt-1 font-mono text-3xl font-semibold">
                        {inventory?.automatedIngredients ?? 0}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-foreground-muted">
                        Configured for pump dispensing
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <span className="eyebrow">Manual Ingredients</span>
                      <div className="mt-1 font-mono text-3xl font-semibold">
                        {inventory?.manualIngredients ?? 0}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-foreground-muted">
                        Hand-added garnishes & mixers
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <span className="eyebrow">Glassware & Categories</span>
                      <div className="mt-1 font-mono text-3xl font-semibold">
                        {inventory?.totalGlasses ?? 0}{' '}
                        <span className="text-base font-normal text-foreground-muted">
                          glasses
                        </span>{' '}
                        · {inventory?.totalCategories ?? 0}{' '}
                        <span className="text-base font-normal text-foreground-muted">
                          categories
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-foreground-muted">
                        Serving configurations
                      </p>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Gauge className="size-5 text-primary" />
                      {t(
                        'statistics.pump_telemetry',
                        'Pump Fill Levels & Status',
                      )}
                    </CardTitle>
                    <CardDescription>
                      Current liquid volume remaining per pump relative to
                      bottle capacity
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {pumpStats.length === 0 ? (
                      <EmptyState
                        icon={<Gauge className="h-12 w-12" />}
                        title="No Pumps Configured"
                        description="Add pumps in the Pumps management page to monitor liquid levels and hardware status."
                      />
                    ) : (
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        {pumpStats.map((pump) => {
                          const isLow =
                            pump.ingredientName !== 'Unassigned' &&
                            pump.fillingLevelInMl < 100;
                          return (
                            <div
                              key={pump.pumpId}
                              className="rounded-md border border-border bg-surface-sunken p-4 space-y-3"
                            >
                              <div className="flex flex-wrap items-start justify-between gap-2">
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-semibold">
                                      {pump.pumpName}
                                    </span>
                                    <Badge variant="outline">
                                      {pump.dtype === 'StepperPump'
                                        ? 'Stepper'
                                        : pump.dtype === 'Valve'
                                          ? 'Valve'
                                          : 'DC'}
                                    </Badge>
                                  </div>
                                  <p className="text-sm text-foreground-muted mt-0.5">
                                    {pump.ingredientName}
                                  </p>
                                </div>
                                <div className="flex flex-wrap items-center gap-1.5">
                                  {isLow && (
                                    <Badge variant="warning">
                                      <AlertTriangle className="size-3.5" />
                                      Low Liquid
                                    </Badge>
                                  )}
                                  <Badge
                                    variant={
                                      pump.isPumpedUp ? 'success' : 'secondary'
                                    }
                                  >
                                    {pump.isPumpedUp ? 'Primed' : 'Unprimed'}
                                  </Badge>
                                </div>
                              </div>

                              <div className="space-y-1">
                                <div className="flex justify-between text-xs font-mono text-foreground-muted">
                                  <span>
                                    {pump.fillingLevelInMl} ml /{' '}
                                    {pump.bottleSizeMl} ml
                                  </span>
                                  <span>{pump.fillPercentage}%</span>
                                </div>
                                <Progress value={pump.fillPercentage} />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="history" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="size-5 text-primary" />
                      {t('statistics.recent_orders', 'Recent Cocktail Orders')}
                    </CardTitle>
                    <CardDescription>
                      Latest drink production runs with status, volume, and
                      duration
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {recentOrders.length === 0 ? (
                      <EmptyState
                        icon={<GlassWater className="h-12 w-12" />}
                        title="No Orders Recorded Yet"
                        description="Order a cocktail from the Drinks page to start tracking production history and volume statistics."
                      />
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>ID</TableHead>
                            <TableHead>Drink</TableHead>
                            <TableHead>User</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Started</TableHead>
                            <TableHead>Duration</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {recentOrders.map((order) => {
                            const statusVariant =
                              order.status === 'completed'
                                ? 'success'
                                : order.status === 'cancelled'
                                  ? 'destructive'
                                  : order.status === 'in_progress'
                                    ? 'info'
                                    : 'warning';
                            return (
                              <TableRow key={order.id}>
                                <TableCell className="font-mono text-sm text-foreground-muted">
                                  #{order.id}
                                </TableCell>
                                <TableCell className="font-medium">
                                  {order.recipeName}
                                </TableCell>
                                <TableCell>{order.username}</TableCell>
                                <TableCell className="font-mono">
                                  {order.amountOrderedMl} ml
                                </TableCell>
                                <TableCell>
                                  <Badge variant={statusVariant}>
                                    {order.status === 'completed' && (
                                      <CheckCircle2 className="size-3.5" />
                                    )}
                                    {order.status === 'cancelled' && (
                                      <XCircle className="size-3.5" />
                                    )}
                                    {order.status}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-sm text-foreground-muted">
                                  {formatDateTime(order.startedAt)}
                                </TableCell>
                                <TableCell className="font-mono text-sm text-foreground-muted">
                                  {formatDuration(
                                    order.startedAt,
                                    order.completedAt,
                                  )}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>

      <ConfirmationDialog
        open={confirmClearOpen}
        onOpenChange={setConfirmClearOpen}
        title={t('statistics.confirm_clear_title', 'Reset Order Statistics?')}
        description={t(
          'statistics.confirm_clear_description',
          'This will permanently delete all recorded cocktail order history and reset volume counters to zero. Recipes, ingredients, and pumps will not be affected.',
        )}
        confirmText={t('statistics.confirm_clear_btn', 'Reset History')}
        cancelText={t('common.cancel', 'Cancel')}
        variant="destructive"
        onConfirm={() => void handleClearHistory()}
      />
    </div>
  );
};

export default StatisticsPage;
