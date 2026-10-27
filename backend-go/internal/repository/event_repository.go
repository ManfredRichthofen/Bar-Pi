package repository

import (
	"errors"
	"net/url"
	"strings"
	"unicode/utf8"

	"github.com/ManfredRichthofen/Bar-Pi/backend-go/internal/models"
	"gorm.io/gorm"
)

const (
	maxEventDurationMs = 60 * 60 * 1000
	maxCommentLength   = 40
	maxURLLength       = 255
)

var allowedRequestMethods = map[string]bool{"GET": true, "POST": true, "PUT": true, "DELETE": true}

type EventRepository struct {
	db *gorm.DB
}

func NewEventRepository(db *gorm.DB) *EventRepository {
	return &EventRepository{db: db}
}

func (r *EventRepository) FindAll() ([]models.EventAction, error) {
	var actions []models.EventAction
	err := r.db.Preload("Groups").Order("id ASC").Find(&actions).Error
	return actions, err
}

func (r *EventRepository) FindByID(id int64) (*models.EventAction, error) {
	var action models.EventAction
	if err := r.db.Preload("Groups").First(&action, id).Error; err != nil {
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
	err := r.db.Preload("Groups").
		Where("event_trigger = ? AND (recipe_id IS NULL OR recipe_id = ?)", trigger, recipeID).
		Order("id ASC").
		Find(&actions).Error
	return actions, err
}

func (r *EventRepository) FindExecutionGroups() ([]string, error) {
	names := []string{}
	err := r.db.Model(&models.EventActionGroup{}).Distinct().Order("group_name ASC").Pluck("group_name", &names).Error
	return names, err
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
	action.Comment = strings.TrimSpace(action.Comment)
	if utf8.RuneCountInString(action.Comment) > maxCommentLength {
		return validationErr("Comment must be at most 40 characters")
	}
	if !models.IsValidEventTrigger(action.Trigger) {
		return validationErr("Unknown event trigger: " + action.Trigger)
	}
	if err := normalizeGroups(action); err != nil {
		return err
	}

	switch action.DType {
	case models.EventActionTypeDoNothing:
	case models.EventActionTypeCallURL:
		if err := validateCallURL(action); err != nil {
			return err
		}
	case models.EventActionTypeGPIO:
		if err := r.validateGPIO(action); err != nil {
			return err
		}
	case models.EventActionTypePlayAudio, models.EventActionTypeExecPy:
		return validationErr("Action type " + action.DType + " is not supported by this backend")
	default:
		return validationErr("Unknown event action type: " + action.DType)
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

	action.Name = action.Comment
	if action.Name == "" {
		action.Name = action.DType
	}
	return nil
}

func normalizeGroups(action *models.EventAction) error {
	seen := map[string]bool{}
	groups := make([]models.EventActionGroup, 0, len(action.Groups))
	for _, g := range action.Groups {
		name := strings.TrimSpace(g.Name)
		if name == "" || seen[name] {
			continue
		}
		if utf8.RuneCountInString(name) > maxCommentLength {
			return validationErr("Execution group names must be at most 40 characters")
		}
		seen[name] = true
		groups = append(groups, models.EventActionGroup{EventActionID: action.ID, Name: name})
	}
	action.Groups = groups
	return nil
}

func validateCallURL(action *models.EventAction) error {
	if action.URL == nil || strings.TrimSpace(*action.URL) == "" {
		return validationErr("A URL is required")
	}
	raw := strings.TrimSpace(*action.URL)
	if len(raw) > maxURLLength {
		return validationErr("URL must be at most 255 characters")
	}
	parsed, err := url.Parse(raw)
	if err != nil || (parsed.Scheme != "http" && parsed.Scheme != "https") || parsed.Host == "" {
		return validationErr("URL must be a valid http or https URL")
	}
	action.URL = &raw
	if action.RequestMethod == nil || !allowedRequestMethods[strings.ToUpper(*action.RequestMethod)] {
		return validationErr("Request method must be GET, POST, PUT or DELETE")
	}
	method := strings.ToUpper(*action.RequestMethod)
	action.RequestMethod = &method
	return nil
}

func (r *EventRepository) validateGPIO(action *models.EventAction) error {
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
	if action.PowerStateHigh == nil {
		high := true
		action.PowerStateHigh = &high
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
	return r.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Where("event_action_id = ?", action.ID).Delete(&models.EventActionGroup{}).Error; err != nil {
			return err
		}
		return tx.Session(&gorm.Session{FullSaveAssociations: true}).Save(action).Error
	})
}

func (r *EventRepository) Delete(id int64) error {
	return r.db.Delete(&models.EventAction{}, id).Error
}
