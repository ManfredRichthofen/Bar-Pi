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
	err := r.db.Where("LOWER(name) LIKE ?", "%"+query+"%").
		Preload("Owner").Preload("DefaultGlass").Preload("Categories").
		Order("LOWER(name)").
		Find(&recipes).Error
	return recipes, err
}

// FindByFilter returns recipes matching the provided filters
func (r *RecipeRepository) FindByFilter(
	ownerID *int64,
	inCollectionID *int64,
	inCategoryID *int64,
	searchName string,
	orderBy string,
) ([]models.Recipe, error) {
	var recipes []models.Recipe
	query := r.db.Preload("Owner").Preload("DefaultGlass").Preload("Categories")

	if ownerID != nil {
		query = query.Where("owner_id = ?", *ownerID)
	}

	if inCollectionID != nil {
		query = query.Joins("JOIN collection_recipes ON collection_recipes.recipe_id = recipes.id").
			Where("collection_recipes.collection_id = ?", *inCollectionID)
	}

	if inCategoryID != nil {
		query = query.Joins("JOIN recipe_categories ON recipe_categories.recipe_id = recipes.id").
			Where("recipe_categories.category_id = ?", *inCategoryID)
	}

	if searchName != "" {
		query = query.Where("LOWER(name) LIKE ?", "%"+searchName+"%")
	}

	// Apply ordering
	switch orderBy {
	case "lastUpdateDesc":
		query = query.Order("last_update DESC")
	case "lastUpdateAsc":
		query = query.Order("last_update ASC")
	case "nameDesc":
		query = query.Order("LOWER(name) DESC")
	default:
		query = query.Order("LOWER(name) ASC")
	}

	err := query.Find(&recipes).Error
	return recipes, err
}

// FindByName returns a recipe by name
func (r *RecipeRepository) FindByName(name string) (*models.Recipe, error) {
	var recipe models.Recipe
	err := r.db.Where("name = ?", name).First(&recipe).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &recipe, nil
}
