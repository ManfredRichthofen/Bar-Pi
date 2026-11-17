package models

import (
	"encoding/json"
	"fmt"
)

type Pump struct {
	ID                  int64       `gorm:"primaryKey;autoIncrement" json:"id"`
	DType               string      `gorm:"column:dtype;not null" json:"dtype"`
	Name                *string     `gorm:"unique" json:"name,omitempty"`
	Completed           bool        `gorm:"not null;default:true" json:"completed"`
	TubeCapacity        *float64    `json:"tubeCapacity,omitempty"`
	CurrentIngredientID *int64      `json:"currentIngredientId,omitempty"`
	CurrentIngredient   *Ingredient `gorm:"foreignKey:CurrentIngredientID" json:"currentIngredient,omitempty"`
	FillingLevelInMl    int         `gorm:"not null;default:0" json:"fillingLevelInMl"`
	IsPumpedUp          bool        `gorm:"not null;default:false" json:"isPumpedUp"`
	DcPinBoard          *int64      `json:"dcPinBoard,omitempty"`
	DcPinNr             *int        `json:"dcPinNr,omitempty"`
	TimePerClInMs       *int        `json:"timePerClInMs,omitempty"`
	IsPowerStateHigh    *bool       `json:"isPowerStateHigh,omitempty"`
	Acceleration        *int        `json:"acceleration,omitempty"`
	StepPinBoard        *int64      `json:"stepPinBoard,omitempty"`
	StepPinNr           *int        `json:"stepPinNr,omitempty"`
	EnablePinBoard      *int64      `json:"enablePinBoard,omitempty"`
	EnablePinNr         *int        `json:"enablePinNr,omitempty"`
	StepsPerCl          *int        `json:"stepsPerCl,omitempty"`
	MaxStepsPerSecond   *int        `json:"maxStepsPerSecond,omitempty"`
	PowerConsumption    int         `gorm:"not null;default:0" json:"powerConsumption"`
	MinimalWaitTime     *int        `json:"minimalWaitTime,omitempty"`
	CanControlDirection bool        `gorm:"-" json:"canControlDirection"`
	BoardNames          map[int64]string `gorm:"-" json:"-"`
}

func (Pump) TableName() string {
	return "pumps"
}

func PumpDTypeToFrontendType(dtype string) string {
	switch dtype {
	case "DcPump", "dc":
		return "dc"
	case "StepperPump", "stepper":
		return "stepper"
	case "Valve", "valve":
		return "valve"
	case "VirtualPump", "virtual":
		return "virtual"
	default:
		return "dc"
	}
}

func FrontendTypeToPumpDType(t string) string {
	switch t {
	case "dc", "DcPump":
		return "DcPump"
	case "stepper", "StepperPump":
		return "StepperPump"
	case "valve", "Valve":
		return "Valve"
	case "virtual", "VirtualPump":
		return "VirtualPump"
	default:
		return t
	}
}

func (p Pump) ComputeState() string {
	switch p.DType {
	case "DcPump", "dc":
		if p.DcPinBoard == nil || p.DcPinNr == nil || p.TimePerClInMs == nil || p.TubeCapacity == nil {
			return "INCOMPLETE"
		}
		return "READY"
	case "Valve", "valve":
		if p.DcPinBoard == nil || p.DcPinNr == nil || p.TimePerClInMs == nil || p.TubeCapacity == nil {
			return "INCOMPLETE"
		}
		return "READY"
	case "VirtualPump", "virtual":
		// No hardware: only needs enough config to simulate a run.
		if p.TimePerClInMs == nil || p.TubeCapacity == nil {
			return "INCOMPLETE"
		}
		return "READY"
	case "StepperPump", "stepper":
		if p.StepPinBoard == nil || p.StepPinNr == nil || p.EnablePinBoard == nil || p.EnablePinNr == nil ||
			p.StepsPerCl == nil || p.MaxStepsPerSecond == nil || p.Acceleration == nil || p.TubeCapacity == nil {
			return "INCOMPLETE"
		}
		return "READY"
	default:
		return "INCOMPLETE"
	}
}

func (p Pump) resolveBoardName(boardID int64) string {
	if p.BoardNames != nil {
		if name, ok := p.BoardNames[boardID]; ok && name != "" {
			return name
		}
	}
	return "Raspberry Pi Local"
}

func (p Pump) MarshalJSON() ([]byte, error) {
	type Alias Pump

	var pinDto *PinDto
	if p.DcPinBoard != nil && p.DcPinNr != nil {
		pinDto = &PinDto{
			BoardID:   p.DcPinBoard,
			Nr:        p.DcPinNr,
			PinID:     p.DcPinNr,
			BoardName: p.resolveBoardName(*p.DcPinBoard),
			PinName:   fmt.Sprintf("BCM %d", *p.DcPinNr),
		}
	}

	var stepPinDto *PinDto
	if p.StepPinBoard != nil && p.StepPinNr != nil {
		stepPinDto = &PinDto{
			BoardID:   p.StepPinBoard,
			Nr:        p.StepPinNr,
			PinID:     p.StepPinNr,
			BoardName: p.resolveBoardName(*p.StepPinBoard),
			PinName:   fmt.Sprintf("BCM %d", *p.StepPinNr),
		}
	}

	var enablePinDto *PinDto
	if p.EnablePinBoard != nil && p.EnablePinNr != nil {
		enablePinDto = &PinDto{
			BoardID:   p.EnablePinBoard,
			Nr:        p.EnablePinNr,
			PinID:     p.EnablePinNr,
			BoardName: p.resolveBoardName(*p.EnablePinBoard),
			PinName:   fmt.Sprintf("BCM %d", *p.EnablePinNr),
		}
	}

	state := p.ComputeState()
	canControlDirection := p.CanControlDirection
	if p.DType == "StepperPump" {
		canControlDirection = true
	}

	return json.Marshal(&struct {
		Alias
		Type                string   `json:"type"`
		TubeCapacityInMl    *float64 `json:"tubeCapacityInMl,omitempty"`
		PumpedUp            bool     `json:"pumpedUp"`
		State               string   `json:"state"`
		Pin                 *PinDto  `json:"pin,omitempty"`
		StepPin             *PinDto  `json:"stepPin,omitempty"`
		EnablePin           *PinDto  `json:"enablePin,omitempty"`
		CanControlDirection bool     `json:"canControlDirection"`
	}{
		Alias:               (Alias)(p),
		Type:                PumpDTypeToFrontendType(p.DType),
		TubeCapacityInMl:    p.TubeCapacity,
		PumpedUp:            p.IsPumpedUp,
		State:               state,
		Pin:                 pinDto,
		StepPin:             stepPinDto,
		EnablePin:           enablePinDto,
		CanControlDirection: canControlDirection,
	})
}

func (p *Pump) UnmarshalJSON(data []byte) error {
	type Alias Pump
	aux := &struct {
		*Alias
		Type             string   `json:"type"`
		TubeCapacityInMl *float64 `json:"tubeCapacityInMl"`
		PumpedUp         *bool    `json:"pumpedUp"`
		Pin              *PinDto  `json:"pin"`
		StepPin          *PinDto  `json:"stepPin"`
		EnablePin        *PinDto  `json:"enablePin"`
	}{
		Alias: (*Alias)(p),
	}
	if err := json.Unmarshal(data, &aux); err != nil {
		return err
	}
	if p.DType == "" && aux.Type != "" {
		p.DType = FrontendTypeToPumpDType(aux.Type)
	} else if p.DType != "" {
		p.DType = FrontendTypeToPumpDType(p.DType)
	}
	if p.TubeCapacity == nil && aux.TubeCapacityInMl != nil {
		p.TubeCapacity = aux.TubeCapacityInMl
	}
	if aux.PumpedUp != nil {
		p.IsPumpedUp = *aux.PumpedUp
	}
	if aux.Pin != nil && aux.Pin.BoardID != nil && aux.Pin.PinNumber() != nil {
		p.DcPinBoard = aux.Pin.BoardID
		p.DcPinNr = aux.Pin.PinNumber()
	}
	if aux.StepPin != nil && aux.StepPin.BoardID != nil && aux.StepPin.PinNumber() != nil {
		p.StepPinBoard = aux.StepPin.BoardID
		p.StepPinNr = aux.StepPin.PinNumber()
	}
	if aux.EnablePin != nil && aux.EnablePin.BoardID != nil && aux.EnablePin.PinNumber() != nil {
		p.EnablePinBoard = aux.EnablePin.BoardID
		p.EnablePinNr = aux.EnablePin.PinNumber()
	}
	p.Completed = p.ComputeState() == "READY"
	return nil
}

type PumpAdvice struct {
	Type   string `json:"type"`   // PUMP_UP, PUMP_DOWN, PUMP_ML, PUMP_TIME, PUMP_STEPS
	Amount int    `json:"amount"` // ml, ms, or steps
}

type RunningStateInfo struct {
	Percentage       int  `json:"percentage"`
	Forward          bool `json:"forward"`
	RunInfinity      bool `json:"runInfinity"`
	JobID            int64 `json:"jobId"`
}

type PumpJobState struct {
	LastJobID    *int64            `json:"lastJobId"`
	RunningState *RunningStateInfo `json:"runningState"`
}

type JobMetrics struct {
	ID          int64  `json:"id"`
	MlPumped    int    `json:"mlPumped"`
	StartTime   int64  `json:"startTime"`
	StopTime    int64  `json:"stopTime"`
	TimeElapsed int64  `json:"timeElapsed"`
	StepsMade   int64  `json:"stepsMade"`
}
