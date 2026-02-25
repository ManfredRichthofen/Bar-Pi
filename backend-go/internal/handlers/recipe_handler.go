package handlers

import (
	"net/http"
	"strconv"

	"github.com/ManfredRichthofen/Bar-Pi/backend-go/internal/middleware"
	"github.com/ManfredRichthofen/Bar-Pi/backend-go/internal/models"
	"github.com/ManfredRichthofen/Bar-Pi/backend-go/internal/service"
	"github.com/gin-gonic/gin"
)

type RecipeHandler struct {
	service      *service.RecipeService
	imageService *service.ImageService
}

func NewRecipeHandler(service *service.RecipeService, imageService *service.ImageService) *RecipeHandler {
	return &RecipeHandler{
		service:      service,
		imageService: imageService,
	}
}

func (h *RecipeHandler) GetAll(c *gin.Context) {
	recipes, err := h.service.GetAll()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch recipes"})
		return
	}

	c.JSON(http.StatusOK, recipes)
}

func (h *RecipeHandler) GetByID(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid recipe ID"})
		return
	}

	recipe, err := h.service.GetByID(id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch recipe"})
		return
	}
	if recipe == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Recipe not found"})
		return
	}

	c.JSON(http.StatusOK, recipe)
}

func (h *RecipeHandler) Create(c *gin.Context) {
	var recipe models.Recipe
	if err := c.ShouldBindJSON(&recipe); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	claims, _ := middleware.GetClaims(c)
	recipe.OwnerID = claims.UserID

	if err := h.service.Create(&recipe); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, recipe)
}

func (h *RecipeHandler) Update(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid recipe ID"})
		return
	}

	var recipe models.Recipe
	if err := c.ShouldBindJSON(&recipe); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	recipe.ID = id

	claims, _ := middleware.GetClaims(c)
	existing, err := h.service.GetByID(id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch recipe"})
		return
	}
	if existing == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Recipe not found"})
		return
	}

	if existing.OwnerID != claims.UserID && claims.Role != models.RoleAdmin {
		c.JSON(http.StatusForbidden, gin.H{"error": "Unauthorized"})
		return
	}

	if err := h.service.Update(&recipe); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update recipe"})
		return
	}

	c.JSON(http.StatusOK, recipe)
}

func (h *RecipeHandler) Delete(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid recipe ID"})
		return
	}

	claims, _ := middleware.GetClaims(c)
	isAdmin := claims.Role == models.RoleAdmin

	if err := h.service.Delete(id, claims.UserID, isAdmin); err != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Recipe deleted successfully"})
}

func (h *RecipeHandler) Search(c *gin.Context) {
	query := c.Query("q")
	if query == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Search query is required"})
		return
	}

	recipes, err := h.service.Search(query)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to search recipes"})
		return
	}

	c.JSON(http.StatusOK, recipes)
}
