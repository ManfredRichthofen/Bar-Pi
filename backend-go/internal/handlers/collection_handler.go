package handlers

import (
	"net/http"
	"strconv"

	"github.com/ManfredRichthofen/Bar-Pi/backend-go/internal/middleware"
	"github.com/ManfredRichthofen/Bar-Pi/backend-go/internal/models"
	"github.com/ManfredRichthofen/Bar-Pi/backend-go/internal/repository"
	"github.com/gin-gonic/gin"
)

type CollectionHandler struct {
	repo *repository.CollectionRepository
}

func NewCollectionHandler(repo *repository.CollectionRepository) *CollectionHandler {
	return &CollectionHandler{repo: repo}
}

func (h *CollectionHandler) GetAll(c *gin.Context) {
	var ownerID *int64
	if s := c.Query("ownerId"); s != "" {
		if v, err := strconv.ParseInt(s, 10, 64); err == nil {
			ownerID = &v
		}
	}
	collections, err := h.repo.FindAll(ownerID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch collections", "message": "Failed to fetch collections"})
		return
	}
	c.JSON(http.StatusOK, collections)
}

func (h *CollectionHandler) GetByID(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid collection ID", "message": "Invalid collection ID"})
		return
	}
	collection, err := h.repo.FindByID(id)
	if err != nil || collection == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Collection not found", "message": "Collection not found"})
		return
	}
	c.JSON(http.StatusOK, collection)
}

func (h *CollectionHandler) Create(c *gin.Context) {
	var collection models.Collection
	if err := c.ShouldBindJSON(&collection); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error(), "message": err.Error()})
		return
	}
	claims, ok := middleware.GetClaims(c)
	if ok && collection.OwnerID == 0 {
		collection.OwnerID = claims.UserID
	}
	if err := h.repo.Create(&collection); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error(), "message": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, collection)
}

func (h *CollectionHandler) Update(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid collection ID", "message": "Invalid collection ID"})
		return
	}
	existing, err := h.repo.FindByID(id)
	if err != nil || existing == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Collection not found", "message": "Collection not found"})
		return
	}
	var collection models.Collection
	if err := c.ShouldBindJSON(&collection); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error(), "message": err.Error()})
		return
	}
	collection.ID = id
	if collection.OwnerID == 0 {
		collection.OwnerID = existing.OwnerID
	}
	if err := h.repo.Update(&collection); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error(), "message": err.Error()})
		return
	}
	c.JSON(http.StatusOK, collection)
}

func (h *CollectionHandler) Delete(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid collection ID", "message": "Invalid collection ID"})
		return
	}
	if err := h.repo.Delete(id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete collection", "message": "Failed to delete collection"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Collection deleted"})
}

func (h *CollectionHandler) AddRecipe(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid collection ID", "message": "Invalid collection ID"})
		return
	}
	var recipeID int64
	if err := c.ShouldBindJSON(&recipeID); err != nil {
		var body struct {
			RecipeID int64 `json:"recipeId"`
		}
		if err2 := c.ShouldBindJSON(&body); err2 != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid recipe ID", "message": "Invalid recipe ID"})
			return
		}
		recipeID = body.RecipeID
	}
	if err := h.repo.AddRecipe(id, recipeID); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error(), "message": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Recipe added to collection"})
}

func (h *CollectionHandler) RemoveRecipe(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid collection ID", "message": "Invalid collection ID"})
		return
	}
	recipeID, err := strconv.ParseInt(c.Param("recipeId"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid recipe ID", "message": "Invalid recipe ID"})
		return
	}
	if err := h.repo.RemoveRecipe(id, recipeID); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error(), "message": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Recipe removed from collection"})
}
