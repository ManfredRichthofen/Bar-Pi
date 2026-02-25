package handlers

import (
	"net/http"
	"strconv"

	"github.com/ManfredRichthofen/Bar-Pi/backend-go/internal/models"
	"github.com/ManfredRichthofen/Bar-Pi/backend-go/internal/service"
	"github.com/gin-gonic/gin"
)

// CocktailHandler handles HTTP requests for cocktail orders
type CocktailHandler struct {
	service *service.CocktailService
}

// NewCocktailHandler creates a new cocktail handler
func NewCocktailHandler(service *service.CocktailService) *CocktailHandler {
	return &CocktailHandler{service: service}
}

// OrderCocktail handles PUT /api/cocktail/:recipeId
func (h *CocktailHandler) OrderCocktail(c *gin.Context) {
	recipeID, err := strconv.ParseInt(c.Param("recipeId"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid recipe ID"})
		return
	}

	var config models.CocktailOrderConfiguration
	if err := c.ShouldBindJSON(&config); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Get user info from context (set by auth middleware)
	userID, _ := c.Get("userID")
	username, _ := c.Get("username")

	if err := h.service.OrderCocktail(
		userID.(int64),
		username.(string),
		recipeID,
		config,
	); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusAccepted, gin.H{"message": "Cocktail order started"})
}

// CheckFeasibility handles PUT /api/cocktail/:recipeId/feasibility
func (h *CocktailHandler) CheckFeasibility(c *gin.Context) {
	recipeID, err := strconv.ParseInt(c.Param("recipeId"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid recipe ID"})
		return
	}

	var config models.CocktailOrderConfiguration
	if err := c.ShouldBindJSON(&config); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	report, err := h.service.CheckFeasibility(recipeID, config)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, report)
}

// CancelCocktail handles DELETE /api/cocktail
func (h *CocktailHandler) CancelCocktail(c *gin.Context) {
	userID, _ := c.Get("userID")

	if err := h.service.CancelOrder(userID.(int64)); err != nil {
		if err.Error() == "no active order to cancel" {
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Cocktail order cancelled"})
}

// ContinueProduction handles POST /api/cocktail/continueproduction
func (h *CocktailHandler) ContinueProduction(c *gin.Context) {
	if err := h.service.ContinueProduction(); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusAccepted, gin.H{"message": "Production continued"})
}

// GetProgress handles GET /api/cocktail/progress
func (h *CocktailHandler) GetProgress(c *gin.Context) {
	progress := h.service.GetCurrentProgress()
	if progress == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "No active order"})
		return
	}

	c.JSON(http.StatusOK, progress)
}
