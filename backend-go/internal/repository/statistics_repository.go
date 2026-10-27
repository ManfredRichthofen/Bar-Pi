package repository

import (
	"fmt"
	"math"
	"time"

	"github.com/ManfredRichthofen/Bar-Pi/backend-go/internal/models"
	"gorm.io/gorm"
)

type StatisticsRepository struct {
	db *gorm.DB
}

func NewStatisticsRepository(db *gorm.DB) *StatisticsRepository {
	return &StatisticsRepository{db: db}
}

// ClearOrderHistory deletes all cocktail order records
func (r *StatisticsRepository) ClearOrderHistory() error {
	return r.db.Session(&gorm.Session{AllowGlobalUpdate: true}).Delete(&models.CocktailOrder{}).Error
}

// GetSummaryStats computes high-level order and volume metrics
func (r *StatisticsRepository) GetSummaryStats() (models.SummaryStats, error) {
	var stats models.SummaryStats

	r.db.Model(&models.CocktailOrder{}).Count(&stats.TotalOrders)
	r.db.Model(&models.CocktailOrder{}).Where("status = ?", "completed").Count(&stats.CompletedOrders)
	r.db.Model(&models.CocktailOrder{}).Where("status = ?", "cancelled").Count(&stats.CancelledOrders)

	r.db.Model(&models.CocktailOrder{}).
		Where("status = ?", "completed").
		Select("COALESCE(SUM(amount_ordered_ml), 0)").
		Scan(&stats.TotalVolumeDispensedMl)

	now := time.Now().UTC()
	last24h := now.Add(-24 * time.Hour)
	last7d := now.AddDate(0, 0, -7)
	last30d := now.AddDate(0, 0, -30)

	r.db.Model(&models.CocktailOrder{}).Where("started_at >= ?", last24h).Count(&stats.OrdersLast24h)
	r.db.Model(&models.CocktailOrder{}).Where("started_at >= ?", last7d).Count(&stats.OrdersLast7d)
	r.db.Model(&models.CocktailOrder{}).Where("started_at >= ?", last30d).Count(&stats.OrdersLast30d)

	if stats.CompletedOrders > 0 {
		avg := float64(stats.TotalVolumeDispensedMl) / float64(stats.CompletedOrders)
		stats.AverageDrinkSizeMl = math.Round(avg*10) / 10
	}

	return stats, nil
}

// GetInventoryStats computes catalog and pump counts
func (r *StatisticsRepository) GetInventoryStats() (models.InventoryStats, error) {
	var inv models.InventoryStats

	r.db.Model(&models.Recipe{}).Count(&inv.TotalRecipes)
	r.db.Model(&models.Ingredient{}).Count(&inv.TotalIngredients)
	r.db.Model(&models.Ingredient{}).Where("dtype = ?", "AutomatedIngredient").Count(&inv.AutomatedIngredients)
	r.db.Model(&models.Ingredient{}).Where("dtype != ?", "AutomatedIngredient").Count(&inv.ManualIngredients)
	r.db.Model(&models.Ingredient{}).Where("in_bar = ?", true).Count(&inv.IngredientsInBar)

	r.db.Model(&models.Pump{}).Count(&inv.TotalPumps)
	r.db.Model(&models.Pump{}).Where("current_ingredient_id IS NOT NULL").Count(&inv.ActivePumps)
	r.db.Model(&models.Pump{}).Where("is_pumped_up = ?", true).Count(&inv.PumpedUpPumps)
	r.db.Model(&models.Pump{}).Select("COALESCE(SUM(filling_level_in_ml), 0)").Scan(&inv.TotalPumpFillingMl)
	r.db.Model(&models.Pump{}).
		Where("current_ingredient_id IS NOT NULL AND filling_level_in_ml < ?", 100).
		Count(&inv.LowLiquidPumps)

	r.db.Model(&models.User{}).Count(&inv.TotalUsers)
	r.db.Model(&models.Category{}).Count(&inv.TotalCategories)
	r.db.Model(&models.Glass{}).Count(&inv.TotalGlasses)

	return inv, nil
}

// GetTopRecipes returns recipes ranked by order count and volume
func (r *StatisticsRepository) GetTopRecipes(limit int) ([]models.RecipeStat, error) {
	if limit <= 0 {
		limit = 10
	}

	type rawRecipeStat struct {
		RecipeID      int64   `gorm:"column:recipe_id"`
		RecipeName    string  `gorm:"column:recipe_name"`
		OrderCount    int64   `gorm:"column:order_count"`
		TotalVolumeMl int64   `gorm:"column:total_volume_ml"`
		LastOrderedAt *string `gorm:"column:last_ordered_at"`
	}

	var rows []rawRecipeStat
	err := r.db.Raw(`
		SELECT
			r.id AS recipe_id,
			r.name AS recipe_name,
			COUNT(co.id) AS order_count,
			COALESCE(SUM(CASE WHEN co.status = 'completed' THEN co.amount_ordered_ml ELSE 0 END), 0) AS total_volume_ml,
			MAX(co.started_at) AS last_ordered_at
		FROM recipes r
		LEFT JOIN cocktail_orders co ON co.recipe_id = r.id AND co.status != 'cancelled'
		GROUP BY r.id, r.name
		ORDER BY order_count DESC, total_volume_ml DESC, LOWER(r.name) ASC
		LIMIT ?
	`, limit).Scan(&rows).Error
	if err != nil {
		return []models.RecipeStat{}, err
	}

	result := make([]models.RecipeStat, 0, len(rows))
	for _, row := range rows {
		stat := models.RecipeStat{
			RecipeID:      row.RecipeID,
			RecipeName:    row.RecipeName,
			OrderCount:    row.OrderCount,
			TotalVolumeMl: row.TotalVolumeMl,
		}
		if row.LastOrderedAt != nil && *row.LastOrderedAt != "" {
			if parsed, parseErr := parseFlexibleTime(*row.LastOrderedAt); parseErr == nil {
				stat.LastOrderedAt = &parsed
			}
		}
		result = append(result, stat)
	}

	return result, nil
}

// GetTopIngredients returns ingredients ranked by usage volume, order count, and recipe count
func (r *StatisticsRepository) GetTopIngredients(limit int) ([]models.IngredientUsageStat, error) {
	if limit <= 0 {
		limit = 15
	}

	var result []models.IngredientUsageStat
	err := r.db.Raw(`
		SELECT
			i.id AS ingredient_id,
			i.name AS ingredient_name,
			i.dtype AS dtype,
			COALESCE(i.in_bar, 0) AS in_bar,
			COALESCE(o.order_count, 0) AS order_count,
			COALESCE(o.total_volume_ml, 0) AS total_volume_ml,
			COALESCE(rc.recipe_count, 0) AS recipe_count
		FROM ingredients i
		LEFT JOIN (
			SELECT
				coi.ingredient_id,
				COUNT(DISTINCT coi.order_id) AS order_count,
				SUM(coi.amount_ml) AS total_volume_ml
			FROM cocktail_order_ingredients coi
			JOIN cocktail_orders co ON co.id = coi.order_id AND co.status = 'completed'
			WHERE coi.ingredient_id IS NOT NULL
			GROUP BY coi.ingredient_id
		) o ON o.ingredient_id = i.id
		LEFT JOIN (
			SELECT
				psi.ingredient_id,
				COUNT(DISTINCT psi.recipe_id) AS recipe_count
			FROM production_step_ingredients psi
			GROUP BY psi.ingredient_id
		) rc ON rc.ingredient_id = i.id
		ORDER BY total_volume_ml DESC, order_count DESC, recipe_count DESC, LOWER(i.name) ASC
		LIMIT ?
	`, limit).Scan(&result).Error
	if err != nil {
		return []models.IngredientUsageStat{}, err
	}
	if result == nil {
		result = []models.IngredientUsageStat{}
	}
	return result, nil
}

// GetCategoryStats returns recipe and order counts per category
func (r *StatisticsRepository) GetCategoryStats() ([]models.CategoryStat, error) {
	var result []models.CategoryStat
	err := r.db.Raw(`
		SELECT
			c.id AS category_id,
			c.name AS category_name,
			COUNT(DISTINCT rc.recipe_id) AS recipe_count,
			COUNT(DISTINCT co.id) AS order_count
		FROM categories c
		LEFT JOIN recipe_categories rc ON rc.category_id = c.id
		LEFT JOIN cocktail_orders co ON co.recipe_id = rc.recipe_id AND co.status = 'completed'
		GROUP BY c.id, c.name
		ORDER BY order_count DESC, recipe_count DESC, LOWER(c.name) ASC
	`).Scan(&result).Error
	if err != nil {
		return []models.CategoryStat{}, err
	}
	if result == nil {
		result = []models.CategoryStat{}
	}
	return result, nil
}

// GetTopUsers returns user order statistics
func (r *StatisticsRepository) GetTopUsers(limit int) ([]models.UserOrderStat, error) {
	if limit <= 0 {
		limit = 10
	}

	var result []models.UserOrderStat
	err := r.db.Raw(`
		SELECT
			u.id AS user_id,
			u.username AS username,
			COUNT(co.id) AS order_count,
			COALESCE(SUM(CASE WHEN co.status = 'completed' THEN co.amount_ordered_ml ELSE 0 END), 0) AS total_volume_ml
		FROM users u
		LEFT JOIN cocktail_orders co ON co.user_id = u.id AND co.status != 'cancelled'
		GROUP BY u.id, u.username
		ORDER BY order_count DESC, total_volume_ml DESC, LOWER(u.username) ASC
		LIMIT ?
	`, limit).Scan(&result).Error
	if err != nil {
		return []models.UserOrderStat{}, err
	}
	if result == nil {
		result = []models.UserOrderStat{}
	}
	return result, nil
}

// GetPumpStats returns current fill levels and status for all pumps
func (r *StatisticsRepository) GetPumpStats() ([]models.PumpStat, error) {
	var pumps []models.Pump
	if err := r.db.Preload("CurrentIngredient").Order("id ASC").Find(&pumps).Error; err != nil {
		return []models.PumpStat{}, err
	}

	result := make([]models.PumpStat, 0, len(pumps))
	for _, p := range pumps {
		pumpName := fmt.Sprintf("Pump #%d", p.ID)
		if p.Name != nil && *p.Name != "" {
			pumpName = *p.Name
		}

		ingredientName := "Unassigned"
		bottleSize := 1000
		if p.CurrentIngredient != nil {
			ingredientName = p.CurrentIngredient.Name
			if p.CurrentIngredient.BottleSize != nil && *p.CurrentIngredient.BottleSize > 0 {
				bottleSize = *p.CurrentIngredient.BottleSize
			}
		}

		fillPct := 0.0
		if bottleSize > 0 && p.FillingLevelInMl > 0 {
			fillPct = math.Min(100, math.Round((float64(p.FillingLevelInMl)/float64(bottleSize))*1000)/10)
		}

		result = append(result, models.PumpStat{
			PumpID:           p.ID,
			PumpName:         pumpName,
			DType:            p.DType,
			IngredientName:   ingredientName,
			FillingLevelInMl: p.FillingLevelInMl,
			BottleSizeMl:     bottleSize,
			FillPercentage:   fillPct,
			IsPumpedUp:       p.IsPumpedUp,
			Completed:        p.Completed,
		})
	}

	return result, nil
}

// GetDailyTimeline returns daily order counts and volume over the past `days` days
func (r *StatisticsRepository) GetDailyTimeline(days int) ([]models.DailyOrderStat, error) {
	if days <= 0 {
		days = 14
	}
	if days > 365 {
		days = 365
	}

	now := time.Now().UTC()
	startDate := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, time.UTC).AddDate(0, 0, -(days - 1))

	var dbRows []models.DailyOrderStat
	err := r.db.Raw(`
		SELECT
			 strftime('%Y-%m-%d', started_at) AS date,
			 COUNT(id) AS order_count,
			 COALESCE(SUM(CASE WHEN status = 'completed' THEN amount_ordered_ml ELSE 0 END), 0) AS total_volume_ml
		FROM cocktail_orders
		WHERE started_at >= ? AND status != 'cancelled'
		GROUP BY strftime('%Y-%m-%d', started_at)
		ORDER BY date ASC
	`, startDate).Scan(&dbRows).Error
	if err != nil {
		return []models.DailyOrderStat{}, err
	}

	byDate := make(map[string]models.DailyOrderStat, len(dbRows))
	for _, row := range dbRows {
		byDate[row.Date] = row
	}

	timeline := make([]models.DailyOrderStat, 0, days)
	for i := 0; i < days; i++ {
		d := startDate.AddDate(0, 0, i).Format("2006-01-02")
		if existing, ok := byDate[d]; ok {
			timeline = append(timeline, existing)
		} else {
			timeline = append(timeline, models.DailyOrderStat{
				Date:          d,
				OrderCount:    0,
				TotalVolumeMl: 0,
			})
		}
	}

	return timeline, nil
}

// GetHourlyDistribution returns order counts for each hour of the day (0-23)
func (r *StatisticsRepository) GetHourlyDistribution() ([]models.HourlyOrderStat, error) {
	var dbRows []models.HourlyOrderStat
	err := r.db.Raw(`
		SELECT
			CAST(strftime('%H', started_at) AS INTEGER) AS hour,
			COUNT(id) AS order_count
		FROM cocktail_orders
		WHERE status != 'cancelled'
		GROUP BY CAST(strftime('%H', started_at) AS INTEGER)
		ORDER BY hour ASC
	`).Scan(&dbRows).Error
	if err != nil {
		return []models.HourlyOrderStat{}, err
	}

	byHour := make(map[int]int64, len(dbRows))
	for _, row := range dbRows {
		byHour[row.Hour] = row.OrderCount
	}

	hours := make([]models.HourlyOrderStat, 24)
	for h := 0; h < 24; h++ {
		hours[h] = models.HourlyOrderStat{
			Hour:       h,
			OrderCount: byHour[h],
		}
	}

	return hours, nil
}

// GetRecentOrders returns the most recent cocktail orders with their ingredients
func (r *StatisticsRepository) GetRecentOrders(limit int) ([]models.CocktailOrder, error) {
	if limit <= 0 {
		limit = 30
	}
	var orders []models.CocktailOrder
	err := r.db.Preload("Ingredients").Order("started_at DESC").Limit(limit).Find(&orders).Error
	if err != nil {
		return []models.CocktailOrder{}, err
	}
	if orders == nil {
		orders = []models.CocktailOrder{}
	}
	return orders, nil
}

func parseFlexibleTime(raw string) (time.Time, error) {
	layouts := []string{
		time.RFC3339Nano,
		time.RFC3339,
		"2006-01-02 15:04:05.999999999-07:00",
		"2006-01-02 15:04:05.999999999Z",
		"2006-01-02 15:04:05.999999999",
		"2006-01-02 15:04:05",
		"2006-01-02T15:04:05",
	}
	for _, layout := range layouts {
		if t, err := time.Parse(layout, raw); err == nil {
			return t, nil
		}
	}
	return time.Time{}, fmt.Errorf("unable to parse time: %s", raw)
}
