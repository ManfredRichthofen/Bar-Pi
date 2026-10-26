//go:build linux

package service

import (
	"fmt"
	"sync"
	"time"

	"github.com/warthog618/go-gpiocdev"
)

// GPIOService handles GPIO pin control for pumps
type GPIOService struct {
	chip  *gpiocdev.Chip
	lines map[int]*gpiocdev.Line
	mu    sync.Mutex
}

// NewGPIOService creates a new GPIO service
func NewGPIOService() (*GPIOService, error) {
	// Open the default GPIO chip (gpiochip0 on Raspberry Pi)
	chip, err := gpiocdev.NewChip("gpiochip0")
	if err != nil {
		return nil, fmt.Errorf("failed to open GPIO chip: %w", err)
	}

	return &GPIOService{
		chip:  chip,
		lines: make(map[int]*gpiocdev.Line),
	}, nil
}

// Close releases all GPIO resources
func (s *GPIOService) Close() error {
	if s == nil {
		return nil
	}
	s.mu.Lock()
	defer s.mu.Unlock()

	for pin, line := range s.lines {
		_ = line.SetValue(0)
		if err := line.Close(); err != nil {
			return fmt.Errorf("failed to close pin %d: %w", pin, err)
		}
		delete(s.lines, pin)
	}

	if s.chip != nil {
		if err := s.chip.Close(); err != nil {
			return fmt.Errorf("failed to close GPIO chip: %w", err)
		}
		s.chip = nil
	}

	return nil
}

// SetupOutputPin configures a GPIO pin as output
func (s *GPIOService) SetupOutputPin(pin int) error {
	if s == nil || s.chip == nil {
		return nil
	}
	s.mu.Lock()
	defer s.mu.Unlock()

	if _, exists := s.lines[pin]; exists {
		return nil
	}

	line, err := s.chip.RequestLine(pin, gpiocdev.AsOutput(0))
	if err != nil {
		return fmt.Errorf("failed to request pin %d as output: %w", pin, err)
	}

	s.lines[pin] = line
	return nil
}

// SetPinHigh sets a GPIO pin to HIGH (3.3V)
func (s *GPIOService) SetPinHigh(pin int) error {
	if s == nil || s.chip == nil {
		return nil
	}
	s.mu.Lock()
	defer s.mu.Unlock()

	line, exists := s.lines[pin]
	if !exists {
		return fmt.Errorf("pin %d not configured", pin)
	}

	if err := line.SetValue(1); err != nil {
		return fmt.Errorf("failed to set pin %d high: %w", pin, err)
	}

	return nil
}

// SetPinLow sets a GPIO pin to LOW (0V)
func (s *GPIOService) SetPinLow(pin int) error {
	if s == nil || s.chip == nil {
		return nil
	}
	s.mu.Lock()
	defer s.mu.Unlock()

	line, exists := s.lines[pin]
	if !exists {
		return fmt.Errorf("pin %d not configured", pin)
	}

	if err := line.SetValue(0); err != nil {
		return fmt.Errorf("failed to set pin %d low: %w", pin, err)
	}

	return nil
}

// GetPinValue reads the current value of a GPIO pin
func (s *GPIOService) GetPinValue(pin int) (int, error) {
	if s == nil || s.chip == nil {
		return 0, fmt.Errorf("GPIO hardware not available")
	}
	s.mu.Lock()
	defer s.mu.Unlock()

	line, exists := s.lines[pin]
	if !exists {
		return 0, fmt.Errorf("pin %d not configured", pin)
	}

	value, err := line.Value()
	if err != nil {
		return 0, fmt.Errorf("failed to read pin %d: %w", pin, err)
	}

	return value, nil
}

// PulsePinDuration pulses a pin HIGH/LOW for a specific duration
func (s *GPIOService) PulsePinDuration(pin int, duration time.Duration, activeHigh bool) error {
	if activeHigh {
		if err := s.SetPinHigh(pin); err != nil {
			return err
		}
		defer func() { _ = s.SetPinLow(pin) }()
	} else {
		if err := s.SetPinLow(pin); err != nil {
			return err
		}
		defer func() { _ = s.SetPinHigh(pin) }()
	}

	time.Sleep(duration)
	return nil
}

// RunDCPump runs a DC pump for a specified duration
func (s *GPIOService) RunDCPump(pin int, durationMs int, activeHigh bool) error {
	if durationMs <= 0 {
		return fmt.Errorf("durationMs must be > 0")
	}
	if err := s.SetupOutputPin(pin); err != nil {
		return fmt.Errorf("failed to setup DC pump pin: %w", err)
	}

	duration := time.Duration(durationMs) * time.Millisecond
	return s.PulsePinDuration(pin, duration, activeHigh)
}

// StepperMotorConfig holds configuration for stepper motor control
type StepperMotorConfig struct {
	StepPin           int
	EnablePin         int
	Steps             int
	MaxStepsPerSecond int
	Acceleration      int
}

// RunStepperMotor runs a stepper motor with acceleration profile
func (s *GPIOService) RunStepperMotor(config StepperMotorConfig) error {
	if config.Steps <= 0 {
		return fmt.Errorf("steps must be > 0")
	}
	if config.MaxStepsPerSecond <= 0 {
		config.MaxStepsPerSecond = 1000
	}

	if err := s.SetupOutputPin(config.StepPin); err != nil {
		return fmt.Errorf("failed to setup step pin: %w", err)
	}
	if err := s.SetupOutputPin(config.EnablePin); err != nil {
		return fmt.Errorf("failed to setup enable pin: %w", err)
	}

	// Enable the motor (active LOW for most drivers) and ensure disable on exit
	if err := s.SetPinLow(config.EnablePin); err != nil {
		return err
	}
	defer func() { _ = s.SetPinHigh(config.EnablePin) }()

	stepsPerSecond := config.MaxStepsPerSecond
	if config.Acceleration > 0 && config.Steps >= 4 {
		accelSteps := config.Steps / 4
		decelSteps := config.Steps / 4

		for i := 0; i < accelSteps; i++ {
			speed := float64(i+1) / float64(accelSteps) * float64(stepsPerSecond)
			if speed < 1 {
				speed = 1
			}
			delay := time.Second / time.Duration(speed)
			if err := s.stepOnce(config.StepPin, delay); err != nil {
				return err
			}
		}

		constantSteps := config.Steps - accelSteps - decelSteps
		delay := time.Second / time.Duration(stepsPerSecond)
		for i := 0; i < constantSteps; i++ {
			if err := s.stepOnce(config.StepPin, delay); err != nil {
				return err
			}
		}

		for i := decelSteps; i > 0; i-- {
			speed := float64(i) / float64(decelSteps) * float64(stepsPerSecond)
			if speed < 1 {
				speed = 1
			}
			delay := time.Second / time.Duration(speed)
			if err := s.stepOnce(config.StepPin, delay); err != nil {
				return err
			}
		}
	} else {
		delay := time.Second / time.Duration(stepsPerSecond)
		for i := 0; i < config.Steps; i++ {
			if err := s.stepOnce(config.StepPin, delay); err != nil {
				return err
			}
		}
	}

	return nil
}

// stepOnce performs a single step pulse
func (s *GPIOService) stepOnce(pin int, delay time.Duration) error {
	if err := s.SetPinHigh(pin); err != nil {
		return err
	}
	time.Sleep(2 * time.Microsecond)
	if err := s.SetPinLow(pin); err != nil {
		return err
	}

	time.Sleep(delay)
	return nil
}

// ReleasePin releases a specific GPIO pin
func (s *GPIOService) ReleasePin(pin int) error {
	if s == nil {
		return nil
	}
	s.mu.Lock()
	defer s.mu.Unlock()

	line, exists := s.lines[pin]
	if !exists {
		return nil
	}

	if err := line.Close(); err != nil {
		return fmt.Errorf("failed to release pin %d: %w", pin, err)
	}

	delete(s.lines, pin)
	return nil
}
