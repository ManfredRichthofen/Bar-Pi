package repository

import (
	"errors"

	"github.com/ManfredRichthofen/Bar-Pi/backend-go/internal/models"
	"gorm.io/gorm"
)

// GlassRepository handles data access for glasses
type GlassRepository struct {
	db *gorm.DB
}

// NewGlassRepository creates a new glass repository
func NewGlassRepository(db *gorm.DB) *GlassRepository {
	return &GlassRepository{db: db}
}

// Create creates a new glass
func (r *GlassRepository) Create(glass *models.Glass) error {
	return r.db.Create(glass).Error
}

// FindByID returns a glass by ID
func (r *GlassRepository) FindByID(id int64) (*models.Glass, error) {
	var glass models.Glass
	err := r.db.First(&glass, id).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &glass, nil
}

// FindAll returns all glasses
func (r *GlassRepository) FindAll() ([]models.Glass, error) {
	var glasses []models.Glass
	err := r.db.Order("name").Find(&glasses).Error
	return glasses, err
}

// FindByName returns a glass by name
func (r *GlassRepository) FindByName(name string) (*models.Glass, error) {
	var glass models.Glass
	err := r.db.Where("name = ?", name).First(&glass).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &glass, nil
}

// Update updates a glass
func (r *GlassRepository) Update(glass *models.Glass) error {
	return r.db.Save(glass).Error
}

// Delete deletes a glass by ID
func (r *GlassRepository) Delete(id int64) error {
	return r.db.Delete(&models.Glass{}, id).Error
}
