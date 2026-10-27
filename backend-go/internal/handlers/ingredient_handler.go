package handlers

import (
	"encoding/json"
	"io"
	"net/http"
	"strconv"
	"strings"

	"github.com/ManfredRichthofen/Bar-Pi/backend-go/internal/models"
	"github.com/ManfredRichthofen/Bar-Pi/backend-go/internal/service"
	"github.com/gin-gonic/gin"
)

// IngredientHandler handles HTTP requests for ingredients
type IngredientHandler struct {
	service      *service.IngredientService
	imageService *service.ImageService
}

// NewIngredientHandler creates a new ingredient handler
func NewIngredientHandler(svc *service.IngredientService, img ...*service.ImageService) *IngredientHandler {
	var imgSvc *service.ImageService
	if len(img) > 0 {
		imgSvc = img[0]
	}
	return &IngredientHandler{
		service:      svc,
		imageService: imgSvc,
	}
}

func parseIngredientAndImageFromRequest(c *gin.Context) (*models.Ingredient, []byte, error) {
	contentType := c.ContentType()
	var ingredient models.Ingredient
	var imageBytes []byte

	if strings.HasPrefix(contentType, "multipart/") {
		if err := c.Request.ParseMultipartForm(16 << 20); err != nil {
			return nil, nil, err
		}
		var ingJSON []byte
		if val := c.Request.FormValue("ingredient"); val != "" {
			ingJSON = []byte(val)
		} else if fileHeaders := c.Request.MultipartForm.File["ingredient"]; len(fileHeaders) > 0 {
			f, err := fileHeaders[0].Open()
			if err != nil {
				return nil, nil, err
			}
			defer f.Close()
			ingJSON, err = io.ReadAll(f)
			if err != nil {
				return nil, nil, err
			}
		}
		if err := json.Unmarshal(ingJSON, &ingredient); err != nil {
			return nil, nil, err
		}

		if imgHeaders := c.Request.MultipartForm.File["image"]; len(imgHeaders) > 0 {
			imgFile, err := imgHeaders[0].Open()
			if err == nil {
				defer imgFile.Close()
				imageBytes, _ = io.ReadAll(imgFile)
			}
		}
	} else {
		if err := c.ShouldBindJSON(&ingredient); err != nil {
			return nil, nil, err
		}
	}

	return &ingredient, imageBytes, nil
}

// GetAll handles GET /api/ingredient
func (h *IngredientHandler) GetAll(c *gin.Context) {
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
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid groupChildrenGroupId", "message": "Invalid groupChildrenGroupId"})
			return
		}
		groupChildrenGroupID = &groupID
	}

	skipAutoMinCheck := inBarOrOnPump || inBar || onPump
	if !skipAutoMinCheck && autocomplete != "" && len(autocomplete) < 2 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Autocomplete query must be at least 2 characters", "message": "Autocomplete query must be at least 2 characters"})
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
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch ingredients", "message": "Failed to fetch ingredients"})
		return
	}

	c.JSON(http.StatusOK, ingredients)
}

// GetBoostable handles GET /api/ingredient/boostable
func (h *IngredientHandler) GetBoostable(c *gin.Context) {
	ingredients, err := h.service.GetBoostable()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch boostable ingredients", "message": "Failed to fetch boostable ingredients"})
		return
	}
	c.JSON(http.StatusOK, ingredients)
}

// GetByID handles GET /api/ingredient/:id
func (h *IngredientHandler) GetByID(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ingredient ID", "message": "Invalid ingredient ID"})
		return
	}

	ingredient, err := h.service.GetByID(id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch ingredient", "message": "Failed to fetch ingredient"})
		return
	}
	if ingredient == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Ingredient not found", "message": "Ingredient not found"})
		return
	}

	c.JSON(http.StatusOK, ingredient)
}

// GetImage handles GET /api/ingredient/:id/image
func (h *IngredientHandler) GetImage(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil || h.imageService == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Image not found"})
		return
	}

	filename := "ingredient_" + strconv.FormatInt(id, 10) + ".jpg"
	data, err := h.imageService.GetImage(filename)
	if err != nil || data == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Image not found"})
		return
	}

	c.Data(http.StatusOK, "image/jpeg", data)
}

// Create handles POST /api/ingredient
func (h *IngredientHandler) Create(c *gin.Context) {
	ingredient, imageBytes, err := parseIngredientAndImageFromRequest(c)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error(), "message": err.Error()})
		return
	}

	if len(imageBytes) > 0 {
		ingredient.HasImage = true
	}

	if err := h.service.Create(ingredient); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error(), "message": err.Error()})
		return
	}

	if len(imageBytes) > 0 && h.imageService != nil {
		if _, err := h.imageService.SaveImage(imageBytes, "ingredient", ingredient.ID); err != nil {
			ingredient.HasImage = false
			_ = h.service.Update(ingredient)
		}
	}

	c.JSON(http.StatusCreated, ingredient)
}

// Update handles PUT /api/ingredient/:id
func (h *IngredientHandler) Update(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ingredient ID", "message": "Invalid ingredient ID"})
		return
	}

	existing, err := h.service.GetByID(id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch ingredient", "message": "Failed to fetch ingredient"})
		return
	}
	if existing == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "ingredient not found", "message": "ingredient not found"})
		return
	}

	ingredient, imageBytes, err := parseIngredientAndImageFromRequest(c)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error(), "message": err.Error()})
		return
	}

	ingredient.ID = id
	ingredient.HasImage = existing.HasImage

	if c.Query("removeImage") == "true" {
		ingredient.HasImage = false
		if h.imageService != nil {
			_ = h.imageService.DeleteImage("ingredient_" + strconv.FormatInt(id, 10) + ".jpg")
		}
	}
	if len(imageBytes) > 0 && h.imageService != nil {
		if _, err := h.imageService.SaveImage(imageBytes, "ingredient", id); err == nil {
			ingredient.HasImage = true
		}
	}

	if err := h.service.Update(ingredient); err != nil {
		if err.Error() == "ingredient not found" {
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error(), "message": err.Error()})
			return
		}
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error(), "message": err.Error()})
		return
	}

	c.JSON(http.StatusOK, ingredient)
}

// Delete handles DELETE /api/ingredient/:id
func (h *IngredientHandler) Delete(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ingredient ID", "message": "Invalid ingredient ID"})
		return
	}

	if err := h.service.Delete(id); err != nil {
		if err.Error() == "ingredient not found" {
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error(), "message": err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete ingredient", "message": "Failed to delete ingredient"})
		return
	}

	if h.imageService != nil {
		_ = h.imageService.DeleteImage("ingredient_" + strconv.FormatInt(id, 10) + ".jpg")
	}

	c.JSON(http.StatusOK, gin.H{"message": "Ingredient deleted successfully"})
}

// AddToBar handles PUT /api/ingredient/:id/bar
func (h *IngredientHandler) AddToBar(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ingredient ID", "message": "Invalid ingredient ID"})
		return
	}

	if err := h.service.SetInBar(id, true); err != nil {
		if err.Error() == "ingredient not found" {
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error(), "message": err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to add ingredient to bar", "message": "Failed to add ingredient to bar"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Ingredient added to bar"})
}

// RemoveFromBar handles DELETE /api/ingredient/:id/bar
func (h *IngredientHandler) RemoveFromBar(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ingredient ID", "message": "Invalid ingredient ID"})
		return
	}

	if err := h.service.SetInBar(id, false); err != nil {
		if err.Error() == "ingredient not found" {
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error(), "message": err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to remove ingredient from bar", "message": "Failed to remove ingredient from bar"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Ingredient removed from bar"})
}

// GetExport handles GET /api/ingredient/export
func (h *IngredientHandler) GetExport(c *gin.Context) {
	ingredients, err := h.service.GetAll()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to export ingredients", "message": "Failed to export ingredients"})
		return
	}

	c.JSON(http.StatusOK, ingredients)
}
