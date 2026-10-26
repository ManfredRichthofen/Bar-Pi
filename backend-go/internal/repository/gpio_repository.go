package repository

import (
	"errors"

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

func (r *GPIORepository) CreateBoard(board *models.GPIOBoard) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		if board.DType == "" {
			board.DType = "local"
		}
		if err := tx.Create(board).Error; err != nil {
			return err
		}
		pinCount := 28
		if board.DType == "i2c" {
			pinCount = 16
		}
		for i := 0; i < pinCount; i++ {
			pin := models.GPIOPin{
				BoardID: board.ID,
				PinNr:   i,
			}
			if err := tx.Create(&pin).Error; err != nil {
				return err
			}
		}
		return nil
	})
}

func (r *GPIORepository) UpdateBoard(board *models.GPIOBoard) error {
	return r.db.Save(board).Error
}

func (r *GPIORepository) DeleteBoard(id int64) error {
	return r.db.Delete(&models.GPIOBoard{}, id).Error
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

	return &models.GPIOStatus{
		PinsUsed:          used,
		MaxPins:           int(maxPins),
		BoardsInstalled:   int(boardsCount),
		StatusesAvailable: int(maxPins),
	}, nil
}
