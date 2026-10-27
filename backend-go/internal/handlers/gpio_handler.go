package handlers

import (
	"net/http"
	"strconv"

	"github.com/ManfredRichthofen/Bar-Pi/backend-go/internal/models"
	"github.com/ManfredRichthofen/Bar-Pi/backend-go/internal/repository"
	"github.com/ManfredRichthofen/Bar-Pi/backend-go/internal/service"
	"github.com/gin-gonic/gin"
)

type GPIOHandler struct {
	gpioService *service.GPIOService
	gpioRepo    *repository.GPIORepository
}

func NewGPIOHandler(gpioService *service.GPIOService, repos ...*repository.GPIORepository) *GPIOHandler {
	var repo *repository.GPIORepository
	if len(repos) > 0 {
		repo = repos[0]
	}
	return &GPIOHandler{
		gpioService: gpioService,
		gpioRepo:    repo,
	}
}

// GetBoards handles GET /api/gpio
func (h *GPIOHandler) GetBoards(c *gin.Context) {
	dType := c.Query("dType")
	if h.gpioRepo == nil {
		c.JSON(http.StatusOK, []models.GPIOBoard{
			{ID: 1, Name: "Raspberry Pi Local", DType: "local"},
		})
		return
	}
	boards, err := h.gpioRepo.FindAllBoards(dType)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch GPIO boards", "message": "Failed to fetch GPIO boards"})
		return
	}
	c.JSON(http.StatusOK, boards)
}

// GetBoardByID handles GET /api/gpio/:id
func (h *GPIOHandler) GetBoardByID(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid board ID", "message": "Invalid board ID"})
		return
	}
	if h.gpioRepo == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Board not found"})
		return
	}
	board, err := h.gpioRepo.FindBoardByID(id)
	if err != nil || board == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Board not found", "message": "Board not found"})
		return
	}
	c.JSON(http.StatusOK, board)
}

// CreateBoard handles POST /api/gpio
func (h *GPIOHandler) CreateBoard(c *gin.Context) {
	var board models.GPIOBoard
	if err := c.ShouldBindJSON(&board); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error(), "message": err.Error()})
		return
	}
	if h.gpioRepo == nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "GPIO repository unavailable"})
		return
	}
	if err := h.gpioRepo.CreateBoard(&board); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error(), "message": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, board)
}

// UpdateBoard handles PUT /api/gpio/:id
func (h *GPIOHandler) UpdateBoard(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid board ID", "message": "Invalid board ID"})
		return
	}
	var board models.GPIOBoard
	if err := c.ShouldBindJSON(&board); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error(), "message": err.Error()})
		return
	}
	board.ID = id
	if h.gpioRepo == nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "GPIO repository unavailable"})
		return
	}
	if err := h.gpioRepo.UpdateBoard(&board); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error(), "message": err.Error()})
		return
	}
	c.JSON(http.StatusOK, board)
}

// DeleteBoard handles DELETE /api/gpio/:id
func (h *GPIOHandler) DeleteBoard(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid board ID", "message": "Invalid board ID"})
		return
	}
	if id == 1 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Cannot delete local Raspberry Pi GPIO board", "message": "Cannot delete local Raspberry Pi GPIO board"})
		return
	}
	if h.gpioRepo != nil {
		if err := h.gpioRepo.DeleteBoard(id); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error(), "message": err.Error()})
			return
		}
	}
	c.JSON(http.StatusOK, gin.H{"message": "GPIO board deleted"})
}

// GetBoardPins handles GET /api/gpio/:id/pin
func (h *GPIOHandler) GetBoardPins(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid board ID", "message": "Invalid board ID"})
		return
	}
	if h.gpioRepo == nil {
		c.JSON(http.StatusOK, []models.GPIOPin{})
		return
	}
	pins, err := h.gpioRepo.FindBoardPins(id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch board pins", "message": "Failed to fetch board pins"})
		return
	}
	c.JSON(http.StatusOK, pins)
}

// GetStatus returns the GPIO system status
func (h *GPIOHandler) GetStatus(c *gin.Context) {
	if h.gpioRepo != nil {
		if st, err := h.gpioRepo.GetStatus(); err == nil && st != nil {
			c.JSON(http.StatusOK, gin.H{
				"status":            "ok",
				"chip":              "gpiochip0",
				"message":           "GPIO system is operational",
				"pinsUsed":          st.PinsUsed,
				"maxPins":           st.MaxPins,
				"boardsInstalled":   st.BoardsInstalled,
				"statusesAvailable": st.StatusesAvailable,
			})
			return
		}
	}
	c.JSON(http.StatusOK, gin.H{
		"status":            "ok",
		"chip":              "gpiochip0",
		"message":           "GPIO system is operational",
		"pinsUsed":          0,
		"maxPins":           28,
		"boardsInstalled":   1,
		"statusesAvailable": 28,
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
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error(), "message": err.Error()})
		return
	}

	if h.gpioService == nil {
		c.JSON(http.StatusOK, gin.H{
			"message": "Pin test simulated (GPIO hardware not present)",
			"pin":     req.Pin,
		})
		return
	}

	if err := h.gpioService.SetupOutputPin(req.Pin); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error(), "message": err.Error()})
		return
	}

	if err := h.gpioService.RunDCPump(req.Pin, req.DurationMs, req.ActiveHigh); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error(), "message": err.Error()})
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
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error(), "message": err.Error()})
		return
	}

	if h.gpioService == nil {
		c.JSON(http.StatusOK, gin.H{"message": "Pump run simulated (GPIO hardware not present)"})
		return
	}

	if req.Type == "dc" {
		if err := h.gpioService.RunDCPump(req.Pin, req.DurationMs, req.ActiveHigh); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error(), "message": err.Error()})
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
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error(), "message": err.Error()})
			return
		}
		c.JSON(http.StatusOK, gin.H{"message": "Stepper motor completed"})
	} else {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid pump type", "message": "Invalid pump type"})
	}
}

// GetPinValue reads the current value of a GPIO pin
func (h *GPIOHandler) GetPinValue(c *gin.Context) {
	pinStr := c.Param("pin")
	pin, err := strconv.Atoi(pinStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid pin number", "message": "Invalid pin number"})
		return
	}

	if h.gpioService == nil {
		c.JSON(http.StatusOK, gin.H{"pin": pin, "value": 0})
		return
	}

	value, err := h.gpioService.GetPinValue(pin)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error(), "message": err.Error()})
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
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid pin number", "message": "Invalid pin number"})
		return
	}

	if h.gpioService != nil {
		if err := h.gpioService.ReleasePin(pin); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error(), "message": err.Error()})
			return
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Pin released successfully",
		"pin":     pin,
	})
}
