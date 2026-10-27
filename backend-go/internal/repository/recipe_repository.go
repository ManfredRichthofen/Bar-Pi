package repository

import (
	"errors"
	"strings"

	"github.com/ManfredRichthofen/Bar-Pi/backend-go/internal/models"
	"gorm.io/gorm"
)

type RecipeRepository struct {
	db *gorm.DB
}

func NewRecipeRepository(db *gorm.DB) *RecipeRepository {
	return &RecipeRepository{db: db}
}

func (r *RecipeRepository) basePreload(db *gorm.DB) *gorm.DB {
	return db.Preload("Owner").
		Preload("DefaultGlass").
		Preload("Categories").
		Preload("ProductionSteps", func(tx *gorm.DB) *gorm.DB {
			return tx.Order("production_steps.step_order ASC")
		}).
		Preload("ProductionSteps.Ingredients").
		Preload("ProductionSteps.Ingredients.Ingredient").
		Preload("ProductionSteps.Ingredients.Ingredient.ParentGroup")
}

func (r *RecipeRepository) populateOnPump(recipes []models.Recipe) {
	if len(recipes) == 0 {
		return
	}
	var pumpIngIDs []int64
	r.db.Model(&models.Pump{}).
		Where("current_ingredient_id IS NOT NULL").
		Pluck("current_ingredient_id", &pumpIngIDs)

	onPumpSet := make(map[int64]bool, len(pumpIngIDs))
	for _, id := range pumpIngIDs {
		onPumpSet[id] = true
	}

	for i := range recipes {
		for j := range recipes[i].ProductionSteps {
			for k := range recipes[i].ProductionSteps[j].Ingredients {
				if ing := recipes[i].ProductionSteps[j].Ingredients[k].Ingredient; ing != nil {
					ing.OnPump = onPumpSet[ing.ID]
				}
			}
		}
	}
}

func (r *RecipeRepository) Create(recipe *models.Recipe) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		steps := recipe.ProductionSteps
		categories := recipe.Categories
		recipe.ProductionSteps = nil
		recipe.Categories = nil

		if err := tx.Create(recipe).Error; err != nil {
			return err
		}

		if len(categories) > 0 {
			if err := tx.Model(recipe).Association("Categories").Replace(categories); err != nil {
				return err
			}
		}

		for i := range steps {
			steps[i].RecipeID = recipe.ID
			steps[i].StepOrder = i
			stepIngs := steps[i].Ingredients
			steps[i].Ingredients = nil

			if err := tx.Create(&steps[i]).Error; err != nil {
				return err
			}

			for j := range stepIngs {
				stepIngs[j].RecipeID = recipe.ID
				stepIngs[j].StepOrder = i
				if stepIngs[j].IngredientID == 0 && stepIngs[j].Ingredient != nil {
					stepIngs[j].IngredientID = stepIngs[j].Ingredient.ID
				}
				stepIngs[j].Ingredient = nil
				if stepIngs[j].Scale <= 0 {
					stepIngs[j].Scale = 1.0
				}
				if err := tx.Create(&stepIngs[j]).Error; err != nil {
					return err
				}
			}
		}

		return nil
	})
}

func (r *RecipeRepository) FindByID(id int64) (*models.Recipe, error) {
	var recipe models.Recipe
	err := r.basePreload(r.db).First(&recipe, id).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	slice := []models.Recipe{recipe}
	r.populateOnPump(slice)
	return &slice[0], nil
}

func (r *RecipeRepository) FindAll() ([]models.Recipe, error) {
	var recipes []models.Recipe
	err := r.basePreload(r.db).Order("LOWER(name) ASC").Find(&recipes).Error
	if err != nil {
		return nil, err
	}
	r.populateOnPump(recipes)
	return recipes, nil
}

func (r *RecipeRepository) Update(recipe *models.Recipe) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		steps := recipe.ProductionSteps
		categories := recipe.Categories
		recipe.ProductionSteps = nil
		recipe.Categories = nil

		if err := tx.Model(&models.Recipe{}).Where("id = ?", recipe.ID).Updates(map[string]any{
			"name":                   recipe.Name,
			"description":            recipe.Description,
			"has_image":              recipe.HasImage,
			"default_amount_to_fill": recipe.DefaultAmountToFill,
			"owner_id":               recipe.OwnerID,
			"glass_id":               recipe.GlassID,
			"last_update":            recipe.LastUpdate,
		}).Error; err != nil {
			return err
		}

		// Replace categories
		if err := tx.Exec("DELETE FROM recipe_categories WHERE recipe_id = ?", recipe.ID).Error; err != nil {
			return err
		}
		if len(categories) > 0 {
			if err := tx.Model(recipe).Association("Categories").Replace(categories); err != nil {
				return err
			}
		}

		// Clear existing steps and step ingredients
		if err := tx.Exec("DELETE FROM production_step_ingredients WHERE recipe_id = ?", recipe.ID).Error; err != nil {
			return err
		}
		if err := tx.Exec("DELETE FROM production_steps WHERE recipe_id = ?", recipe.ID).Error; err != nil {
			return err
		}

		for i := range steps {
			steps[i].RecipeID = recipe.ID
			steps[i].StepOrder = i
			stepIngs := steps[i].Ingredients
			steps[i].Ingredients = nil

			if err := tx.Create(&steps[i]).Error; err != nil {
				return err
			}

			for j := range stepIngs {
				stepIngs[j].RecipeID = recipe.ID
				stepIngs[j].StepOrder = i
				if stepIngs[j].IngredientID == 0 && stepIngs[j].Ingredient != nil {
					stepIngs[j].IngredientID = stepIngs[j].Ingredient.ID
				}
				stepIngs[j].Ingredient = nil
				if stepIngs[j].Scale <= 0 {
					stepIngs[j].Scale = 1.0
				}
				if err := tx.Create(&stepIngs[j]).Error; err != nil {
					return err
				}
			}
		}

		return nil
	})
}

func (r *RecipeRepository) Delete(id int64) error {
	return r.db.Delete(&models.Recipe{}, id).Error
}

func (r *RecipeRepository) Search(query string) ([]models.Recipe, error) {
	var recipes []models.Recipe
	err := r.basePreload(r.db).
		Where("LOWER(name) LIKE ?", "%"+strings.ToLower(query)+"%").
		Order("LOWER(name)").
		Find(&recipes).Error
	if err != nil {
		return nil, err
	}
	r.populateOnPump(recipes)
	return recipes, nil
}

// FindByFilter returns recipes matching the provided filters
func (r *RecipeRepository) FindByFilter(
	ownerID *int64,
	inCollectionID *int64,
	inCategoryID *int64,
	containsIngredients []int64,
	searchName string,
	orderBy string,
) ([]models.Recipe, error) {
	var recipes []models.Recipe
	query := r.basePreload(r.db).Model(&models.Recipe{})

	if ownerID != nil {
		query = query.Where("recipes.owner_id = ?", *ownerID)
	}

	if inCollectionID != nil {
		query = query.Joins("JOIN collection_recipes ON collection_recipes.recipe_id = recipes.id").
			Where("collection_recipes.collection_id = ?", *inCollectionID)
	}

	if inCategoryID != nil {
		query = query.Joins("JOIN recipe_categories ON recipe_categories.recipe_id = recipes.id").
			Where("recipe_categories.category_id = ?", *inCategoryID)
	}

	if len(containsIngredients) > 0 {
		query = query.Where("recipes.id IN (SELECT DISTINCT recipe_id FROM production_step_ingredients WHERE ingredient_id IN ?)", containsIngredients)
	}

	if searchName != "" {
		query = query.Where("LOWER(recipes.name) LIKE ?", "%"+strings.ToLower(searchName)+"%")
	}

	// Apply ordering
	switch orderBy {
	case "lastUpdateDesc":
		query = query.Order("recipes.last_update DESC")
	case "lastUpdateAsc":
		query = query.Order("recipes.last_update ASC")
	case "nameDesc":
		query = query.Order("LOWER(recipes.name) DESC")
	default:
		query = query.Order("LOWER(recipes.name) ASC")
	}

	err := query.Find(&recipes).Error
	if err != nil {
		return nil, err
	}
	r.populateOnPump(recipes)
	return recipes, nil
}

