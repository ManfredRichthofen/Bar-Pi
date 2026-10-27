package service

import (
	"errors"
	"fmt"
	"math"
	"sync"
	"time"

	"github.com/ManfredRichthofen/Bar-Pi/backend-go/internal/models"
	"github.com/ManfredRichthofen/Bar-Pi/backend-go/internal/repository"
	"github.com/ManfredRichthofen/Bar-Pi/backend-go/internal/websocket"
	"gorm.io/gorm"
)

// CocktailService handles cocktail order operations
type CocktailService struct {
	recipeRepo     *repository.RecipeRepository
	ingredientRepo *repository.IngredientRepository
	pumpRepo       *repository.PumpRepository
	userService    *UserService
	gpioService    *GPIOService
	events         EventDispatcher
	wsService      *websocket.Service
	db             *gorm.DB

	currentOrder *models.CocktailProgress
	continueCh   chan struct{}
	cancelCh     chan struct{}
	mu           sync.RWMutex
}

// SetEventDispatcher wires in the event engine fired on production start, finish and cancel.
func (s *CocktailService) SetEventDispatcher(d EventDispatcher) {
	s.events = d
}

func (s *CocktailService) dispatchEvent(trigger string, recipeID int64) {
	if s.events != nil {
		s.events.Dispatch(trigger, recipeID)
	}
}

// NewCocktailService creates a new cocktail service
func NewCocktailService(
	recipeRepo *repository.RecipeRepository,
	ingredientRepo *repository.IngredientRepository,
	pumpRepo *repository.PumpRepository,
	opts ...any,
) *CocktailService {
	cs := &CocktailService{
		recipeRepo:     recipeRepo,
		ingredientRepo: ingredientRepo,
		pumpRepo:       pumpRepo,
	}
	for _, opt := range opts {
		switch v := opt.(type) {
		case *GPIOService:
			cs.gpioService = v
		case *websocket.Service:
			cs.wsService = v
		case *gorm.DB:
			cs.db = v
		case *UserService:
			cs.userService = v
		}
	}
	return cs
}

func (s *CocktailService) computeScaledIngredientAmounts(
	recipe *models.Recipe,
	config models.CocktailOrderConfiguration,
) ([]models.RequiredIngredient, int) {
	amountOrdered := config.AmountOrderedInMl
	if amountOrdered <= 0 {
		if recipe.DefaultAmountToFill > 0 {
			amountOrdered = recipe.DefaultAmountToFill
		} else if recipe.DefaultGlass != nil && recipe.DefaultGlass.Size > 0 {
			amountOrdered = recipe.DefaultGlass.Size
		} else {
			amountOrdered = 250
		}
	}

	boostFactor := 1.0
	if config.Customisations.Boost > 0 || (config.Customisations.Boost == 0 && len(config.Customisations.AdditionalIngredients) >= 0) {
		if config.Customisations.Boost != 0 {
			boostFactor = float64(config.Customisations.Boost) / 100.0
		}
	}

	// Calculate base total liquid in recipe
	baseTotal := 0.0
	for _, step := range recipe.ProductionSteps {
		for _, si := range step.Ingredients {
			scale := si.Scale
			if scale <= 0 {
				scale = 1.0
			}
			amt := float64(si.Amount) * scale
			if si.Boostable {
				amt *= boostFactor
			}
			baseTotal += amt
		}
	}

	scaleRatio := 1.0
	if baseTotal > 0 && amountOrdered > 0 {
		scaleRatio = float64(amountOrdered) / baseTotal
	}

	reqMap := make(map[int64]*models.RequiredIngredient)
	var order []int64

	for _, step := range recipe.ProductionSteps {
		for _, si := range step.Ingredients {
			if si.Ingredient == nil {
				continue
			}
			ing := *si.Ingredient
			scale := si.Scale
			if scale <= 0 {
				scale = 1.0
			}
			amt := float64(si.Amount) * scale
			if si.Boostable {
				amt *= boostFactor
			}
			scaledAmt := int(math.Round(amt * scaleRatio))
			if scaledAmt < 1 && si.Amount > 0 {
				scaledAmt = 1
			}

			if existing, ok := reqMap[ing.ID]; ok {
				existing.AmountRequired += scaledAmt
				existing.Amount += scaledAmt
			} else {
				ingCopy := ing
				reqMap[ing.ID] = &models.RequiredIngredient{
					Ingredient:     &ingCopy,
					AmountRequired: scaledAmt,
					Amount:         scaledAmt,
					AmountMissing:  0,
				}
				order = append(order, ing.ID)
			}
		}
	}

	// Add additional ingredients from customisations
	for _, add := range config.Customisations.AdditionalIngredients {
		if add.Amount <= 0 {
			continue
		}
		ingID := add.IngredientID
		if ingID == 0 && add.Ingredient != nil {
			ingID = add.Ingredient.ID
		}
		if ingID == 0 {
			continue
		}
		if existing, ok := reqMap[ingID]; ok {
			existing.AmountRequired += add.Amount
			existing.Amount += add.Amount
		} else {
			var ing *models.Ingredient
			if add.Ingredient != nil && add.Ingredient.Name != "" {
				ing = add.Ingredient
			} else if fetched, err := s.ingredientRepo.FindByID(ingID); err == nil && fetched != nil {
				ing = fetched
			}
			if ing != nil {
				reqMap[ingID] = &models.RequiredIngredient{
					Ingredient:     ing,
					AmountRequired: add.Amount,
					Amount:         add.Amount,
					AmountMissing:  0,
				}
				order = append(order, ingID)
			}
		}
	}

	totalAmount := 0
	result := make([]models.RequiredIngredient, 0, len(order))
	for _, id := range order {
		item := reqMap[id]
		totalAmount += item.AmountRequired
		result = append(result, *item)
	}
	if totalAmount == 0 {
		totalAmount = amountOrdered
	}

	return result, totalAmount
}

// CheckFeasibility checks if a recipe can be made with current ingredients and pumps
func (s *CocktailService) CheckFeasibility(recipeID int64, config models.CocktailOrderConfiguration) (*models.FeasibilityReport, error) {
	recipe, err := s.recipeRepo.FindByID(recipeID)
	if err != nil {
		return nil, fmt.Errorf("failed to find recipe: %w", err)
	}
	if recipe == nil {
		return nil, errors.New("recipe not found")
	}

	pumps, err := s.pumpRepo.FindAll()
	if err != nil {
		return nil, fmt.Errorf("failed to get pumps: %w", err)
	}

	pumpFillingByIngredient := make(map[int64]int)
	onPumpByIngredient := make(map[int64]bool)
	for _, p := range pumps {
		if p.CurrentIngredientID != nil {
			ingID := *p.CurrentIngredientID
			onPumpByIngredient[ingID] = true
			pumpFillingByIngredient[ingID] += p.FillingLevelInMl
		}
	}

	requiredIngredients, totalAmount := s.computeScaledIngredientAmounts(recipe, config)

	report := &models.FeasibilityReport{
		Feasible:                    true,
		TotalAmountInMl:             totalAmount,
		RecipeID:                    recipeID,
		RequiredIngredients:         requiredIngredients,
		MissingIngredients:          []string{},
		InsufficientPumps:           []string{},
		AllIngredientGroupsReplaced: true,
		Message:                     "Recipe is feasible",
	}

	if len(recipe.ProductionSteps) == 0 {
		report.Feasible = false
		report.Reason = "Recipe has no production steps"
		report.Message = report.Reason
		return report, nil
	}

	for i := range report.RequiredIngredients {
		req := &report.RequiredIngredients[i]
		ing := req.Ingredient
		if ing == nil {
			continue
		}
		ing.OnPump = onPumpByIngredient[ing.ID]
		inBar := ing.InBar != nil && *ing.InBar

		if ing.DType == "AutomatedIngredient" {
			if ing.OnPump {
				avail := pumpFillingByIngredient[ing.ID]
				if avail < req.AmountRequired {
					req.AmountMissing = req.AmountRequired - avail
					report.InsufficientPumps = append(report.InsufficientPumps, ing.Name)
				}
			} else if !inBar {
				req.AmountMissing = req.AmountRequired
				report.MissingIngredients = append(report.MissingIngredients, ing.Name)
			}
		} else if ing.DType == "ManualIngredient" {
			// Manual ingredients can be added by hand during production even if not marked inBar,
			// unless checkMissingIngredients is strictly requested and neither inBar nor onPump
			if config.CheckMissingIngredients && !inBar && !ing.OnPump {
				req.AmountMissing = req.AmountRequired
				report.MissingIngredients = append(report.MissingIngredients, ing.Name)
			}
		} else if ing.DType == "IngredientGroup" {
			report.AllIngredientGroupsReplaced = false
			report.Feasible = false
			report.Reason = fmt.Sprintf("Ingredient group '%s' must be replaced with a specific ingredient", ing.Name)
		}

		if req.AmountMissing > 0 && !config.SkipMissingIngredients {
			if report.Reason == "" {
				report.Reason = fmt.Sprintf("Insufficient amount for %s (missing %d ml)", ing.Name, req.AmountMissing)
			}
		}
	}

	if !report.AllIngredientGroupsReplaced {
		report.Message = report.Reason
	} else if len(report.MissingIngredients) > 0 || len(report.InsufficientPumps) > 0 {
		report.Message = report.Reason
	}

	return report, nil
}

// OrderCocktail starts cocktail production
func (s *CocktailService) OrderCocktail(userID int64, username string, recipeID int64, config models.CocktailOrderConfiguration) error {
	s.mu.Lock()
	if s.currentOrder != nil && (s.currentOrder.Status == "in_progress" || s.currentOrder.Status == "paused") {
		s.mu.Unlock()
		return errors.New("another cocktail is already being made")
	}
	s.mu.Unlock()

	if s.userService != nil {
		user, err := s.userService.GetByID(userID)
		if err != nil {
			return fmt.Errorf("failed to load user: %w", err)
		}
		if user != nil && user.MaxDrinksPerDay > 0 {
			count, err := s.userService.CountCompletedOrdersToday(userID)
			if err != nil {
				return fmt.Errorf("failed to check drink limit: %w", err)
			}
			if count >= int64(user.MaxDrinksPerDay) {
				return errors.New("daily drink limit reached")
			}
		}
	}

	recipe, err := s.recipeRepo.FindByID(recipeID)
	if err != nil {
		return fmt.Errorf("failed to find recipe: %w", err)
	}
	if recipe == nil {
		return errors.New("recipe not found")
	}

	feasibility, err := s.CheckFeasibility(recipeID, config)
	if err != nil {
		return fmt.Errorf("failed to check feasibility: %w", err)
	}
	if !feasibility.Feasible {
		return fmt.Errorf("recipe is not feasible: %s", feasibility.Message)
	}

	s.mu.Lock()
	s.continueCh = make(chan struct{}, 1)
	s.cancelCh = make(chan struct{})
	s.currentOrder = &models.CocktailProgress{
		RecipeID:        recipeID,
		RecipeName:      recipe.Name,
		Recipe:          recipe,
		UserID:          userID,
		Username:        username,
		CurrentStep:     0,
		TotalSteps:      len(recipe.ProductionSteps),
		Status:          "in_progress",
		State:           "PREPARING",
		Message:         "Starting production",
		PercentComplete: 0,
		Progress:        0,
		StartedAt:       time.Now(),
	}
	progressSnap := *s.currentOrder
	s.mu.Unlock()

	s.broadcastProgress(&progressSnap)
	s.dispatchEvent(models.EventTriggerProductionStarted, recipeID)

	go s.produceCocktail(recipe, config, feasibility)

	return nil
}

func (s *CocktailService) broadcastProgress(progress *models.CocktailProgress) {
	if s.wsService == nil {
		return
	}
	s.wsService.BroadcastCocktailProgress(progress)
}

func (s *CocktailService) recordOrder(
	recipe *models.Recipe,
	userID int64,
	username string,
	totalAmountMl int,
	status string,
	startedAt time.Time,
	completedAt time.Time,
	reqIngs []models.RequiredIngredient,
) {
	if s.db == nil {
		return
	}
	recipeID := recipe.ID
	uid := userID
	record := models.CocktailOrder{
		RecipeID:        &recipeID,
		RecipeName:      recipe.Name,
		UserID:          &uid,
		Username:        username,
		AmountOrderedMl: totalAmountMl,
		Status:          status,
		StartedAt:       startedAt,
		CompletedAt:     &completedAt,
	}
	if err := s.db.Create(&record).Error; err != nil {
		return
	}
	for _, ri := range reqIngs {
		if ri.Ingredient == nil || ri.AmountRequired <= 0 {
			continue
		}
		ingID := ri.Ingredient.ID
		oi := models.CocktailOrderIngredient{
			OrderID:        record.ID,
			IngredientID:   &ingID,
			IngredientName: ri.Ingredient.Name,
			DType:          ri.Ingredient.DType,
			AmountMl:       ri.AmountRequired,
		}
		_ = s.db.Create(&oi).Error
	}
}

func (s *CocktailService) produceCocktail(
	recipe *models.Recipe,
	config models.CocktailOrderConfiguration,
	feasibility *models.FeasibilityReport,
) {
	totalSteps := len(recipe.ProductionSteps)
	if totalSteps == 0 {
		totalSteps = 1
	}

	pumps, _ := s.pumpRepo.FindAll()
	pumpByIngredient := make(map[int64]*models.Pump)
	for i := range pumps {
		if pumps[i].CurrentIngredientID != nil {
			pumpByIngredient[*pumps[i].CurrentIngredientID] = &pumps[i]
		}
	}

	reqByIngredient := make(map[int64]int)
	for _, ri := range feasibility.RequiredIngredients {
		if ri.Ingredient != nil {
			reqByIngredient[ri.Ingredient.ID] = ri.AmountRequired
		}
	}

	for i, step := range recipe.ProductionSteps {
		s.mu.RLock()
		cancelCh := s.cancelCh
		continueCh := s.continueCh
		s.mu.RUnlock()

		select {
		case <-cancelCh:
			return
		default:
		}

		stepType := models.StepDTypeToFrontendType(step.DType)
		if stepType == "writtenInstruction" {
			s.mu.Lock()
			if s.currentOrder == nil || s.currentOrder.Status == "cancelled" {
				s.mu.Unlock()
				return
			}
			s.currentOrder.CurrentStep = i + 1
			s.currentOrder.Status = "paused"
			s.currentOrder.State = "MANUAL_ACTION_REQUIRED"
			s.currentOrder.WrittenInstruction = step.Message
			s.currentOrder.Message = step.Message
			pct := (i * 100) / totalSteps
			s.currentOrder.PercentComplete = pct
			s.currentOrder.Progress = pct
			snap := *s.currentOrder
			s.mu.Unlock()
			s.broadcastProgress(&snap)

			select {
			case <-cancelCh:
				return
			case <-continueCh:
			}
			continue
		}

		// Separate automated (on pump) vs manual ingredients in this step
		var manualPrompts []models.ManualIngredientItem
		var autoIngs []models.ProductionStepIngredient

		for _, si := range step.Ingredients {
			if si.Ingredient == nil {
				continue
			}
			amt := reqByIngredient[si.Ingredient.ID]
			if amt <= 0 {
				amt = si.Amount
			}
			if _, onPump := pumpByIngredient[si.Ingredient.ID]; onPump && si.Ingredient.DType == "AutomatedIngredient" {
				autoIngs = append(autoIngs, si)
			} else {
				unit := si.Ingredient.Unit
				if unit == "" {
					unit = "ml"
				}
				manualPrompts = append(manualPrompts, models.ManualIngredientItem{
					Ingredient: si.Ingredient,
					Name:       si.Ingredient.Name,
					Amount:     amt,
					Unit:       unit,
				})
			}
		}

		// If manual ingredients need to be added, prompt user and wait for continueProduction
		if len(manualPrompts) > 0 {
			s.mu.Lock()
			if s.currentOrder == nil || s.currentOrder.Status == "cancelled" {
				s.mu.Unlock()
				return
			}
			s.currentOrder.CurrentStep = i + 1
			s.currentOrder.Status = "paused"
			s.currentOrder.State = "MANUAL_INGREDIENT_ADD"
			s.currentOrder.CurrentIngredientsToAddManually = manualPrompts
			s.currentOrder.Message = "Please add manual ingredients"
			pct := (i * 100) / totalSteps
			s.currentOrder.PercentComplete = pct
			s.currentOrder.Progress = pct
			snap := *s.currentOrder
			s.mu.Unlock()
			s.broadcastProgress(&snap)

			select {
			case <-cancelCh:
				return
			case <-continueCh:
			}
		}

		// Run automated ingredients for this step
		s.mu.Lock()
		if s.currentOrder == nil || s.currentOrder.Status == "cancelled" {
			s.mu.Unlock()
			return
		}
		s.currentOrder.CurrentStep = i + 1
		s.currentOrder.Status = "in_progress"
		s.currentOrder.State = "PUMPING"
		s.currentOrder.CurrentIngredientsToAddManually = nil
		s.currentOrder.Message = fmt.Sprintf("Dispensing step %d of %d", i+1, totalSteps)
		s.mu.Unlock()

		// Compute step dispense duration and activate pumps via GPIO
		maxDurationMs := 1500
		var activeDcPins []struct {
			pin        int
			activeHigh bool
		}
		for _, si := range autoIngs {
			if si.Ingredient == nil {
				continue
			}
			p, ok := pumpByIngredient[si.Ingredient.ID]
			if !ok {
				continue
			}
			amt := reqByIngredient[si.Ingredient.ID]
			if amt <= 0 {
				amt = si.Amount
			}
			timePerCl := 1000
			if p.TimePerClInMs != nil && *p.TimePerClInMs > 0 {
				timePerCl = *p.TimePerClInMs
			}
			mult := 1.0
			if si.Ingredient.PumpTimeMultiplier != nil && *si.Ingredient.PumpTimeMultiplier > 0 {
				mult = *si.Ingredient.PumpTimeMultiplier
			}
			pumpMs := int((float64(amt) / 10.0) * float64(timePerCl) * mult)
			if pumpMs > maxDurationMs {
				maxDurationMs = pumpMs
			}

			if s.gpioService != nil {
				if (p.DType == "DcPump" || p.DType == "Valve") && p.DcPinNr != nil {
					activeHigh := p.IsPowerStateHigh == nil || *p.IsPowerStateHigh
					_ = s.gpioService.SetupOutputPin(*p.DcPinNr)
					if activeHigh {
						_ = s.gpioService.SetPinHigh(*p.DcPinNr)
					} else {
						_ = s.gpioService.SetPinLow(*p.DcPinNr)
					}
					activeDcPins = append(activeDcPins, struct {
						pin        int
						activeHigh bool
					}{pin: *p.DcPinNr, activeHigh: activeHigh})
				} else if p.DType == "StepperPump" && p.StepPinNr != nil && p.EnablePinNr != nil {
					stepsPerCl := 100
					if p.StepsPerCl != nil && *p.StepsPerCl > 0 {
						stepsPerCl = *p.StepsPerCl
					}
					maxSteps := 1000
					if p.MaxStepsPerSecond != nil && *p.MaxStepsPerSecond > 0 {
						maxSteps = *p.MaxStepsPerSecond
					}
					accel := 0
					if p.Acceleration != nil && *p.Acceleration > 0 {
						accel = *p.Acceleration
					}
					totalMotorSteps := int((float64(amt) / 10.0) * float64(stepsPerCl))
					go func(cfg StepperMotorConfig) {
						_ = s.gpioService.RunStepperMotor(cfg)
					}(StepperMotorConfig{
						StepPin:           *p.StepPinNr,
						EnablePin:         *p.EnablePinNr,
						Steps:             totalMotorSteps,
						MaxStepsPerSecond: maxSteps,
						Acceleration:      accel,
					})
				}
			}
		}

		stopActivePins := func() {
			if s.gpioService == nil {
				return
			}
			for _, ap := range activeDcPins {
				if ap.activeHigh {
					_ = s.gpioService.SetPinLow(ap.pin)
				} else {
					_ = s.gpioService.SetPinHigh(ap.pin)
				}
			}
		}

		subTicks := 5
		tickDuration := time.Duration(maxDurationMs/subTicks) * time.Millisecond
		if tickDuration < 100*time.Millisecond {
			tickDuration = 100 * time.Millisecond
		}
		if tickDuration > 500*time.Millisecond {
			tickDuration = 500 * time.Millisecond
		}
		for tick := 1; tick <= subTicks; tick++ {
			select {
			case <-cancelCh:
				stopActivePins()
				return
			case <-time.After(tickDuration):
				s.mu.Lock()
				if s.currentOrder == nil || s.currentOrder.Status == "cancelled" {
					s.mu.Unlock()
					stopActivePins()
					return
				}
				pct := ((i*subTicks + tick) * 100) / (totalSteps * subTicks)
				s.currentOrder.PercentComplete = pct
				s.currentOrder.Progress = pct
				snap := *s.currentOrder
				s.mu.Unlock()
				s.broadcastProgress(&snap)
			}
		}
		stopActivePins()

		// Deduct liquid from pumps
		for _, si := range autoIngs {
			if si.Ingredient == nil {
				continue
			}
			if p, ok := pumpByIngredient[si.Ingredient.ID]; ok {
				amt := reqByIngredient[si.Ingredient.ID]
				if amt <= 0 {
					amt = si.Amount
				}
				newLevel := p.FillingLevelInMl - amt
				if newLevel < 0 {
					newLevel = 0
				}
				p.FillingLevelInMl = newLevel
				_ = s.pumpRepo.UpdateFields(p.ID, map[string]any{
					"filling_level_in_ml": newLevel,
				})
			}
		}
	}

	now := time.Now()
	s.mu.Lock()
	if s.currentOrder == nil || s.currentOrder.Status == "cancelled" {
		s.mu.Unlock()
		return
	}
	s.currentOrder.Status = "completed"
	s.currentOrder.State = "COMPLETED"
	s.currentOrder.Message = "Cocktail ready!"
	s.currentOrder.PercentComplete = 100
	s.currentOrder.Progress = 100
	s.currentOrder.CompletedAt = &now
	snap := *s.currentOrder
	s.mu.Unlock()

	s.broadcastProgress(&snap)
	s.dispatchEvent(models.EventTriggerProductionFinished, recipe.ID)
	s.recordOrder(recipe, snap.UserID, snap.Username, feasibility.TotalAmountInMl, "completed", snap.StartedAt, now, feasibility.RequiredIngredients)

	// Clear progress after a brief display window so clients see 100% COMPLETED
	time.AfterFunc(5*time.Second, func() {
		s.mu.Lock()
		if s.currentOrder != nil && s.currentOrder.StartedAt.Equal(snap.StartedAt) && s.currentOrder.Status == "completed" {
			s.currentOrder = nil
			s.mu.Unlock()
			s.broadcastProgress(nil)
			return
		}
		s.mu.Unlock()
	})
}

// GetCurrentProgress returns the current cocktail production progress
func (s *CocktailService) GetCurrentProgress() *models.CocktailProgress {
	s.mu.RLock()
	defer s.mu.RUnlock()

	if s.currentOrder == nil {
		return nil
	}

	progress := *s.currentOrder
	return &progress
}

// CancelOrder cancels the current cocktail order
func (s *CocktailService) CancelOrder(userID int64, isAdmin ...bool) error {
	admin := len(isAdmin) > 0 && isAdmin[0]

	s.mu.Lock()
	if s.currentOrder == nil {
		s.mu.Unlock()
		return errors.New("no active order to cancel")
	}

	if s.currentOrder.Status != "in_progress" && s.currentOrder.Status != "paused" {
		s.mu.Unlock()
		return errors.New("order is not in progress")
	}

	if !admin && s.currentOrder.UserID != userID {
		s.mu.Unlock()
		return errors.New("you can only cancel your own orders")
	}

	if s.cancelCh != nil {
		select {
		case <-s.cancelCh:
		default:
			close(s.cancelCh)
		}
	}

	now := time.Now()
	s.currentOrder.Status = "cancelled"
	s.currentOrder.State = "CANCELLED"
	s.currentOrder.Message = "Order cancelled by user"
	s.currentOrder.CompletedAt = &now
	snap := *s.currentOrder
	recipe := s.currentOrder.Recipe
	s.mu.Unlock()

	s.broadcastProgress(&snap)
	s.dispatchEvent(models.EventTriggerProductionCancelled, snap.RecipeID)
	if recipe != nil {
		s.recordOrder(recipe, snap.UserID, snap.Username, recipe.DefaultAmountToFill, "cancelled", snap.StartedAt, now, nil)
	}

	time.AfterFunc(3*time.Second, func() {
		s.mu.Lock()
		if s.currentOrder != nil && s.currentOrder.StartedAt.Equal(snap.StartedAt) && s.currentOrder.Status == "cancelled" {
			s.currentOrder = nil
			s.mu.Unlock()
			s.broadcastProgress(nil)
			return
		}
		s.mu.Unlock()
	})

	return nil
}

// ContinueProduction continues a paused production
func (s *CocktailService) ContinueProduction() error {
	s.mu.Lock()
	if s.currentOrder == nil {
		s.mu.Unlock()
		return errors.New("no active order")
	}

	if s.currentOrder.Status != "paused" {
		s.mu.Unlock()
		return errors.New("order is not paused")
	}

	s.currentOrder.Status = "in_progress"
	s.currentOrder.State = "PUMPING"
	s.currentOrder.Message = "Production resumed"
	s.currentOrder.CurrentIngredientsToAddManually = nil
	ch := s.continueCh
	snap := *s.currentOrder
	s.mu.Unlock()

	s.broadcastProgress(&snap)

	if ch != nil {
		select {
		case ch <- struct{}{}:
		default:
		}
	}

	return nil
}
