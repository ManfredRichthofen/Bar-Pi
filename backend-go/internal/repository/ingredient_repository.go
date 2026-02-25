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

// FindByFilter returns ingredients matching the provided filters
func (r *IngredientRepository) FindByFilter(
	autocomplete string,
	filterManualIngredients bool,
	filterAutomaticIngredients bool,
	filterIngredientGroups bool,
	groupChildrenGroupID *int64,
	inBar bool,
	onPump bool,
	inBarOrOnPump bool,
) ([]models.Ingredient, error) {
	var ingredients []models.Ingredient
	query := r.db.Preload("ParentGroup")

	// Autocomplete filter
	if autocomplete != "" {
		query = query.Where("LOWER(name) LIKE ?", "%"+autocomplete+"%")
	}

	// Type filters
	if filterManualIngredients {
		query = query.Where("dtype = ?", "ManualIngredient")
	}
	if filterAutomaticIngredients {
		query = query.Where("dtype = ?", "AutomatedIngredient")
	}
	if filterIngredientGroups {
		query = query.Where("dtype = ?", "IngredientGroup")
	}

	// Parent group filter
	if groupChildrenGroupID != nil {
		query = query.Where("parent_group_id = ?", *groupChildrenGroupID)
	}

	// Bar and pump filters
	if inBar {
		trueVal := true
		query = query.Where("in_bar = ?", trueVal)
	}
	if onPump {
		// TODO: Join with pumps table when pump model is implemented
		query = query.Where("id IN (SELECT current_ingredient_id FROM pumps WHERE current_ingredient_id IS NOT NULL)")
	}
	if inBarOrOnPump {
		trueVal := true
		query = query.Where("in_bar = ? OR id IN (SELECT current_ingredient_id FROM pumps WHERE current_ingredient_id IS NOT NULL)", trueVal)
	}

	err := query.Order("LOWER(name)").Find(&ingredients).Error
	return ingredients, err
}

// FindByName returns an ingredient by name
func (r *IngredientRepository) FindByName(name string) (*models.Ingredient, error) {
	var ingredient models.Ingredient
	err := r.db.Where("name = ?", name).First(&ingredient).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &ingredient, nil
}

// SetInBar updates the inBar status of an ingredient
func (r *IngredientRepository) SetInBar(id int64, inBar bool) error {
	return r.db.Model(&models.Ingredient{}).Where("id = ?", id).Update("in_bar", inBar).Error
}

func (r *IngredientRepository) Update(ingredient *models.Ingredient) error {
	return r.db.Save(ingredient).Error
}

func (r *IngredientRepository) Delete(id int64) error {
	return r.db.Delete(&models.Ingredient{}, id).Error
}
