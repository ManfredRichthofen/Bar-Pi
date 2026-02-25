package models

import "time"

type Ingredient struct {
	ID                  int64       `gorm:"primaryKey;autoIncrement" json:"id"`
	DType               string      `gorm:"not null" json:"dtype"`
	Name                string      `gorm:"unique;not null" json:"name"`
	AlcoholContent      *int        `json:"alcoholContent,omitempty"`
	ParentGroupID       *int64      `json:"parentGroupId,omitempty"`
	ParentGroup         *Ingredient `gorm:"foreignKey:ParentGroupID" json:"parentGroup,omitempty"`
	BottleSize          *int        `json:"bottleSize,omitempty"`
	Unit                string      `json:"unit,omitempty"`
	InBar               *bool       `json:"inBar,omitempty"`
	PumpTimeMultiplier  *float64    `json:"pumpTimeMultiplier,omitempty"`
	HasImage            bool        `gorm:"not null;default:false" json:"hasImage"`
	CreatedAt           time.Time   `gorm:"autoCreateTime:nano" json:"createdAt"`
	UpdatedAt           time.Time   `gorm:"autoUpdateTime:nano" json:"updatedAt"`
}

func (Ingredient) TableName() string {
	return "ingredients"
}
