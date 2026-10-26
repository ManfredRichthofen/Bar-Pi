package repository

import (
	"errors"

	"github.com/ManfredRichthofen/Bar-Pi/backend-go/internal/models"
	"gorm.io/gorm"
)

// PumpRepository handles data access for pumps
type PumpRepository struct {
	db *gorm.DB
}

// NewPumpRepository creates a new pump repository
func NewPumpRepository(db *gorm.DB) *PumpRepository {
	return &PumpRepository{db: db}
}

func (r *PumpRepository) enrichPumps(pumps []models.Pump) {
	if len(pumps) == 0 {
		return
	}
	var boards []models.GPIOBoard
	r.db.Find(&boards)
	boardNames := make(map[int64]string, len(boards))
	for _, b := range boards {
		boardNames[b.ID] = b.Name
	}

	for i := range pumps {
		pumps[i].BoardNames = boardNames
		if pumps[i].CurrentIngredient != nil {
			pumps[i].CurrentIngredient.OnPump = true
		}
	}
}

// Create creates a new pump
func (r *PumpRepository) Create(pump *models.Pump) error {
	return r.db.Create(pump).Error
}

// FindByID returns a pump by ID
func (r *PumpRepository) FindByID(id int64) (*models.Pump, error) {
	var pump models.Pump
	err := r.db.Preload("CurrentIngredient").Preload("CurrentIngredient.ParentGroup").First(&pump, id).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	slice := []models.Pump{pump}
	r.enrichPumps(slice)
	return &slice[0], nil
}

// FindAll returns all pumps
func (r *PumpRepository) FindAll() ([]models.Pump, error) {
	var pumps []models.Pump
	err := r.db.Preload("CurrentIngredient").Preload("CurrentIngredient.ParentGroup").Order("id").Find(&pumps).Error
	if err != nil {
		return nil, err
	}
	r.enrichPumps(pumps)
	return pumps, nil
}

// Update updates a pump
func (r *PumpRepository) Update(pump *models.Pump) error {
	return r.db.Save(pump).Error
}

// UpdateFields updates specific fields of a pump
func (r *PumpRepository) UpdateFields(id int64, fields map[string]any) error {
	return r.db.Model(&models.Pump{}).Where("id = ?", id).Updates(fields).Error
}

// Delete deletes a pump by ID
func (r *PumpRepository) Delete(id int64) error {
	return r.db.Delete(&models.Pump{}, id).Error
}

// FindByIngredientID returns pumps containing a specific ingredient
func (r *PumpRepository) FindByIngredientID(ingredientID int64) ([]models.Pump, error) {
	var pumps []models.Pump
	err := r.db.Where("current_ingredient_id = ?", ingredientID).
		Preload("CurrentIngredient").
		Preload("CurrentIngredient.ParentGroup").
		Find(&pumps).Error
	if err != nil {
		return nil, err
	}
	r.enrichPumps(pumps)
	return pumps, nil
}
