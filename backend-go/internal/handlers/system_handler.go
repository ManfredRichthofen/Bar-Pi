package handlers

import (
	"net/http"

	"github.com/ManfredRichthofen/Bar-Pi/backend-go/internal/models"
	"github.com/ManfredRichthofen/Bar-Pi/backend-go/internal/service"
	"github.com/gin-gonic/gin"
)

// SystemHandler handles HTTP requests for system settings
type SystemHandler struct {
	service *service.SystemService
}

// NewSystemHandler creates a new system handler
func NewSystemHandler(service *service.SystemService) *SystemHandler {
	return &SystemHandler{service: service}
}

// GetAppearance handles GET /api/system/settings/appearance
func (h *SystemHandler) GetAppearance(c *gin.Context) {
	settings := h.service.GetAppearanceSettings()
	c.JSON(http.StatusOK, settings)
}

// SetAppearance handles PUT /api/system/settings/appearance
func (h *SystemHandler) SetAppearance(c *gin.Context) {
	var settings models.AppearanceSettings
	if err := c.ShouldBindJSON(&settings); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	h.service.SetAppearanceSettings(settings)
	c.JSON(http.StatusOK, h.service.GetAppearanceSettings())
}

// GetLanguages handles GET /api/system/settings/appearance/language
func (h *SystemHandler) GetLanguages(c *gin.Context) {
	languages := h.service.GetAvailableLanguages()
	c.JSON(http.StatusOK, languages)
}

// GetGlobalSettings handles GET /api/system/settings/global
func (h *SystemHandler) GetGlobalSettings(c *gin.Context) {
	settings := h.service.GetGlobalSettings()
	c.JSON(http.StatusOK, settings)
}

// SetDonated handles PUT /api/system/settings/donated
func (h *SystemHandler) SetDonated(c *gin.Context) {
	var req struct {
		Donated bool `json:"donated"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	h.service.SetDonated(req.Donated)
	c.JSON(http.StatusOK, gin.H{"message": "Donated status updated"})
}

// SetDonationDisclaimer handles PUT /api/system/settings/sawdonationdisclaimer
func (h *SystemHandler) SetDonationDisclaimer(c *gin.Context) {
	h.service.SetDonationDisclaimer()
	c.JSON(http.StatusOK, gin.H{"message": "Donation disclaimer marked as seen"})
}

// GetI2CSettings handles GET /api/system/settings/i2c
func (h *SystemHandler) GetI2CSettings(c *gin.Context) {
	settings := h.service.GetI2CSettings()
	c.JSON(http.StatusOK, settings)
}

// SetI2CSettings handles PUT /api/system/settings/i2c
func (h *SystemHandler) SetI2CSettings(c *gin.Context) {
	var settings models.I2CSettings
	if err := c.ShouldBindJSON(&settings); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	h.service.SetI2CSettings(settings)
	c.JSON(http.StatusOK, h.service.GetI2CSettings())
}

// GetDefaultFilter handles GET /api/system/settings/defaultfilter
func (h *SystemHandler) GetDefaultFilter(c *gin.Context) {
	settings := h.service.GetDefaultFilterSettings()
	c.JSON(http.StatusOK, settings)
}

// SetDefaultFilter handles PUT /api/system/settings/defaultfilter
func (h *SystemHandler) SetDefaultFilter(c *gin.Context) {
	var settings models.DefaultFilterSettings
	if err := c.ShouldBindJSON(&settings); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	h.service.SetDefaultFilterSettings(settings)
	c.JSON(http.StatusOK, h.service.GetDefaultFilterSettings())
}

// Shutdown handles PUT /api/system/shutdown
func (h *SystemHandler) Shutdown(c *gin.Context) {
	isReboot := c.Query("isReboot") == "true"
	
	action := "shutdown"
	if isReboot {
		action = "reboot"
	}

	// In production, this would trigger actual system shutdown/reboot
	// For now, just return success
	c.JSON(http.StatusOK, gin.H{"message": "System " + action + " initiated"})
}
