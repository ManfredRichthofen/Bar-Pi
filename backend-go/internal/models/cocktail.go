package models

import "time"

type AdditionalIngredientDto struct {
	IngredientID int64       `json:"ingredientId"`
	Ingredient   *Ingredient `json:"ingredient,omitempty"`
	Amount       int         `json:"amount"`
	ManualAdd    bool        `json:"manualAdd,omitempty"`
}

type OrderCustomisations struct {
	Boost                 int                       `json:"boost"`
	AdditionalIngredients []AdditionalIngredientDto `json:"additionalIngredients"`
}

// CocktailOrderConfiguration represents order settings compatible with both CocktailPi and Bar-Pi
type CocktailOrderConfiguration struct {
	AmountOrderedInMl           int                 `json:"amountOrderedInMl"`
	BoostIngredients            []int64             `json:"boostIngredients,omitempty"`
	Customisations              OrderCustomisations `json:"customisations,omitempty"`
	ProductionStepReplacements  []any               `json:"productionStepReplacements,omitempty"`
	IngredientGroupReplacements []any               `json:"ingredientGroupReplacements,omitempty"`
	UseAutomaticIngredients     bool                `json:"useAutomaticIngredients,omitempty"`
	SkipMissingIngredients      bool                `json:"skipMissingIngredients,omitempty"`
	AllowManualIngredients      bool                `json:"allowManualIngredients,omitempty"`
	AllowAutomaticIngredients   bool                `json:"allowAutomaticIngredients,omitempty"`
	CheckMissingIngredients     bool                `json:"checkMissingIngredients,omitempty"`
}

type ManualIngredientItem struct {
	Ingredient *Ingredient `json:"ingredient,omitempty"`
	Name       string      `json:"name"`
	Amount     int         `json:"amount"`
	Unit       string      `json:"unit"`
}

// CocktailProgress represents the current cocktail production status (both CocktailPi STOMP & Bar-Pi REST)
type CocktailProgress struct {
	RecipeID                        int64                  `json:"recipeId"`
	RecipeName                      string                 `json:"recipeName"`
	Recipe                          *Recipe                `json:"recipe,omitempty"`
	UserID                          int64                  `json:"userId"`
	Username                        string                 `json:"username"`
	User                            *User                  `json:"user,omitempty"`
	CurrentStep                     int                    `json:"currentStep"`
	TotalSteps                      int                    `json:"totalSteps"`
	Status                          string                 `json:"status"` // pending, in_progress, paused, completed, cancelled, error
	State                           string                 `json:"state"`  // PREPARING, PUMPING, MANUAL_INGREDIENT_ADD, MANUAL_ACTION_REQUIRED, COMPLETED, FINISHED, CANCELLED
	Message                         string                 `json:"message"`
	WrittenInstruction              string                 `json:"writtenInstruction,omitempty"`
	PercentComplete                 int                    `json:"percentComplete"`
	Progress                        int                    `json:"progress"`
	CurrentIngredientsToAddManually []ManualIngredientItem `json:"currentIngredientsToAddManually,omitempty"`
	StartedAt                       time.Time              `json:"startedAt"`
	CompletedAt                     *time.Time             `json:"completedAt,omitempty"`
}

type RequiredIngredient struct {
	Ingredient     *Ingredient `json:"ingredient"`
	AmountRequired int         `json:"amountRequired"`
	AmountMissing  int         `json:"amountMissing"`
	Amount         int         `json:"amount"`
}

// FeasibilityReport represents whether a recipe can be made
type FeasibilityReport struct {
	Feasible                    bool                 `json:"feasible"`
	TotalAmountInMl             int                  `json:"totalAmountInMl"`
	Reason                      string               `json:"reason,omitempty"`
	RecipeID                    int64                `json:"recipeId"`
	RequiredIngredients         []RequiredIngredient `json:"requiredIngredients"`
	InsufficientPumps           []string             `json:"insufficientPumps"`
	MissingIngredients          []string             `json:"missingIngredients"`
	AllIngredientGroupsReplaced bool                 `json:"allIngredientGroupsReplaced"`
	Message                     string               `json:"message"`
}
