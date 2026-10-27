package models

import (
	"encoding/json"
	"fmt"
)

type GPIOBoard struct {
	ID         int64     `gorm:"primaryKey;autoIncrement" json:"id"`
	Name       string    `gorm:"unique;not null" json:"name"`
	DType      string    `gorm:"column:dtype;not null" json:"dtype"`
	BoardModel *string   `gorm:"column:board_model" json:"boardModel,omitempty"`
	I2CAddress *int      `gorm:"column:i2c_address" json:"address,omitempty"`
	Pins       []GPIOPin `gorm:"foreignKey:BoardID;references:ID" json:"pins,omitempty"`
}

var I2CBoardModelPins = map[string]int{
	"PCF8574":  8,
	"PCF8574A": 8,
	"PCF8575":  16,
	"MCP23008": 8,
	"MCP23017": 16,
}

const (
	GPIOTypeLocal = "local"
	GPIOTypeI2C   = "i2c"
	LocalPinCount = 28
)

func (GPIOBoard) TableName() string {
	return "gpio_boards"
}

func (b GPIOBoard) MarshalJSON() ([]byte, error) {
	type Alias GPIOBoard
	t := b.DType
	if t == "" {
		t = "local"
	}
	return json.Marshal(&struct {
		Alias
		Type string `json:"type"`
	}{
		Alias: (Alias)(b),
		Type:  t,
	})
}

func (b *GPIOBoard) UnmarshalJSON(data []byte) error {
	type Alias GPIOBoard
	aux := &struct {
		*Alias
		Type string `json:"type"`
	}{
		Alias: (*Alias)(b),
	}
	if err := json.Unmarshal(data, &aux); err != nil {
		return err
	}
	if b.DType == "" && aux.Type != "" {
		b.DType = aux.Type
	}
	return nil
}

type GPIOPin struct {
	PinNr   int        `gorm:"primaryKey;column:pin_nr" json:"nr"`
	BoardID int64      `gorm:"primaryKey;column:board" json:"boardId"`
	Board   *GPIOBoard `gorm:"foreignKey:BoardID;references:ID" json:"-"`
	InUse   bool       `gorm:"-" json:"inUse"`
}

func (GPIOPin) TableName() string {
	return "gpio_pins"
}

func (p GPIOPin) MarshalJSON() ([]byte, error) {
	boardName := "Raspberry Pi Local"
	if p.Board != nil && p.Board.Name != "" {
		boardName = p.Board.Name
	}
	pinName := fmt.Sprintf("BCM %d", p.PinNr)
	return json.Marshal(&struct {
		Nr        int    `json:"nr"`
		PinID     int    `json:"pinId"`
		BoardID   int64  `json:"boardId"`
		BoardName string `json:"boardName"`
		PinName   string `json:"pinName"`
		InUse     bool   `json:"inUse"`
	}{
		Nr:        p.PinNr,
		PinID:     p.PinNr,
		BoardID:   p.BoardID,
		BoardName: boardName,
		PinName:   pinName,
		InUse:     p.InUse,
	})
}

type PinDto struct {
	BoardID   *int64 `json:"boardId"`
	Nr        *int   `json:"nr"`
	PinID     *int   `json:"pinId,omitempty"`
	BoardName string `json:"boardName,omitempty"`
	PinName   string `json:"pinName,omitempty"`
}

func (p *PinDto) PinNumber() *int {
	if p == nil {
		return nil
	}
	if p.Nr != nil {
		return p.Nr
	}
	return p.PinID
}

type GPIOStatus struct {
	PinsUsed          int `json:"pinsUsed"`
	MaxPins           int `json:"maxPins"`
	BoardsInstalled   int `json:"boardsInstalled"`
	StatusesAvailable int `json:"statusesAvailable"`
}
