package service

import (
	"errors"
	"fmt"
	"sync"
	"sync/atomic"
	"time"

	"github.com/ManfredRichthofen/Bar-Pi/backend-go/internal/models"
	"github.com/ManfredRichthofen/Bar-Pi/backend-go/internal/repository"
	"github.com/ManfredRichthofen/Bar-Pi/backend-go/internal/websocket"
)

// PumpService handles business logic for pumps
type PumpService struct {
	repo           *repository.PumpRepository
	ingredientRepo *repository.IngredientRepository
	gpioRepo       *repository.GPIORepository
	gpioService    *GPIOService
	wsService      *websocket.Service
	systemService  *SystemService

	mu           sync.RWMutex
	runningJobs  map[int64]chan struct{}
	jobStates    map[int64]*models.PumpJobState
	jobMetrics   map[int64]*models.JobMetrics
	jobCounter   int64
}

// NewPumpService creates a new pump service
func NewPumpService(
	repo *repository.PumpRepository,
	ingredientRepo *repository.IngredientRepository,
	opts ...any,
) *PumpService {
	ps := &PumpService{
		repo:           repo,
		ingredientRepo: ingredientRepo,
		runningJobs:    make(map[int64]chan struct{}),
		jobStates:      make(map[int64]*models.PumpJobState),
		jobMetrics:     make(map[int64]*models.JobMetrics),
	}
	for _, opt := range opts {
		switch v := opt.(type) {
		case *repository.GPIORepository:
			ps.gpioRepo = v
		case *GPIOService:
			ps.gpioService = v
		case *websocket.Service:
			ps.wsService = v
		case *SystemService:
			ps.systemService = v
		}
	}
	return ps
}

func (s *PumpService) enrichCanControlDirection(pumps []models.Pump) {
	reverseEnabled := false
	if s.systemService != nil {
		reverseEnabled = s.systemService.GetReversePumpSettings().Enable
	}
	for i := range pumps {
		if pumps[i].DType == "StepperPump" || reverseEnabled {
			pumps[i].CanControlDirection = true
		}
	}
}

func (s *PumpService) ensurePinsExist(pump *models.Pump) {
	if s.gpioRepo == nil {
		return
	}
	if pump.DcPinBoard != nil && pump.DcPinNr != nil {
		_ = s.gpioRepo.EnsurePinExists(*pump.DcPinBoard, *pump.DcPinNr)
	}
	if pump.StepPinBoard != nil && pump.StepPinNr != nil {
		_ = s.gpioRepo.EnsurePinExists(*pump.StepPinBoard, *pump.StepPinNr)
	}
	if pump.EnablePinBoard != nil && pump.EnablePinNr != nil {
		_ = s.gpioRepo.EnsurePinExists(*pump.EnablePinBoard, *pump.EnablePinNr)
	}
}

func (s *PumpService) broadcastLayout() {
	if s.wsService == nil {
		return
	}
	if pumps, err := s.GetAll(); err == nil {
		s.wsService.BroadcastPumpLayout(pumps)
	}
}

// GetAll returns all pumps
func (s *PumpService) GetAll() ([]models.Pump, error) {
	pumps, err := s.repo.FindAll()
	if err != nil {
		return nil, err
	}
	s.enrichCanControlDirection(pumps)
	return pumps, nil
}

// GetByID returns a pump by ID
func (s *PumpService) GetByID(id int64) (*models.Pump, error) {
	pump, err := s.repo.FindByID(id)
	if err != nil || pump == nil {
		return pump, err
	}
	slice := []models.Pump{*pump}
	s.enrichCanControlDirection(slice)
	return &slice[0], nil
}

// Create creates a new pump (supports incomplete skeleton pumps from PumpSelector)
func (s *PumpService) Create(pump *models.Pump) error {
	pump.DType = models.FrontendTypeToPumpDType(pump.DType)
	if pump.DType == "" {
		pump.DType = "DcPump"
	}

	validTypes := map[string]bool{
		"DcPump":      true,
		"StepperPump": true,
		"Valve":       true,
	}
	if !validTypes[pump.DType] {
		return fmt.Errorf("invalid pump type: %s", pump.DType)
	}

	if pump.Name != nil && *pump.Name == "" {
		pump.Name = nil
	}

	if err := s.validatePumpRanges(pump); err != nil {
		return err
	}

	s.ensurePinsExist(pump)
	pump.Completed = pump.ComputeState() == "READY"

	if err := s.repo.Create(pump); err != nil {
		return err
	}
	if updated, err := s.GetByID(pump.ID); err == nil && updated != nil {
		*pump = *updated
	}
	s.broadcastLayout()
	return nil
}

// Update updates an existing pump
func (s *PumpService) Update(pump *models.Pump) error {
	pump.DType = models.FrontendTypeToPumpDType(pump.DType)
	if err := s.validatePumpRanges(pump); err != nil {
		return err
	}

	existing, err := s.repo.FindByID(pump.ID)
	if err != nil {
		return fmt.Errorf("failed to find pump: %w", err)
	}
	if existing == nil {
		return errors.New("pump not found")
	}

	s.ensurePinsExist(pump)
	pump.Completed = pump.ComputeState() == "READY"

	if err := s.repo.Update(pump); err != nil {
		return err
	}
	s.broadcastLayout()
	return nil
}

// PatchPumpRequest represents the JSON body sent by EditPumpPage / PumpDtoMapper
type PatchPumpRequest struct {
	Name                *string        `json:"name"`
	Type                *string        `json:"type"`
	DType               *string        `json:"dtype"`
	Pin                 *models.PinDto `json:"pin"`
	EnablePin           *models.PinDto `json:"enablePin"`
	StepPin             *models.PinDto `json:"stepPin"`
	TimePerClInMs       *int           `json:"timePerClInMs"`
	IsPowerStateHigh    *bool          `json:"isPowerStateHigh"`
	TubeCapacity        *float64       `json:"tubeCapacity"`
	TubeCapacityInMl    *float64       `json:"tubeCapacityInMl"`
	FillingLevelInMl    *int           `json:"fillingLevelInMl"`
	IsPumpedUp          *bool          `json:"isPumpedUp"`
	PumpedUp            *bool          `json:"pumpedUp"`
	CurrentIngredientID *int64         `json:"currentIngredientId"`
	Acceleration        *int           `json:"acceleration"`
	MaxStepsPerSecond   *int           `json:"maxStepsPerSecond"`
	StepsPerCl          *int           `json:"stepsPerCl"`
	RemoveFields        []string       `json:"removeFields"`
}

func toInt(v any) (int, bool) {
	switch val := v.(type) {
	case float64:
		return int(val), true
	case int:
		return val, true
	case int64:
		return int(val), true
	case string:
		var parsed int
		if _, err := fmt.Sscanf(val, "%d", &parsed); err == nil {
			return parsed, true
		}
	}
	return 0, false
}

func toInt64(v any) (int64, bool) {
	switch val := v.(type) {
	case float64:
		return int64(val), true
	case int64:
		return val, true
	case int:
		return int64(val), true
	case string:
		var parsed int64
		if _, err := fmt.Sscanf(val, "%d", &parsed); err == nil {
			return parsed, true
		}
	}
	return 0, false
}

func toFloat64(v any) (float64, bool) {
	switch val := v.(type) {
	case float64:
		return val, true
	case int:
		return float64(val), true
	case int64:
		return float64(val), true
	case string:
		var parsed float64
		if _, err := fmt.Sscanf(val, "%f", &parsed); err == nil {
			return parsed, true
		}
	}
	return 0, false
}

// UpdateFields updates specific fields of a pump safely, supporting both CocktailPi camelCase/nested Pin DTOs and snake_case
func (s *PumpService) UpdateFields(id int64, fields map[string]any) error {
	existing, err := s.repo.FindByID(id)
	if err != nil {
		return fmt.Errorf("failed to find pump: %w", err)
	}
	if existing == nil {
		return errors.New("pump not found")
	}

	if v, ok := fields["type"].(string); ok && v != "" {
		existing.DType = models.FrontendTypeToPumpDType(v)
	} else if v, ok := fields["dtype"].(string); ok && v != "" {
		existing.DType = models.FrontendTypeToPumpDType(v)
	}

	if v, ok := fields["name"]; ok {
		if str, isStr := v.(string); isStr {
			if str == "" {
				existing.Name = nil
			} else {
				existing.Name = &str
			}
		} else if v == nil {
			existing.Name = nil
		}
	}

	if v, ok := fields["tubeCapacityInMl"]; ok {
		if f, ok := toFloat64(v); ok {
			existing.TubeCapacity = &f
		}
	} else if v, ok := fields["tubeCapacity"]; ok {
		if f, ok := toFloat64(v); ok {
			existing.TubeCapacity = &f
		}
	} else if v, ok := fields["tube_capacity"]; ok {
		if f, ok := toFloat64(v); ok {
			existing.TubeCapacity = &f
		}
	}

	if v, ok := fields["fillingLevelInMl"]; ok {
		if n, ok := toInt(v); ok {
			existing.FillingLevelInMl = n
		}
	} else if v, ok := fields["filling_level_in_ml"]; ok {
		if n, ok := toInt(v); ok {
			existing.FillingLevelInMl = n
		}
	}

	if v, ok := fields["isPumpedUp"].(bool); ok {
		existing.IsPumpedUp = v
	} else if v, ok := fields["pumpedUp"].(bool); ok {
		existing.IsPumpedUp = v
	} else if v, ok := fields["is_pumped_up"].(bool); ok {
		existing.IsPumpedUp = v
	}

	if v, ok := fields["isPowerStateHigh"].(bool); ok {
		existing.IsPowerStateHigh = &v
	} else if v, ok := fields["is_power_state_high"].(bool); ok {
		existing.IsPowerStateHigh = &v
	}

	if v, ok := fields["timePerClInMs"]; ok {
		if n, ok := toInt(v); ok && n >= 1 {
			existing.TimePerClInMs = &n
		}
	} else if v, ok := fields["time_per_cl_in_ms"]; ok {
		if n, ok := toInt(v); ok && n >= 1 {
			existing.TimePerClInMs = &n
		}
	}

	if v, ok := fields["acceleration"]; ok {
		if n, ok := toInt(v); ok && n >= 1 {
			existing.Acceleration = &n
		}
	}
	if v, ok := fields["maxStepsPerSecond"]; ok {
		if n, ok := toInt(v); ok && n >= 1 {
			existing.MaxStepsPerSecond = &n
		}
	} else if v, ok := fields["max_steps_per_second"]; ok {
		if n, ok := toInt(v); ok && n >= 1 {
			existing.MaxStepsPerSecond = &n
		}
	}
	if v, ok := fields["stepsPerCl"]; ok {
		if n, ok := toInt(v); ok && n >= 1 {
			existing.StepsPerCl = &n
		}
	} else if v, ok := fields["steps_per_cl"]; ok {
		if n, ok := toInt(v); ok && n >= 1 {
			existing.StepsPerCl = &n
		}
	}

	// Handle currentIngredientId / current_ingredient_id
	for _, key := range []string{"currentIngredientId", "current_ingredient_id"} {
		if rawIng, exists := fields[key]; exists {
			if rawIng == nil {
				existing.CurrentIngredientID = nil
				existing.CurrentIngredient = nil
			} else if ingID, ok := toInt64(rawIng); ok {
				if ingID <= 0 {
					existing.CurrentIngredientID = nil
					existing.CurrentIngredient = nil
				} else {
					ingredient, err := s.ingredientRepo.FindByID(ingID)
					if err != nil {
						return fmt.Errorf("failed to find ingredient: %w", err)
					}
					if ingredient == nil {
						return errors.New("ingredient not found")
					}
					existing.CurrentIngredientID = &ingID
					existing.CurrentIngredient = ingredient
				}
			}
		}
	}

	// Handle nested pin objects: pin, stepPin, enablePin
	parsePinMap := func(raw any) (*int64, *int) {
		m, ok := raw.(map[string]any)
		if !ok || m == nil {
			return nil, nil
		}
		var boardID *int64
		var pinNr *int
		if b, ok := toInt64(m["boardId"]); ok && b > 0 {
			boardID = &b
		}
		if nr, ok := toInt(m["nr"]); ok && nr >= 0 {
			pinNr = &nr
		} else if nr, ok := toInt(m["pinId"]); ok && nr >= 0 {
			pinNr = &nr
		}
		if boardID == nil || pinNr == nil {
			return nil, nil
		}
		return boardID, pinNr
	}

	if rawPin, exists := fields["pin"]; exists {
		b, n := parsePinMap(rawPin)
		existing.DcPinBoard = b
		existing.DcPinNr = n
	}
	if rawStepPin, exists := fields["stepPin"]; exists {
		b, n := parsePinMap(rawStepPin)
		existing.StepPinBoard = b
		existing.StepPinNr = n
	}
	if rawEnablePin, exists := fields["enablePin"]; exists {
		b, n := parsePinMap(rawEnablePin)
		existing.EnablePinBoard = b
		existing.EnablePinNr = n
	}

	// Handle removeFields if present
	if rmList, ok := fields["removeFields"].([]any); ok {
		for _, item := range rmList {
			fieldStr, _ := item.(string)
			switch fieldStr {
			case "pin", "dcPin":
				existing.DcPinBoard = nil
				existing.DcPinNr = nil
			case "stepPin":
				existing.StepPinBoard = nil
				existing.StepPinNr = nil
			case "enablePin":
				existing.EnablePinBoard = nil
				existing.EnablePinNr = nil
			case "currentIngredient", "currentIngredientId":
				existing.CurrentIngredientID = nil
				existing.CurrentIngredient = nil
			case "name":
				existing.Name = nil
			}
		}
	}

	if err := s.validatePumpRanges(existing); err != nil {
		return err
	}

	s.ensurePinsExist(existing)
	existing.Completed = existing.ComputeState() == "READY"

	if err := s.repo.Update(existing); err != nil {
		return err
	}
	s.broadcastLayout()
	return nil
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

	_ = s.StopPump(&id)

	if err := s.repo.Delete(id); err != nil {
		return err
	}
	s.broadcastLayout()
	return nil
}

// SetIngredient sets the current ingredient for a pump
func (s *PumpService) SetIngredient(pumpID int64, ingredientID *int64) error {
	return s.UpdateFields(pumpID, map[string]any{
		"currentIngredientId": ingredientID,
	})
}

// SetFillingLevel sets the filling level of a pump
func (s *PumpService) SetFillingLevel(pumpID int64, level int) error {
	if level < 0 {
		return errors.New("filling level cannot be negative")
	}
	return s.UpdateFields(pumpID, map[string]any{
		"fillingLevelInMl": level,
	})
}

// SetPumpedUp sets the pumped up status and broadcasts running state
func (s *PumpService) SetPumpedUp(pumpID int64, isPumpedUp bool) error {
	pump, err := s.repo.FindByID(pumpID)
	if err != nil {
		return fmt.Errorf("failed to find pump: %w", err)
	}
	if pump == nil {
		return errors.New("pump not found")
	}

	advice := models.PumpAdvice{
		Type:   "PUMP_UP",
		Amount: 0,
	}
	if !isPumpedUp {
		advice.Type = "PUMP_DOWN"
	}
	_, err = s.DispatchPumpAdvice(pumpID, advice)
	return err
}

// StartPump starts a specific pump or all pumps (if pumpID == nil)
func (s *PumpService) StartPump(pumpID *int64) error {
	if pumpID == nil {
		pumps, err := s.repo.FindAll()
		if err != nil {
			return err
		}
		for _, p := range pumps {
			id := p.ID
			_, _ = s.DispatchPumpAdvice(id, models.PumpAdvice{Type: "RUN_INFINITY"})
		}
		return nil
	}

	pump, err := s.repo.FindByID(*pumpID)
	if err != nil || pump == nil {
		return errors.New("pump not found")
	}
	_, err = s.DispatchPumpAdvice(*pumpID, models.PumpAdvice{Type: "RUN_INFINITY"})
	return err
}

// StopPump stops a specific pump or all pumps (if pumpID == nil)
func (s *PumpService) StopPump(pumpID *int64) error {
	s.mu.Lock()
	var idsToStop []int64
	if pumpID == nil {
		for id := range s.runningJobs {
			idsToStop = append(idsToStop, id)
		}
	} else {
		idsToStop = append(idsToStop, *pumpID)
	}

	for _, id := range idsToStop {
		if ch, running := s.runningJobs[id]; running {
			close(ch)
			delete(s.runningJobs, id)
		}
		state := s.jobStates[id]
		if state == nil {
			state = &models.PumpJobState{}
		}
		state.RunningState = nil
		s.jobStates[id] = state
	}
	s.mu.Unlock()

	for _, id := range idsToStop {
		if s.wsService != nil {
			s.wsService.BroadcastPumpRunningState(id, s.GetJobState(id))
		}
	}
	return nil
}

// DispatchPumpAdvice executes a pump job asynchronously and returns a job ID
func (s *PumpService) DispatchPumpAdvice(pumpID int64, advice models.PumpAdvice) (int64, error) {
	pump, err := s.repo.FindByID(pumpID)
	if err != nil {
		return 0, err
	}
	if pump == nil {
		return 0, errors.New("pump not found")
	}

	// Stop any existing job on this pump
	_ = s.StopPump(&pumpID)

	jobID := atomic.AddInt64(&s.jobCounter, 1)
	stopCh := make(chan struct{})

	runInfinity := advice.Type == "RUN_INFINITY"
	forward := advice.Type != "PUMP_DOWN"

	runningInfo := &models.RunningStateInfo{
		Percentage:  0,
		Forward:     forward,
		RunInfinity: runInfinity,
		JobID:       jobID,
	}
	jobState := &models.PumpJobState{
		LastJobID:    &jobID,
		RunningState: runningInfo,
	}
	metrics := &models.JobMetrics{
		ID:        jobID,
		StartTime: time.Now().UnixMilli(),
	}

	s.mu.Lock()
	s.runningJobs[pumpID] = stopCh
	s.jobStates[pumpID] = jobState
	s.jobMetrics[jobID] = metrics
	s.mu.Unlock()

	if s.wsService != nil {
		s.wsService.BroadcastPumpRunningState(pumpID, jobState)
	}

	go func() {
		start := time.Now()
		defer func() {
			now := time.Now()
			s.mu.Lock()
			if currentCh, ok := s.runningJobs[pumpID]; ok && currentCh == stopCh {
				delete(s.runningJobs, pumpID)
			}
			if st, ok := s.jobStates[pumpID]; ok {
				st.RunningState = nil
			}
			if m, ok := s.jobMetrics[jobID]; ok {
				m.StopTime = now.UnixMilli()
				m.TimeElapsed = now.Sub(start).Milliseconds()
			}
			s.mu.Unlock()

			if s.wsService != nil {
				s.wsService.BroadcastPumpRunningState(pumpID, s.GetJobState(pumpID))
				s.broadcastLayout()
			}
		}()

		if runInfinity {
			// Activate pin if hardware present
			if s.gpioService != nil && pump.DcPinNr != nil {
				activeHigh := pump.IsPowerStateHigh == nil || *pump.IsPowerStateHigh
				_ = s.gpioService.SetupOutputPin(*pump.DcPinNr)
				if activeHigh {
					_ = s.gpioService.SetPinHigh(*pump.DcPinNr)
				} else {
					_ = s.gpioService.SetPinLow(*pump.DcPinNr)
				}
				defer func() {
					if activeHigh {
						_ = s.gpioService.SetPinLow(*pump.DcPinNr)
					} else {
						_ = s.gpioService.SetPinHigh(*pump.DcPinNr)
					}
				}()
			}
			<-stopCh
			return
		}

		// Finite job duration
		durationMs := 1500
		if advice.Amount > 0 {
			durationMs = advice.Amount
		} else if pump.TubeCapacity != nil && *pump.TubeCapacity > 0 && pump.TimePerClInMs != nil {
			durationMs = int((*pump.TubeCapacity / 10.0) * float64(*pump.TimePerClInMs))
			if durationMs < 500 {
				durationMs = 500
			}
		}

		// Energize GPIO pin (and reverse director pin if applicable) during finite job
		if s.gpioService != nil && pump.DcPinNr != nil {
			activeHigh := pump.IsPowerStateHigh == nil || *pump.IsPowerStateHigh
			var directorPin *int
			var directorActiveHigh bool
			if !forward && s.systemService != nil {
				rev := s.systemService.GetReversePumpSettings()
				if rev.Enable && rev.Settings != nil && rev.Settings.DirectorPin != nil {
					directorPin = rev.Settings.DirectorPin.PinNumber()
					// Reverse state is opposite of ForwardStateHigh
					directorActiveHigh = !rev.Settings.ForwardStateHigh
				}
			}
			if directorPin != nil {
				_ = s.gpioService.SetupOutputPin(*directorPin)
				if directorActiveHigh {
					_ = s.gpioService.SetPinHigh(*directorPin)
				} else {
					_ = s.gpioService.SetPinLow(*directorPin)
				}
				defer func(dp int, dah bool) {
					if dah {
						_ = s.gpioService.SetPinLow(dp)
					} else {
						_ = s.gpioService.SetPinHigh(dp)
					}
				}(*directorPin, directorActiveHigh)
			}

			_ = s.gpioService.SetupOutputPin(*pump.DcPinNr)
			if activeHigh {
				_ = s.gpioService.SetPinHigh(*pump.DcPinNr)
			} else {
				_ = s.gpioService.SetPinLow(*pump.DcPinNr)
			}
			defer func(pin int, ah bool) {
				if ah {
					_ = s.gpioService.SetPinLow(pin)
				} else {
					_ = s.gpioService.SetPinHigh(pin)
				}
			}(*pump.DcPinNr, activeHigh)
		}

		steps := 10
		stepDuration := time.Duration(durationMs/steps) * time.Millisecond
		if stepDuration < 50*time.Millisecond {
			stepDuration = 50 * time.Millisecond
		}

		for i := 1; i <= steps; i++ {
			select {
			case <-stopCh:
				return
			case <-time.After(stepDuration):
				s.mu.Lock()
				if st, ok := s.jobStates[pumpID]; ok && st.RunningState != nil {
					st.RunningState.Percentage = (i * 100) / steps
				}
				s.mu.Unlock()
				if s.wsService != nil {
					s.wsService.BroadcastPumpRunningState(pumpID, s.GetJobState(pumpID))
				}
			}
		}

		switch advice.Type {
		case "PUMP_UP":
			_ = s.repo.UpdateFields(pumpID, map[string]any{"is_pumped_up": true})
		case "PUMP_DOWN":
			_ = s.repo.UpdateFields(pumpID, map[string]any{"is_pumped_up": false})
		}

		s.mu.Lock()
		if m, ok := s.jobMetrics[jobID]; ok {
			if pump.TubeCapacity != nil {
				m.MlPumped = int(*pump.TubeCapacity)
			} else {
				m.MlPumped = advice.Amount
			}
		}
		s.mu.Unlock()
	}()

	return jobID, nil
}

func (s *PumpService) GetJobState(pumpID int64) models.PumpJobState {
	s.mu.RLock()
	defer s.mu.RUnlock()
	if st, ok := s.jobStates[pumpID]; ok && st != nil {
		cp := *st
		if st.RunningState != nil {
			rs := *st.RunningState
			cp.RunningState = &rs
		}
		return cp
	}
	return models.PumpJobState{}
}

func (s *PumpService) GetJobMetrics(jobID int64) *models.JobMetrics {
	s.mu.RLock()
	defer s.mu.RUnlock()
	if m, ok := s.jobMetrics[jobID]; ok && m != nil {
		cp := *m
		return &cp
	}
	return &models.JobMetrics{
		ID: jobID,
	}
}

func (s *PumpService) validatePumpRanges(pump *models.Pump) error {
	if pump.FillingLevelInMl < 0 {
		return errors.New("filling level cannot be negative")
	}
	if pump.TubeCapacity != nil && *pump.TubeCapacity < 0 {
		return errors.New("tube capacity cannot be negative")
	}
	if pump.TimePerClInMs != nil && *pump.TimePerClInMs < 1 {
		return errors.New("timePerClInMs must be at least 1")
	}
	if pump.Acceleration != nil && (*pump.Acceleration < 1 || *pump.Acceleration > 500000) {
		return errors.New("acceleration must be between 1 and 500000")
	}
	if pump.MaxStepsPerSecond != nil && (*pump.MaxStepsPerSecond < 1 || *pump.MaxStepsPerSecond > 500000) {
		return errors.New("maxStepsPerSecond must be between 1 and 500000")
	}
	if pump.StepsPerCl != nil && *pump.StepsPerCl < 1 {
		return errors.New("stepsPerCl must be at least 1")
	}
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
