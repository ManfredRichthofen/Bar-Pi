package service

import (
	"errors"
	"fmt"

	"github.com/ManfredRichthofen/Bar-Pi/backend-go/internal/models"
	"github.com/ManfredRichthofen/Bar-Pi/backend-go/internal/repository"
)

// IngredientService handles business logic for ingredients
type IngredientService struct {
	repo *repository.IngredientRepository
}

// NewIngredientService creates a new ingredient service
func NewIngredientService(repo *repository.IngredientRepository) *IngredientService {
	return &IngredientService{repo: repo}
}

// GetAll returns all ingredients
func (s *IngredientService) GetAll() ([]models.Ingredient, error) {
	return s.repo.FindAll()
}

// GetByID returns an ingredient by ID
func (s *IngredientService) GetByID(id int64) (*models.Ingredient, error) {
	return s.repo.FindByID(id)
}

// GetByFilter returns ingredients matching the provided filters
func (s *IngredientService) GetByFilter(
	autocomplete string,
	filterManualIngredients bool,
	filterAutomaticIngredients bool,
	filterIngredientGroups bool,
	groupChildrenGroupID *int64,
	inBar bool,
	onPump bool,
	inBarOrOnPump bool,
) ([]models.Ingredient, error) {
	return s.repo.FindByFilter(
		autocomplete,
		filterManualIngredients,
		filterAutomaticIngredients,
		filterIngredientGroups,
		groupChildrenGroupID,
		inBar,
		onPump,
		inBarOrOnPump,
	)
}

// GetInBar returns all ingredients marked as in bar
func (s *IngredientService) GetInBar() ([]models.Ingredient, error) {
	return s.repo.FindInBar()
}

// Create creates a new ingredient
func (s *IngredientService) Create(ingredient *models.Ingredient) error {
	// Validate ingredient
	if err := s.validateIngredient(ingredient); err != nil {
		return err
	}

	// Check for duplicate name
	existing, err := s.repo.FindByName(ingredient.Name)
	if err != nil {
		return fmt.Errorf("failed to check for duplicate: %w", err)
	}
	if existing != nil {
		return errors.New("ingredient with this name already exists")
	}

	return s.repo.Create(ingredient)
}

// Update updates an existing ingredient
func (s *IngredientService) Update(ingredient *models.Ingredient) error {
	// Validate ingredient
	if err := s.validateIngredient(ingredient); err != nil {
		return err
	}

	// Check if ingredient exists
	existing, err := s.repo.FindByID(ingredient.ID)
	if err != nil {
		return fmt.Errorf("failed to find ingredient: %w", err)
	}
	if existing == nil {
		return errors.New("ingredient not found")
	}

	// Check for duplicate name (excluding current ingredient)
	duplicate, err := s.repo.FindByName(ingredient.Name)
	if err != nil {
		return fmt.Errorf("failed to check for duplicate: %w", err)
	}
	if duplicate != nil && duplicate.ID != ingredient.ID {
		return errors.New("ingredient with this name already exists")
	}

	return s.repo.Update(ingredient)
}

// Delete deletes an ingredient by ID
func (s *IngredientService) Delete(id int64) error {
	// Check if ingredient exists
	existing, err := s.repo.FindByID(id)
	if err != nil {
		return fmt.Errorf("failed to find ingredient: %w", err)
	}
	if existing == nil {
		return errors.New("ingredient not found")
	}

	return s.repo.Delete(id)
}

// SetInBar updates the inBar status of an ingredient
func (s *IngredientService) SetInBar(id int64, inBar bool) error {
	// Check if ingredient exists
	existing, err := s.repo.FindByID(id)
	if err != nil {
		return fmt.Errorf("failed to find ingredient: %w", err)
	}
	if existing == nil {
		return errors.New("ingredient not found")
	}

	return s.repo.SetInBar(id, inBar)
}

// validateIngredient validates ingredient data
func (s *IngredientService) validateIngredient(ingredient *models.Ingredient) error {
	if ingredient.Name == "" {
		return errors.New("ingredient name is required")
	}

	if ingredient.DType == "" {
		return errors.New("ingredient type (dtype) is required")
	}

	// Validate dtype
	validTypes := map[string]bool{
		"ManualIngredient":    true,
		"AutomatedIngredient": true,
		"IngredientGroup":     true,
	}
	if !validTypes[ingredient.DType] {
		return fmt.Errorf("invalid ingredient type: %s", ingredient.DType)
	}

	// Validate alcohol content
	if ingredient.AlcoholContent != nil {
		if *ingredient.AlcoholContent < 0 || *ingredient.AlcoholContent > 100 {
			return errors.New("alcohol content must be between 0 and 100")
		}
	}

	// Validate automated ingredient requirements
	if ingredient.DType == "AutomatedIngredient" {
		if ingredient.BottleSize == nil {
			return errors.New("bottle size is required for automated ingredients")
		}
		if ingredient.PumpTimeMultiplier == nil {
			return errors.New("pump time multiplier is required for automated ingredients")
		}
	}

	// Prevent self-referencing parent group
	if ingredient.ParentGroupID != nil && *ingredient.ParentGroupID == ingredient.ID {
		return errors.New("ingredient cannot be its own parent group")
	}

	return nil
}
