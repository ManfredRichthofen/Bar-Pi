package service

import (
	"errors"
	"fmt"
	"log"
	"time"

	"github.com/ManfredRichthofen/Bar-Pi/backend-go/internal/models"
	"github.com/ManfredRichthofen/Bar-Pi/backend-go/internal/repository"
)

// pinController is the part of GPIOService that event actions need.
type pinController interface {
	SetupOutputPin(pin int) error
	SetPinHigh(pin int) error
	SetPinLow(pin int) error
}

// EventDispatcher fires every action registered for a trigger.
type EventDispatcher interface {
	Dispatch(trigger string, recipeID int64)
}

type EventService struct {
	repo *repository.EventRepository
	pins pinController
}

// NewEventService creates the event engine. pins may be nil when no GPIO hardware is available.
func NewEventService(repo *repository.EventRepository, pins pinController) *EventService {
	return &EventService{repo: repo, pins: pins}
}

// Dispatch runs the matching actions in the background so it never delays production.
func (s *EventService) Dispatch(trigger string, recipeID int64) {
	actions, err := s.repo.FindByTrigger(trigger, recipeID)
	if err != nil {
		log.Printf("events: failed to load actions for %s: %v", trigger, err)
		return
	}
	for _, action := range actions {
		go func(action models.EventAction) {
			if err := s.Execute(action); err != nil {
				log.Printf("events: action %q (%d) failed: %v", action.Name, action.ID, err)
			}
		}(action)
	}
}

// Execute runs one action. For a timed action the pin is restored in the background.
func (s *EventService) Execute(action models.EventAction) error {
	if action.DType != models.EventActionTypeGPIO {
		return fmt.Errorf("unsupported action type %q", action.DType)
	}
	if action.GpioBoard == nil || action.GpioPin == nil {
		return errors.New("action has no GPIO pin")
	}
	boardType, err := s.repo.BoardType(*action.GpioBoard)
	if err != nil {
		return err
	}
	if boardType != models.GPIOTypeLocal {
		return errors.New("only pins on the local Raspberry Pi board are supported")
	}
	if s.pins == nil {
		return errors.New("GPIO hardware is not available")
	}

	pin := *action.GpioPin
	high := action.PowerStateHigh == nil || *action.PowerStateHigh
	if err := s.pins.SetupOutputPin(pin); err != nil {
		return err
	}
	if err := setPin(s.pins, pin, high); err != nil {
		return err
	}
	if action.DurationInMs != nil && *action.DurationInMs > 0 {
		time.AfterFunc(time.Duration(*action.DurationInMs)*time.Millisecond, func() {
			if err := setPin(s.pins, pin, !high); err != nil {
				log.Printf("events: failed to restore pin %d: %v", pin, err)
			}
		})
	}
	return nil
}

func setPin(pins pinController, pin int, high bool) error {
	if high {
		return pins.SetPinHigh(pin)
	}
	return pins.SetPinLow(pin)
}
