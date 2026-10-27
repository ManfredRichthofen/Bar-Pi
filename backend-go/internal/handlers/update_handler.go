package handlers

import (
	"errors"
	"net/http"

	"github.com/ManfredRichthofen/Bar-Pi/backend-go/internal/models"
	"github.com/ManfredRichthofen/Bar-Pi/backend-go/internal/service"
	"github.com/gin-gonic/gin"
)

// UpdateHandler handles HTTP requests for the self-updater
type UpdateHandler struct {
	updates *service.UpdateService
	system  *service.SystemService
}

// NewUpdateHandler creates a new update handler
func NewUpdateHandler(updates *service.UpdateService, system *service.SystemService) *UpdateHandler {
	return &UpdateHandler{updates: updates, system: system}
}

// GetStatus handles GET /api/system/update/status
func (h *UpdateHandler) GetStatus(c *gin.Context) {
	c.JSON(http.StatusOK, h.updates.Status())
}

// Check handles POST /api/system/update/check
func (h *UpdateHandler) Check(c *gin.Context) {
	status, err := h.updates.Check(c.Request.Context())
	if err != nil {
		c.JSON(updateErrorStatus(err), gin.H{"error": err.Error(), "status": status})
		return
	}
	c.JSON(http.StatusOK, status)
}

// Install handles POST /api/system/update/install
func (h *UpdateHandler) Install(c *gin.Context) {
	if err := h.updates.StartInstall(); err != nil {
		c.JSON(updateErrorStatus(err), gin.H{"error": err.Error(), "status": h.updates.Status()})
		return
	}
	c.JSON(http.StatusAccepted, h.updates.Status())
}

// GetSettings handles GET /api/system/settings/updater
func (h *UpdateHandler) GetSettings(c *gin.Context) {
	c.JSON(http.StatusOK, h.system.GetUpdaterSettings())
}

// SetSettings handles PUT /api/system/settings/updater
func (h *UpdateHandler) SetSettings(c *gin.Context) {
	var settings models.UpdaterSettings
	if err := c.ShouldBindJSON(&settings); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, h.system.SetUpdaterSettings(settings))
}

func updateErrorStatus(err error) int {
	switch {
	case errors.Is(err, service.ErrUpdaterDisabled), errors.Is(err, service.ErrUpdateUnsupported):
		return http.StatusForbidden
	case errors.Is(err, service.ErrUpdateInProgress), errors.Is(err, service.ErrOrderInProgress):
		return http.StatusConflict
	case errors.Is(err, service.ErrNoUpdateAvailable):
		return http.StatusBadRequest
	default:
		return http.StatusBadGateway
	}
}
