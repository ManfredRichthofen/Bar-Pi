package repository

import (
	"errors"
	"strings"

	"github.com/ManfredRichthofen/Bar-Pi/backend-go/internal/models"
	"gorm.io/gorm"
)

const maxEventDurationMs = 60 * 60 * 1000

type EventRepository struct {
	db *gorm.DB
}

func NewEventRepository(db *gorm.DB) *EventRepository {
	return &EventRepository{db: db}
}

func (r *EventRepository) FindAll() ([]models.EventAction, error) {
	var actions []models.EventAction
	err := r.db.Order("name ASC").Find(&actions).Error
	return actions, err
}

func (r *EventRepository) FindByID(id int64) (*models.EventAction, error) {
	var action models.EventAction
	if err := r.db.First(&action, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &action, nil
}

// FindByTrigger returns actions for the trigger that apply to the recipe
// (recipe-specific ones plus those without a recipe).
func (r *EventRepository) FindByTrigger(trigger string, recipeID int64) ([]models.EventAction, error) {
	var actions []models.EventAction
	err := r.db.
		Where("event_trigger = ? AND (recipe_id IS NULL OR recipe_id = ?)", trigger, recipeID).
		Order("id ASC").
		Find(&actions).Error
	return actions, err
}

// BoardType returns the dtype of a GPIO board, or "" if it does not exist.
func (r *EventRepository) BoardType(boardID int64) (string, error) {
	var board models.GPIOBoard
	if err := r.db.Select("dtype").First(&board, boardID).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return "", nil
		}
		return "", err
	}
	return board.DType, nil
}

func (r *EventRepository) validate(action *models.EventAction) error {
	action.Name = strings.TrimSpace(action.Name)
	if action.Name == "" {
		return validationErr("Event name must not be empty")
	}
	if !models.IsValidEventTrigger(action.Trigger) {
		return validationErr("Unknown event trigger: " + action.Trigger)
	}
	if action.DType == "" {
		action.DType = models.EventActionTypeGPIO
	}
	if action.DType != models.EventActionTypeGPIO {
		return validationErr("Unknown event action type: " + action.DType)
	}
	if action.GpioBoard == nil || action.GpioPin == nil {
		return validationErr("A GPIO pin is required")
	}
	var pins int64
	if err := r.db.Model(&models.GPIOPin{}).
		Where("board = ? AND pin_nr = ?", *action.GpioBoard, *action.GpioPin).
		Count(&pins).Error; err != nil {
		return err
	}
	if pins == 0 {
		return validationErr("The selected GPIO pin does not exist")
	}
	if action.DurationInMs != nil && (*action.DurationInMs < 0 || *action.DurationInMs > maxEventDurationMs) {
		return validationErr("Duration must be between 0 and 3600000 ms")
	}
	if action.RecipeID != nil {
		var recipes int64
		if err := r.db.Model(&models.Recipe{}).Where("id = ?", *action.RecipeID).Count(&recipes).Error; err != nil {
			return err
		}
		if recipes == 0 {
			return validationErr("The selected recipe does not exist")
		}
	}
	return nil
}

func (r *EventRepository) Create(action *models.EventAction) error {
	action.ID = 0
	if err := r.validate(action); err != nil {
		return err
	}
	return r.db.Create(action).Error
}

func (r *EventRepository) Update(action *models.EventAction) error {
	if err := r.validate(action); err != nil {
		return err
	}
	return r.db.Save(action).Error
}

func (r *EventRepository) Delete(id int64) error {
	return r.db.Delete(&models.EventAction{}, id).Error
}
