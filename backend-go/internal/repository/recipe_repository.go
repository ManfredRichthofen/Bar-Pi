package repository

import (
	"errors"

	"github.com/ManfredRichthofen/Bar-Pi/backend-go/internal/models"
	"gorm.io/gorm"
)

type RecipeRepository struct {
	db *gorm.DB
}

func NewRecipeRepository(db *gorm.DB) *RecipeRepository {
	return &RecipeRepository{db: db}
}

func (r *RecipeRepository) Create(recipe *models.Recipe) error {
	return r.db.Create(recipe).Error
}

func (r *RecipeRepository) FindByID(id int64) (*models.Recipe, error) {
	var recipe models.Recipe
	err := r.db.Preload("Owner").Preload("DefaultGlass").Preload("Categories").
		Preload("ProductionSteps").Preload("ProductionSteps.Ingredients.Ingredient").
		First(&recipe, id).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &recipe, nil
}

func (r *RecipeRepository) FindAll() ([]models.Recipe, error) {
	var recipes []models.Recipe
	err := r.db.Preload("Owner").Preload("DefaultGlass").Preload("Categories").Find(&recipes).Error
	return recipes, err
}

func (r *RecipeRepository) FindByOwnerID(ownerID int64) ([]models.Recipe, error) {
	var recipes []models.Recipe
	err := r.db.Where("owner_id = ?", ownerID).
		Preload("Owner").Preload("DefaultGlass").Preload("Categories").
		Find(&recipes).Error
	return recipes, err
}

func (r *RecipeRepository) Update(recipe *models.Recipe) error {
	return r.db.Save(recipe).Error
}

func (r *RecipeRepository) Delete(id int64) error {
	return r.db.Delete(&models.Recipe{}, id).Error
}

func (r *RecipeRepository) Search(query string) ([]models.Recipe, error) {
	var recipes []models.Recipe
	err := r.db.Where("name LIKE ?", "%"+query+"%").
		Preload("Owner").Preload("DefaultGlass").Preload("Categories").
		Find(&recipes).Error
	return recipes, err
}
