package models

import (
	"encoding/json"
	"time"
)

type Ingredient struct {
	ID                 int64       `gorm:"primaryKey;autoIncrement" json:"id"`
	DType              string      `gorm:"column:dtype;not null" json:"dtype"`
	Name               string      `gorm:"unique;not null" json:"name"`
	AlcoholContent     *int        `json:"alcoholContent"`
	ParentGroupID      *int64      `json:"parentGroupId"`
	ParentGroup        *Ingredient `gorm:"foreignKey:ParentGroupID" json:"parentGroup,omitempty"`
	BottleSize         *int        `json:"bottleSize,omitempty"`
	Unit               string      `json:"unit,omitempty"`
	InBar              *bool       `json:"inBar,omitempty"`
	PumpTimeMultiplier *float64    `json:"pumpTimeMultiplier,omitempty"`
	HasImage           bool        `gorm:"not null;default:false" json:"hasImage"`
	OnPump             bool        `gorm:"-" json:"onPump"`
	CreatedAt          time.Time   `gorm:"autoCreateTime" json:"createdAt"`
	UpdatedAt          time.Time   `gorm:"autoUpdateTime" json:"updatedAt"`
}

func (Ingredient) TableName() string {
	return "ingredients"
}

func DTypeToFrontendType(dtype string) string {
	switch dtype {
	case "AutomatedIngredient", "automated":
		return "automated"
	case "ManualIngredient", "manual":
		return "manual"
	case "IngredientGroup", "group":
		return "group"
	default:
		return dtype
	}
}

func FrontendTypeToDType(t string) string {
	switch t {
	case "automated", "AutomatedIngredient":
		return "AutomatedIngredient"
	case "manual", "ManualIngredient":
		return "ManualIngredient"
	case "group", "IngredientGroup":
		return "IngredientGroup"
	default:
		return t
	}
}

func (i Ingredient) MarshalJSON() ([]byte, error) {
	type Alias Ingredient
	alc := 0
	if i.AlcoholContent != nil {
		alc = *i.AlcoholContent
	}
	inBar := false
	if i.InBar != nil {
		inBar = *i.InBar
	}
	unit := i.Unit
	if unit == "" && (i.DType == "AutomatedIngredient" || i.DType == "ManualIngredient") {
		unit = "ml"
	}
	var parentGroupName *string
	if i.ParentGroup != nil {
		parentGroupName = &i.ParentGroup.Name
	}
	return json.Marshal(&struct {
		Alias
		Type            string    `json:"type"`
		AlcoholContent  int       `json:"alcoholContent"`
		InBar           bool      `json:"inBar"`
		Unit            string    `json:"unit,omitempty"`
		ParentGroupName *string   `json:"parentGroupName,omitempty"`
		LastUpdate      time.Time `json:"lastUpdate"`
	}{
		Alias:           (Alias)(i),
		Type:            DTypeToFrontendType(i.DType),
		AlcoholContent:  alc,
		InBar:           inBar,
		Unit:            unit,
		ParentGroupName: parentGroupName,
		LastUpdate:      i.UpdatedAt,
	})
}

func (i *Ingredient) UnmarshalJSON(data []byte) error {
	type Alias Ingredient
	aux := &struct {
		*Alias
		Type string `json:"type"`
	}{
		Alias: (*Alias)(i),
	}
	if err := json.Unmarshal(data, &aux); err != nil {
		return err
	}
	if i.DType == "" && aux.Type != "" {
		i.DType = FrontendTypeToDType(aux.Type)
	} else if i.DType != "" {
		i.DType = FrontendTypeToDType(i.DType)
	}
	return nil
}
