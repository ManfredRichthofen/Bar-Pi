package service

import (
	"context"
	"errors"
	"fmt"
	"log"
	"net/http"
	"time"

	"github.com/ManfredRichthofen/Bar-Pi/backend-go/internal/models"
	"github.com/ManfredRichthofen/Bar-Pi/backend-go/internal/repository"
)

const callURLTimeout = 10 * time.Second

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

// MultiDispatcher forwards every event to several dispatchers.
type MultiDispatcher []EventDispatcher

func (m MultiDispatcher) Dispatch(trigger string, recipeID int64) {
	for _, d := range m {
		d.Dispatch(trigger, recipeID)
	}
}

type EventService struct {
	repo   *repository.EventRepository
	pins   pinController
	client *http.Client
}

// NewEventService creates the event engine. pins may be nil when no GPIO hardware is available.
func NewEventService(repo *repository.EventRepository, pins pinController) *EventService {
	return &EventService{repo: repo, pins: pins, client: &http.Client{Timeout: callURLTimeout}}
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
				log.Printf("events: action %d (%s) failed: %v", action.ID, action.Name, err)
			}
		}(action)
	}
}

// Execute runs one action. A timed gpio action restores its pin in the background.
func (s *EventService) Execute(action models.EventAction) error {
	switch action.DType {
	case models.EventActionTypeDoNothing:
		return nil
	case models.EventActionTypeCallURL:
		return s.callURL(action)
	case models.EventActionTypeGPIO:
		return s.setGPIO(action)
	default:
		return fmt.Errorf("unsupported action type %q", action.DType)
	}
}

func (s *EventService) callURL(action models.EventAction) error {
	if action.URL == nil || action.RequestMethod == nil {
		return errors.New("action has no URL or request method")
	}
	ctx, cancel := context.WithTimeout(context.Background(), callURLTimeout)
	defer cancel()
	req, err := http.NewRequestWithContext(ctx, *action.RequestMethod, *action.URL, nil)
	if err != nil {
		return err
	}
	resp, err := s.client.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	if resp.StatusCode >= 400 {
		return fmt.Errorf("request returned %s", resp.Status)
	}
	return nil
}

func (s *EventService) setGPIO(action models.EventAction) error {
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
