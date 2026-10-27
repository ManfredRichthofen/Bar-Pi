package models

import (
	"encoding/json"
	"strconv"
	"time"
)

type Recipe struct {
	ID                  int64            `gorm:"primaryKey;autoIncrement" json:"id"`
	Name                string           `gorm:"not null" json:"name"`
	Description         string           `json:"description"`
	HasImage            bool             `gorm:"not null;default:false" json:"hasImage"`
	DefaultAmountToFill int              `gorm:"not null;default:250" json:"defaultAmountToFill"`
	OwnerID             int64            `gorm:"not null" json:"ownerId"`
	Owner               *User            `gorm:"foreignKey:OwnerID" json:"owner,omitempty"`
	GlassID             *int64           `json:"glassId"`
	DefaultGlass        *Glass           `gorm:"foreignKey:GlassID" json:"defaultGlass,omitempty"`
	LastUpdate          time.Time        `gorm:"autoUpdateTime" json:"lastUpdate"`
	CreatedAt           time.Time        `gorm:"autoCreateTime" json:"createdAt"`
	ProductionSteps     []ProductionStep `gorm:"foreignKey:RecipeID" json:"productionSteps,omitempty"`
	Categories          []Category       `gorm:"many2many:recipe_categories" json:"categories,omitempty"`
}

func (Recipe) TableName() string {
	return "recipes"
}

type RecipeIngredientSummary struct {
	ID             int64  `json:"id"`
	Name           string `json:"name"`
	Amount         int    `json:"amount"`
	Unit           string `json:"unit"`
	Type           string `json:"type"`
	DType          string `json:"dtype"`
	AlcoholContent int    `json:"alcoholContent"`
	InBar          bool   `json:"inBar"`
	OnPump         bool   `json:"onPump"`
	Boostable      bool   `json:"boostable"`
}

func (r Recipe) MarshalJSON() ([]byte, error) {
	type Alias Recipe

	ingredientsMap := make(map[int64]*RecipeIngredientSummary)
	var ingredientOrder []int64
	alcoholic := false

	for _, step := range r.ProductionSteps {
		for _, si := range step.Ingredients {
			if si.Ingredient == nil {
				continue
			}
			ing := si.Ingredient
			alc := 0
			if ing.AlcoholContent != nil {
				alc = *ing.AlcoholContent
			}
			if alc > 0 {
				alcoholic = true
			}
			inBar := false
			if ing.InBar != nil {
				inBar = *ing.InBar
			}
			unit := ing.Unit
			if unit == "" {
				unit = "ml"
			}
			if existing, ok := ingredientsMap[ing.ID]; ok {
				existing.Amount += si.Amount
				if si.Boostable {
					existing.Boostable = true
				}
			} else {
				ingredientsMap[ing.ID] = &RecipeIngredientSummary{
					ID:             ing.ID,
					Name:           ing.Name,
					Amount:         si.Amount,
					Unit:           unit,
					Type:           DTypeToFrontendType(ing.DType),
					DType:          ing.DType,
					AlcoholContent: alc,
					InBar:          inBar,
					OnPump:         ing.OnPump,
					Boostable:      si.Boostable,
				}
				ingredientOrder = append(ingredientOrder, ing.ID)
			}
		}
	}

	ingredients := make([]RecipeIngredientSummary, 0, len(ingredientOrder))
	for _, id := range ingredientOrder {
		ingredients = append(ingredients, *ingredientsMap[id])
	}

	ownerName := ""
	if r.Owner != nil {
		ownerName = r.Owner.Username
	}

	return json.Marshal(&struct {
		Alias
		OwnerName   string                    `json:"ownerName,omitempty"`
		Alcoholic   bool                      `json:"alcoholic"`
		Ingredients []RecipeIngredientSummary `json:"ingredients"`
	}{
		Alias:       (Alias)(r),
		OwnerName:   ownerName,
		Alcoholic:   alcoholic,
		Ingredients: ingredients,
	})
}

type ProductionStep struct {
	RecipeID    int64                      `gorm:"primaryKey" json:"recipeId"`
	DType       string                     `gorm:"column:dtype;not null" json:"dtype"`
	StepOrder   int                        `gorm:"primaryKey;column:step_order" json:"order"`
	Message     string                     `json:"message,omitempty"`
	Ingredients []ProductionStepIngredient `gorm:"foreignKey:RecipeID,StepOrder;references:RecipeID,StepOrder" json:"stepIngredients,omitempty"`
}

func (ProductionStep) TableName() string {
	return "production_steps"
}

func StepDTypeToFrontendType(dtype string) string {
	switch dtype {
	case "AddIngredientsProductionStep", "AddIngredients", "addIngredients":
		return "addIngredients"
	case "WrittenInstructionProductionStep", "WrittenInstruction", "writtenInstruction":
		return "writtenInstruction"
	default:
		return dtype
	}
}

func FrontendTypeToStepDType(t string) string {
	switch t {
	case "addIngredients", "AddIngredientsProductionStep", "AddIngredients":
		return "AddIngredients"
	case "writtenInstruction", "WrittenInstructionProductionStep", "WrittenInstruction":
		return "WrittenInstruction"
	default:
		return t
	}
}

func (ps ProductionStep) MarshalJSON() ([]byte, error) {
	type Alias ProductionStep
	return json.Marshal(&struct {
		Alias
		Type        string                     `json:"type"`
		Ingredients []ProductionStepIngredient `json:"ingredients,omitempty"`
	}{
		Alias:       (Alias)(ps),
		Type:        StepDTypeToFrontendType(ps.DType),
		Ingredients: ps.Ingredients,
	})
}

func (ps *ProductionStep) UnmarshalJSON(data []byte) error {
	type Alias ProductionStep
	aux := &struct {
		*Alias
		Type            string                     `json:"type"`
		Ingredients     []ProductionStepIngredient `json:"ingredients"`
		StepIngredients []ProductionStepIngredient `json:"stepIngredients"`
	}{
		Alias: (*Alias)(ps),
	}
	if err := json.Unmarshal(data, &aux); err != nil {
		return err
	}
	if ps.DType == "" && aux.Type != "" {
		ps.DType = FrontendTypeToStepDType(aux.Type)
	} else if ps.DType != "" {
		ps.DType = FrontendTypeToStepDType(ps.DType)
	}
	if len(aux.StepIngredients) > 0 {
		ps.Ingredients = aux.StepIngredients
	} else if len(aux.Ingredients) > 0 {
		ps.Ingredients = aux.Ingredients
	}
	return nil
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

func (psi *ProductionStepIngredient) UnmarshalJSON(data []byte) error {
	var raw struct {
		RecipeID     int64           `json:"recipeId"`
		StepOrder    int             `json:"stepOrder"`
		IngredientID int64           `json:"ingredientId"`
		Ingredient   *Ingredient     `json:"ingredient"`
		Amount       float64         `json:"amount"`
		Scale        json.RawMessage `json:"scale"`
		Boostable    bool            `json:"boostable"`
	}
	if err := json.Unmarshal(data, &raw); err != nil {
		return err
	}
	psi.RecipeID = raw.RecipeID
	psi.StepOrder = raw.StepOrder
	psi.IngredientID = raw.IngredientID
	psi.Ingredient = raw.Ingredient
	if psi.IngredientID == 0 && raw.Ingredient != nil {
		psi.IngredientID = raw.Ingredient.ID
	}
	psi.Amount = int(raw.Amount)
	psi.Boostable = raw.Boostable
	psi.Scale = 1.0

	if len(raw.Scale) > 0 {
		var f float64
		if err := json.Unmarshal(raw.Scale, &f); err == nil && f > 0 {
			psi.Scale = f
		} else {
			var s string
			if err := json.Unmarshal(raw.Scale, &s); err == nil {
				if parsed, err := strconv.ParseFloat(s, 64); err == nil && parsed > 0 {
					psi.Scale = parsed
				}
			}
		}
	}
	return nil
}
