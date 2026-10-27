package handlers

import (
	"net/http"

	"github.com/ManfredRichthofen/Bar-Pi/backend-go/internal/models"
	"github.com/ManfredRichthofen/Bar-Pi/backend-go/internal/mqtt"
	"github.com/ManfredRichthofen/Bar-Pi/backend-go/internal/service"
	"github.com/gin-gonic/gin"
)

// SystemHandler handles HTTP requests for system settings
type SystemHandler struct {
	service *service.SystemService
	mqtt    MQTTController
}

// MQTTController applies MQTT settings to the running connector.
type MQTTController interface {
	Apply(settings models.MQTTSettings) mqtt.Status
	Status() mqtt.Status
}

// NewSystemHandler creates a new system handler
func NewSystemHandler(service *service.SystemService) *SystemHandler {
	return &SystemHandler{service: service}
}

// SetMQTT wires in the connector so settings changes take effect immediately.
func (h *SystemHandler) SetMQTT(m MQTTController) {
	h.mqtt = m
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
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error(), "message": err.Error()})
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

// GetVersion handles GET /api/system/version
func (h *SystemHandler) GetVersion(c *gin.Context) {
	settings := h.service.GetGlobalSettings()
	c.JSON(http.StatusOK, gin.H{
		"version": settings.AppVersion,
		"appName": settings.AppName,
		"backend": "go",
	})
}

// SetDonated handles PUT /api/system/settings/donated
func (h *SystemHandler) SetDonated(c *gin.Context) {
	var req struct {
		Donated bool `json:"donated"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error(), "message": err.Error()})
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
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error(), "message": err.Error()})
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
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error(), "message": err.Error()})
		return
	}

	h.service.SetDefaultFilterSettings(settings)
	c.JSON(http.StatusOK, h.service.GetDefaultFilterSettings())
}

// GetOrderingPolicy handles GET /api/system/settings/ordering
func (h *SystemHandler) GetOrderingPolicy(c *gin.Context) {
	c.JSON(http.StatusOK, h.service.GetOrderingPolicySettings())
}

// SetOrderingPolicy handles PUT /api/system/settings/ordering
func (h *SystemHandler) SetOrderingPolicy(c *gin.Context) {
	var settings models.OrderingPolicySettings
	if err := c.ShouldBindJSON(&settings); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error(), "message": err.Error()})
		return
	}

	c.JSON(http.StatusOK, h.service.SetOrderingPolicySettings(settings))
}

// GetLoginSettings handles GET /api/auth/login/settings (public) and /api/system/settings/login
func (h *SystemHandler) GetLoginSettings(c *gin.Context) {
	c.JSON(http.StatusOK, h.service.GetLoginSettings())
}

// SetLoginSettings handles PUT /api/system/settings/login
func (h *SystemHandler) SetLoginSettings(c *gin.Context) {
	var settings models.LoginSettings
	if err := c.ShouldBindJSON(&settings); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error(), "message": err.Error()})
		return
	}

	c.JSON(http.StatusOK, h.service.SetLoginSettings(settings))
}

// Shutdown handles PUT /api/system/shutdown
func (h *SystemHandler) Shutdown(c *gin.Context) {
	isReboot := c.Query("isReboot") == "true"

	action := "shutdown"
	if isReboot {
		action = "reboot"
	}

	c.JSON(http.StatusOK, gin.H{"message": "System " + action + " initiated"})
}

type mqttSettingsResponse struct {
	Enabled         bool        `json:"enabled"`
	BrokerURL       string      `json:"brokerUrl"`
	Username        string      `json:"username"`
	PasswordSet     bool        `json:"passwordSet"`
	BaseTopic       string      `json:"baseTopic"`
	DiscoveryPrefix string      `json:"discoveryPrefix"`
	Status          mqtt.Status `json:"status"`
}

func (h *SystemHandler) mqttResponse(settings models.MQTTSettings, status mqtt.Status) mqttSettingsResponse {
	settings, _ = mqtt.Normalize(settings)
	return mqttSettingsResponse{
		Enabled:         settings.Enabled,
		BrokerURL:       settings.BrokerURL,
		Username:        settings.Username,
		PasswordSet:     settings.Password != "",
		BaseTopic:       settings.BaseTopic,
		DiscoveryPrefix: settings.DiscoveryPrefix,
		Status:          status,
	}
}

func (h *SystemHandler) mqttStatus() mqtt.Status {
	if h.mqtt == nil {
		return mqtt.Status{}
	}
	return h.mqtt.Status()
}

// GetMQTTSettings handles GET /api/system/settings/mqtt
func (h *SystemHandler) GetMQTTSettings(c *gin.Context) {
	c.JSON(http.StatusOK, h.mqttResponse(h.service.GetMQTTSettings(), h.mqttStatus()))
}

// SetMQTTSettings handles PUT /api/system/settings/mqtt.
// A missing password keeps the stored one; an empty string clears it.
func (h *SystemHandler) SetMQTTSettings(c *gin.Context) {
	var body struct {
		Enabled         bool    `json:"enabled"`
		BrokerURL       string  `json:"brokerUrl"`
		Username        string  `json:"username"`
		Password        *string `json:"password"`
		BaseTopic       string  `json:"baseTopic"`
		DiscoveryPrefix string  `json:"discoveryPrefix"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error(), "message": err.Error()})
		return
	}
	settings := models.MQTTSettings{
		Enabled:         body.Enabled,
		BrokerURL:       body.BrokerURL,
		Username:        body.Username,
		Password:        h.service.GetMQTTSettings().Password,
		BaseTopic:       body.BaseTopic,
		DiscoveryPrefix: body.DiscoveryPrefix,
	}
	if body.Password != nil {
		settings.Password = *body.Password
	}
	settings, err := mqtt.Normalize(settings)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error(), "message": err.Error()})
		return
	}
	h.service.SetMQTTSettings(settings)
	status := h.mqttStatus()
	if h.mqtt != nil {
		status = h.mqtt.Apply(settings)
	}
	c.JSON(http.StatusOK, h.mqttResponse(settings, status))
}

// GetMQTTStatus handles GET /api/system/settings/mqtt/status
func (h *SystemHandler) GetMQTTStatus(c *gin.Context) {
	c.JSON(http.StatusOK, h.mqttStatus())
}
