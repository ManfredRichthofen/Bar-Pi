package models

import "encoding/json"

type Glass struct {
	ID                      int64  `gorm:"primaryKey;autoIncrement" json:"id"`
	Name                    string `gorm:"unique;not null" json:"name"`
	Size                    int    `gorm:"not null" json:"size"`
	Description             string `gorm:"default:''" json:"description,omitempty"`
	IsDefault               bool   `gorm:"column:is_default;not null;default:false" json:"default"`
	UseForSingleIngredients bool   `gorm:"column:use_for_single_ingredients;not null;default:false" json:"useForSingleIngredients"`
}

func (Glass) TableName() string {
	return "glasses"
}

func (g Glass) MarshalJSON() ([]byte, error) {
	type Alias Glass
	return json.Marshal(&struct {
		Alias
		SizeInMl int `json:"sizeInMl"`
	}{
		Alias:    (Alias)(g),
		SizeInMl: g.Size,
	})
}

func (g *Glass) UnmarshalJSON(data []byte) error {
	type Alias Glass
	aux := &struct {
		*Alias
		SizeInMl *int  `json:"sizeInMl"`
		Default  *bool `json:"default"`
	}{
		Alias: (*Alias)(g),
	}
	if err := json.Unmarshal(data, &aux); err != nil {
		return err
	}
	if g.Size == 0 && aux.SizeInMl != nil {
		g.Size = *aux.SizeInMl
	}
	if aux.Default != nil {
		g.IsDefault = *aux.Default
	}
	return nil
}
