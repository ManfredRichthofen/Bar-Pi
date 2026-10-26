//go:build !linux

package service

import (
	"fmt"
	"sync"
	"time"
)

// StepperMotorConfig holds configuration for stepper motor control
type StepperMotorConfig struct {
	StepPin           int
	EnablePin         int
	Steps             int
	MaxStepsPerSecond int
	Acceleration      int
}

// GPIOService provides a simulated GPIO service on non-Linux systems (Windows/macOS)
type GPIOService struct {
	pins map[int]int
	mu   sync.Mutex
}

func NewGPIOService() (*GPIOService, error) {
	return &GPIOService{
		pins: make(map[int]int),
	}, nil
}

func (s *GPIOService) Close() error {
	if s == nil {
		return nil
	}
	s.mu.Lock()
	defer s.mu.Unlock()
	s.pins = make(map[int]int)
	return nil
}

func (s *GPIOService) SetupOutputPin(pin int) error {
	if s == nil {
		return nil
	}
	s.mu.Lock()
	defer s.mu.Unlock()
	if _, exists := s.pins[pin]; !exists {
		s.pins[pin] = 0
	}
	return nil
}

func (s *GPIOService) SetPinHigh(pin int) error {
	if s == nil {
		return nil
	}
	s.mu.Lock()
	defer s.mu.Unlock()
	s.pins[pin] = 1
	return nil
}

func (s *GPIOService) SetPinLow(pin int) error {
	if s == nil {
		return nil
	}
	s.mu.Lock()
	defer s.mu.Unlock()
	s.pins[pin] = 0
	return nil
}

func (s *GPIOService) GetPinValue(pin int) (int, error) {
	if s == nil {
		return 0, fmt.Errorf("GPIO service not initialized")
	}
	s.mu.Lock()
	defer s.mu.Unlock()
	return s.pins[pin], nil
}

func (s *GPIOService) PulsePinDuration(pin int, duration time.Duration, activeHigh bool) error {
	if activeHigh {
		_ = s.SetPinHigh(pin)
		defer func() { _ = s.SetPinLow(pin) }()
	} else {
		_ = s.SetPinLow(pin)
		defer func() { _ = s.SetPinHigh(pin) }()
	}
	time.Sleep(duration)
	return nil
}

func (s *GPIOService) RunDCPump(pin int, durationMs int, activeHigh bool) error {
	if durationMs <= 0 {
		return fmt.Errorf("durationMs must be > 0")
	}
	_ = s.SetupOutputPin(pin)
	return s.PulsePinDuration(pin, time.Duration(durationMs)*time.Millisecond, activeHigh)
}

func (s *GPIOService) RunStepperMotor(config StepperMotorConfig) error {
	if config.Steps <= 0 {
		return fmt.Errorf("steps must be > 0")
	}
	if config.MaxStepsPerSecond <= 0 {
		config.MaxStepsPerSecond = 1000
	}
	_ = s.SetupOutputPin(config.StepPin)
	_ = s.SetupOutputPin(config.EnablePin)
	_ = s.SetPinLow(config.EnablePin)
	defer func() { _ = s.SetPinHigh(config.EnablePin) }()
	return nil
}

func (s *GPIOService) ReleasePin(pin int) error {
	if s == nil {
		return nil
	}
	s.mu.Lock()
	defer s.mu.Unlock()
	delete(s.pins, pin)
	return nil
}
