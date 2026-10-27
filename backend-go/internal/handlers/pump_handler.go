package handlers

import (
	"net/http"
	"strconv"

	"github.com/ManfredRichthofen/Bar-Pi/backend-go/internal/models"
	"github.com/ManfredRichthofen/Bar-Pi/backend-go/internal/service"
	"github.com/gin-gonic/gin"
)

// PumpHandler handles HTTP requests for pumps and pump settings
type PumpHandler struct {
	service       *service.PumpService
	systemService *service.SystemService
}

// NewPumpHandler creates a new pump handler
func NewPumpHandler(svc *service.PumpService, sys ...*service.SystemService) *PumpHandler {
	var sysSvc *service.SystemService
	if len(sys) > 0 {
		sysSvc = sys[0]
	}
	return &PumpHandler{
		service:       svc,
		systemService: sysSvc,
	}
}

// GetAll handles GET /api/pump
func (h *PumpHandler) GetAll(c *gin.Context) {
	pumps, err := h.service.GetAll()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch pumps", "message": "Failed to fetch pumps"})
		return
	}

	c.JSON(http.StatusOK, pumps)
}

// GetByID handles GET /api/pump/:id
func (h *PumpHandler) GetByID(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid pump ID", "message": "Invalid pump ID"})
		return
	}

	pump, err := h.service.GetByID(id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch pump", "message": "Failed to fetch pump"})
		return
	}
	if pump == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Pump not found", "message": "Pump not found"})
		return
	}

	c.JSON(http.StatusOK, pump)
}

// Create handles POST /api/pump
func (h *PumpHandler) Create(c *gin.Context) {
	var pump models.Pump
	if err := c.ShouldBindJSON(&pump); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error(), "message": err.Error()})
		return
	}

	if err := h.service.Create(&pump); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error(), "message": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, pump)
}

// Update handles PATCH /api/pump/:id and PUT /api/pump/:id
func (h *PumpHandler) Update(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid pump ID", "message": "Invalid pump ID"})
		return
	}

	var fields map[string]any
	if err := c.ShouldBindJSON(&fields); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error(), "message": err.Error()})
		return
	}

	if err := h.service.UpdateFields(id, fields); err != nil {
		if err.Error() == "pump not found" {
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error(), "message": err.Error()})
			return
		}
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error(), "message": err.Error()})
		return
	}

	pump, _ := h.service.GetByID(id)
	c.JSON(http.StatusOK, pump)
}

// Delete handles DELETE /api/pump/:id
func (h *PumpHandler) Delete(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid pump ID", "message": "Invalid pump ID"})
		return
	}

	if err := h.service.Delete(id); err != nil {
		if err.Error() == "pump not found" {
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error(), "message": err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete pump", "message": "Failed to delete pump"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Pump deleted successfully"})
}

// PumpUp handles PUT /api/pump/:id/pumpup
func (h *PumpHandler) PumpUp(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid pump ID", "message": "Invalid pump ID"})
		return
	}

	if err := h.service.SetPumpedUp(id, true); err != nil {
		if err.Error() == "pump not found" {
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error(), "message": err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to pump up", "message": "Failed to pump up"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Pump up initiated"})
}

// PumpBack handles PUT /api/pump/:id/pumpback
func (h *PumpHandler) PumpBack(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid pump ID", "message": "Invalid pump ID"})
		return
	}

	if err := h.service.SetPumpedUp(id, false); err != nil {
		if err.Error() == "pump not found" {
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error(), "message": err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to pump back", "message": "Failed to pump back"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Pump back initiated"})
}

// RunJob handles PUT /api/pump/:id/runjob
func (h *PumpHandler) RunJob(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid pump ID", "message": "Invalid pump ID"})
		return
	}

	var advice models.PumpAdvice
	if err := c.ShouldBindJSON(&advice); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error(), "message": err.Error()})
		return
	}

	jobID, err := h.service.DispatchPumpAdvice(id, advice)
	if err != nil {
		if err.Error() == "pump not found" {
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error(), "message": err.Error()})
			return
		}
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error(), "message": err.Error()})
		return
	}

	c.JSON(http.StatusOK, jobID)
}

// GetJobMetrics handles GET /api/pump/jobmetrics/:id
func (h *PumpHandler) GetJobMetrics(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid job ID", "message": "Invalid job ID"})
		return
	}

	metrics := h.service.GetJobMetrics(id)
	c.JSON(http.StatusOK, metrics)
}

// Start handles PUT /api/pump/start
func (h *PumpHandler) Start(c *gin.Context) {
	idStr := c.Query("id")
	if idStr == "" {
		if err := h.service.StartPump(nil); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error(), "message": err.Error()})
			return
		}
		c.JSON(http.StatusOK, gin.H{"message": "All pumps started"})
		return
	}

	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid pump ID", "message": "Invalid pump ID"})
		return
	}

	if err := h.service.StartPump(&id); err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Pump not found", "message": "Pump not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Pump started"})
}

// Stop handles PUT /api/pump/stop
func (h *PumpHandler) Stop(c *gin.Context) {
	idStr := c.Query("id")
	if idStr == "" {
		_ = h.service.StopPump(nil)
		c.JSON(http.StatusOK, gin.H{"message": "All pumps stopped"})
		return
	}

	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid pump ID", "message": "Invalid pump ID"})
		return
	}

	if err := h.service.StopPump(&id); err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Pump not found", "message": "Pump not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Pump stopped"})
}

// GetReversePumpSettings handles GET /api/pump/settings/reversepumping
func (h *PumpHandler) GetReversePumpSettings(c *gin.Context) {
	if h.systemService == nil {
		c.JSON(http.StatusOK, models.ReversePumpSettings{Enable: false})
		return
	}
	c.JSON(http.StatusOK, h.systemService.GetReversePumpSettings())
}

// SetReversePumpSettings handles PUT /api/pump/settings/reversepumping
func (h *PumpHandler) SetReversePumpSettings(c *gin.Context) {
	var settings models.ReversePumpSettings
	if err := c.ShouldBindJSON(&settings); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error(), "message": err.Error()})
		return
	}
	if h.systemService != nil {
		h.systemService.SetReversePumpSettings(settings)
		c.JSON(http.StatusOK, h.systemService.GetReversePumpSettings())
		return
	}
	c.JSON(http.StatusOK, settings)
}

// GetLoadCell handles GET /api/pump/settings/loadcell
func (h *PumpHandler) GetLoadCell(c *gin.Context) {
	if h.systemService == nil {
		c.JSON(http.StatusOK, nil)
		return
	}
	c.JSON(http.StatusOK, h.systemService.GetLoadCellSettings())
}

// SetLoadCell handles PUT /api/pump/settings/loadcell
func (h *PumpHandler) SetLoadCell(c *gin.Context) {
	var settings *models.LoadCellSettings
	_ = c.ShouldBindJSON(&settings)
	if h.systemService != nil {
		updated := h.systemService.SetLoadCellSettings(settings)
		c.JSON(http.StatusOK, updated)
		return
	}
	c.JSON(http.StatusOK, settings)
}

// ReadLoadCell handles GET /api/pump/settings/loadcell/read
func (h *PumpHandler) ReadLoadCell(c *gin.Context) {
	c.JSON(http.StatusOK, 0)
}

// CalibrateLoadCellZero handles PUT /api/pump/settings/loadcell/calibratezero
func (h *PumpHandler) CalibrateLoadCellZero(c *gin.Context) {
	if h.systemService != nil {
		c.JSON(http.StatusOK, h.systemService.CalibrateLoadCellZero())
		return
	}
	c.JSON(http.StatusOK, gin.H{"calibrated": false})
}

// CalibrateLoadCellReference handles PUT /api/pump/settings/loadcell/calibratereference
func (h *PumpHandler) CalibrateLoadCellReference(c *gin.Context) {
	var refWeight float64
	if err := c.ShouldBindJSON(&refWeight); err != nil {
		var obj struct {
			ReferenceWeight float64 `json:"referenceWeight"`
		}
		_ = c.ShouldBindJSON(&obj)
		refWeight = obj.ReferenceWeight
	}
	if h.systemService != nil {
		c.JSON(http.StatusOK, h.systemService.CalibrateLoadCellRef(refWeight))
		return
	}
	c.JSON(http.StatusOK, gin.H{"calibrated": true})
}
