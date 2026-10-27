package models

const (
	EventTriggerProductionStarted   = "COCKTAIL_PRODUCTION_STARTED"
	EventTriggerProductionFinished  = "COCKTAIL_PRODUCTION_FINISHED"
	EventTriggerProductionCancelled = "COCKTAIL_PRODUCTION_CANCELLED"

	EventActionTypeGPIO = "gpio"
)

var EventTriggers = []string{
	EventTriggerProductionStarted,
	EventTriggerProductionFinished,
	EventTriggerProductionCancelled,
}

func IsValidEventTrigger(trigger string) bool {
	for _, t := range EventTriggers {
		if t == trigger {
			return true
		}
	}
	return false
}

// EventAction is the persisted form of an action that runs when a trigger fires.
type EventAction struct {
	ID             int64  `gorm:"primaryKey;autoIncrement"`
	DType          string `gorm:"column:dtype;not null"`
	Name           string `gorm:"not null"`
	Trigger        string `gorm:"column:event_trigger;not null"`
	RecipeID       *int64 `gorm:"column:recipe_id"`
	GpioBoard      *int64 `gorm:"column:gpio_board"`
	GpioPin        *int   `gorm:"column:gpio_pin"`
	PowerStateHigh *bool  `gorm:"column:power_state_high"`
	DurationInMs   *int   `gorm:"column:duration_in_ms"`
}

func (EventAction) TableName() string {
	return "event_actions"
}

// EventActionDto is the API shape. RecipeID nil means the action runs for every recipe.
// DurationInMs of nil or 0 leaves the pin in its new state.
type EventActionDto struct {
	ID             int64   `json:"id"`
	Type           string  `json:"type"`
	Name           string  `json:"name"`
	Trigger        string  `json:"trigger"`
	RecipeID       *int64  `json:"recipeId"`
	Pin            *PinDto `json:"pin,omitempty"`
	PowerStateHigh bool    `json:"powerStateHigh"`
	DurationInMs   *int    `json:"durationInMs"`
}

func (a EventAction) ToDto() EventActionDto {
	dto := EventActionDto{
		ID:             a.ID,
		Type:           a.DType,
		Name:           a.Name,
		Trigger:        a.Trigger,
		RecipeID:       a.RecipeID,
		PowerStateHigh: a.PowerStateHigh == nil || *a.PowerStateHigh,
		DurationInMs:   a.DurationInMs,
	}
	if a.GpioBoard != nil && a.GpioPin != nil {
		dto.Pin = &PinDto{BoardID: a.GpioBoard, Nr: a.GpioPin}
	}
	return dto
}

func (d EventActionDto) ToModel() EventAction {
	high := d.PowerStateHigh
	a := EventAction{
		ID:             d.ID,
		DType:          d.Type,
		Name:           d.Name,
		Trigger:        d.Trigger,
		RecipeID:       d.RecipeID,
		PowerStateHigh: &high,
		DurationInMs:   d.DurationInMs,
	}
	if d.Pin != nil {
		a.GpioBoard = d.Pin.BoardID
		a.GpioPin = d.Pin.PinNumber()
	}
	return a
}
