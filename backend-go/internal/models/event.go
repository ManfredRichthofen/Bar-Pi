package models

import "fmt"

// Trigger names match the original CocktailPi API (including its "CANCELED" spelling).
const (
	EventTriggerApplicationStartup         = "APPLICATION_STARTUP"
	EventTriggerProductionStarted          = "COCKTAIL_PRODUCTION_STARTED"
	EventTriggerManualInteractionRequested = "COCKTAIL_PRODUCTION_MANUAL_INTERACTION_REQUESTED"
	EventTriggerManualInteractionCompleted = "COCKTAIL_PRODUCTION_MANUAL_INTERACTION_COMPLETED"
	EventTriggerProductionFinished         = "COCKTAIL_PRODUCTION_FINISHED"
	EventTriggerProductionCancelled        = "COCKTAIL_PRODUCTION_CANCELED"
)

// Action types. doNothing, callUrl, playAudio and execPy are CocktailPi's;
// gpio is a Bar-Pi addition that CocktailPi clients never send.
const (
	EventActionTypeDoNothing = "doNothing"
	EventActionTypeCallURL   = "callUrl"
	EventActionTypePlayAudio = "playAudio"
	EventActionTypeExecPy    = "execPy"
	EventActionTypeGPIO      = "gpio"
)

var EventTriggers = []string{
	EventTriggerApplicationStartup,
	EventTriggerProductionStarted,
	EventTriggerManualInteractionRequested,
	EventTriggerManualInteractionCompleted,
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

// EventActionGroup tags an action with an execution group.
type EventActionGroup struct {
	EventActionID int64  `gorm:"primaryKey;column:event_action_id"`
	Name          string `gorm:"primaryKey;column:group_name"`
}

func (EventActionGroup) TableName() string {
	return "event_action_groups"
}

// EventAction is the persisted form of an action that runs when a trigger fires.
type EventAction struct {
	ID             int64              `gorm:"primaryKey;autoIncrement"`
	DType          string             `gorm:"column:dtype;not null"`
	Name           string             `gorm:"not null"`
	Comment        string             `gorm:"not null"`
	Trigger        string             `gorm:"column:event_trigger;not null"`
	RecipeID       *int64             `gorm:"column:recipe_id"`
	GpioBoard      *int64             `gorm:"column:gpio_board"`
	GpioPin        *int               `gorm:"column:gpio_pin"`
	PowerStateHigh *bool              `gorm:"column:power_state_high"`
	DurationInMs   *int               `gorm:"column:duration_in_ms"`
	URL            *string            `gorm:"column:url"`
	RequestMethod  *string            `gorm:"column:request_method"`
	OnRepeat       *bool              `gorm:"column:on_repeat"`
	SoundDevice    *string            `gorm:"column:sound_device"`
	Volume         *int               `gorm:"column:volume"`
	Groups         []EventActionGroup `gorm:"foreignKey:EventActionID"`
}

func (EventAction) TableName() string {
	return "event_actions"
}

// EventActionDto is the API shape, field-compatible with CocktailPi's.
// RecipeID and the gpio fields are Bar-Pi extensions. RecipeID nil means every recipe;
// DurationInMs nil or 0 leaves a gpio pin in its new state.
type EventActionDto struct {
	ID              int64    `json:"id"`
	Type            string   `json:"type"`
	Comment         string   `json:"comment"`
	Description     string   `json:"description,omitempty"`
	Trigger         string   `json:"trigger"`
	ExecutionGroups []string `json:"executionGroups"`
	RecipeID        *int64   `json:"recipeId,omitempty"`
	URL             *string  `json:"url,omitempty"`
	RequestMethod   *string  `json:"requestMethod,omitempty"`
	OnRepeat        *bool    `json:"onRepeat,omitempty"`
	SoundDevice     *string  `json:"soundDevice,omitempty"`
	Volume          *int     `json:"volume,omitempty"`
	Pin             *PinDto  `json:"pin,omitempty"`
	PowerStateHigh  *bool    `json:"powerStateHigh,omitempty"`
	DurationInMs    *int     `json:"durationInMs,omitempty"`
}

func (a EventAction) describe() string {
	switch a.DType {
	case EventActionTypeCallURL:
		if a.URL != nil && a.RequestMethod != nil {
			return fmt.Sprintf("%s %s", *a.RequestMethod, *a.URL)
		}
	case EventActionTypeGPIO:
		if a.GpioPin != nil {
			state := "HIGH"
			if a.PowerStateHigh != nil && !*a.PowerStateHigh {
				state = "LOW"
			}
			if a.DurationInMs != nil && *a.DurationInMs > 0 {
				return fmt.Sprintf("Set BCM %d %s for %d ms", *a.GpioPin, state, *a.DurationInMs)
			}
			return fmt.Sprintf("Set BCM %d %s", *a.GpioPin, state)
		}
	case EventActionTypeDoNothing:
		return "Do nothing"
	}
	return ""
}

func (a EventAction) ToDto() EventActionDto {
	groups := make([]string, 0, len(a.Groups))
	for _, g := range a.Groups {
		groups = append(groups, g.Name)
	}
	dto := EventActionDto{
		ID:              a.ID,
		Type:            a.DType,
		Comment:         a.Comment,
		Description:     a.describe(),
		Trigger:         a.Trigger,
		ExecutionGroups: groups,
		RecipeID:        a.RecipeID,
		URL:             a.URL,
		RequestMethod:   a.RequestMethod,
		OnRepeat:        a.OnRepeat,
		SoundDevice:     a.SoundDevice,
		Volume:          a.Volume,
		PowerStateHigh:  a.PowerStateHigh,
		DurationInMs:    a.DurationInMs,
	}
	if a.GpioBoard != nil && a.GpioPin != nil {
		dto.Pin = &PinDto{BoardID: a.GpioBoard, Nr: a.GpioPin}
	}
	return dto
}

func (d EventActionDto) ToModel() EventAction {
	a := EventAction{
		ID:             d.ID,
		DType:          d.Type,
		Comment:        d.Comment,
		Trigger:        d.Trigger,
		RecipeID:       d.RecipeID,
		URL:            d.URL,
		RequestMethod:  d.RequestMethod,
		OnRepeat:       d.OnRepeat,
		SoundDevice:    d.SoundDevice,
		Volume:         d.Volume,
		PowerStateHigh: d.PowerStateHigh,
		DurationInMs:   d.DurationInMs,
	}
	if d.Pin != nil {
		a.GpioBoard = d.Pin.BoardID
		a.GpioPin = d.Pin.PinNumber()
	}
	for _, name := range d.ExecutionGroups {
		a.Groups = append(a.Groups, EventActionGroup{Name: name})
	}
	return a
}
