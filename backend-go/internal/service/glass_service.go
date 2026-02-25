package service

import (
	"errors"
	"fmt"

	"github.com/ManfredRichthofen/Bar-Pi/backend-go/internal/models"
	"github.com/ManfredRichthofen/Bar-Pi/backend-go/internal/repository"
)

// GlassService handles business logic for glasses
type GlassService struct {
	repo *repository.GlassRepository
}

// NewGlassService creates a new glass service
func NewGlassService(repo *repository.GlassRepository) *GlassService {
	return &GlassService{repo: repo}
}

// GetAll returns all glasses
func (s *GlassService) GetAll() ([]models.Glass, error) {
	return s.repo.FindAll()
}

// GetByID returns a glass by ID
func (s *GlassService) GetByID(id int64) (*models.Glass, error) {
	return s.repo.FindByID(id)
}

// Create creates a new glass
func (s *GlassService) Create(glass *models.Glass) error {
	if err := s.validateGlass(glass); err != nil {
		return err
	}

	existing, err := s.repo.FindByName(glass.Name)
	if err != nil {
		return fmt.Errorf("failed to check for duplicate: %w", err)
	}
	if existing != nil {
		return errors.New("glass with this name already exists")
	}

	return s.repo.Create(glass)
}

// Update updates an existing glass
func (s *GlassService) Update(glass *models.Glass) error {
	if err := s.validateGlass(glass); err != nil {
		return err
	}

	existing, err := s.repo.FindByID(glass.ID)
	if err != nil {
		return fmt.Errorf("failed to find glass: %w", err)
	}
	if existing == nil {
		return errors.New("glass not found")
	}

	duplicate, err := s.repo.FindByName(glass.Name)
	if err != nil {
		return fmt.Errorf("failed to check for duplicate: %w", err)
	}
	if duplicate != nil && duplicate.ID != glass.ID {
		return errors.New("glass with this name already exists")
	}

	return s.repo.Update(glass)
}

// Delete deletes a glass by ID
func (s *GlassService) Delete(id int64) error {
	existing, err := s.repo.FindByID(id)
	if err != nil {
		return fmt.Errorf("failed to find glass: %w", err)
	}
	if existing == nil {
		return errors.New("glass not found")
	}

	return s.repo.Delete(id)
}

// validateGlass validates glass data
func (s *GlassService) validateGlass(glass *models.Glass) error {
	if glass.Name == "" {
		return errors.New("glass name is required")
	}

	if glass.Size < 10 || glass.Size > 5000 {
		return errors.New("glass size must be between 10 and 5000 ml")
	}

	return nil
}
