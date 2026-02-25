package models

type Pump struct {
	ID                   int64       `gorm:"primaryKey;autoIncrement" json:"id"`
	DType                string      `gorm:"not null" json:"dtype"`
	Name                 *string     `gorm:"unique" json:"name,omitempty"`
	Completed            bool        `gorm:"not null;default:true" json:"completed"`
	TubeCapacity         *float64    `json:"tubeCapacity,omitempty"`
	CurrentIngredientID  *int64      `json:"currentIngredientId,omitempty"`
	CurrentIngredient    *Ingredient `gorm:"foreignKey:CurrentIngredientID" json:"currentIngredient,omitempty"`
	FillingLevelInMl     int         `gorm:"not null;default:0" json:"fillingLevelInMl"`
	IsPumpedUp           bool        `gorm:"not null;default:false" json:"isPumpedUp"`
	DcPinBoard           *int64      `json:"dcPinBoard,omitempty"`
	DcPinNr              *int        `json:"dcPinNr,omitempty"`
	TimePerClInMs        *int        `json:"timePerClInMs,omitempty"`
	IsPowerStateHigh     *bool       `json:"isPowerStateHigh,omitempty"`
	Acceleration         *int        `json:"acceleration,omitempty"`
	StepPinBoard         *int64      `json:"stepPinBoard,omitempty"`
	StepPinNr            *int        `json:"stepPinNr,omitempty"`
	EnablePinBoard       *int64      `json:"enablePinBoard,omitempty"`
	EnablePinNr          *int        `json:"enablePinNr,omitempty"`
	StepsPerCl           *int        `json:"stepsPerCl,omitempty"`
	MaxStepsPerSecond    *int        `json:"maxStepsPerSecond,omitempty"`
}

func (Pump) TableName() string {
	return "pumps"
}
