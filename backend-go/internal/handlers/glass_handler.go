package handlers

import (
	"net/http"
	"strconv"

	"github.com/ManfredRichthofen/Bar-Pi/backend-go/internal/models"
	"github.com/ManfredRichthofen/Bar-Pi/backend-go/internal/service"
	"github.com/gin-gonic/gin"
)

// GlassHandler handles HTTP requests for glasses
type GlassHandler struct {
	service *service.GlassService
}

// NewGlassHandler creates a new glass handler
func NewGlassHandler(service *service.GlassService) *GlassHandler {
	return &GlassHandler{service: service}
}

// GetAll handles GET /api/glass
func (h *GlassHandler) GetAll(c *gin.Context) {
	glasses, err := h.service.GetAll()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch glasses"})
		return
	}

	c.JSON(http.StatusOK, glasses)
}

// GetByID handles GET /api/glass/:id
func (h *GlassHandler) GetByID(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid glass ID"})
		return
	}

	glass, err := h.service.GetByID(id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch glass"})
		return
	}
	if glass == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Glass not found"})
		return
	}

	c.JSON(http.StatusOK, glass)
}

// Create handles POST /api/glass
func (h *GlassHandler) Create(c *gin.Context) {
	var glass models.Glass
	if err := c.ShouldBindJSON(&glass); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.service.Create(&glass); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, glass)
}

// Update handles PUT /api/glass/:id
func (h *GlassHandler) Update(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid glass ID"})
		return
	}

	var glass models.Glass
	if err := c.ShouldBindJSON(&glass); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	glass.ID = id

	if err := h.service.Update(&glass); err != nil {
		if err.Error() == "glass not found" {
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, glass)
}

// Delete handles DELETE /api/glass/:id
func (h *GlassHandler) Delete(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid glass ID"})
		return
	}

	if err := h.service.Delete(id); err != nil {
		if err.Error() == "glass not found" {
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete glass"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Glass deleted successfully"})
}
