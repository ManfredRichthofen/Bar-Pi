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
	s.mu.Lock()
	defer s.mu.Unlock()

	// Close all open lines
	for pin, line := range s.lines {
		if err := line.Close(); err != nil {
			return fmt.Errorf("failed to close pin %d: %w", pin, err)
		}
		delete(s.lines, pin)
	}

	// Close the chip
	if s.chip != nil {
		if err := s.chip.Close(); err != nil {
			return fmt.Errorf("failed to close GPIO chip: %w", err)
		}
	}

	return nil
}

// SetupOutputPin configures a GPIO pin as output
func (s *GPIOService) SetupOutputPin(pin int) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	// Check if pin is already configured
	if _, exists := s.lines[pin]; exists {
		return nil // Already configured
	}

	// Request the line as output with initial low value
	line, err := s.chip.RequestLine(pin, gpiocdev.AsOutput(0))
	if err != nil {
		return fmt.Errorf("failed to request pin %d as output: %w", pin, err)
	}

	s.lines[pin] = line
	return nil
}

// SetPinHigh sets a GPIO pin to HIGH (3.3V)
func (s *GPIOService) SetPinHigh(pin int) error {
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

// PulsePinDuration pulses a pin HIGH for a specific duration
func (s *GPIOService) PulsePinDuration(pin int, duration time.Duration, activeHigh bool) error {
	// Set pin to active state
	if activeHigh {
		if err := s.SetPinHigh(pin); err != nil {
			return err
		}
	} else {
		if err := s.SetPinLow(pin); err != nil {
			return err
		}
	}

	// Wait for duration
	time.Sleep(duration)

	// Set pin to inactive state
	if activeHigh {
		if err := s.SetPinLow(pin); err != nil {
			return err
		}
	} else {
		if err := s.SetPinHigh(pin); err != nil {
			return err
		}
	}

	return nil
}

// RunDCPump runs a DC pump for a specified duration
func (s *GPIOService) RunDCPump(pin int, durationMs int, activeHigh bool) error {
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
	// Setup pins
	if err := s.SetupOutputPin(config.StepPin); err != nil {
		return fmt.Errorf("failed to setup step pin: %w", err)
	}
	if err := s.SetupOutputPin(config.EnablePin); err != nil {
		return fmt.Errorf("failed to setup enable pin: %w", err)
	}

	// Enable the motor (active LOW for most drivers)
	if err := s.SetPinLow(config.EnablePin); err != nil {
		return err
	}

	// Calculate acceleration profile
	stepsPerSecond := config.MaxStepsPerSecond
	if config.Acceleration > 0 {
		// Simple trapezoidal acceleration profile
		accelSteps := config.Steps / 4 // 25% acceleration
		decelSteps := config.Steps / 4 // 25% deceleration

		// Acceleration phase
		for i := 0; i < accelSteps; i++ {
			speed := float64(i) / float64(accelSteps) * float64(stepsPerSecond)
			if speed < 1 {
				speed = 1
			}
			delay := time.Second / time.Duration(speed)
			if err := s.stepOnce(config.StepPin, delay); err != nil {
				return err
			}
		}

		// Constant speed phase
		constantSteps := config.Steps - accelSteps - decelSteps
		delay := time.Second / time.Duration(stepsPerSecond)
		for i := 0; i < constantSteps; i++ {
			if err := s.stepOnce(config.StepPin, delay); err != nil {
				return err
			}
		}

		// Deceleration phase
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
		// No acceleration, constant speed
		delay := time.Second / time.Duration(stepsPerSecond)
		for i := 0; i < config.Steps; i++ {
			if err := s.stepOnce(config.StepPin, delay); err != nil {
				return err
			}
		}
	}

	// Disable the motor
	if err := s.SetPinHigh(config.EnablePin); err != nil {
		return err
	}

	return nil
}

// stepOnce performs a single step pulse
func (s *GPIOService) stepOnce(pin int, delay time.Duration) error {
	// Step pulse (HIGH for 1 microsecond minimum)
	if err := s.SetPinHigh(pin); err != nil {
		return err
	}
	time.Sleep(2 * time.Microsecond)
	if err := s.SetPinLow(pin); err != nil {
		return err
	}

	// Wait for the step delay
	time.Sleep(delay)
	return nil
}

// ReleasePin releases a specific GPIO pin
func (s *GPIOService) ReleasePin(pin int) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	line, exists := s.lines[pin]
	if !exists {
		return nil // Already released
	}

	if err := line.Close(); err != nil {
		return fmt.Errorf("failed to release pin %d: %w", pin, err)
	}

	delete(s.lines, pin)
	return nil
}
