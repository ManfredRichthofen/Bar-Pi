package models

import "time"

type Collection struct {
	ID          int64     `gorm:"primaryKey;autoIncrement" json:"id"`
	Name        string    `gorm:"not null" json:"name"`
	Description string    `json:"description"`
	OwnerID     int64     `gorm:"not null" json:"ownerId"`
	Owner       *User     `gorm:"foreignKey:OwnerID" json:"owner,omitempty"`
	Recipes     []Recipe  `gorm:"many2many:collection_recipes" json:"recipes,omitempty"`
	CreatedAt   time.Time `gorm:"autoCreateTime" json:"createdAt"`
	UpdatedAt   time.Time `gorm:"autoUpdateTime" json:"updatedAt"`
}

func (Collection) TableName() string {
	return "collections"
}
