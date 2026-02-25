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

// Create creates a new pump
func (r *PumpRepository) Create(pump *models.Pump) error {
	return r.db.Create(pump).Error
}

// FindByID returns a pump by ID
func (r *PumpRepository) FindByID(id int64) (*models.Pump, error) {
	var pump models.Pump
	err := r.db.Preload("CurrentIngredient").First(&pump, id).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &pump, nil
}

// FindAll returns all pumps
func (r *PumpRepository) FindAll() ([]models.Pump, error) {
	var pumps []models.Pump
	err := r.db.Preload("CurrentIngredient").Order("id").Find(&pumps).Error
	return pumps, err
}

// Update updates a pump
func (r *PumpRepository) Update(pump *models.Pump) error {
	return r.db.Save(pump).Error
}

// UpdateFields updates specific fields of a pump
func (r *PumpRepository) UpdateFields(id int64, fields map[string]interface{}) error {
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
		Find(&pumps).Error
	return pumps, err
}
