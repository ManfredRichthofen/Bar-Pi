package service

import (
	"errors"
	"fmt"

	"github.com/ManfredRichthofen/Bar-Pi/backend-go/internal/models"
	"github.com/ManfredRichthofen/Bar-Pi/backend-go/internal/repository"
)

type RecipeService struct {
	repo *repository.RecipeRepository
}

func NewRecipeService(repo *repository.RecipeRepository) *RecipeService {
	return &RecipeService{repo: repo}
}

func (s *RecipeService) Create(recipe *models.Recipe) error {
	if recipe.Name == "" {
		return errors.New("recipe name is required")
	}
	return s.repo.Create(recipe)
}

func (s *RecipeService) GetByID(id int64) (*models.Recipe, error) {
	return s.repo.FindByID(id)
}

func (s *RecipeService) GetAll() ([]models.Recipe, error) {
	return s.repo.FindAll()
}

func (s *RecipeService) GetByOwnerID(ownerID int64) ([]models.Recipe, error) {
	return s.repo.FindByOwnerID(ownerID)
}

func (s *RecipeService) Update(recipe *models.Recipe) error {
	existing, err := s.repo.FindByID(recipe.ID)
	if err != nil {
		return fmt.Errorf("failed to find recipe: %w", err)
	}
	if existing == nil {
		return errors.New("recipe not found")
	}
	return s.repo.Update(recipe)
}

func (s *RecipeService) Delete(id int64, userID int64, isAdmin bool) error {
	recipe, err := s.repo.FindByID(id)
	if err != nil {
		return fmt.Errorf("failed to find recipe: %w", err)
	}
	if recipe == nil {
		return errors.New("recipe not found")
	}

	if recipe.OwnerID != userID && !isAdmin {
		return errors.New("unauthorized to delete this recipe")
	}

	return s.repo.Delete(id)
}

func (s *RecipeService) Search(query string) ([]models.Recipe, error) {
	return s.repo.Search(query)
}
