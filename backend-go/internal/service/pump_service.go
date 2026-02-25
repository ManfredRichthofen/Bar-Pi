package service

import (
	"errors"
	"fmt"

	"github.com/ManfredRichthofen/Bar-Pi/backend-go/internal/models"
	"github.com/ManfredRichthofen/Bar-Pi/backend-go/internal/repository"
)

// PumpService handles business logic for pumps
type PumpService struct {
	repo           *repository.PumpRepository
	ingredientRepo *repository.IngredientRepository
}

// NewPumpService creates a new pump service
func NewPumpService(repo *repository.PumpRepository, ingredientRepo *repository.IngredientRepository) *PumpService {
	return &PumpService{
		repo:           repo,
		ingredientRepo: ingredientRepo,
	}
}

// GetAll returns all pumps
func (s *PumpService) GetAll() ([]models.Pump, error) {
	return s.repo.FindAll()
}

// GetByID returns a pump by ID
func (s *PumpService) GetByID(id int64) (*models.Pump, error) {
	return s.repo.FindByID(id)
}

// Create creates a new pump
func (s *PumpService) Create(pump *models.Pump) error {
	if err := s.validatePump(pump); err != nil {
		return err
	}

	return s.repo.Create(pump)
}

// Update updates an existing pump
func (s *PumpService) Update(pump *models.Pump) error {
	if err := s.validatePump(pump); err != nil {
		return err
	}

	existing, err := s.repo.FindByID(pump.ID)
	if err != nil {
		return fmt.Errorf("failed to find pump: %w", err)
	}
	if existing == nil {
		return errors.New("pump not found")
	}

	return s.repo.Update(pump)
}

// UpdateFields updates specific fields of a pump
func (s *PumpService) UpdateFields(id int64, fields map[string]interface{}) error {
	existing, err := s.repo.FindByID(id)
	if err != nil {
		return fmt.Errorf("failed to find pump: %w", err)
	}
	if existing == nil {
		return errors.New("pump not found")
	}

	// Validate ingredient if being updated
	if ingredientID, ok := fields["current_ingredient_id"]; ok && ingredientID != nil {
		if id, ok := ingredientID.(int64); ok && id > 0 {
			ingredient, err := s.ingredientRepo.FindByID(id)
			if err != nil {
				return fmt.Errorf("failed to find ingredient: %w", err)
			}
			if ingredient == nil {
				return errors.New("ingredient not found")
			}
		}
	}

	return s.repo.UpdateFields(id, fields)
}

// Delete deletes a pump by ID
func (s *PumpService) Delete(id int64) error {
	existing, err := s.repo.FindByID(id)
	if err != nil {
		return fmt.Errorf("failed to find pump: %w", err)
	}
	if existing == nil {
		return errors.New("pump not found")
	}

	return s.repo.Delete(id)
}

// SetIngredient sets the current ingredient for a pump
func (s *PumpService) SetIngredient(pumpID int64, ingredientID *int64) error {
	pump, err := s.repo.FindByID(pumpID)
	if err != nil {
		return fmt.Errorf("failed to find pump: %w", err)
	}
	if pump == nil {
		return errors.New("pump not found")
	}

	if ingredientID != nil && *ingredientID > 0 {
		ingredient, err := s.ingredientRepo.FindByID(*ingredientID)
		if err != nil {
			return fmt.Errorf("failed to find ingredient: %w", err)
		}
		if ingredient == nil {
			return errors.New("ingredient not found")
		}
	}

	fields := map[string]interface{}{
		"current_ingredient_id": ingredientID,
	}
	return s.repo.UpdateFields(pumpID, fields)
}

// SetFillingLevel sets the filling level of a pump
func (s *PumpService) SetFillingLevel(pumpID int64, level int) error {
	if level < 0 {
		return errors.New("filling level cannot be negative")
	}

	pump, err := s.repo.FindByID(pumpID)
	if err != nil {
		return fmt.Errorf("failed to find pump: %w", err)
	}
	if pump == nil {
		return errors.New("pump not found")
	}

	fields := map[string]interface{}{
		"filling_level_in_ml": level,
	}
	return s.repo.UpdateFields(pumpID, fields)
}

// SetPumpedUp sets the pumped up status
func (s *PumpService) SetPumpedUp(pumpID int64, isPumpedUp bool) error {
	pump, err := s.repo.FindByID(pumpID)
	if err != nil {
		return fmt.Errorf("failed to find pump: %w", err)
	}
	if pump == nil {
		return errors.New("pump not found")
	}

	fields := map[string]interface{}{
		"is_pumped_up": isPumpedUp,
	}
	return s.repo.UpdateFields(pumpID, fields)
}

// validatePump validates pump data
func (s *PumpService) validatePump(pump *models.Pump) error {
	if pump.DType == "" {
		return errors.New("pump type (dtype) is required")
	}

	// Validate dtype
	validTypes := map[string]bool{
		"DcPump":      true,
		"StepperPump": true,
	}
	if !validTypes[pump.DType] {
		return fmt.Errorf("invalid pump type: %s", pump.DType)
	}

	// Validate DC pump requirements
	if pump.DType == "DcPump" {
		if pump.DcPinBoard == nil || pump.DcPinNr == nil {
			return errors.New("DC pump requires dcPinBoard and dcPinNr")
		}
		if pump.TimePerClInMs == nil || *pump.TimePerClInMs < 1 {
			return errors.New("DC pump requires valid timePerClInMs (>= 1)")
		}
	}

	// Validate Stepper pump requirements
	if pump.DType == "StepperPump" {
		if pump.StepPinBoard == nil || pump.StepPinNr == nil {
			return errors.New("Stepper pump requires stepPinBoard and stepPinNr")
		}
		if pump.EnablePinBoard == nil || pump.EnablePinNr == nil {
			return errors.New("Stepper pump requires enablePinBoard and enablePinNr")
		}
		if pump.StepsPerCl == nil || *pump.StepsPerCl < 1 {
			return errors.New("Stepper pump requires valid stepsPerCl (>= 1)")
		}
		if pump.Acceleration != nil && (*pump.Acceleration < 1 || *pump.Acceleration > 500000) {
			return errors.New("acceleration must be between 1 and 500000")
		}
		if pump.MaxStepsPerSecond != nil && (*pump.MaxStepsPerSecond < 1 || *pump.MaxStepsPerSecond > 500000) {
			return errors.New("maxStepsPerSecond must be between 1 and 500000")
		}
	}

	// Validate filling level
	if pump.FillingLevelInMl < 0 {
		return errors.New("filling level cannot be negative")
	}

	// Validate tube capacity
	if pump.TubeCapacity != nil && *pump.TubeCapacity < 0 {
		return errors.New("tube capacity cannot be negative")
	}

	// Validate ingredient if set
	if pump.CurrentIngredientID != nil && *pump.CurrentIngredientID > 0 {
		ingredient, err := s.ingredientRepo.FindByID(*pump.CurrentIngredientID)
		if err != nil {
			return fmt.Errorf("failed to validate ingredient: %w", err)
		}
		if ingredient == nil {
			return errors.New("ingredient not found")
		}
	}

	return nil
}
