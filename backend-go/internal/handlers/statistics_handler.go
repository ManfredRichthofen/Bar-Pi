package handlers

import (
	"net/http"
	"strconv"

	"github.com/ManfredRichthofen/Bar-Pi/backend-go/internal/service"
	"github.com/gin-gonic/gin"
)

type StatisticsHandler struct {
	service *service.StatisticsService
}

func NewStatisticsHandler(service *service.StatisticsService) *StatisticsHandler {
	return &StatisticsHandler{service: service}
}

func (h *StatisticsHandler) GetOverview(c *gin.Context) {
	days := 14
	if dStr := c.Query("days"); dStr != "" {
		if d, err := strconv.Atoi(dStr); err == nil && d > 0 {
			days = d
		}
	}

	overview, err := h.service.GetOverview(days)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch statistics", "message": "Failed to fetch statistics"})
		return
	}
	c.JSON(http.StatusOK, overview)
}

func (h *StatisticsHandler) GetTopRecipes(c *gin.Context) {
	limit := 15
	if lStr := c.Query("limit"); lStr != "" {
		if l, err := strconv.Atoi(lStr); err == nil && l > 0 {
			limit = l
		}
	}

	recipes, err := h.service.GetTopRecipes(limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch recipe statistics", "message": "Failed to fetch recipe statistics"})
		return
	}
	c.JSON(http.StatusOK, recipes)
}

func (h *StatisticsHandler) GetTopIngredients(c *gin.Context) {
	limit := 20
	if lStr := c.Query("limit"); lStr != "" {
		if l, err := strconv.Atoi(lStr); err == nil && l > 0 {
			limit = l
		}
	}

	ingredients, err := h.service.GetTopIngredients(limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch ingredient statistics", "message": "Failed to fetch ingredient statistics"})
		return
	}
	c.JSON(http.StatusOK, ingredients)
}

func (h *StatisticsHandler) GetRecentOrders(c *gin.Context) {
	limit := 30
	if lStr := c.Query("limit"); lStr != "" {
		if l, err := strconv.Atoi(lStr); err == nil && l > 0 {
			limit = l
		}
	}

	orders, err := h.service.GetRecentOrders(limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch recent orders", "message": "Failed to fetch recent orders"})
		return
	}
	c.JSON(http.StatusOK, orders)
}

func (h *StatisticsHandler) ClearOrderHistory(c *gin.Context) {
	if err := h.service.ClearOrderHistory(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to clear order history", "message": "Failed to clear order history"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Order history cleared"})
}
