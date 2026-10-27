package repository

import (
	"errors"
	"strings"

	"github.com/ManfredRichthofen/Bar-Pi/backend-go/internal/models"
	"gorm.io/gorm"
)

type GPIORepository struct {
	db *gorm.DB
}

func NewGPIORepository(db *gorm.DB) *GPIORepository {
	return &GPIORepository{db: db}
}

func (r *GPIORepository) FindAllBoards(dType string) ([]models.GPIOBoard, error) {
	var boards []models.GPIOBoard
	q := r.db.Preload("Pins")
	if dType != "" {
		q = q.Where("LOWER(dtype) = LOWER(?)", dType)
	}
	err := q.Order("id ASC").Find(&boards).Error
	return boards, err
}

func (r *GPIORepository) FindBoardByID(id int64) (*models.GPIOBoard, error) {
	var board models.GPIOBoard
	err := r.db.Preload("Pins").First(&board, id).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &board, nil
}

type ErrValidation struct{ Msg string }

func (e *ErrValidation) Error() string { return e.Msg }

func validationErr(msg string) error { return &ErrValidation{Msg: msg} }

func normalizeBoard(board *models.GPIOBoard) error {
	board.Name = strings.TrimSpace(board.Name)
	if board.Name == "" {
		return validationErr("Board name must not be empty")
	}
	board.DType = strings.ToLower(board.DType)
	if board.DType == "" {
		board.DType = models.GPIOTypeLocal
	}
	switch board.DType {
	case models.GPIOTypeLocal:
		board.BoardModel = nil
		board.I2CAddress = nil
	case models.GPIOTypeI2C:
		if board.I2CAddress == nil || *board.I2CAddress < 0x03 || *board.I2CAddress > 0x77 {
			return validationErr("I2C address must be between 0x03 and 0x77")
		}
		if board.BoardModel == nil {
			return validationErr("Board model is required for I2C boards")
		}
		model := strings.ToUpper(strings.TrimSpace(*board.BoardModel))
		if _, ok := models.I2CBoardModelPins[model]; !ok {
			return validationErr("Unsupported I2C board model: " + *board.BoardModel)
		}
		board.BoardModel = &model
	default:
		return validationErr("Unknown board type: " + board.DType)
	}
	return nil
}

func (r *GPIORepository) checkUnique(board *models.GPIOBoard) error {
	var n int64
	q := r.db.Model(&models.GPIOBoard{}).Where("LOWER(name) = LOWER(?)", board.Name)
	if board.ID != 0 {
		q = q.Where("id != ?", board.ID)
	}
	if err := q.Count(&n).Error; err != nil {
		return err
	}
	if n > 0 {
		return validationErr("A board with this name already exists")
	}
	if board.DType == models.GPIOTypeI2C {
		q = r.db.Model(&models.GPIOBoard{}).Where("dtype = ? AND i2c_address = ?", models.GPIOTypeI2C, *board.I2CAddress)
		if board.ID != 0 {
			q = q.Where("id != ?", board.ID)
		}
		if err := q.Count(&n).Error; err != nil {
			return err
		}
		if n > 0 {
			return validationErr("An I2C board with this address already exists")
		}
	}
	return nil
}

func (r *GPIORepository) CreateBoard(board *models.GPIOBoard) error {
	board.ID = 0
	board.Pins = nil
	if err := normalizeBoard(board); err != nil {
		return err
	}
	if err := r.checkUnique(board); err != nil {
		return err
	}
	return r.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(board).Error; err != nil {
			return err
		}
		pinCount := models.LocalPinCount
		if board.DType == models.GPIOTypeI2C {
			pinCount = models.I2CBoardModelPins[*board.BoardModel]
		}
		for i := 0; i < pinCount; i++ {
			if err := tx.Create(&models.GPIOPin{BoardID: board.ID, PinNr: i}).Error; err != nil {
				return err
			}
		}
		return nil
	})
}

// UpdateBoard updates an I2C board. The board type is immutable and the pin
// layout is rebuilt if the model changes (rejected when removed pins are in use).
func (r *GPIORepository) UpdateBoard(board *models.GPIOBoard) error {
	existing, err := r.FindBoardByID(board.ID)
	if err != nil {
		return err
	}
	if existing == nil {
		return validationErr("Board not found")
	}
	if existing.DType != models.GPIOTypeI2C {
		return validationErr("Only I2C boards can be edited")
	}
	board.DType = existing.DType
	board.Pins = nil
	if err := normalizeBoard(board); err != nil {
		return err
	}
	if err := r.checkUnique(board); err != nil {
		return err
	}
	newCount := models.I2CBoardModelPins[*board.BoardModel]
	return r.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Model(&models.GPIOBoard{}).Where("id = ?", board.ID).Updates(map[string]any{
			"name":        board.Name,
			"board_model": board.BoardModel,
			"i2c_address": board.I2CAddress,
		}).Error; err != nil {
			return err
		}
		oldCount := len(existing.Pins)
		if newCount < oldCount {
			if err := tx.Where("board = ? AND pin_nr >= ?", board.ID, newCount).Delete(&models.GPIOPin{}).Error; err != nil {
				return validationErr("Cannot change model: pins that would be removed are in use")
			}
		}
		for i := oldCount; i < newCount; i++ {
			if err := tx.Create(&models.GPIOPin{BoardID: board.ID, PinNr: i}).Error; err != nil {
				return err
			}
		}
		return nil
	})
}

func (r *GPIORepository) DeleteBoard(id int64) error {
	board, err := r.FindBoardByID(id)
	if err != nil {
		return err
	}
	if board == nil {
		return validationErr("Board not found")
	}
	if board.DType != models.GPIOTypeI2C {
		return validationErr("Cannot delete local Raspberry Pi GPIO board")
	}
	pins, err := r.FindBoardPins(id)
	if err != nil {
		return err
	}
	for _, p := range pins {
		if p.InUse {
			return validationErr("Cannot delete board: some of its pins are still in use by pumps or events")
		}
	}
	if err := r.db.Delete(&models.GPIOBoard{}, id).Error; err != nil {
		return validationErr("Cannot delete board: some of its pins are still in use")
	}
	return nil
}

func (r *GPIORepository) FindBoardPins(boardID int64) ([]models.GPIOPin, error) {
	board, err := r.FindBoardByID(boardID)
	if err != nil || board == nil {
		return nil, err
	}
	var pins []models.GPIOPin
	if err := r.db.Where("board = ?", boardID).Order("pin_nr ASC").Find(&pins).Error; err != nil {
		return nil, err
	}

	// Determine in-use pins from pumps
	var pumps []models.Pump
	r.db.Find(&pumps)
	usedPins := make(map[int]bool)
	for _, p := range pumps {
		if p.DcPinBoard != nil && *p.DcPinBoard == boardID && p.DcPinNr != nil {
			usedPins[*p.DcPinNr] = true
		}
		if p.StepPinBoard != nil && *p.StepPinBoard == boardID && p.StepPinNr != nil {
			usedPins[*p.StepPinNr] = true
		}
		if p.EnablePinBoard != nil && *p.EnablePinBoard == boardID && p.EnablePinNr != nil {
			usedPins[*p.EnablePinNr] = true
		}
	}

	var events []models.EventAction
	r.db.Where("gpio_board = ?", boardID).Find(&events)
	for _, e := range events {
		if e.GpioPin != nil {
			usedPins[*e.GpioPin] = true
		}
	}

	for i := range pins {
		pins[i].Board = board
		pins[i].InUse = usedPins[pins[i].PinNr]
	}
	return pins, nil
}

func (r *GPIORepository) EnsurePinExists(boardID int64, pinNr int) error {
	var board models.GPIOBoard
	if err := r.db.First(&board, boardID).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			board = models.GPIOBoard{
				ID:    boardID,
				Name:  "Raspberry Pi Local",
				DType: "local",
			}
			_ = r.db.Create(&board).Error
		}
	}
	var pin models.GPIOPin
	err := r.db.Where("board = ? AND pin_nr = ?", boardID, pinNr).First(&pin).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return r.db.Create(&models.GPIOPin{
			BoardID: boardID,
			PinNr:   pinNr,
		}).Error
	}
	return err
}

func (r *GPIORepository) GetStatus() (*models.GPIOStatus, error) {
	var boardsCount int64
	r.db.Model(&models.GPIOBoard{}).Count(&boardsCount)

	var maxPins int64
	r.db.Model(&models.GPIOPin{}).Count(&maxPins)

	var pumps []models.Pump
	r.db.Find(&pumps)
	used := 0
	for _, p := range pumps {
		if p.DcPinNr != nil {
			used++
		}
		if p.StepPinNr != nil {
			used++
		}
		if p.EnablePinNr != nil {
			used++
		}
	}

	var eventPins int64
	r.db.Model(&models.EventAction{}).Count(&eventPins)
	used += int(eventPins)

	return &models.GPIOStatus{
		PinsUsed:          used,
		MaxPins:           int(maxPins),
		BoardsInstalled:   int(boardsCount),
		StatusesAvailable: int(maxPins),
	}, nil
}
