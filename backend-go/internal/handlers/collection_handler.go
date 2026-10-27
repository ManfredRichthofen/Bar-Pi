package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"
	"strings"

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

func (h *CollectionHandler) authorize(c *gin.Context) (*models.Collection, bool) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid collection ID", "message": "Invalid collection ID"})
		return nil, false
	}
	collection, err := h.repo.FindByID(id)
	if err != nil || collection == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Collection not found", "message": "Collection not found"})
		return nil, false
	}
	claims, ok := middleware.GetClaims(c)
	if !ok || (claims.UserID != collection.OwnerID && claims.Role.Level() < models.RoleAdmin.Level()) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Insufficient permissions", "message": "You can only modify your own collections"})
		return nil, false
	}
	return collection, true
}

func (h *CollectionHandler) Create(c *gin.Context) {
	var collection models.Collection
	if err := c.ShouldBindJSON(&collection); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error(), "message": err.Error()})
		return
	}
	collection.Name = strings.TrimSpace(collection.Name)
	if collection.Name == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Collection name must not be empty", "message": "Collection name must not be empty"})
		return
	}
	claims, ok := middleware.GetClaims(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	collection.ID = 0
	collection.OwnerID = claims.UserID
	collection.Recipes = nil
	if err := h.repo.Create(&collection); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error(), "message": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, collection)
}

func (h *CollectionHandler) Update(c *gin.Context) {
	existing, ok := h.authorize(c)
	if !ok {
		return
	}
	var body struct {
		Name        string `json:"name"`
		Description string `json:"description"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error(), "message": err.Error()})
		return
	}
	body.Name = strings.TrimSpace(body.Name)
	if body.Name == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Collection name must not be empty", "message": "Collection name must not be empty"})
		return
	}
	existing.Name = body.Name
	existing.Description = body.Description
	if err := h.repo.Update(existing); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error(), "message": err.Error()})
		return
	}
	updated, err := h.repo.FindByID(existing.ID)
	if err != nil || updated == nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to reload collection", "message": "Failed to reload collection"})
		return
	}
	c.JSON(http.StatusOK, updated)
}

func (h *CollectionHandler) Delete(c *gin.Context) {
	collection, ok := h.authorize(c)
	if !ok {
		return
	}
	if err := h.repo.Delete(collection.ID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete collection", "message": "Failed to delete collection"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Collection deleted"})
}

// AddRecipe accepts the recipe ID as a bare JSON number or as {"recipeId": n}.
func (h *CollectionHandler) AddRecipe(c *gin.Context) {
	collection, ok := h.authorize(c)
	if !ok {
		return
	}
	raw, err := c.GetRawData()
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid recipe ID", "message": "Invalid recipe ID"})
		return
	}
	var recipeID int64
	if err := json.Unmarshal(raw, &recipeID); err != nil {
		var body struct {
			RecipeID int64 `json:"recipeId"`
		}
		if err := json.Unmarshal(raw, &body); err != nil || body.RecipeID == 0 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid recipe ID", "message": "Invalid recipe ID"})
			return
		}
		recipeID = body.RecipeID
	}
	if err := h.repo.AddRecipe(collection.ID, recipeID); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Recipe not found", "message": "Recipe not found"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Recipe added to collection"})
}

func (h *CollectionHandler) RemoveRecipe(c *gin.Context) {
	collection, ok := h.authorize(c)
	if !ok {
		return
	}
	recipeID, err := strconv.ParseInt(c.Param("recipeId"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid recipe ID", "message": "Invalid recipe ID"})
		return
	}
	if err := h.repo.RemoveRecipe(collection.ID, recipeID); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error(), "message": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Recipe removed from collection"})
}
