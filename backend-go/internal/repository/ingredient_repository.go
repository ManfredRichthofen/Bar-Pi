package repository

import (
	"errors"

	"github.com/ManfredRichthofen/Bar-Pi/backend-go/internal/models"
	"gorm.io/gorm"
)

type IngredientRepository struct {
	db *gorm.DB
}

func NewIngredientRepository(db *gorm.DB) *IngredientRepository {
	return &IngredientRepository{db: db}
}

func (r *IngredientRepository) Create(ingredient *models.Ingredient) error {
	return r.db.Create(ingredient).Error
}

func (r *IngredientRepository) FindByID(id int64) (*models.Ingredient, error) {
	var ingredient models.Ingredient
	err := r.db.Preload("ParentGroup").First(&ingredient, id).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &ingredient, nil
}

func (r *IngredientRepository) FindAll() ([]models.Ingredient, error) {
	var ingredients []models.Ingredient
	err := r.db.Preload("ParentGroup").Find(&ingredients).Error
	return ingredients, err
}

func (r *IngredientRepository) FindInBar() ([]models.Ingredient, error) {
	var ingredients []models.Ingredient
	inBar := true
	err := r.db.Where("in_bar = ?", inBar).Preload("ParentGroup").Find(&ingredients).Error
	return ingredients, err
}

func (r *IngredientRepository) Update(ingredient *models.Ingredient) error {
	return r.db.Save(ingredient).Error
}

func (r *IngredientRepository) Delete(id int64) error {
	return r.db.Delete(&models.Ingredient{}, id).Error
}
