package handlers

import (
	"net/http"
	"strconv"

	"github.com/ManfredRichthofen/Bar-Pi/backend-go/internal/models"
	"github.com/ManfredRichthofen/Bar-Pi/backend-go/internal/service"
	"github.com/gin-gonic/gin"
)

// PumpHandler handles HTTP requests for pumps
type PumpHandler struct {
	service *service.PumpService
}

// NewPumpHandler creates a new pump handler
func NewPumpHandler(service *service.PumpService) *PumpHandler {
	return &PumpHandler{service: service}
}

// GetAll handles GET /api/pump
func (h *PumpHandler) GetAll(c *gin.Context) {
	pumps, err := h.service.GetAll()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch pumps"})
		return
	}

	c.JSON(http.StatusOK, pumps)
}

// GetByID handles GET /api/pump/:id
func (h *PumpHandler) GetByID(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid pump ID"})
		return
	}

	pump, err := h.service.GetByID(id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch pump"})
		return
	}
	if pump == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Pump not found"})
		return
	}

	c.JSON(http.StatusOK, pump)
}

// Create handles POST /api/pump
func (h *PumpHandler) Create(c *gin.Context) {
	var pump models.Pump
	if err := c.ShouldBindJSON(&pump); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.service.Create(&pump); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, pump)
}

// Update handles PATCH /api/pump/:id
func (h *PumpHandler) Update(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid pump ID"})
		return
	}

	var fields map[string]interface{}
	if err := c.ShouldBindJSON(&fields); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.service.UpdateFields(id, fields); err != nil {
		if err.Error() == "pump not found" {
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	pump, _ := h.service.GetByID(id)
	c.JSON(http.StatusOK, pump)
}

// Delete handles DELETE /api/pump/:id
func (h *PumpHandler) Delete(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid pump ID"})
		return
	}

	if err := h.service.Delete(id); err != nil {
		if err.Error() == "pump not found" {
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete pump"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Pump deleted successfully"})
}

// PumpUp handles PUT /api/pump/:id/pumpup
func (h *PumpHandler) PumpUp(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid pump ID"})
		return
	}

	if err := h.service.SetPumpedUp(id, true); err != nil {
		if err.Error() == "pump not found" {
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to pump up"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Pump up initiated"})
}

// PumpBack handles PUT /api/pump/:id/pumpback
func (h *PumpHandler) PumpBack(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid pump ID"})
		return
	}

	if err := h.service.SetPumpedUp(id, false); err != nil {
		if err.Error() == "pump not found" {
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to pump back"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Pump back initiated"})
}

// Start handles PUT /api/pump/start
func (h *PumpHandler) Start(c *gin.Context) {
	idStr := c.Query("id")
	if idStr == "" {
		// Start all pumps
		c.JSON(http.StatusOK, gin.H{"message": "All pumps started"})
		return
	}

	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid pump ID"})
		return
	}

	pump, err := h.service.GetByID(id)
	if err != nil || pump == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Pump not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Pump started"})
}

// Stop handles PUT /api/pump/stop
func (h *PumpHandler) Stop(c *gin.Context) {
	idStr := c.Query("id")
	if idStr == "" {
		// Stop all pumps
		c.JSON(http.StatusOK, gin.H{"message": "All pumps stopped"})
		return
	}

	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid pump ID"})
		return
	}

	pump, err := h.service.GetByID(id)
	if err != nil || pump == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Pump not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Pump stopped"})
}
