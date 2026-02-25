package models

import "time"

type Recipe struct {
	ID             int64              `gorm:"primaryKey;autoIncrement" json:"id"`
	Name           string             `gorm:"not null" json:"name"`
	Description    string             `json:"description"`
	HasImage       bool               `gorm:"not null;default:false" json:"hasImage"`
	OwnerID        int64              `gorm:"not null" json:"ownerId"`
	Owner          *User              `gorm:"foreignKey:OwnerID" json:"owner,omitempty"`
	GlassID        *int64             `json:"glassId"`
	DefaultGlass   *Glass             `gorm:"foreignKey:GlassID" json:"defaultGlass,omitempty"`
	LastUpdate     time.Time          `gorm:"autoUpdateTime:nano" json:"lastUpdate"`
	CreatedAt      time.Time          `gorm:"autoCreateTime:nano" json:"createdAt"`
	ProductionSteps []ProductionStep  `gorm:"foreignKey:RecipeID" json:"productionSteps,omitempty"`
	Categories     []Category         `gorm:"many2many:recipe_categories" json:"categories,omitempty"`
}

func (Recipe) TableName() string {
	return "recipes"
}

type ProductionStep struct {
	RecipeID    int64                       `gorm:"primaryKey" json:"recipeId"`
	DType       string                      `gorm:"not null" json:"dtype"`
	StepOrder   int                         `gorm:"primaryKey;column:step_order" json:"order"`
	Message     string                      `json:"message,omitempty"`
	Ingredients []ProductionStepIngredient  `gorm:"foreignKey:RecipeID,StepOrder;references:RecipeID,StepOrder" json:"ingredients,omitempty"`
}

func (ProductionStep) TableName() string {
	return "production_steps"
}

type ProductionStepIngredient struct {
	RecipeID     int64       `gorm:"primaryKey" json:"recipeId"`
	StepOrder    int         `gorm:"primaryKey;column:step_order" json:"stepOrder"`
	IngredientID int64       `gorm:"primaryKey" json:"ingredientId"`
	Ingredient   *Ingredient `gorm:"foreignKey:IngredientID" json:"ingredient,omitempty"`
	Amount       int         `gorm:"not null" json:"amount"`
	Scale        float64     `gorm:"not null;default:1.0" json:"scale"`
	Boostable    bool        `gorm:"not null;default:false" json:"boostable"`
}

func (ProductionStepIngredient) TableName() string {
	return "production_step_ingredients"
}
