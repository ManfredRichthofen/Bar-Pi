package models

type Glass struct {
	ID   int64  `gorm:"primaryKey;autoIncrement" json:"id"`
	Name string `gorm:"unique;not null" json:"name"`
	Size int    `gorm:"not null" json:"size"`
}

func (Glass) TableName() string {
	return "glasses"
}
