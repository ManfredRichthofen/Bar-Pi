package repository

import (
	"errors"

	"github.com/ManfredRichthofen/Bar-Pi/backend-go/internal/models"
	"gorm.io/gorm"
)

type CollectionRepository struct {
	db *gorm.DB
}

func NewCollectionRepository(db *gorm.DB) *CollectionRepository {
	return &CollectionRepository{db: db}
}

func (r *CollectionRepository) Create(collection *models.Collection) error {
	return r.db.Create(collection).Error
}

func (r *CollectionRepository) FindByID(id int64) (*models.Collection, error) {
	var collection models.Collection
	err := r.db.Preload("Owner").Preload("Recipes").First(&collection, id).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &collection, nil
}

func (r *CollectionRepository) FindAll(ownerID *int64) ([]models.Collection, error) {
	var collections []models.Collection
	q := r.db.Preload("Owner").Preload("Recipes")
	if ownerID != nil {
		q = q.Where("owner_id = ?", *ownerID)
	}
	err := q.Order("name ASC").Find(&collections).Error
	return collections, err
}

func (r *CollectionRepository) Update(collection *models.Collection) error {
	return r.db.Save(collection).Error
}

func (r *CollectionRepository) Delete(id int64) error {
	return r.db.Delete(&models.Collection{}, id).Error
}

func (r *CollectionRepository) AddRecipe(collectionID, recipeID int64) error {
	return r.db.Exec(
		"INSERT OR IGNORE INTO collection_recipes (collection_id, recipe_id) VALUES (?, ?)",
		collectionID, recipeID,
	).Error
}

func (r *CollectionRepository) RemoveRecipe(collectionID, recipeID int64) error {
	return r.db.Exec(
		"DELETE FROM collection_recipes WHERE collection_id = ? AND recipe_id = ?",
		collectionID, recipeID,
	).Error
}
