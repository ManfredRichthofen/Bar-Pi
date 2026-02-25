package service

import (
	"errors"
	"fmt"

	"github.com/ManfredRichthofen/Bar-Pi/backend-go/internal/models"
	"github.com/ManfredRichthofen/Bar-Pi/backend-go/internal/repository"
)

// CategoryService handles business logic for categories
type CategoryService struct {
	repo *repository.CategoryRepository
}

// NewCategoryService creates a new category service
func NewCategoryService(repo *repository.CategoryRepository) *CategoryService {
	return &CategoryService{repo: repo}
}

// GetAll returns all categories
func (s *CategoryService) GetAll() ([]models.Category, error) {
	return s.repo.FindAll()
}

// GetByID returns a category by ID
func (s *CategoryService) GetByID(id int64) (*models.Category, error) {
	return s.repo.FindByID(id)
}

// Create creates a new category
func (s *CategoryService) Create(category *models.Category) error {
	if category.Name == "" {
		return errors.New("category name is required")
	}

	existing, err := s.repo.FindByName(category.Name)
	if err != nil {
		return fmt.Errorf("failed to check for duplicate: %w", err)
	}
	if existing != nil {
		return errors.New("category with this name already exists")
	}

	return s.repo.Create(category)
}

// Update updates an existing category
func (s *CategoryService) Update(category *models.Category) error {
	if category.Name == "" {
		return errors.New("category name is required")
	}

	existing, err := s.repo.FindByID(category.ID)
	if err != nil {
		return fmt.Errorf("failed to find category: %w", err)
	}
	if existing == nil {
		return errors.New("category not found")
	}

	duplicate, err := s.repo.FindByName(category.Name)
	if err != nil {
		return fmt.Errorf("failed to check for duplicate: %w", err)
	}
	if duplicate != nil && duplicate.ID != category.ID {
		return errors.New("category with this name already exists")
	}

	return s.repo.Update(category)
}

// Delete deletes a category by ID
func (s *CategoryService) Delete(id int64) error {
	existing, err := s.repo.FindByID(id)
	if err != nil {
		return fmt.Errorf("failed to find category: %w", err)
	}
	if existing == nil {
		return errors.New("category not found")
	}

	return s.repo.Delete(id)
}
