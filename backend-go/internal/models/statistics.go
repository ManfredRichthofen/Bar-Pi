package models

import "time"

// CocktailOrder represents a persisted cocktail order record for statistics
type CocktailOrder struct {
	ID              int64                     `gorm:"primaryKey;autoIncrement" json:"id"`
	RecipeID        *int64                    `gorm:"column:recipe_id" json:"recipeId,omitempty"`
	RecipeName      string                    `gorm:"column:recipe_name;not null" json:"recipeName"`
	UserID          *int64                    `gorm:"column:user_id" json:"userId,omitempty"`
	Username        string                    `gorm:"column:username;not null" json:"username"`
	AmountOrderedMl int                       `gorm:"column:amount_ordered_ml;not null;default:250" json:"amountOrderedMl"`
	Status          string                    `gorm:"column:status;not null;default:'in_progress'" json:"status"`
	StartedAt       time.Time                 `gorm:"column:started_at;not null" json:"startedAt"`
	CompletedAt     *time.Time                `gorm:"column:completed_at" json:"completedAt,omitempty"`
	Ingredients     []CocktailOrderIngredient `gorm:"foreignKey:OrderID" json:"ingredients,omitempty"`
}

func (CocktailOrder) TableName() string {
	return "cocktail_orders"
}

// CocktailOrderIngredient represents an ingredient dispensed or used in an order
type CocktailOrderIngredient struct {
	ID             int64  `gorm:"primaryKey;autoIncrement" json:"id"`
	OrderID        int64  `gorm:"column:order_id;not null" json:"orderId"`
	IngredientID   *int64 `gorm:"column:ingredient_id" json:"ingredientId,omitempty"`
	IngredientName string `gorm:"column:ingredient_name;not null" json:"ingredientName"`
	DType          string `gorm:"column:dtype;not null;default:'AutomatedIngredient'" json:"dtype"`
	AmountMl       int    `gorm:"column:amount_ml;not null;default:0" json:"amountMl"`
}

func (CocktailOrderIngredient) TableName() string {
	return "cocktail_order_ingredients"
}

// SummaryStats contains top-level order and volume KPIs
type SummaryStats struct {
	TotalOrders            int64   `json:"totalOrders"`
	CompletedOrders        int64   `json:"completedOrders"`
	CancelledOrders        int64   `json:"cancelledOrders"`
	TotalVolumeDispensedMl int64   `json:"totalVolumeDispensedMl"`
	OrdersLast24h          int64   `json:"ordersLast24h"`
	OrdersLast7d           int64   `json:"ordersLast7d"`
	OrdersLast30d          int64   `json:"ordersLast30d"`
	AverageDrinkSizeMl     float64 `json:"averageDrinkSizeMl"`
}

// InventoryStats contains catalog and hardware counts
type InventoryStats struct {
	TotalRecipes         int64 `json:"totalRecipes"`
	TotalIngredients     int64 `json:"totalIngredients"`
	AutomatedIngredients int64 `json:"automatedIngredients"`
	ManualIngredients    int64 `json:"manualIngredients"`
	IngredientsInBar     int64 `json:"ingredientsInBar"`
	TotalPumps           int64 `json:"totalPumps"`
	ActivePumps          int64 `json:"activePumps"`
	PumpedUpPumps        int64 `json:"pumpedUpPumps"`
	TotalPumpFillingMl   int64 `json:"totalPumpFillingMl"`
	LowLiquidPumps       int64 `json:"lowLiquidPumps"`
	TotalUsers           int64 `json:"totalUsers"`
	TotalCategories      int64 `json:"totalCategories"`
	TotalGlasses         int64 `json:"totalGlasses"`
}

// RecipeStat represents order and volume metrics for a single recipe
type RecipeStat struct {
	RecipeID      int64      `json:"recipeId"`
	RecipeName    string     `json:"recipeName"`
	OrderCount    int64      `json:"orderCount"`
	TotalVolumeMl int64      `json:"totalVolumeMl"`
	LastOrderedAt *time.Time `json:"lastOrderedAt,omitempty"`
}

// IngredientUsageStat represents ingredient usage across orders and recipes
type IngredientUsageStat struct {
	IngredientID   int64  `json:"ingredientId"`
	IngredientName string `json:"ingredientName"`
	DType          string `json:"dtype"`
	InBar          bool   `json:"inBar"`
	OrderCount     int64  `json:"orderCount"`
	TotalVolumeMl  int64  `json:"totalVolumeMl"`
	RecipeCount    int64  `json:"recipeCount"`
}

// CategoryStat represents recipe and order counts per category
type CategoryStat struct {
	CategoryID   int64  `json:"categoryId"`
	CategoryName string `json:"categoryName"`
	RecipeCount  int64  `json:"recipeCount"`
	OrderCount   int64  `json:"orderCount"`
}

// UserOrderStat represents order activity for a user
type UserOrderStat struct {
	UserID        int64  `json:"userId"`
	Username      string `json:"username"`
	OrderCount    int64  `json:"orderCount"`
	TotalVolumeMl int64  `json:"totalVolumeMl"`
}

// PumpStat represents pump fill level and status for statistics
type PumpStat struct {
	PumpID           int64   `json:"pumpId"`
	PumpName         string  `json:"pumpName"`
	DType            string  `json:"dtype"`
	IngredientName   string  `json:"ingredientName"`
	FillingLevelInMl int     `json:"fillingLevelInMl"`
	BottleSizeMl     int     `json:"bottleSizeMl"`
	FillPercentage   float64 `json:"fillPercentage"`
	IsPumpedUp       bool    `json:"isPumpedUp"`
	Completed        bool    `json:"completed"`
}

// DailyOrderStat represents order count and volume for a single calendar date
type DailyOrderStat struct {
	Date          string `json:"date"`
	OrderCount    int64  `json:"orderCount"`
	TotalVolumeMl int64  `json:"totalVolumeMl"`
}

// HourlyOrderStat represents order count for an hour of the day (0-23)
type HourlyOrderStat struct {
	Hour       int   `json:"hour"`
	OrderCount int64 `json:"orderCount"`
}

// StatisticsOverview aggregates all statistics for the Advanced Mode dashboard
type StatisticsOverview struct {
	Summary            SummaryStats          `json:"summary"`
	Inventory          InventoryStats        `json:"inventory"`
	TopRecipes         []RecipeStat          `json:"topRecipes"`
	TopIngredients     []IngredientUsageStat `json:"topIngredients"`
	Categories         []CategoryStat        `json:"categories"`
	TopUsers           []UserOrderStat       `json:"topUsers"`
	PumpStats          []PumpStat            `json:"pumpStats"`
	DailyTimeline      []DailyOrderStat      `json:"dailyTimeline"`
	HourlyDistribution []HourlyOrderStat     `json:"hourlyDistribution"`
	RecentOrders       []CocktailOrder       `json:"recentOrders"`
}
