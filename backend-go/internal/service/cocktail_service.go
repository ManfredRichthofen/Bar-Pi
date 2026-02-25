package service

import (
	"errors"
	"fmt"
	"sync"
	"time"

	"github.com/ManfredRichthofen/Bar-Pi/backend-go/internal/models"
	"github.com/ManfredRichthofen/Bar-Pi/backend-go/internal/repository"
)

// CocktailService handles cocktail order operations
type CocktailService struct {
	recipeRepo     *repository.RecipeRepository
	ingredientRepo *repository.IngredientRepository
	pumpRepo       *repository.PumpRepository
	currentOrder   *models.CocktailProgress
	mu             sync.RWMutex
}

// NewCocktailService creates a new cocktail service
func NewCocktailService(
	recipeRepo *repository.RecipeRepository,
	ingredientRepo *repository.IngredientRepository,
	pumpRepo *repository.PumpRepository,
) *CocktailService {
	return &CocktailService{
		recipeRepo:     recipeRepo,
		ingredientRepo: ingredientRepo,
		pumpRepo:       pumpRepo,
	}
}

// CheckFeasibility checks if a recipe can be made with current ingredients
func (s *CocktailService) CheckFeasibility(recipeID int64, config models.CocktailOrderConfiguration) (*models.FeasibilityReport, error) {
	recipe, err := s.recipeRepo.FindByID(recipeID)
	if err != nil {
		return nil, fmt.Errorf("failed to find recipe: %w", err)
	}
	if recipe == nil {
		return nil, errors.New("recipe not found")
	}

	report := &models.FeasibilityReport{
		Feasible:           true,
		RecipeID:           recipeID,
		MissingIngredients: []string{},
		InsufficientPumps:  []string{},
		Message:            "Recipe is feasible",
	}

	// Get all pumps
	pumps, err := s.pumpRepo.FindAll()
	if err != nil {
		return nil, fmt.Errorf("failed to get pumps: %w", err)
	}

	// Check if we have pumps with required ingredients
	// This is a simplified check - full implementation would check quantities
	if len(pumps) == 0 {
		report.Feasible = false
		report.Message = "No pumps configured"
		return report, nil
	}

	// Check production steps and ingredients
	if len(recipe.ProductionSteps) == 0 {
		report.Feasible = false
		report.Message = "Recipe has no production steps"
		return report, nil
	}

	// In a full implementation, we would:
	// 1. Check each ingredient in production steps
	// 2. Verify pumps have sufficient liquid
	// 3. Check if manual ingredients are in bar
	// 4. Calculate total volume needed

	return report, nil
}

// OrderCocktail starts cocktail production
func (s *CocktailService) OrderCocktail(userID int64, username string, recipeID int64, config models.CocktailOrderConfiguration) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	// Check if there's already an order in progress
	if s.currentOrder != nil && s.currentOrder.Status == "in_progress" {
		return errors.New("another cocktail is already being made")
	}

	// Get recipe
	recipe, err := s.recipeRepo.FindByID(recipeID)
	if err != nil {
		return fmt.Errorf("failed to find recipe: %w", err)
	}
	if recipe == nil {
		return errors.New("recipe not found")
	}

	// Check feasibility
	feasibility, err := s.CheckFeasibility(recipeID, config)
	if err != nil {
		return fmt.Errorf("failed to check feasibility: %w", err)
	}
	if !feasibility.Feasible {
		return fmt.Errorf("recipe is not feasible: %s", feasibility.Message)
	}

	// Create progress tracker
	s.currentOrder = &models.CocktailProgress{
		RecipeID:        recipeID,
		RecipeName:      recipe.Name,
		UserID:          userID,
		Username:        username,
		CurrentStep:     0,
		TotalSteps:      len(recipe.ProductionSteps),
		Status:          "in_progress",
		Message:         "Starting production",
		PercentComplete: 0,
		StartedAt:       time.Now(),
	}

	// Start production in background
	go s.produceCoktail(recipe, config)

	return nil
}

// produceCoktail simulates cocktail production
func (s *CocktailService) produceCoktail(recipe *models.Recipe, config models.CocktailOrderConfiguration) {
	// This is a simplified simulation
	// Full implementation would:
	// 1. Control actual pumps via GPIO
	// 2. Handle manual ingredient prompts
	// 3. Monitor production progress
	// 4. Handle errors and cleanup

	totalSteps := len(recipe.ProductionSteps)
	
	for i := 0; i < totalSteps; i++ {
		s.mu.Lock()
		if s.currentOrder.Status == "cancelled" {
			s.mu.Unlock()
			return
		}
		
		s.currentOrder.CurrentStep = i + 1
		s.currentOrder.PercentComplete = ((i + 1) * 100) / totalSteps
		s.currentOrder.Message = fmt.Sprintf("Processing step %d of %d", i+1, totalSteps)
		s.mu.Unlock()

		// Simulate step processing time
		time.Sleep(2 * time.Second)
	}

	// Mark as completed
	s.mu.Lock()
	now := time.Now()
	s.currentOrder.Status = "completed"
	s.currentOrder.Message = "Cocktail ready!"
	s.currentOrder.PercentComplete = 100
	s.currentOrder.CompletedAt = &now
	s.mu.Unlock()
}

// GetCurrentProgress returns the current cocktail production progress
func (s *CocktailService) GetCurrentProgress() *models.CocktailProgress {
	s.mu.RLock()
	defer s.mu.RUnlock()
	
	if s.currentOrder == nil {
		return nil
	}
	
	// Return a copy to avoid race conditions
	progress := *s.currentOrder
	return &progress
}

// CancelOrder cancels the current cocktail order
func (s *CocktailService) CancelOrder(userID int64) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	if s.currentOrder == nil {
		return errors.New("no active order to cancel")
	}

	if s.currentOrder.Status != "in_progress" {
		return errors.New("order is not in progress")
	}

	// Check if user owns this order (or is admin - handled in handler)
	if s.currentOrder.UserID != userID {
		return errors.New("you can only cancel your own orders")
	}

	s.currentOrder.Status = "cancelled"
	s.currentOrder.Message = "Order cancelled by user"
	now := time.Now()
	s.currentOrder.CompletedAt = &now

	return nil
}

// ContinueProduction continues a paused production
func (s *CocktailService) ContinueProduction() error {
	s.mu.Lock()
	defer s.mu.Unlock()

	if s.currentOrder == nil {
		return errors.New("no active order")
	}

	if s.currentOrder.Status != "paused" {
		return errors.New("order is not paused")
	}

	s.currentOrder.Status = "in_progress"
	s.currentOrder.Message = "Production resumed"

	return nil
}
