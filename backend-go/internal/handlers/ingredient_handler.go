package handlers

import (
	"net/http"
	"strconv"

	"github.com/ManfredRichthofen/Bar-Pi/backend-go/internal/models"
	"github.com/ManfredRichthofen/Bar-Pi/backend-go/internal/service"
	"github.com/gin-gonic/gin"
)

// IngredientHandler handles HTTP requests for ingredients
type IngredientHandler struct {
	service *service.IngredientService
}

// NewIngredientHandler creates a new ingredient handler
func NewIngredientHandler(service *service.IngredientService) *IngredientHandler {
	return &IngredientHandler{service: service}
}

// GetAll handles GET /api/ingredient
func (h *IngredientHandler) GetAll(c *gin.Context) {
	// Parse query parameters
	autocomplete := c.Query("autocomplete")
	filterManualIngredients := c.Query("filterManualIngredients") == "true"
	filterAutomaticIngredients := c.Query("filterAutomaticIngredients") == "true"
	filterIngredientGroups := c.Query("filterIngredientGroups") == "true"
	inBar := c.Query("inBar") == "true"
	onPump := c.Query("onPump") == "true"
	inBarOrOnPump := c.Query("inBarOrOnPump") == "true"

	var groupChildrenGroupID *int64
	if groupIDStr := c.Query("groupChildrenGroupId"); groupIDStr != "" {
		groupID, err := strconv.ParseInt(groupIDStr, 10, 64)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid groupChildrenGroupId"})
			return
		}
		groupChildrenGroupID = &groupID
	}

	// Validate autocomplete length if provided (unless specific filters are set)
	skipAutoMinCheck := inBarOrOnPump || inBar || onPump
	if !skipAutoMinCheck && autocomplete != "" && len(autocomplete) < 2 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Autocomplete query must be at least 2 characters"})
		return
	}

	ingredients, err := h.service.GetByFilter(
		autocomplete,
		filterManualIngredients,
		filterAutomaticIngredients,
		filterIngredientGroups,
		groupChildrenGroupID,
		inBar,
		onPump,
		inBarOrOnPump,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch ingredients"})
		return
	}

	c.JSON(http.StatusOK, ingredients)
}

// GetByID handles GET /api/ingredient/:id
func (h *IngredientHandler) GetByID(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ingredient ID"})
		return
	}

	ingredient, err := h.service.GetByID(id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch ingredient"})
		return
	}
	if ingredient == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Ingredient not found"})
		return
	}

	c.JSON(http.StatusOK, ingredient)
}

// Create handles POST /api/ingredient
func (h *IngredientHandler) Create(c *gin.Context) {
	var ingredient models.Ingredient
	if err := c.ShouldBindJSON(&ingredient); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.service.Create(&ingredient); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, ingredient)
}

// Update handles PUT /api/ingredient/:id
func (h *IngredientHandler) Update(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ingredient ID"})
		return
	}

	var ingredient models.Ingredient
	if err := c.ShouldBindJSON(&ingredient); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	ingredient.ID = id

	if err := h.service.Update(&ingredient); err != nil {
		if err.Error() == "ingredient not found" {
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, ingredient)
}

// Delete handles DELETE /api/ingredient/:id
func (h *IngredientHandler) Delete(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ingredient ID"})
		return
	}

	if err := h.service.Delete(id); err != nil {
		if err.Error() == "ingredient not found" {
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete ingredient"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Ingredient deleted successfully"})
}

// AddToBar handles PUT /api/ingredient/:id/bar
func (h *IngredientHandler) AddToBar(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ingredient ID"})
		return
	}

	if err := h.service.SetInBar(id, true); err != nil {
		if err.Error() == "ingredient not found" {
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to add ingredient to bar"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Ingredient added to bar"})
}

// RemoveFromBar handles DELETE /api/ingredient/:id/bar
func (h *IngredientHandler) RemoveFromBar(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ingredient ID"})
		return
	}

	if err := h.service.SetInBar(id, false); err != nil {
		if err.Error() == "ingredient not found" {
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to remove ingredient from bar"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Ingredient removed from bar"})
}

// GetExport handles GET /api/ingredient/export
func (h *IngredientHandler) GetExport(c *gin.Context) {
	ingredients, err := h.service.GetAll()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to export ingredients"})
		return
	}

	c.JSON(http.StatusOK, ingredients)
}
