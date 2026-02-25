package models

import "time"

// CocktailOrderConfiguration represents order settings
type CocktailOrderConfiguration struct {
	AmountOrderedInMl int     `json:"amountOrderedInMl"`
	BoostIngredients  []int64 `json:"boostIngredients"`
}

// CocktailProgress represents the current cocktail production status
type CocktailProgress struct {
	RecipeID          int64     `json:"recipeId"`
	RecipeName        string    `json:"recipeName"`
	UserID            int64     `json:"userId"`
	Username          string    `json:"username"`
	CurrentStep       int       `json:"currentStep"`
	TotalSteps        int       `json:"totalSteps"`
	Status            string    `json:"status"` // pending, in_progress, completed, cancelled, error
	Message           string    `json:"message"`
	PercentComplete   int       `json:"percentComplete"`
	StartedAt         time.Time `json:"startedAt"`
	CompletedAt       *time.Time `json:"completedAt,omitempty"`
}

// FeasibilityReport represents whether a recipe can be made
type FeasibilityReport struct {
	Feasible          bool     `json:"feasible"`
	RecipeID          int64    `json:"recipeId"`
	MissingIngredients []string `json:"missingIngredients"`
	InsufficientPumps  []string `json:"insufficientPumps"`
	Message           string   `json:"message"`
}
