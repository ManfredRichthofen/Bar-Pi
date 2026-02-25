package handlers

import (
	"net/http"
	"strconv"

	"github.com/ManfredRichthofen/Bar-Pi/backend-go/internal/service"
	"github.com/gin-gonic/gin"
)

type GPIOHandler struct {
	gpioService *service.GPIOService
}

func NewGPIOHandler(gpioService *service.GPIOService) *GPIOHandler {
	return &GPIOHandler{
		gpioService: gpioService,
	}
}

// GetStatus returns the GPIO system status
func (h *GPIOHandler) GetStatus(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"status":  "ok",
		"chip":    "gpiochip0",
		"message": "GPIO system is operational",
	})
}

// TestPin tests a GPIO pin by pulsing it
func (h *GPIOHandler) TestPin(c *gin.Context) {
	var req struct {
		Pin        int  `json:"pin" binding:"required"`
		DurationMs int  `json:"durationMs" binding:"required"`
		ActiveHigh bool `json:"activeHigh"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Setup and test the pin
	if err := h.gpioService.SetupOutputPin(req.Pin); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if err := h.gpioService.RunDCPump(req.Pin, req.DurationMs, req.ActiveHigh); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Pin test completed successfully",
		"pin":     req.Pin,
	})
}

// RunPump runs a pump (DC or stepper)
func (h *GPIOHandler) RunPump(c *gin.Context) {
	var req struct {
		Type              string `json:"type" binding:"required"` // "dc" or "stepper"
		Pin               int    `json:"pin"`
		DurationMs        int    `json:"durationMs"`
		ActiveHigh        bool   `json:"activeHigh"`
		StepPin           int    `json:"stepPin"`
		EnablePin         int    `json:"enablePin"`
		Steps             int    `json:"steps"`
		MaxStepsPerSecond int    `json:"maxStepsPerSecond"`
		Acceleration      int    `json:"acceleration"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if req.Type == "dc" {
		if err := h.gpioService.RunDCPump(req.Pin, req.DurationMs, req.ActiveHigh); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusOK, gin.H{"message": "DC pump completed"})
	} else if req.Type == "stepper" {
		config := service.StepperMotorConfig{
			StepPin:           req.StepPin,
			EnablePin:         req.EnablePin,
			Steps:             req.Steps,
			MaxStepsPerSecond: req.MaxStepsPerSecond,
			Acceleration:      req.Acceleration,
		}
		if err := h.gpioService.RunStepperMotor(config); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusOK, gin.H{"message": "Stepper motor completed"})
	} else {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid pump type"})
	}
}

// GetPinValue reads the current value of a GPIO pin
func (h *GPIOHandler) GetPinValue(c *gin.Context) {
	pinStr := c.Param("pin")
	pin, err := strconv.Atoi(pinStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid pin number"})
		return
	}

	value, err := h.gpioService.GetPinValue(pin)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"pin":   pin,
		"value": value,
	})
}

// ReleasePin releases a GPIO pin
func (h *GPIOHandler) ReleasePin(c *gin.Context) {
	pinStr := c.Param("pin")
	pin, err := strconv.Atoi(pinStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid pin number"})
		return
	}

	if err := h.gpioService.ReleasePin(pin); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Pin released successfully",
		"pin":     pin,
	})
}
